# ✅ Task List: Transcript Processing Feature

**Feature ID**: FR-03  
**Feature Name**: Transcripts  
**Stage**: MVP  
**Last Updated**: 2025-07-25

---

## 🧩 1. Feature Overview

> Enable automatic processing of meeting transcripts by dropping files into a shared folder. The system detects files, checks for duplicates, and generates AI-powered summaries.

---

## 🔧 2. Backend Tasks

### 🗂 Data Modeling (PostgreSQL)
- [ ] Create `transcripts` table with status tracking
- [ ] Add unique constraint on `file_hash` for duplicate detection
- [ ] Create indexes on `status` and `meeting_id` columns
- [ ] Link transcripts to meetings table (foreign key)
- [ ] Seed test data:
  - [ ] Sample transcripts with different statuses
  - [ ] Test files for duplicate detection

### 📡 File Watcher Service
- [ ] Implement Node.js file watcher using `fs.watch`
- [ ] Configure watch directory path from environment
- [ ] Set up 30-second polling interval
- [ ] Filter for `.txt` files only
- [ ] Implement file hash generation (MD5)
- [ ] Create service startup/shutdown logic

### 🤖 Processing Service
- [ ] Implement duplicate check against database
- [ ] Create transcript record with 'pending' status
- [ ] Extract meeting date from filename
- [ ] Read file content (UTF-8 encoding)
- [ ] Handle files up to 10MB size limit

### 🧠 LLM Integration
- [ ] Set up OpenAI API client
- [ ] Implement summary generation function
- [ ] Create structured prompt template
- [ ] Parse LLM response to JSON
- [ ] Handle API rate limits and timeouts
- [ ] Implement retry logic (1 retry on failure)

### 💾 Summary Storage
- [ ] Create summary record in database
- [ ] Link summary to transcript (1:1 relationship)
- [ ] Update transcript status to 'done'
- [ ] Store error messages for failed processing

### 🚨 Error Handling
- [ ] Log all errors to console with timestamps
- [ ] Update transcript status to 'error' on failure
- [ ] Store error messages in `error_msg` field
- [ ] Skip files that can't be read
- [ ] Handle LLM API errors gracefully

---

## 🌐 3. API Integration

### Status Checking
- [ ] Expose transcript status through existing endpoints
- [ ] Include error messages in API responses
- [ ] Return proper HTTP status codes

---

## 🎨 4. Frontend Tasks

### 📊 Dashboard Updates
- [ ] Display transcript processing status
- [ ] Show error indicator for failed transcripts
- [ ] Disable "View Summary" for pending/error status
---

## 🧪 5. Testing Tasks

### Unit Tests
- [ ] Test file hash generation
- [ ] Test duplicate detection logic
- [ ] Test LLM prompt formatting
- [ ] Test JSON parsing from LLM response
- [ ] Test error handling scenarios

### Integration Tests
- [ ] Test file watcher detection
- [ ] Test duplicate file handling
- [ ] Test large file handling (10MB limit)

### Manual Testing
- [ ] Drop various transcript files in folder
- [ ] Test duplicate file scenarios
- [ ] Test error scenarios (invalid content)
- [ ] Verify summary generation accuracy

---

## ✅ 8. Acceptance Criteria

- [ ] Duplicate files are not processed twice
- [ ] Transcripts generate summaries with all required fields
- [ ] Processing errors are logged and visible in UI
- [ ] System handles files up to 10MB
- [ ] Status updates reflect in dashboard
- [ ] "View Summary" only enabled for completed transcripts
