# YouTube Transcript SaaS - Quick Start Guide
## Tech Stack, Budget & Roadmap

**Project Owner:** Ben  
**Timeline:** 12 weeks to MVP  
**Budget:** $143 (conservative)  
**Time Commitment:** 5-10 hours/week (school/interviews come first)

---

## 🎯 **The Vision in One Sentence**

Build a reliable YouTube transcript extraction tool with AI summaries, monetized at $9/mo, reaching $2K MRR within 6 months.

---

## 💻 **Tech Stack (Final Decision)**

### **Frontend**

| Layer | Technology | Why This |
|-------|-----------|----------|
| **Framework** | Next.js 14 (App Router) | Best ecosystem, Vercel integration, RSC support |
| **Language** | TypeScript | Type safety, fewer bugs |
| **Styling** | Tailwind CSS | Fast styling, consistent design |
| **UI Components** | shadcn/ui | Beautiful pre-built components |
| **State Management** | Zustand | Lightweight, simple |
| **Hosting** | Vercel (Hobby → Pro) | Auto-deploy, edge functions, $0-20/mo |

**Total Cost:** $0 (Month 1-3), $20/mo (Month 6+)

---

### **Backend (API Gateway)**

| Layer | Technology | Why This |
|-------|-----------|----------|
| **Runtime** | Node.js 20+ | Async I/O, unified stack with frontend |
| **Framework** | Next.js API Routes | Same repo as frontend, simple deployment |
| **Authentication** | Supabase Auth | Built-in JWT, social login, free tier |
| **Rate Limiting** | Upstash Redis | Fast, serverless, tracks quotas |
| **Job Queue** | **Upstash QStash** ⭐ | HTTP-based, scale to zero, $0 when idle |

**Key Change from Original:** Using QStash instead of BullMQ (saves $240-480/year)

**Total Cost:** $0 (Month 1-3), $10/mo (Month 6+)

---

### **Backend (Processing Workers)**

| Layer | Technology | Why This |
|-------|-----------|----------|
| **Language** | Python 3.11 | Best scraping libraries |
| **Framework** | FastAPI (or simple Flask) | Fast, async-capable |
| **Scraping Library** | **ScrapingBee API** ⭐ | 99.98% success, zero maintenance |
| **Fallback Scraping** | youtube-transcript-api | Open source, use for testing |
| **Container** | Docker | Consistent env dev → prod |
| **Hosting** | Google Cloud Run | Auto-scale 0-100, pay per use |

**Key Change from Original:** Using ScrapingBee from day 1 (saves 30-40 hrs/month maintenance)

**Total Cost:** $5 (Month 1), $10-30 (Month 2-3), $99 (Month 6+)

---

### **AI Layer**

| Layer | Technology | Why This |
|-------|-----------|----------|
| **Primary Model** | **Gemini 3 Flash** ⭐ | $0.30/1M tokens (86% cheaper than Claude) |
| **Premium Model** | Claude 4 Sonnet | Superior prose for Pro Plus tier |
| **Developer Model** | GPT-5.2 Thinking | Complex reasoning for API tier |
| **SDK** | Anthropic SDK + Google AI SDK | Official libraries |

**Key Change from Original:** Gemini first, Claude second (saves $1,680/year)

**Cost per AI summary:**
- Gemini 3 Flash: $0.021
- Claude 4 Sonnet: $0.202 (10x more expensive)

**Total Cost:** $0 (Month 1-3, no AI yet), $60/mo (Month 6+)

---

### **Database & Storage**

| Layer | Technology | Why This |
|-------|-----------|----------|
| **Primary Database** | PostgreSQL 15 via Supabase | Free tier generous, auth included |
| **Caching Layer** | Upstash Redis | Serverless, 10K req/day free |
| **File Storage** | Supabase Storage | For exports if needed |

**Schema Overview:**
```sql
-- Users (managed by Supabase Auth)
users (
  id, email, subscription_tier, stripe_customer_id
)

-- Transcripts
transcripts (
  id, video_id UNIQUE, language, content JSONB,
  text_blob TEXT, created_at
)

-- AI Summaries (separate table, different TTL)
ai_summaries (
  id, video_id, summary TEXT, created_at
)

-- Usage tracking
request_logs (
  id, user_id, video_id, status, provider, cost_usd
)
```

**Total Cost:** $0 (Month 1-6), $25/mo (Month 6+)

