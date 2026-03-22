# DPT Content Hub — Feature Tracker

## Status Key
- ✅ Built & Working
- 🔨 In Progress
- 📋 Planned
- 💡 Future Idea

---

## CORE MODULES

### 1. Content Pipeline
| Feature | Status | Notes |
|---|---|---|
| Create posts manually | ✅ | Admin can create posts per client |
| AI-powered topic research (Claude + web search) | ✅ | Searches LinkedIn, Reddit, Quora, blogs |
| AI-powered post generation with voice rules | ✅ | Uses client-specific config |
| Client-specific voice profiles | ✅ | Per-client tone, banned words, examples |
| Client-specific research keywords & sources | ✅ | Subreddits, blogs, thought leaders |
| Status workflow (Draft → Review → Approved → Scheduled → Posted) | ✅ | Full lifecycle |
| Quick actions on content list (inline status changes) | ✅ | No need to open each post |
| Calendar view (grouped by week) | ✅ | Toggle between list and calendar |
| Date picker for scheduling and posting | ✅ | Separate scheduled_date and posted_date |
| Graphic upload per post | ✅ | Via Supabase Storage |
| Comment thread per post | ✅ | Both admin and client can comment |
| Post editing by admin | ✅ | Admin can edit post content inline in detail panel |
| Graphic approval as separate status | ✅ | Separate graphic_status field, client can approve/reject graphic independently |
| Bulk status changes | ✅ | Bulk mode toggle, select multiple posts, bulk send for review/approve/schedule/delete |
| Bulk scheduling (drag-and-drop calendar) | 💡 | Visual drag to reschedule |
| Post duplication / templates | ✅ | Templates library page, save any post as template, filter by client |
| Multi-platform content adaptation | 💡 | Schema supports Twitter/IG/FB but generation is LinkedIn-only |

### 2. Client Approval Portal
| Feature | Status | Notes |
|---|---|---|
| Client login (email/password) | ✅ | Supabase Auth |
| View upcoming posts | ✅ | Filtered to their content only |
| Approve posts | ✅ | One-click approve |
| Request changes with mandatory feedback | ✅ | Must type feedback before submitting |
| Comment on posts | ✅ | Threaded comments |
| Calendar view of scheduled content | ✅ | Monthly grouped view |
| Password reset / forgot password | ✅ | Forgot password link on login, sends reset email |
| Email notifications on new content to review | 📋 | Clients don't know when new content arrives |
| Client dashboard with engagement metrics | ✅ | Full dashboard: KPIs with growth, content status, engagement rate trend, top performing posts, follower growth chart |
| Graphic preview and approval | ✅ | Client can approve/reject graphics with feedback |
| Mobile-responsive client portal | 💡 | Works but not optimised for mobile |

### 3. Admin Dashboard
| Feature | Status | Notes |
|---|---|---|
| KPI overview (total posts, clients, pending, upcoming) | ✅ | |
| Status breakdown chart | ✅ | Visual bar per status |
| Posts per client summary | ✅ | With pending count |
| Client management (add/invite) | ✅ | Temp password flow |
| Client voice & content config (4 tabs) | ✅ | Voice, content rules, research, calendar |
| Admin can edit post content | ✅ | Edit button in post detail panel, inline textarea |
| Activity feed / recent changes | ✅ | Dashboard shows recent comments, approvals, rejections across all clients |
| Team management (multiple admin users) | 💡 | Currently single admin role |
| Client health overview | 💡 | Posts pending > X days, clients not reviewed |

