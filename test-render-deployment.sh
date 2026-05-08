#!/bin/bash

# Render Deployment Troubleshooting Script

API_URL="https://smart-inventory-management-system-snl0.onrender.com"

echo "🔍 Testing Render API Deployment..."
echo ""

# Test 1: Health endpoint
echo "1️⃣  Testing /health endpoint..."
curl -v "$API_URL/health" 2>&1 | head -20
echo ""
echo ""

# Test 2: Auth login (no auth required)
echo "2️⃣  Testing /auth/login endpoint..."
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"inventory123"}' 2>&1 | head -20
echo ""
echo ""

# Test 3: Check if server is responding
echo "3️⃣  Checking HTTP response code..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
echo "HTTP Status: $HTTP_CODE"
echo ""

# Test 4: Root endpoint
echo "4️⃣  Testing root endpoint..."
curl -v "$API_URL/" 2>&1 | head -20
echo ""

echo "✅ Troubleshooting complete. Check the output above."
