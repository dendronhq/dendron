#!/bin/bash
echo "injecting variables"

client="${GOOGLE_OAUTH_CLIENT_ID:-google_oauth_placeholder_id}"
secret="${GOOGLE_OAUTH_CLIENT_SECRET:-google_oauth_placeholder_secret}"

sed -ibak "s/google_oauth_placeholder_id/$client/g" ./dist/extension.js
sed -ibak "s/google_oauth_placeholder_secret/$secret/g" ./dist/extension.js
