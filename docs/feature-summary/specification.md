# 🔧 3. Backend & API Specification

### 3.1 Endpoint: `GET /api/summaries/:transcriptId`

- **Purpose:** Retrieve a structured JSON summary linked to a transcript.
- **Path Param:** `transcriptId` (UUID)

#### ✅ If status = `done`:

```json
{
  "summaryId": "uuid-xyz",
  "transcriptId": "uuid-abc",
  "date": "2025-07-18",
  "attendees": ["Alice Johnson", "Bob Lee", "Charlie Kim"],
  "keyDecisions": [
    "Extend beta testing by 2 weeks",
    "Switch to a new cloud provider"
  ],
  "actionItems": [
    {
      "task": "Prepare updated marketing plan",
      "assignedTo": ["Alice Johnson"],
      "dueDate": "2025-07-25"
    }
  ],
  "discussionHighlights": [
    "Concerns raised about onboarding drop-off rate"
  ],
  "nextSteps": [
    "Schedule customer success team meeting"
  ],
  "transcriptContent": "Alice: Welcome everyone to today's meeting...\nBob: Thanks for joining...\n[Full transcript text]",
  "createdAt": "2025-07-18T09:32:00.000Z",
  "updatedAt": "2025-07-18T10:15:00.000Z"
}
```
⏳ If status = process:
```json
{ "status": "process" }
```
## 🧩 4. Data Model (PostgreSQL)
### 4.1 Tables 📊 summaries
```sql
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID UNIQUE NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  date DATE,
  attendees JSONB,
  keyDecisions JSONB,
  actionItems JSONB,
  discussionHighlights JSONB,
  nextSteps JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  update_at TIMESTAMP DEFALUT NOW(),
  CONSTRAINT fk_transcript
    FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("transcriptId") ON DELETE CASCADE
);
```

## 🖥 5. UI Layout Specification
### 5.1 Route
/summary/:transcriptId

Linked from "View Summary" button on dashboard

### 5.2 Page Header
Back button (← Back to Dashboard)

Meeting title

Meeting date

### 5.3 Content Sections
Attendees – Names list

Key Decisions – Bulleted items

Action Items – Card layout with due dates

Discussion Highlights – Quote or bullet format

Next Steps – Checklist style

Meeting Transcript – Full conversation text in expandable/collapsible section

(Optional) Additional Notes

### 5.4 Navigation
Sticky sidebar (desktop)

Scroll-to-section links (including Meeting Transcript)

Highlight current section on scroll

Meeting Transcript section can be collapsed/expanded

🧱 8. Design Notes
Summary is stored in a JSONB column for flexibility

One-to-one mapping: transcript → summary

Summary is view-only (no editing)

Summary must be tied to a transcript with status = done

Transcript content is fetched from the transcripts table via JOIN query

Transcript section is collapsible to save space when not needed


🔗 10. Dependencies
Summary API endpoint must be working

Transcript record must be present and processed

Database must include seed