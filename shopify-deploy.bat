
@echo off
echo Running Shopify deployment script...

:: Ensure we're starting with a clean cache
echo Clearing cache before deployment...
echo Y | del /s /q ".\.shopify\*.*"
echo Cache cleared!

:: Run the deployment script with proper cache busting
echo Running deployment with cache busting...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set DEPLOY_TIMESTAMP=%datetime:~0,14%
node deploy-shopify.js %* --cache-bust=%DEPLOY_TIMESTAMP%

:: Verify successful deployment
if %ERRORLEVEL% EQU 0 (
  echo Deployment completed successfully!
  echo Note: It may take a few minutes for changes to be visible in your store.
  echo If you still see cached content, please clear your browser cache.
) else (
  echo Deployment encountered errors. Please check the logs above.
)
