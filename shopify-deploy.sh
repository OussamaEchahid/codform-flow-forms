
#!/bin/bash
echo "Running Shopify deployment script..."

# Ensure we're starting with a clean cache
echo "Clearing cache before deployment..."
rm -rf ./.shopify/*
echo "Cache cleared!"

# Run the deployment script with proper cache busting
echo "Running deployment with cache busting..."
DEPLOY_TIMESTAMP=$(date +%s)
node deploy-shopify.js "$@" --cache-bust="$DEPLOY_TIMESTAMP"

# Verify successful deployment
if [ $? -eq 0 ]; then
  echo "Deployment completed successfully!"
  echo "Note: It may take a few minutes for changes to be visible in your store."
  echo "If you still see cached content, please clear your browser cache."
else
  echo "Deployment encountered errors. Please check the logs above."
fi
