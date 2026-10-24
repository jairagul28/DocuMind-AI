#!/usr/bin/env bash
# ==============================================================================
# DocuMind AI — Submission Packager Script
# ==============================================================================
# Usage: ./package_submission.sh "YourFullName" "YourRegisterNumber"
# Generates: <FullName>_<RegisterNumber>_Task2.zip
# Excludes: .env, node_modules, venv, caches, build artifacts, git history
# ==============================================================================

set -e

FULL_NAME="$1"
REG_NUM="$2"

if [ -z "$FULL_NAME" ] || [ -z "$REG_NUM" ]; then
  echo "Error: Missing arguments."
  echo "Usage: ./package_submission.sh <FullName> <RegisterNumber>"
  echo "Example: ./package_submission.sh JohnDoe 21BCE1001"
  exit 1
fi

ZIP_NAME="${FULL_NAME}_${REG_NUM}_Task2.zip"
TARGET_DIR="${FULL_NAME}_${REG_NUM}_Task2"

echo "Creating clean submission package: $ZIP_NAME"

# Clean up previous temporary staging
rm -rf "$TARGET_DIR" "$ZIP_NAME"
mkdir -p "$TARGET_DIR"

# Copy root documents
cp README.md "$TARGET_DIR/"
cp TECHNICAL_EXPLANATION.md "$TARGET_DIR/"
cp candidate_details.txt "$TARGET_DIR/"
cp .gitignore "$TARGET_DIR/"
[ -f render.yaml ] && cp render.yaml "$TARGET_DIR/"
[ -f "${FULL_NAME}_Resume.pdf" ] && cp "${FULL_NAME}_Resume.pdf" "$TARGET_DIR/" || echo "Notice: ${FULL_NAME}_Resume.pdf not found in root. Remember to place your resume PDF before final zip submission."

# Copy sample documents
cp -r sample_documents "$TARGET_DIR/"

# Copy backend (excluding venv, pycache, .env)
mkdir -p "$TARGET_DIR/backend"
cp backend/requirements.txt "$TARGET_DIR/backend/"
cp backend/.env.example "$TARGET_DIR/backend/"
cp -r backend/app "$TARGET_DIR/backend/"
cp -r backend/tests "$TARGET_DIR/backend/"

# Copy frontend (excluding node_modules, dist, .env)
mkdir -p "$TARGET_DIR/frontend"
cp frontend/package.json "$TARGET_DIR/frontend/"
cp frontend/.env.example "$TARGET_DIR/frontend/"
cp frontend/vite.config.js "$TARGET_DIR/frontend/"
cp frontend/tailwind.config.js "$TARGET_DIR/frontend/"
cp frontend/postcss.config.js "$TARGET_DIR/frontend/"
cp frontend/index.html "$TARGET_DIR/frontend/"
[ -f frontend/vercel.json ] && cp frontend/vercel.json "$TARGET_DIR/frontend/"
cp -r frontend/src "$TARGET_DIR/frontend/"

# Strip caches
find "$TARGET_DIR" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TARGET_DIR" -name "*.pyc" -delete 2>/dev/null || true
find "$TARGET_DIR" -name ".DS_Store" -delete 2>/dev/null || true
find "$TARGET_DIR" -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Create ZIP archive
zip -r "$ZIP_NAME" "$TARGET_DIR" > /dev/null
rm -rf "$TARGET_DIR"

echo "Submission package created successfully: $ZIP_NAME"
ls -lh "$ZIP_NAME"

