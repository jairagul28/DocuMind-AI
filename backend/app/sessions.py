import base64
import hashlib
import hmac
import secrets
import time
import uuid
from typing import Optional

from fastapi import Header, HTTPException, status


class AnonymousSessionManager:
    """Issues and validates short-lived, process-local signed session tokens."""

    TOKEN_TTL_SECONDS = 24 * 60 * 60

    def __init__(self) -> None:
        self._signing_key = secrets.token_bytes(32)

    def create_token(self) -> str:
        session_id = uuid.uuid4().hex
        expires_at = int(time.time()) + self.TOKEN_TTL_SECONDS
        payload = f"{session_id}.{expires_at}".encode("ascii")
        encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=")
        signature = hmac.new(
            self._signing_key, encoded_payload, hashlib.sha256
        ).digest()
        encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=")
        return f"{encoded_payload.decode('ascii')}.{encoded_signature.decode('ascii')}"

    def validate_token(self, token: Optional[str]) -> Optional[str]:
        if not token or len(token) > 256:
            return None

        try:
            encoded_payload, encoded_signature = token.encode("ascii").split(b".", 1)
            supplied_signature = base64.urlsafe_b64decode(
                encoded_signature + b"=" * (-len(encoded_signature) % 4)
            )
            expected_signature = hmac.new(
                self._signing_key, encoded_payload, hashlib.sha256
            ).digest()
            if not hmac.compare_digest(supplied_signature, expected_signature):
                return None

            payload = base64.urlsafe_b64decode(
                encoded_payload + b"=" * (-len(encoded_payload) % 4)
            ).decode("ascii")
            session_id, expires_at = payload.split(".", 1)
            if len(session_id) != 32 or int(expires_at) <= int(time.time()):
                return None
            uuid.UUID(hex=session_id)
            return session_id
        except (ValueError, UnicodeError):
            return None


session_manager = AnonymousSessionManager()


def get_session_id(
    session_token: Optional[str] = Header(default=None, alias="X-Session-Token"),
) -> str:
    session_id = session_manager.validate_token(session_token)
    if session_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid browser session is required.",
        )
    return session_id
