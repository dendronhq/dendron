#!/bin/bash
echo "syncing note assets..."
aws s3 sync assets/notes/vault.main/assets/ s3://foundation-prod-assetspublic53c57cce-8cpvgjldwysl/assets/