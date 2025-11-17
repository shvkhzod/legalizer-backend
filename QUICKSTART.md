# Quick Start - Backend Deployment

Deploy your backend to Railway in 5 minutes.

## 1. Push to GitHub

```bash
cd legalizer-backend
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/yourusername/legalizer-backend.git
git push -u origin main
```

## 2. Create Railway Project

1. Go to railway.app
2. **New Project** → **Empty Project**
3. **+ New** → **Database** → **PostgreSQL**

## 3. Deploy Backend

1. **+ New** → **GitHub Repo** → Select `legalizer-backend`
2. Click service → **Variables** → Add:
   - `JWT_ACCESS_SECRET`: (generate with command below)
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://your-frontend-url.railway.app` (update later)

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. **Settings** → **Connect** → Select PostgreSQL database

## 4. Run Migration

1. **Settings** → **Deploy** → **Custom Start Command**: `npm run migrate && npm start`
2. Wait for deployment
3. Change command back to: `npm start`
4. Redeploy

## 5. Get URL

**Settings** → **Networking** → **Generate Domain** → Copy URL

Done! Test: `https://your-url.railway.app/health`

Next: Deploy frontend and update CORS_ORIGIN
