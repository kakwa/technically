#!/bin/bash

# Script to download and update the "Projects I like" content from GitHub stars
# This script downloads the README from kakwa/stars and creates a content file

set -e

# Configuration
STARS_URL="https://raw.githubusercontent.com/kakwa/stars/refs/heads/master/README.md"
CONTENT_DIR="content"
PROJECTS_FILE="$CONTENT_DIR/github-starred.md"

# Create content directory if it doesn't exist
mkdir -p "$CONTENT_DIR"

# Download the stars README
echo "Downloading projects from GitHub stars..."
curl -s "$STARS_URL" -o "$PROJECTS_FILE"

# Add Hugo front matter to the downloaded content
echo "Adding Hugo front matter..."
cat > "$PROJECTS_FILE.tmp" << 'EOF'
+++
title = "Projects I Starred ⭐ - Github.com"
date = 2025-01-01T00:00:00+02:00
draft = false
summary = "A curated list of interesting projects I've starred on GitHub"
hideToc = true
+++

EOF

# Append the downloaded content to the front matter
cat "$PROJECTS_FILE" >> "$PROJECTS_FILE.tmp"

# Replace the original file
mv "$PROJECTS_FILE.tmp" "$PROJECTS_FILE"

echo "Projects I like content updated successfully!"
echo "File created: $PROJECTS_FILE"