---

### **External Services**

| Service | Purpose | Cost |
|---------|---------|------|
| **Stripe** | Payments | 2.9% + $0.30 per transaction |
| **Postmark** | Transactional emails | Free tier (100/mo) |
| **ScrapingBee** | Reliable scraping | $49-99/mo |
| **Plausible/Umami** | Privacy-friendly analytics | $0 (self-hosted Umami) |
| **Domain** | yourapp.com | $12/year |

**Total Variable Cost:** Based on usage

---

## 💰 **12-Week Budget Breakdown**

### **Month 1: Foundation ($22)**

| Week | Item | Cost | Cumulative |
|------|------|------|------------|
| Week 1 | Domain (1 year) | $12 | $12 |
| Week 2 | - | $0 | $12 |
| Week 3 | Webshare proxies (testing only) | $5 | $17 |
| Week 4 | Webshare | $5 | $22 |

**What you build:** Auth, basic UI, local scraping tests

---

### **Month 2: Core Features ($35)**

| Week | Item | Cost | Cumulative |
|------|------|------|------------|
| Week 5 | Webshare | $5 | $27 |
| Week 6 | Webshare | $5 | $32 |
| Week 7 | Webshare + ScrapingBee (fallback testing) | $5 + $10 | $47 |
| Week 8 | Webshare + ScrapingBee | $5 + $10 | $62 |

**What you build:** Dashboard, caching, reliable extraction

---

### **Month 3: Payments & Launch ($50)**

| Week | Item | Cost | Cumulative |
|------|------|------|------------|
| Week 9 | Webshare + ScrapingBee | $5 + $10 | $77 |
| Week 10 | Webshare + ScrapingBee | $5 + $10 | $92 |
| Week 11 | Webshare + ScrapingBee (beta testing) | $5 + $15 | $112 |
| Week 12 | Webshare + ScrapingBee (launch) | $5 + $20 | $137 |

**Optional:** GitHub Copilot Month 3 only (+$10) for launch speed

**What you build:** Stripe integration, polish, beta test, soft launch

---

### **Total 12-Week Investment**

| Budget Tier | Cost | What You Get |
|-------------|------|--------------|
| **Bare Minimum** | $107 | DIY everything, lots of debugging |
| **Recommended** | $143 | Hybrid approach (DIY + paid fallback) |
| **Premium** | $197 | Add Copilot all 3 months |

**Recommended for you:** $143 (9 hours of Best Buy work)

---

### **Ongoing Costs (Post-Launch)**

**Month 4 (100 users, 50 paid):**
```
Infrastructure:
- Vercel: $0 (still free)
- Supabase: $0 (under limits)
- Upstash QStash: $0
- ScrapingBee: $49 (upgrade to paid plan)
- Domain: $1
Total: $50

Revenue: 50 × $9 = $450
Profit: $400 (800% margin)
```

**Month 6 (200 paid users - PRD target):**
```
Infrastructure:
- Vercel Pro: $20
- Supabase Pro: $25
- Upstash: $10
- ScrapingBee: $99
- Domain: $1
Total: $155

Revenue: 200 × $9 = $1,800
Profit: $1,645 (91% margin)
```

**Month 12 (1,000 paid users):**
```
Infrastructure: $284 (updated stack)
Variable: $80 (scraping + AI)
Stripe fees: $417
Total: $781

Revenue: $14,395
Profit: $13,614 (94.6% margin)
```

---

## 🗺️ **12-Week Roadmap**

### **Phase 1: MVP (Weeks 1-12)**

---

#### **Month 1: Foundation (Weeks 1-4)**

**Week 1: Setup & Planning**
- [ ] Buy domain name ($12)
- [ ] Set up GitHub repository
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase account (free tier)
- [ ] Configure Vercel deployment
- [ ] Apply to P21 Venture Mentoring Service

**Deliverable:** Landing page deployed, basic routing works

**Hours:** 6-8 hours  
**School consideration:** Do during light syllabus week

---

**Week 2: Authentication**
- [ ] Implement Supabase Auth (email/password)
- [ ] Create signup/login pages with shadcn/ui
- [ ] Build empty dashboard shell
- [ ] Set up environment variables properly (never commit secrets!)

**Deliverable:** Users can sign up and see dashboard

**Hours:** 6-8 hours

---

