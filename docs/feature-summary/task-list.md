# ✅ Full Task List – Summary View Feature (FR-02)

---

## 🔧 1. Backend Tasks

### 1.1 API Implementation
- [ ] Implement `GET /api/summaries/:transcriptId` controller
- [ ] Query the transcript and check if `status = done`
- [ ] Join summary data with transcript and meeting info
- [ ] Include transcript content in the JOIN query
- [ ] Handle `pending`, `error`, and `not found` states
- [ ] Return proper JSON structure based on summary schema
- [ ] Add `transcriptContent` field to the response
- [ ] Return HTTP status codes: 200, 404, 400

### 1.2 Validation
- [ ] Check that `transcriptId` is a valid UUID
- [ ] Check if transcript exists
- [ ] Validate that `summary` record exists for the transcript

### 1.3 Error Handling
- [ ] Return error message if AI summary generation failed
- [ ] Return error if transcript not found or malformed
- [ ] Log server-side errors (e.g., DB failures)

---

## 🧩 2. Data Model / Database

### 2.1 Schema Setup
- [ ] Define `summaries` table with JSONB fields (if not done)
- [ ] Ensure `transcript_id` is UNIQUE and FK to `transcripts`
- [ ] Add necessary indexes: `transcript_id`, `created_at`

### 2.2 Seed Data (Dev/Test)
- [ ] Seed transcripts with various statuses (`done`, `pending`, `error`)
- [ ] Seed summaries with realistic data for all JSONB fields
- [ ] Include cases where some sections (e.g. `nextSteps`) are empty

---

## 🖥 3. Frontend Tasks

### 3.1 API Integration
- [ ] Call `GET /api/summaries/:transcriptId` on page load
- [ ] Display loading spinner while fetching
- [ ] Handle 3 states: `done`, `pending`, `error`
- [ ] Handle API failure (e.g., 404 or server error)

### 3.2 Component Development
- [ ] `<SummaryPage />` – main layout container
- [ ] `<SummaryHeader />` – meeting title and date
- [ ] `<AttendeesList />`
- [ ] `<KeyDecisions />`
- [ ] `<ActionItemsList />`
- [ ] `<DiscussionHighlights />`
- [ ] `<NextSteps />`
- [ ] `<MeetingTranscript />` – collapsible transcript section
- [ ] `<SectionNavigationSidebar />` – scroll nav on desktop (include transcript)
- [ ] `<EmptySection />` – hide sections with no content
- [ ] `<BackToDashboardButton />`

### 3.3 UI States
- [ ] Loading state (skeleton or spinner)
- [ ] Pending state: "Summary is still being generated"
- [ ] Error state: "An error occurred" + retry or contact option
- [ ] No summary: fallback UI for missing data

---

## 🎨 4. UI/UX and Interaction

- [ ] Scroll-to-section from sidebar (including transcript)
- [ ] Sticky sidebar (desktop only)
- [ ] Responsive layout (desktop ≥ 1024px)
- [ ] Clean and legible typography for each section
- [ ] Icons or badges for task assignments
- [ ] Human-readable date formatting
- [ ] Implement expand/collapse functionality for transcript section
- [ ] Add visual indicator for transcript section state (expanded/collapsed)
- [ ] Format transcript content with speaker names and line breaks

---

## ♿ 5. Accessibility & Responsiveness

- [ ] Ensure tab/keyboard navigation between sections
- [ ] Use semantic HTML for lists and headings
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Responsive layout on mobile/tablet
- [ ] Test with screen reader (optional)

---

## 🧪 6. Testing Tasks

### 6.1 Unit Tests (Frontend)
- [ ] Component renders with valid data
- [ ] Component handles empty/undefined fields
- [ ] Error message appears if fetch fails
- [ ] Spinner shows during loading
- [ ] Test transcript expand/collapse functionality
- [ ] Test transcript content rendering with proper formatting

### 6.2 Unit Tests (Backend)
- [ ] Test API response when summary exists
- [ ] Test API when status is `pending` or `error`
- [ ] Test invalid transcriptId
- [ ] Test missing summary case
- [ ] Test transcript content is included in response
- [ ] Test JOIN query returns correct transcript data

### 6.3 Integration Tests
- [ ] Summary loads end-to-end from dashboard → summary view
- [ ] Handle all status cases (done, pending, error)
- [ ] All sections render correctly with mock data
