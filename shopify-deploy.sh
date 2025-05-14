
#!/bin/bash
echo "Running Shopify deployment script..."
echo "Clearing cache before deployment..."
rm -rf ./.shopify/*
echo "Cache cleared!"
node deploy-shopify.js "$@"

