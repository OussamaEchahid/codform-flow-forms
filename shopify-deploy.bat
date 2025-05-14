
@echo off
echo Running Shopify deployment script...
echo Clearing cache before deployment...
echo Y | del /s /q ".\.shopify\*.*"
echo Cache cleared!
node deploy-shopify.js %*

