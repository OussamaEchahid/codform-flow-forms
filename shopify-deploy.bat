
@echo off
echo Running Shopify deployment script...
echo This script will validate your theme code before deployment

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Error: Node.js is required but not installed.
  echo Please install Node.js from https://nodejs.org/
  exit /b 1
)

REM Run HTML validation before deployment
echo Validating theme HTML...
node validate-shopify-extensions.js

if %errorlevel% neq 0 (
  echo Error: HTML validation failed. Please fix the errors before deploying.
  exit /b 1
)

REM Deploy if validation passes
echo HTML validation passed. Deploying to Shopify...
node deploy-shopify.js %*
