#!/bin/bash

echo "--- SlabClash Demo Startup (Alt-Frontend Edition) ---"

# 1. Kill stray processes on target ports
echo "Cleaning up ports 3000 and 3001..."
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null

# 2. Stop and Clean Docker
echo "Resetting Docker containers..."
docker compose down

# 3. Start core services
echo "Starting Database and Storage..."
if ! docker compose up -d; then
  echo "⚠️ Redis port conflict detected. Starting without Docker Redis..."
  docker compose up -d postgres minio minio-init
fi

# 4. Database Preparation
echo "Preparing Backend Environment (.env)..."
cat <<ENV > backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/slabclash?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=demo-secret-key-123
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=rootuser
AWS_SECRET_ACCESS_KEY=rootpassword
S3_ENDPOINT=http://localhost:9100
S3_BUCKET_NAME=slabclash-uploads
PHASH_THRESHOLD=10
ENV

echo "Preparing Database (Migrations & Seeding)..."
cd backend
yarn install --silent
yarn prisma migrate dev --name init_demo --skip-generate > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
npx prisma db seed > /dev/null 2>&1
cd ..

# 5. Start Backend in Background (Explicit Port 3000)
echo "Starting Backend on port 3000..."
PORT=3000 nohup yarn dev:backend > backend.log 2>&1 &
BACKEND_PID=$!

# 6. Start Alt-Frontend in Background (Primary on port 3001)
echo "Starting Frontend (Alt) on port 3001..."
cd alt-frontend
npm install --silent
nohup npm run dev -- --port 3001 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 7. Health Check Wait
echo "Waiting for services to initialize..."
MAX_RETRIES=30
COUNT=0
while ! curl -s http://localhost:3000/v1/health > /dev/null; do
    sleep 2
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Backend failed to start. Check backend.log"
        exit 1
    fi
    echo -n "."
done
echo " Done!"

echo ""
echo "--- DEMO READY ---"
echo "Backend PID: $BACKEND_PID (Logs: backend.log)"
echo "Frontend PID: $FRONTEND_PID (Logs: frontend.log)"
echo ""
echo "🚀 Demo URL: http://localhost:3001"
echo ""
echo "Note: The previous main-frontend has been disabled in this script."
echo "To stop everything later, run: fuser -k 3000/tcp 3001/tcp && docker compose down"
