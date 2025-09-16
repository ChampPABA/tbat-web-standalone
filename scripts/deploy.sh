#!/bin/bash

# Vercel Deployment Script
# Usage: ./scripts/deploy.sh [production|preview]

set -e

ENVIRONMENT=${1:-preview}

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm i -g vercel
fi

# Build the project
echo "📦 Building the project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔥 Deploying to production..."
    vercel --prod
else
    echo "👀 Deploying preview..."
    vercel
fi

echo "✅ Deployment complete!"