**Week 3: Scraping Engine (Local Testing)**
- [ ] Set up Python environment locally
- [ ] Install youtube-transcript-api
- [ ] Test basic transcript extraction (no proxies)
- [ ] Create simple API endpoint (FastAPI or Flask)
- [ ] Sign up for Webshare ($5/mo for testing)

**Deliverable:** Can extract transcripts locally

**Hours:** 6-8 hours

---

**Week 4: Frontend Integration**
- [ ] Connect Next.js frontend to Python backend
- [ ] Build transcript display page
- [ ] Add copy-to-clipboard button
- [ ] Implement basic error handling

**Deliverable:** End-to-end flow works (paste URL → see transcript)

**Hours:** 8-10 hours

**Month 1 Progress:** ~30% MVP complete, spent $22

---

#### **Month 2: Core Features (Weeks 5-8)**

**Week 5: Dashboard Development**
- [ ] Build transcript history page
- [ ] Show recent transcripts with thumbnails
- [ ] Add search within personal history
- [ ] Create account settings page

**Deliverable:** Functional dashboard with history

**Hours:** 8-10 hours  
**School consideration:** Reduce to 5-6 hours if midterms approaching

---

**Week 6: Database & Caching**
- [ ] Set up PostgreSQL schema in Supabase
- [ ] Implement Redis caching (Upstash free tier)
- [ ] Save transcripts to database
- [ ] Test cache hit/miss logic

**Deliverable:** Transcripts persist, caching works

**Hours:** 6-8 hours

---

**Week 7: Reliability (Add ScrapingBee)**
- [ ] Sign up for ScrapingBee trial
- [ ] Implement "waterfall" scraping logic:
  1. Check cache
  2. Try Webshare (cheap)
  3. Fall back to ScrapingBee (reliable)
- [ ] Add retry logic with exponential backoff
- [ ] Test success rate improvement

**Deliverable:** 95%+ success rate on transcripts

**Hours:** 7-9 hours

---

**Week 8: Rate Limiting & User Management**
- [ ] Implement rate limiting with Redis
  - Free users: 5/day
  - Pro users: Unlimited
- [ ] Add usage tracking (requests_log table)
- [ ] Build upgrade prompts in UI
- [ ] Test with multiple test accounts

**Deliverable:** Rate limits enforced, usage tracked

**Hours:** 6-8 hours

**Month 2 Progress:** ~65% MVP complete, spent $57 cumulative

---

#### **Month 3: Payments & Launch (Weeks 9-12)**

**Week 9: Stripe Integration**
- [ ] Set up Stripe account
- [ ] Create Pro plan product ($9/mo)
- [ ] Implement Stripe Checkout
- [ ] Build webhook handler (payment_succeeded, subscription_deleted)
- [ ] Test full payment flow in test mode

**Deliverable:** Users can upgrade to Pro

**Hours:** 10-12 hours (Stripe is complex)  
**Optional:** Add GitHub Copilot this week ($10) to speed up

---

**Week 10: Polish & Bug Fixes**
- [ ] Fix all known bugs from backlog
- [ ] Improve error messages (user-friendly)
- [ ] Add loading states everywhere
- [ ] Write basic FAQ/Help documentation
- [ ] Set up error tracking (Sentry free tier)

**Deliverable:** Production-ready quality

**Hours:** 10-12 hours (polish takes time)

---

**Week 11: Beta Testing**
- [ ] Invite 10-20 beta users:
  - UTEP classmates
  - Coding Interview Club members
  - Friends/family
- [ ] Create feedback form (Google Forms)
- [ ] Monitor error logs closely (Sentry)
- [ ] Fix critical bugs immediately

**Deliverable:** Validated by real users, major bugs fixed

**Hours:** 8-10 hours (mostly monitoring + support)

**Expected feedback:** 5-10 bugs, 2-3 feature requests

---

**Week 12: Soft Launch 🚀**
- [ ] Create demo video (Loom, 2-3 minutes)
- [ ] Write Product Hunt launch post
- [ ] Prepare Reddit posts (r/SideProject, r/YouTube)
- [ ] Post on Twitter/X with demo
- [ ] Monitor analytics closely (Plausible/Umami)
- [ ] Respond to all feedback within 24 hours

**Deliverable:** Publicly launched, first users arriving

**Hours:** 10-12 hours (launch day + support)

**Expected results:**
- 100-300 visitors (if Product Hunt goes well)
- 20-50 signups
- 2-5 paid conversions ($18-45 revenue!)

