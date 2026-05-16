# User Flow — Build with AI Hackathon

This document describes the user journey through the hackathon platform.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. OVERVIEW         2. LOGIN/REGISTER        3. PARTICIPATE                │
│   ─────────────       ─────────────────       ─────────────────             │
│   User lands on       User signs in or         User chooses one or more:     │
│   hackathon page      creates account         • Join a project              │
│   • Sees hero         (Firebase Auth)         • Create project idea          │
│   • Reads "What is    • Email/password        • Work on Adventure            │
│     a Hackathon?"     • Google sign-in          Leaderboard                  │
│   • Sees stats                                (adventure.wietsevenema.eu)    │
│   • CTA buttons                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Overview

**Route:** `/hackathon` (Overview tab)

**What the user sees:**
- **Hero** — Build with AI · IWD 2026 · GDG London
- **Stats** — 100+ participants, Mar 13 deadline
- **What is a Hackathon?** — Brief intro to hackathons and Build with AI
- **CTA buttons** — Submit Project, Find a Team, Project Gallery

**User actions:**
- **Not signed in:** "Sign in to submit" (disabled) — prompts user to log in
- **Signed in:** Submit Project, Find a Team, Project Gallery (all active)

**Next step:** User clicks "Sign In" (header) or attempts to submit → goes to Step 2

---

## Step 2: Login or Register

**Trigger:** User clicks "Sign In" in the header

**What happens:**
- Auth modal opens with two tabs: **Sign In** and **Sign Up**
- **Sign In:** Email + password, or "Sign in with Google"
- **Sign Up:** Display name, email, password, or "Sign up with Google"

**Authentication:** Firebase Auth (email/password + Google OAuth)

**After successful login:**
- Modal closes; user is signed in
- Header shows hackathon actions, **Profile** link, user name, Sign Out
- **Recommended:** open **[/hackathon/profile](/hackathon/profile)** (or `/profile`, which redirects) and complete bio, team preference, and in-person attendance — required before **Request to join** on **[/hackathon/ideas](/hackathon/ideas)**

**Next step:** Participate (Step 3) or finish profile first

---

## Step 3: Participate

Once signed in, the user can choose one or more of these paths:

### Option A: Join a Project

**Routes:** `/hackathon/participants` or `/hackathon/gallery`

**Participants page:**
- Shows unique participant count and project count
- Lists projects by participants
- User can browse and click a project to view details

**Project Gallery:**
- Browse all submitted projects
- Search, sort, filter
- Click a project to view details, like, comment
- Connect with teams

**Flow:** User browses → finds interesting project → views details → can reach out to team (via project info)

---

### Option B: Idea gallery & join a team

**Route:** `/hackathon/ideas` (short URL `/ideas` redirects here)

- Lists projects with **Looking for members**
- **Request to join** is available only after the user’s **hackathon profile** is complete (see `/hackathon/profile`)

### Option C: Create a project / submit

**Route:** **`/hackathon/my-projects`** — project summary and **Project submission** form below (deep link: `?project=1`, edit: `?project=1&edit=<id>`). Legacy **`/submit`** redirects here.

**What the user does:**

- Reviews or edits the **project** card (title, status, links).
- Uses the **submission** form for draft/final ship (separate from hackathon profile fields).
- Saves as **draft** or **submits** when ready (timeline gates unchanged).

**Flow:** Complete profile as needed → create idea → save draft → iterate → submit before deadline

---

### Option D: Work on Adventure Leaderboard

**External link:** [adventure.wietsevenema.eu](https://adventure.wietsevenema.eu/)

**What it is:** A separate platform to test and practice AI skills (leaderboard, challenges).

**How users find it:**
- Mentioned in Overview "What is a Hackathon?" section
- Linked from Resources page

**Flow:** User visits adventure.wietsevenema.eu → completes challenges → builds skills → may return to create/join a hackathon project

---

## Flow Summary Table

| Step | Action | Route / Location |
|------|--------|------------------|
| 1 | See overview | `/hackathon` |
| 2 | Sign in or register | Auth modal (header "Sign In") |
| 2b | Complete hackathon profile (for join requests) | `/hackathon/profile` |
| 3a | Join a project | `/hackathon/participants`, `/hackathon/gallery` |
| 3b | Idea gallery — request to join | `/hackathon/ideas` (`/ideas`) |
| 3c | Create / submit project | `/hackathon/my-projects?project=1` (`/ideas/create` redirects here; `/submit` redirects) |
| 3d | Work on Adventure | [adventure.wietsevenema.eu](https://adventure.wietsevenema.eu/) |

---

## Navigation Tabs (Signed In)

| Tab | Route | Purpose |
|-----|-------|---------|
| Overview | `/hackathon` | Hero, intro, CTAs |
| My Projects | `/hackathon/my-projects` | User's drafts and submissions |
| Participants | `/hackathon/participants` | Participant count, project list |
| Resources | `/hackathon/resources` | Links (Gemini API, AI Studio, Adventure) |
| Rules | `/hackathon/rules` | Teams, submission requirements, judging |
| Project Gallery | `/hackathon/gallery` | Browse all projects |

---

## Quick Reference

```
Overview → Sign In → Profile (recommended) → [Join | Idea gallery | My project | Adventure]
```

- **Join:** Participants or Gallery
- **Ideas:** `/hackathon/ideas` — complete `/hackathon/profile` first to request to join
- **Create:** `/hackathon/my-projects` (`?project=1` deep link; `/submit` redirects)
- **Adventure:** adventure.wietsevenema.eu (external)
