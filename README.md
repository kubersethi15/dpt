# DPT Content Hub

A content operations platform for DPT social media agency. Manages the full content lifecycle: creation → review → approval → scheduling → posting, with client-facing portals and LinkedIn performance reporting.

## Architecture

- **Frontend**: React 18 + Vite (single-page app)
- **Backend**: Supabase (Postgres + Auth + Storage + RLS)
- **Hosting**: Vercel (free tier)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (post graphics)

## Features

### Admin Portal (DPT)
- **Dashboard** — Overview of all posts, clients, status breakdown
- **Create Content** — AI-powered workflow: research trending topics via web search → pick 2-3 topics → generate posts with voice/formatting rules → review/edit → push to client
- **Content Pipeline** — Manage all posts, status tracking, graphic uploads, workflow management
- **Client Management** — Add/invite clients, view client details
- **Reports** — Enter weekly LinkedIn metrics, generate branded performance reports

### Client Portal
- **My Content** — View all posts, approve/request changes, leave comments
- **Calendar** — Visual timeline of upcoming scheduled content
- **My Reports** — View LinkedIn performance metrics and trends

### Workflow
```
[Create Content Module]
Research Topics (AI + Web Search) → DPT Picks 2-3 Topics → Generate Posts (AI + Voice Rules) → DPT Reviews/Edits

[Approval Flow]  
→ Push to Client for Review → Client Approves Copy → DPT Creates Graphics → Client Approves Graphics → Posted

[Status Flow]
Draft → Pending Review → [Approved] → Scheduled → Posted
                       → [Changes Requested] → (DPT revises) → Pending Review
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings > API

### 2. Run the Database Schema

1. Go to your Supabase Dashboard > SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run it — this creates all tables, RLS policies, triggers, and storage

### 3. Configure Auth

In Supabase Dashboard > Authentication > Settings:
- Enable Email provider (should be on by default)
- Optionally disable "Confirm email" for easier onboarding during setup
- Set Site URL to your Vercel domain (after deploying)

### 4. Create Your Admin Account

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > Create manually
3. Enter your admin email and password
4. After the user is created, go to Table Editor > profiles
5. Find your profile row and change `role` from `client` to `admin`

### 5. Local Development

```bash
# Clone and install
cd dpt-content-hub
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase URL and Anon Key

# Start dev server
npm run dev
```

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL = your Supabase project URL
# VITE_SUPABASE_ANON_KEY = your Supabase anon key

# Deploy to production
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 7. Add Clients

Once deployed:
1. Log in as admin
2. Go to Clients > Add Client
3. Enter their name, email, company, niche
4. They'll receive a temp password (Welcome123!) — have them change it on first login

## Row-Level Security

All data is protected by Supabase RLS:
- **Admin** sees and manages everything
- **Clients** only see their own posts, comments, and reports
- **Clients** can approve/reject posts and add comments, but can't edit post content
- **Graphics** are publicly readable (for display) but only admin can upload/delete

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Anthropic API (Create Content Module)

The Create Content module calls Claude to research topics and generate posts. In production, this routes through a Supabase Edge Function so your API key never touches the browser.

### Deploy the Edge Function

```bash
# 1. Install Supabase CLI (if not already)
npm i -g supabase

# 2. Login and link your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 3. Set your Anthropic API key as a secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here

# 4. Deploy the function
supabase functions deploy claude-proxy
```

The Edge Function:
- Validates the user is authenticated via Supabase Auth
- Checks the user has `admin` role (clients can't trigger AI generation)
- Forwards the request to Anthropic with your API key
- Returns the response to the frontend

The frontend automatically detects whether the Edge Function is available. If it is, it routes through the proxy. If not (e.g. local dev without functions), it falls back to direct API calls.

## File Structure

```
dpt-content-hub/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.js          # Vite config
├── vercel.json             # Vercel SPA routing
├── .env.example            # Env template
├── supabase/
│   ├── schema.sql          # Full database schema (run in SQL Editor)
│   └── functions/
│       └── claude-proxy/
│           └── index.ts    # Edge Function for Anthropic API proxy
└── src/
    ├── main.jsx            # React entry
    ├── supabaseClient.js   # Supabase client init
    └── App.jsx             # Full application (all components)
```