### 4. Reporting
| Feature | Status | Notes |
|---|---|---|
| Weekly aggregate data entry | ✅ | Impressions, likes, comments, shares, profile views, followers, search |
| Per-post lifetime metrics entry | ✅ | All LinkedIn metrics + notes, updatable anytime |
| Date range report generation | ✅ | Pulls both weekly and per-post data |
| Report: cover page with branding | ✅ | Gradient header, client details, period |
| Report: executive summary (6 KPIs) | ✅ | Followers, impressions, engagements, eng rate, profile views, posts count |
| Report: weekly performance bars + data table | ✅ | Visual bars with inline eng rate |
| Report: content mix breakdown | ✅ | Post type distribution |
| Report: post performance ranking | ✅ | Ranked by impressions with eng rate, best performer highlighted |
| Print / Save PDF | ✅ | Browser print (functional but basic) |
| Server-side PDF generation | ✅ | Edge Function generates branded PDF with cover, KPIs, weekly trends, post rankings. Download button in report modal |
| Report: follower growth chart | ✅ | Bar chart with start/end/net growth summary |
| Report: engagement rate trend over time | ✅ | Color-coded bars with avg, peak, and LinkedIn benchmark |
| Report: top vs bottom performing posts comparison | ✅ | Side-by-side best vs lowest with full metrics |
| Report: content recommendations / next steps | 💡 | AI-generated based on what performed well |
| Automated report scheduling | 💡 | Auto-generate and email monthly |
| LinkedIn profile audit report | 💡 | Separate report type for prospecting |
| CSV/Excel data import for metrics | 💡 | Paste or upload instead of manual entry |

---

## INFRASTRUCTURE

| Feature | Status | Notes |
|---|---|---|
| Supabase Auth (email/password) | ✅ | |
| Row-level security (admin vs client) | ✅ | Clients only see their own data |
| Supabase Edge Function (Anthropic API proxy) | ✅ | API key stays server-side |
| GitHub repo with CI | ✅ | Claude can push directly |
| Vercel deployment config | ✅ | vercel.json ready, not yet deployed |
| Deploy to Vercel | 📋 | Need to connect repo and add env vars |
| Custom domain | 💡 | e.g. hub.dpt.agency |
| Error tracking / monitoring | 💡 | Sentry or similar |
| Database backups | 💡 | Supabase handles this on paid plans |

---

## NOTIFICATIONS & COMMUNICATION

| Feature | Status | Notes |
|---|---|---|
| Email on new content for review | 📋 | Via Supabase triggers + Resend/SendGrid |
| Email on client approval/rejection | 📋 | So DPT knows immediately |
| Email on comment added | 💡 | |
| In-app notification badges | ✅ | Red badge on sidebar, polls every 30s, notifications page |
| Slack integration for DPT | 💡 | Post status changes to a Slack channel |
| Weekly digest email to clients | 💡 | Summary of upcoming content |

---

## CONTENT QUALITY & STRATEGY

| Feature | Status | Notes |
|---|---|---|
| Client voice config (tone, banned words, examples) | ✅ | |
| Research keywords and sources per client | ✅ | |
| AI content QA pass | ✅ | Instant client-side QA checks banned words, AI phrases, emoji policy, length, engagement bait, exclamation marks |
| Post scoring / quality indicator | ✅ | Clean/issues badge per post with colored left border |
| A/B post variants | ✅ | Generate alternative version with different hook/angle, inline comparison |
| Content calendar recommendations | 💡 | AI suggests what to post next week based on gaps |
| Competitor content monitoring | 💡 | Track what competitors are posting |
| Hashtag performance tracking | 💡 | Which hashtags drive reach |
| Best time to post analysis | 💡 | Based on historical metrics |

---

## NEXT PRIORITIES (recommended order)

1. **Deploy to Vercel** — unblocks DPT actually using it
2. **Password reset flow** — clients can't recover access without it
3. **Admin post editing** — DPT needs to edit posts after client feedback
4. **Email notifications** — the approval flow is useless if nobody knows content is waiting
5. **Graphic approval workflow** — separate copy vs graphic approval
6. **AI content QA pass** — catch banned words and AI-sounding language before client sees it
7. **Server-side PDF reports** — proper branded reports matching the quality we built before
8. **In-app notification badges** — show pending counts in sidebar
9. **CSV metric import** — speed up data entry for reporting
10. **Client dashboard upgrade** — proper engagement trends, follower growth, top posts
