
@echo off
echo Running Shopify deployment script...
echo.
echo This will deploy the theme extension to your Shopify store.
echo Make sure you have configured your Shopify CLI and authenticated with your store.
echo.
node deploy-shopify.js %*