**Month 3 Progress:** 100% MVP complete, spent $137 cumulative

---

### **Phase 2: Growth Features (Months 4-6)**

**Not building yet, but planning for:**

**Month 4:**
- [ ] Add AI summaries (Gemini 3 Flash)
- [ ] Multi-language support
- [ ] Export formats (.md, .json, .srt, .pdf)

**Month 5:**
- [ ] "Chat with Transcript" (RAG-based Q&A)
- [ ] Batch processing (up to 50 videos)
- [ ] Improved analytics dashboard

**Month 6:**
- [ ] Multi-channel search (Developer tier)
- [ ] API access (basic endpoints)
- [ ] Blog generator feature

**Success Milestone:** 200 paid users, $1,800 MRR

---

### **Phase 3: Scale & Enterprise (Months 7-12)**

**Month 7-9:**
- [ ] Developer API (full featured)
- [ ] Webhooks for async processing
- [ ] Advanced analytics
- [ ] Team workspaces

**Month 10-12:**
- [ ] Enterprise tier features
- [ ] Custom SLAs
- [ ] White-label option
- [ ] Sales outreach to agencies

**Success Milestone:** 1,000 paid users, $14K MRR

---

## 📅 **Weekly Schedule Template**

Given you're juggling school + interviews + Best Buy:

### **Typical Week Breakdown**

| Day | Primary Focus | SaaS Time |
|-----|--------------|-----------|
| **Monday** | School + Interview Prep | 0 hours |
| **Tuesday** | School + Interview Prep | 0 hours |
| **Wednesday** | School + Best Buy | 0 hours |
| **Thursday** | School + Interview Prep | 1-2 hours (evening) |
| **Friday** | School + Best Buy | 0 hours |
| **Saturday** | Best Buy (morning) | 3-4 hours (afternoon/evening) |
| **Sunday** | Interview Prep (morning) | 2-3 hours (afternoon) |

**Total:** 6-9 hours/week

**Flexibility:**
- Busy week (midterms)? Do 3-4 hours
- Light week (spring break)? Do 15-20 hours
- Week before finals? PAUSE completely

---

## 🎯 **Success Milestones & Celebration**

Track progress and reward yourself:

| Milestone | Reward | Cost |
|-----------|--------|------|
| Week 4: Auth working | Favorite meal | $15 |
| Week 8: First transcript cached | New coding setup item | $30 |
| Week 12: Launch day | Celebrate with friends | $50 |
| First paying user | Reinvest in tool | $20 |
| 10 paying users | Upgrade infrastructure | - |
| Break-even ($143 revenue) | Take a day off | Priceless |

---

## 💡 **Tech Stack Decision Summary**

### **What Changed from Original PRD (Critical)**

| Component | Original | Updated (2026) | Why |
|-----------|----------|----------------|-----|
| **Job Queue** | BullMQ | Upstash QStash | Scale to zero, $0 idle cost |
| **AI Model** | Claude 4 Sonnet | Gemini 3 Flash | 86% cheaper, same quality |
| **Scraping** | DIY + Webshare | ScrapingBee primary | Saves 30-40 hrs/month |
| **Pricing** | Unlimited AI | 100 AI summaries cap | Prevents loss scenarios |

**Annual Savings:** $1,788 + 360-480 hours

---

### **Final Tech Stack (Simple List)**

**Frontend:**
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Deployed on Vercel

**Backend:**
- Next.js API Routes (Node.js)
- Upstash QStash (job queue)
- Python 3.11 + FastAPI (workers)
- Google Cloud Run (serverless containers)

**Data:**
- PostgreSQL (Supabase)
- Redis (Upstash)

**External:**
- ScrapingBee (transcription)
- Gemini 3 Flash (AI summaries)
- Stripe (payments)

---

## 🚀 **Next Steps (This Week)**

### **Priority 1: Funding (Do First)**
- [ ] Apply to P21 Venture Mentoring Service (pioneers21elpaso.org)
  - Free mentorship
  - 15-minute application
  - Could save you months of mistakes

### **Priority 2: Budget (Do Second)**
- [ ] Set aside $25 from next Best Buy paycheck
- [ ] Create separate savings or envelope for "SaaS fund"
- [ ] Buy domain name ($12)

