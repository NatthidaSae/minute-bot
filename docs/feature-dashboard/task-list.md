# ✅ Task List: Dashboard Listing Feature

**Feature ID**: FR-01  
**Last Updated**: 2025-07-23

---

## 🧩 1. Feature Overview

> Display a user's meeting history in a paginated dashboard, with meeting status and navigation to available summaries.

---

## 🔧 2. Backend Tasks

### 🗂 Data Modeling (PostgreSQL)
- [ ] Create `meetings` table (UUID, title, meeting_date, user_id)
- [ ] Create `transcripts` table (UUID, meeting_id, status: pending/done/error)
- [ ] Define relationships:
  - [ ] `users (1) → (N) meetings`
  - [ ] `meetings (1) → (N) transcripts`
- [ ] Seed dev database:
  - [ ] 1 user → 5+ meetings
  - [ ] 1 transcript per meeting (various statuses)

### 📡 Endpoint: `GET /api/meetings`
- [ ] Create controller for `GET /api/meetings`
- [ ] Support `?page=1` query parameter
- [ ] Join `meetings` + latest `transcripts` → return id, title, meeting_date, status
- [ ] Sort by `meeting_date DESC`
- [ ] Return `meta` object: `page`, `totalPages`, `totalCount`
- [ ] Write unit tests for the endpoint

---

## 🌐 3. API Integration (Frontend ↔ Backend)

- [ ] Call `/api/meetings` from the dashboard
- [ ] Extract `data` and `meta` from the response
- [ ] Map data to UI: title, date, status
- [ ] Conditionally render "View Summary" button (only if `status == 'done'`)
- [ ] Handle fallback states:
  - [ ] Loading state
  - [ ] Empty state ("No meetings found")
  - [ ] Error handling state

---

## 🎨 4. Frontend UI Tasks

### 🔹 Page & Layout
- [ ] Create route `/dashboard`
- [ ] Add header: "My Meetings"
- [ ] Add section: “Today’s Meetings” (if any)
- [ ] Add section: Paginated Meeting List (10 per page)

### 🔹 Component: Meeting List Item
- [ ] Display meeting `title`, `date`, and `status`
- [ ] "View Summary" button → link to `/summary/:transcriptId`
- [ ] Highlight meetings held today (badge, icon, or label)

### 🔹 Pagination Controls
- [ ] Add buttons: `[Prev] [1] [2] [3] ... [Next]`
- [ ] Disable Prev/Next when out of bounds
- [ ] Compute current page from `meta.page`

### 🔹 Fallback UX
- [ ] Show skeleton loading UI while fetching data
- [ ] Show empty state when no data
- [ ] Show error state when API fails

### 🔹 Accessibility & Responsiveness
- [ ] Ensure layout is desktop-friendly
- [ ] Ensure keyboard navigation and screen reader compatibility
- [ ] Use semantic HTML and ARIA attributes where needed

---

## ✅ 5. Acceptance Criteria

- [ ] Dashboard displays 10 meetings per page
- [ ] Meetings held today are clearly marked
- [ ] "View Summary" only shows if `status = 'done'`
- [ ] Pagination works correctly with meta data
- [ ] Empty state message appears when needed
- [ ] Layout is responsive and accessible

---

## 🚧 6. Out of Scope

- [ ] Editing or deleting meetings
- [ ] Uploading or generating transcripts
- [ ] Summary generation (handled by external AI service)

---
