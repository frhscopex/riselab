# 🚀 RiseLab Production Deployment Guide

This document outlines the steps to deploy the RiseLab backend to a production environment (Railway, Render, or Heroku).

## 1. Environment Variables
Ensure the following variables are set in your production environment:
- `DATABASE_URL`: Your Supabase/PostgreSQL connection string (e.g., `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`).
- `VALID_API_KEYS`: A comma-separated list of authorized keys (e.g., `prod_key_1,prod_key_2`).
- `PORT`: Set to `3000` (or the default provided by your host).

## 2. Database Migration
Before the first run, ensure the database schema is synced:
```bash
cd backend
npx prisma db push
```

## 3. Initial Ingestion
Seed the database with the latest research:
```bash
node ingest.js
```

## 4. Deployment Command
The production server should be started using:
```bash
npm start
```
(Defined in `package.json` as `node src/server.js`)

## 5. Frontend Connection
Update the API base URL in your frontend code:
- Development: `http://localhost:3000`
- Production: `https://your-app-name.railway.app`

---
**RiseLab — Architecture without Slop.**
