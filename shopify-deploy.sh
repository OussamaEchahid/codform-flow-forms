
#!/bin/bash
echo "Running Shopify deployment script..."
echo "This script will validate your theme code before deployment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required but not installed."
  echo "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Run HTML validation before deployment
echo "Validating theme HTML..."
node validate-shopify-extensions.js

if [ $? -ne 0 ]; then
  echo "Error: HTML validation failed. Please fix the errors before deploying."
  exit 1
fi

# Deploy if validation passes
echo "HTML validation passed. Deploying to Shopify..."
node deploy-shopify.js "$@"