### **Priority 3: Setup (Do Third)**
- [ ] Create GitHub account (if you don't have one)
- [ ] Sign up for Vercel (free)
- [ ] Sign up for Supabase (free)
- [ ] Sign up for Upstash (free)

### **Don't Do Yet:**
- ❌ Don't buy ScrapingBee until Week 7
- ❌ Don't upgrade to paid plans until you hit limits
- ❌ Don't buy Copilot until Month 3 (if at all)

---

## 📚 **Resources & Links**

### **Documentation**
- Next.js: nextjs.org/docs
- Supabase: supabase.com/docs
- Upstash: upstash.com/docs
- ScrapingBee: scrapingbee.com/documentation
- Gemini API: ai.google.dev/docs

### **Local Resources (El Paso)**
- P21 Venture Mentoring: pioneers21elpaso.org
- P21 Financial Accelerator: $5,000 grant competition
- Tech Frontier: techfrontierep.org
- The Station (coworking): thestationep.com ($100/mo)
- "Tacos and Tech-ila": Monthly pitch event

### **Learning Resources**
- GitHub Student Pack: education.github.com/pack (free credits)
- UTEP Azure for Students: $100 free credit
- YouTube: "Next.js tutorial", "Stripe integration", "Python FastAPI"

---

## 🎓 **Important Reminders for Students**

### **Priority Order (Always)**
1. **School** - Don't sacrifice GPA (you're doing great at 3.88!)
2. **Interviews** - Landing internship > side project revenue
3. **SaaS** - Build in spare time, learning experience

### **The Real Value**
Even if this SaaS makes $0, you'll have:
- ✅ Production-grade portfolio piece
- ✅ Experience with Next.js, PostgreSQL, Redis, Stripe, AI APIs
- ✅ Understanding of SaaS business models
- ✅ Interview talking points

**In your interviews, you can say:**
> "I built a YouTube transcript SaaS that handles 1,000+ requests/day with 99% reliability. I implemented a waterfall proxy strategy, integrated Stripe for payments, optimized caching to keep costs under $50/month, and used Gemini AI for summaries. It's currently generating $200+ MRR."

**That statement alone is worth more than the actual revenue.**

---

## 📊 **Quick Reference: Monthly Costs**

| Month | Infrastructure | Revenue | Profit | Note |
|-------|---------------|---------|--------|------|
| 1-3 | $22-137 | $0 | -$137 | Development phase |
| 4 | $50 | $450 | $400 | First paid users |
| 5 | $75 | $900 | $825 | Growing |
| 6 | $155 | $1,800 | $1,645 | Hit target! |
| 7-12 | $200-400 | $5K-14K | $4.5K-13K | Scaling |

**Break-even:** Month 4-5 (recover initial $143 investment)

---

## ✅ **Final Checklist (Before You Start)**

**This Week:**
- [ ] Read this entire document
- [ ] Decide on budget: $107 (minimum) or $143 (recommended)
- [ ] Set aside money from Best Buy paycheck
- [ ] Apply to P21 VMS
- [ ] Buy domain name

**Next Week:**
- [ ] Set up all free accounts (GitHub, Vercel, Supabase, Upstash)
- [ ] Create initial Next.js project
- [ ] Deploy "Hello World" to Vercel

**Month 1:**
- [ ] Build auth system
- [ ] Get local scraping working
- [ ] Spend exactly $22

**Month 2:**
- [ ] Build dashboard
- [ ] Add caching
- [ ] Improve reliability
- [ ] Spend ~$35

**Month 3:**
- [ ] Integrate Stripe
- [ ] Beta test
- [ ] Launch publicly
- [ ] Spend ~$50

**Total:** $107-143, 100 hours, 12 weeks

---

## 🎉 **You Got This!**

Remember:
- This is a **marathon, not a sprint**
- School and interviews come first
- Build in public, learn constantly
- The journey > the destination

**When you feel overwhelmed:**
1. Pause the SaaS for a week (it's okay!)
2. Focus on school/interviews
3. Come back when you have time
4. Progress > perfection

**Good luck, Ben! This is going to be an amazing learning experience.**

---

**Questions? Blockers? Track them and adjust as you go.**

**Remember:** You have a 3.88 GPA, you're Chief Outreach Officer of Coding Club, you've won hackathons, and you're crushing it at Best Buy. You can absolutely build this.

**Now go apply to P21 and get that $5K grant to fund this 33x over! 🚀**
