#!/bin/bash

# Deployment Script for Smart Inventory Management System
set -e

echo "======================================================"
echo "🚀 Smart Inventory Management System Deployment Helper"
echo "======================================================"

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Building workspaces..."
npm run build

echo ""
echo "======================================================"
echo "☁️ Backend Deployment (Railway)"
echo "======================================================"
echo "Please log in to Railway (if not already):"
npx @railway/cli login

echo "Linking to your Railway project..."
npx @railway/cli link

echo "Deploying API to Railway..."
# Tell railway to use the apps/api folder
npx @railway/cli up -d
echo "✅ Backend deployed! Please ensure you set the correct Root Directory (apps/api) and Environment Variables in the Railway Dashboard."

echo ""
echo "======================================================"
echo "🌐 Frontend Deployment (Vercel)"
echo "======================================================"
echo "Deploying Web App to Vercel..."
npx vercel
npx vercel --prod
echo "✅ Frontend deployed! Please ensure you set the environment variables in the Vercel Dashboard."

echo ""
echo "🎉 Deployment Process Completed!"
echo "Check DEPLOYMENT.md for more details on environment variables and database setup."
