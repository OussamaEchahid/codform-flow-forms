# Deploy Supabase Functions Script
# This script deploys the updated billing functions to Supabase

Write-Host "🚀 Deploying Supabase Functions..." -ForegroundColor Green

# Deploy change-plan function
Write-Host "📦 Deploying change-plan function..." -ForegroundColor Yellow
supabase functions deploy change-plan --project-ref trlklwixfeaexhydzaue

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ change-plan function deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy change-plan function" -ForegroundColor Red
    exit 1
}

# Deploy shopify-billing-webhook function
Write-Host "📦 Deploying shopify-billing-webhook function..." -ForegroundColor Yellow
supabase functions deploy shopify-billing-webhook --project-ref trlklwixfeaexhydzaue

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ shopify-billing-webhook function deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy shopify-billing-webhook function" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 All functions deployed successfully!" -ForegroundColor Green
Write-Host "📝 Don't forget to update your Shopify app webhooks if needed." -ForegroundColor Cyan
