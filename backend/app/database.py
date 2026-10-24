import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, PyMongoError, ServerSelectionTimeoutError

from app.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages MongoDB connection and documents collection with fallback cache."""

    def __init__(self) -> None:
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        # In-memory document fallback store when MongoDB is offline
        self._fallback_store: Dict[str, Dict[str, Any]] = {}

    def connect(self) -> None:
        """Initialize MongoDB client and create collection indexes."""
        try:
            logger.info("Connecting to MongoDB: %s", settings.MONGODB_URI)
            self.client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            )
            self.db = self.client[settings.MONGODB_DB]
            # Fast ping
            self.client.admin.command("ping")
            logger.info("Connected to MongoDB database: %s", settings.MONGODB_DB)
            self._setup_collections()
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            logger.warning(
                "MongoDB unavailable at %s (%s). Running with memory-backed fallback.",
                settings.MONGODB_URI,
                err,
            )
        except Exception as err:
            logger.error("Error connecting to MongoDB: %s", err)

    def _setup_collections(self) -> None:
        """Create initial indexes for the documents collection."""
        if self.db is None:
            return
        try:
            docs_coll = self.db["documents"]
            docs_coll.create_index("upload_timestamp")
            docs_coll.create_index("processing_status")
            docs_coll.create_index("filename")
            logger.info("Ensured 'documents' collection indexes.")
        except Exception as err:
            logger.warning("Could not create collection indexes: %s", err)

    def close(self) -> None:
        """Close MongoDB connection pool."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    def check_connection(self) -> Dict[str, Any]:
        """Ping MongoDB to evaluate current connectivity status."""
        try:
            if not self.client:
                self.client = MongoClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                    connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                )
                self.db = self.client[settings.MONGODB_DB]

            self.client.admin.command("ping")
            collections = self.db.list_collection_names() if self.db is not None else []
            doc_count = self.db["documents"].count_documents({}) if self.db is not None else len(self._fallback_store)
            return {
                "connected": True,
                "database": settings.MONGODB_DB,
                "uri": settings.MONGODB_URI,
                "collections": collections,
                "documents_count": doc_count,
            }
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            return {
                "connected": False,
                "database": settings.MONGODB_DB,
                "uri": settings.MONGODB_URI,
                "error": f"Connection timed out: {err}",
                "fallback_active": True,
                "fallback_documents_count": len(self._fallback_store),
            }
        except Exception as err:
            return {
                "connected": False,
                "database": settings.MONGODB_DB,
                "uri": settings.MONGODB_URI,
                "error": str(err),
            }

    def get_documents_collection(self) -> Optional[Collection]:
        """Return the PyMongo documents collection if connected."""
        if self.db is not None:
            try:
                # Fast check
                self.client.admin.command("ping")
                return self.db["documents"]
            except Exception:
                return None
        return None

    # --- Document CRUD Operations ---

    def insert_document(self, doc_data: Dict[str, Any]) -> str:
        """Insert document record into MongoDB or fallback store."""
        doc_id = doc_data.get("id") or str(uuid.uuid4())
        doc_data["id"] = doc_id

        coll = self.get_documents_collection()
        if coll is not None:
            try:
                mongo_doc = doc_data.copy()
                mongo_doc["_id"] = doc_id
                coll.insert_one(mongo_doc)
                logger.info("Inserted document %s into MongoDB.", doc_id)
            except Exception as err:
                logger.warning("MongoDB insert failed (%s). Saving to fallback cache.", err)

        # Keep fallback cache updated
        self._fallback_store[doc_id] = doc_data.copy()
        return doc_id

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single document by ID from MongoDB or fallback store."""
        coll = self.get_documents_collection()
        if coll is not None:
            try:
                # Try query by _id or id
                query: Dict[str, Any] = {"$or": [{"_id": doc_id}, {"id": doc_id}]}
                if ObjectId.is_valid(doc_id):
                    query["$or"].append({"_id": ObjectId(doc_id)})

                res = coll.find_one(query)
                if res:
                    res["id"] = str(res.get("_id", doc_id))
                    if "_id" in res:
                        del res["_id"]
                    return res
            except Exception as err:
                logger.warning("MongoDB find failed: %s", err)

        # Check fallback store
        if doc_id in self._fallback_store:
            return self._fallback_store[doc_id].copy()

        return None

    def list_documents(self) -> List[Dict[str, Any]]:
        """List documents sorted by upload_timestamp descending."""
        coll = self.get_documents_collection()
        if coll is not None:
            try:
                docs = list(coll.find().sort("upload_timestamp", -1).limit(100))
                results = []
                for d in docs:
                    d["id"] = str(d.pop("_id", d.get("id", "")))
                    results.append(d)
                return results
            except Exception as err:
                logger.warning("MongoDB list failed: %s", err)

        # Return fallback documents sorted descending
        fallback_docs = list(self._fallback_store.values())
        fallback_docs.sort(key=lambda d: d.get("upload_timestamp", ""), reverse=True)
        return [d.copy() for d in fallback_docs]

    def update_document(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        """Update fields on an existing document."""
        updated = False
        coll = self.get_documents_collection()
        if coll is not None:
            try:
                query: Dict[str, Any] = {"$or": [{"_id": doc_id}, {"id": doc_id}]}
                if ObjectId.is_valid(doc_id):
                    query["$or"].append({"_id": ObjectId(doc_id)})

                res = coll.update_one(query, {"$set": updates})
                if res.matched_count > 0:
                    updated = True
            except Exception as err:
                logger.warning("MongoDB update failed: %s", err)

        if doc_id in self._fallback_store:
            self._fallback_store[doc_id].update(updates)
            updated = True

        return updated

    def delete_document(self, doc_id: str) -> bool:
        """Delete document by ID from MongoDB and fallback store."""
        deleted = False
        coll = self.get_documents_collection()
        if coll is not None:
            try:
                query: Dict[str, Any] = {"$or": [{"_id": doc_id}, {"id": doc_id}]}
                if ObjectId.is_valid(doc_id):
                    query["$or"].append({"_id": ObjectId(doc_id)})

                res = coll.delete_one(query)
                if res.deleted_count > 0:
                    deleted = True
            except Exception as err:
                logger.warning("MongoDB delete failed: %s", err)

        if doc_id in self._fallback_store:
            del self._fallback_store[doc_id]
            deleted = True

        return deleted


db_manager = DatabaseManager()
