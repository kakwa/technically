#!/usr/bin/env python3
"""
Printables Collections README Generator
Fetches user collections from Printables.com and generates a README.md file
"""

import requests
import json
from typing import Dict, List, Any
from datetime import datetime

# API Configuration
API_URL = "https://api.printables.com/graphql/"

# "@kakwa_3337391"
USER_ID = "3337391"  # Change this to your user ID
USER_NICK = "kakwa"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
    'Accept': 'application/graphql-response+json, application/graphql+json, application/json',
    'Accept-Language': 'en',
    'graphql-client-version': 'v2.2.2',
    'content-type': 'application/json',
    'Origin': 'https://www.printables.com',
}

QUERY = """query UserCollections($userId: ID!) {
  collections: userCollections(userId: $userId) {
    ...CollectionRow
    __typename
  }
}
fragment AvatarUser on UserType {
  id
  handle
  verified
  dateVerified
  publicUsername
  avatarFilePath
  badgesProfileLevel {
    profileLevel
    __typename
  }
  __typename
}
fragment CollectionRow on CollectionType {
  id
  name
  private
  liked
  likesCount
  user {
    ...AvatarUser
    __typename
  }
  modelsCount: printsCount
  models: thumbnails11 {
    ...ModelThumbnail
    __typename
  }
  __typename
}
fragment ModelThumbnail on ThumbnailPrintType {
  id
  slug
  nsfw
  image {
    filePath
    rotation
    __typename
  }
  __typename
}"""

# Query for individual model details
MODEL_QUERY = """query Print($id: ID!) {
  print(id: $id) {
    id
    name
    slug
    nsfw
    image {
      filePath
      rotation
      __typename
    }
    __typename
  }
}"""


def fetch_model_details(model_id: str) -> Dict[str, Any]:
    """Fetch individual model details from Printables API"""
    payload = {
        "operationName": "Print",
        "query": MODEL_QUERY,
        "variables": {"id": model_id}
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload)
        if response.status_code != 200:
            print(f"Model API Error for {model_id}: {response.status_code}")
            return {}
        response.raise_for_status()
        data = response.json()

        if 'data' in data and 'print' in data['data']:
            return data['data']['print']
        else:
            return {}
    except requests.exceptions.RequestException as e:
        print(f"Error fetching model {model_id}: {e}")
        return {}


def fetch_collections(user_id: str) -> List[Dict[str, Any]]:
    """Fetch user collections from Printables API"""
    payload = {
        "operationName": "UserCollections",
        "query": QUERY,
        "variables": {"userId": user_id}
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json()

        if 'data' in data and 'collections' in data['data']:
            return data['data']['collections']
        else:
            print("Error: Unexpected API response structure")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return []


def generate_markdown(collections: List[Dict[str, Any]], user_id: str) -> str:
    """Generate markdown content from collections data"""
    md_lines = []

    # Header
    md_lines.append(
"""
+++
title = "3D Models I Liked ❤️ - Printables.com"
date = 2025-01-01T00:00:00+02:00
draft = false
summary = "A curated list of interesting models I've liked on Printables"
+++
""")
    md_lines.append("---\n")

    # Table of Contents
    collections = sorted(collections, key=lambda c: c['name'])
#    if collections:
#        md_lines.append("# Table of Contents\n")
#        for i, collection in enumerate(collections, 1):
#            collection_name = collection.get('name', 'Unnamed Collection')
#            anchor = collection_name.lower().replace(' ', '-').replace('/', '')
#            md_lines.append(f"{i}. [{collection_name}](#{anchor})")
#        md_lines.append("\n---\n")

    # Collections
    for collection in collections:
        name = collection.get('name', 'Unnamed Collection')
        collection_id = collection.get('id', '')
        models_count = collection.get('modelsCount', 0)
        likes_count = collection.get('likesCount', 0)
        is_private = collection.get('private', False)
        models = collection.get('models', [])


        # Collection metadata
        collection_url = f"https://www.printables.com/@{USER_NICK}_{USER_ID}/collections/{collection_id}"
        md_lines.append(f"# {name}")
        md_lines.append(f"collection page: [🔗]({collection_url})")

        # Models in collection
        if models:
            for model in models:
                model_slug = model.get('slug', '')
                model_id = model.get('id', '')
                is_nsfw = model.get('nsfw', False)
                image = model.get('image', {})
                image_path = image.get('filePath', '') if image else ''

                # Fetch detailed model information
                model_details = fetch_model_details(model_id)
                model_name = model_details.get('name', '') if model_details else ''

                model_url = f"https://www.printables.com/model/{model_id}"
                # Use actual model name if available, otherwise fall back to slug conversion
                if model_name:
                    display_title = model_name
                else:
                    # Fallback: Convert slug to title (replace hyphens with spaces and capitalize)
                    display_title = model_slug.replace('-', ' ').title() if model_slug else f"Model {model_id}"

                # Debug output
                print(f"  Model: {display_title} (ID: {model_id}, Name: '{model_name}', Slug: '{model_slug}')")

                nsfw_tag = " [NSFW]" if is_nsfw else ""
                md_lines.append(f"* [{display_title}]({model_url}){nsfw_tag}")
            md_lines.append("")
        else:
            md_lines.append("*No models in this collection yet.*\n")

        md_lines.append("\n---\n")

    md_lines.append(f"\n*last refresh: {datetime.now().isoformat(timespec='seconds')}*\n")
    return "\n".join(md_lines)


def save_readme(content: str, filename: str = "README.md"):
    """Save markdown content to file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ README generated successfully: {filename}")
    except IOError as e:
        print(f"Error saving file: {e}")


def main():
    """Main execution function"""
    print(f"Fetching collections for user ID: {USER_ID}...")

    collections = fetch_collections(USER_ID)

    if not collections:
        print("No collections found or error occurred.")
        return

    print(f"Found {len(collections)} collection(s)")

    # Generate markdown
    markdown_content = generate_markdown(collections, USER_ID)

    # Save to file
    save_readme(markdown_content, "content/printables-liked.md")

    # Print summary
    total_models = sum(c.get('modelsCount', 0) for c in collections)
    print(f"\nSummary:")
    print(f"  Collections: {len(collections)}")
    print(f"  Total Models: {total_models}")


if __name__ == "__main__":
    main()
