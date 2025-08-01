# 📘 Feature Specification: Dashboard Listing

**Feature ID**: FR-01  
**Feature Name**: Dashboard Listing  
**Owner**: Product / Engineering  
**Last Updated**: 2025-07-23


## 🧱 3. Functional Specification

### 3.1 Route

- **Path**: `/dashboard`  
- **Method**: GET

### 3.2 UI Layout

- Header: "My Meetings"
- Section A: Today’s Meetings (เฉพาะ meeting ที่ตรงกับวันปัจจุบัน)
- Section B: Paginated list (แสดง 10 รายการต่อหน้า)

แต่ละรายการแสดง:

- `title`
- `date`
- `status`: `process`, `done`, `error`
- ปุ่ม **"View Summary"** (แสดงเฉพาะเมื่อ `status == 'done'`)

---

## 🔌 4. API Integration

### 4.1 Endpoint: `GET /api/meetings`

**Purpose**: ดึงรายการ meeting ของผู้ใช้แบบแบ่งหน้า (pagination)

#### Parameters

| Name | Type   | Description             | Default |
|------|--------|-------------------------|---------|
| page | number | หมายเลขหน้าที่ต้องการดู | 1       |

#### Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Meeting title",
      "date": "2025-07-20",
      "status": "done"
    }
  ],
  "meta": {
    "page": 1,
    "totalPages": 3,
    "totalCount": 25
  }
}

```
## 🗃️ 5. Data Model Mapping
### 5.1 Entity Relationship
```scss
users (1) → (N) meetings  
meetings (1) → (N) transcripts  
```

### 5.2 Table Fields (สำคัญ)
## 2.1 Entity Relationship Overview

```
users (1) → (N) meetings
meetings (1) → (N) transcripts  
transcripts (1) → (1) summaries
```

## 2.2 Table Definitions

### 🧑 users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 📅 meetings
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 📝 transcripts
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  meetingDate DATE NOT NULL,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('process', 'done', 'error')) NOT NULL DEFAULT 'process',
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_meeting
    FOREIGN KEY ("meetingId") REFERENCES "Meetings"("meetingId") ON DELETE CASCADE
);
```

### 📊 summaries
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
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_transcript
    FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("transcriptId") ON DELETE CASCADE
);
```


⚙️ 8. Backend Tasks
Task	Description
Model	สร้าง meetings, transcripts, user, summary table
Endpoint	สร้าง GET /api/meetings พร้อม pagination
Sorting	Sort ตาม meeting_date DESC
Join	Join meetings กับ transcripts เพื่อดึง status
Meta Output	ส่ง meta object กลับสำหรับ pagination

💻 9. Frontend Tasks
Task	Description
Layout	สร้าง /dashboard route
Meeting List	แสดงรายการประชุมแบบแบ่งหน้า
Summary Button	ปุ่ม "View Summary" → /summary/:transcriptId
Pagination	ปุ่ม [Prev], [1], [2], ... [Next]
Today Indicator	แสดง badge/icon สำหรับ meeting วันนี้
Fallback States	แสดง loading / empty / error states

📎 10. Dependencies
✅ API /api/meetings พร้อมใช้

✅ Summary page (/summary/:id) สำหรับใช้กับปุ่ม "View Summary"


# 🧠 Technical Specification – Dashboard Listing & Summary View

## 📁 Overview

This document outlines the technical specifications for the following frontend + backend features:

- **Dashboard Listing (FR-01):** Displays paginated meetings with transcript status.
- **Summary View (FR-02):** Displays structured AI-generated meeting summaries.

---

## 🧰 Tech Stack

| Layer        | Technology                           |
|--------------|---------------------------------------|
| Frontend     | React.js Vite          |
| UI Framework | Tailwind CSS                         |
| State Mgmt   | React Context   |
| Backend      | Node.js with Express.js              |
| API Layer    | RESTful API                          |
| Database     | PostgreSQL                           |
---

## 🧩 Architecture Diagram

```text
[ Client UI ]
     ↓
[ React Dashboard & Summary Views ]
     ↓
[ API Layer (Express.js) ]
     ↓
[ PostgreSQL + Prisma ORM ]
