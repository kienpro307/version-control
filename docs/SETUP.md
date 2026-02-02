# Setup & Deployment Guide

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- Vercel account (free tier works)

---

## 1. Database Setup (Supabase)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your **Project URL** and **Anon Key**

### Run Migrations
1. Open **SQL Editor** in Supabase Dashboard
2. Copy & execute `supabase/schema.sql`
3. Copy & execute `supabase/migration_groups.sql`

---

## 2. Environment Variables

Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Key (generate a strong one!)
API_SECRET_KEY=mvm_sk_live_YOUR_STRONG_KEY_HERE
```

### Generate Strong API Key (PowerShell)

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
"mvm_sk_live_" + [Convert]::ToBase64String($bytes).Replace("+", "A").Replace("/", "B").Substring(0, 32)
```

---

## 3. Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open in browser
# http://localhost:3000
# http://localhost:3000/docs (API documentation)
```

---

## 4. Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then set environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add API_SECRET_KEY

# Redeploy with env vars
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `API_SECRET_KEY`
5. Click **Deploy**

Your app will be live at: `https://your-project.vercel.app`

---

## 5. Verify Deployment

### Test API

```bash
# Replace with your Vercel URL and API key
curl -X GET "https://your-project.vercel.app/api/projects" \
  -H "Authorization: Bearer mvm_sk_live_YOUR_KEY"
```

### Expected Response

```json
{
  "success": true,
  "data": [],
  "meta": { "total": 0 }
}
```

---

## 6. Configure AI Agent

Add this to your AI Agent's environment/config:

```env
MVM_API_URL=https://your-project.vercel.app/api
MVM_API_KEY=mvm_sk_live_YOUR_KEY
```

Or in the system prompt:

```
Tool: MyVersionManager
BaseURL: https://your-project.vercel.app/api
Auth: Bearer Token from ENV:MVM_API_KEY
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API_SECRET_KEY in Vercel env vars |
| 500 Server Error | Check Supabase credentials |
| CORS Error | Add origin to middleware (if calling from browser) |
| Build fails | Run `npm run build` locally first to check TypeScript |

---

## Security Checklist

- [ ] API Key is strong (32+ characters)
- [ ] API Key is NOT committed to git (check `.gitignore`)
- [ ] Supabase RLS policies are enabled
- [ ] Environment variables set in Vercel (not hardcoded)
