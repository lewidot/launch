#!/bin/bash
set -e

REPO_URL="${PLAYWRIGHT_REPO_URL:-https://github.com/lewidot/playwright-project}"
PROJECT_DIR="/app/pw-project"

echo "Starting launch..."

if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "Playwright project not found. Cloning from $REPO_URL..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    if [ $? -ne 0 ]; then
        echo "Failed to clone Playwright project."
        exit 1
    fi
fi

cd "$PROJECT_DIR"
echo "Installing Playwright project dependencies..."
npm install --include=dev
echo "Playwright project setup completed."

cd /app
echo "Starting hono server..."
exec ./server
