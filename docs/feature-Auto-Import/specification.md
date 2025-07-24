# 📘 Feature Specification: Auto Import Transcripts

**Feature ID:** FR-03  
**Feature Name:** Auto Import Transcripts  
**Version:** 1.0  
**Last Updated:** 2025-07-24

---

## 🎯 1. Overview

The Auto Import feature enables users to automatically process transcript files by placing them in a designated folder. The system performs periodic file sweeps to import new files, creates meeting records, processes transcripts, and triggers AI summary generation.

---

## 🏗️ 2. Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Import Folder  │────▶│  File Sweeper    │────▶│ Import Service  │
│   (Shared)      │     │  (Cron Job)      │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                              ┌────────────────────────────┼────────────────┐
                              │                            │                │
                        ┌─────▼──────┐            ┌────────▼──────┐   ┌─────▼──────┐
                        │  Database  │            │ File Storage  │   │ AI Service │
                        │            │            │               │   │            │
                        └────────────┘            └───────────────┘   └────────────┘
```

---

## 🔧 3. Backend & API Specification

### 3.1 File Sweeper Service

**Configuration:**
```javascript
{
  "importFolder": "/shared/transcripts/import",
  "processedFolder": "/shared/transcripts/processed",
  "errorFolder": "/shared/transcripts/error",
  "cronSchedule": "*/10 * * * *", // Every 10 minutes
  "supportedFormats": [".txt", ".json", ".md"]
}
```

### 3.2 Import Process Flow

1. **File Sweep**
   - Scan import folder for all files
   - Filter unprocessed files (check against import_logs)
   - Validate file format and size
   - Check for duplicate imports (by file hash)

2. **Batch Processing**
   - Process all new files in current sweep
   - Parse transcript content
   - Extract metadata (meeting date, title if available)
   - Create database records

3. **Post-Processing**
   - Move successful imports to processed folder
   - Move failed imports to error folder
   - Trigger AI summary generation for each file

### 3.3 API Endpoints

#### `POST /api/import/sweep`
- **Purpose:** Manually trigger a file sweep
- **Response:**
```json
{
  "processed": 5,
  "failed": 1,
  "skipped": 2,
  "details": [
    {
      "filename": "meeting_2025-07-24.txt",
      "status": "success",
      "transcriptId": "uuid-123"
    }
  ]
}
```

#### `GET /api/import/status`
- **Purpose:** Get import service status and statistics
- **Response:**
```json
{
  "status": "active",
  "lastSweep": "2025-07-24T10:30:00Z",
  "nextSweep": "2025-07-24T10:40:00Z",
  "stats": {
    "totalProcessed": 152,
    "successRate": 0.94,
    "averageProcessingTime": 2.3
  }
}
```

#### `GET /api/import/history`
- **Purpose:** Get import history with pagination
- **Query Params:** `page`, `limit`, `status`
- **Response:**
```json
{
  "data": [
    {
      "id": "import-uuid",
      "filename": "meeting_2025-07-24.txt",
      "importDate": "2025-07-24T10:25:00Z",
      "status": "success",
      "fileSize": 45678,
      "processingTime": 1.8,
      "transcriptId": "uuid-123",
      "meetingId": "uuid-456"
    }
  ],
  "meta": {
    "page": 1,
    "totalPages": 5,
    "totalCount": 48
  }
}
```

---

## 🧩 4. Data Model

### 4.1 Import Logs Table
```sql
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_hash VARCHAR(64) NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  import_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'duplicate')) NOT NULL,
  error_message TEXT,
  processing_time DECIMAL(5,2),
  transcript_id UUID REFERENCES transcripts(id),
  meeting_id UUID REFERENCES meetings(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_file_hash ON import_logs(file_hash);
```

### 4.2 Supported File Formats

#### Text Format (.txt)
```
Meeting: Project Status Update
Date: 2025-07-24
Attendees: Alice, Bob, Charlie

Alice: Let's start with the project status...
Bob: The development is on track...
```

#### JSON Format (.json)
```json
{
  "meeting": {
    "title": "Project Status Update",
    "date": "2025-07-24",
    "attendees": ["Alice", "Bob", "Charlie"]
  },
  "transcript": [
    {"speaker": "Alice", "text": "Let's start with the project status..."},
    {"speaker": "Bob", "text": "The development is on track..."}
  ]
}
```

---

## 🖥️ 5. UI Specification

### 5.1 Import Status Dashboard

**Route:** `/import-status`

**Components:**
- Import statistics card (success rate, total processed)
- Recent imports table with status indicators
- File format guide and requirements
- Manual upload option (drag & drop)

### 5.2 Import History Page

**Features:**
- Sortable/filterable table of all imports
- Status badges (success/failed/duplicate)
- Links to view generated summaries
- Error details for failed imports
- Re-process option for failed imports

---

## 🔒 6. Security & Validation

### 6.1 File Validation
- Maximum file size: 10MB
- Supported formats: .txt, .json, .md
- UTF-8 encoding required
- Virus scanning before processing

### 6.2 Duplicate Detection
- SHA-256 hash comparison
- Content-based similarity check (90% threshold)
- Option to force re-import with override flag

### 6.3 Access Control
- Import folder permissions restricted
- API endpoints require authentication
- Audit trail for all import operations

---

## ⚡ 7. Performance Considerations

- **Batch Processing:** Process all files found in single sweep
- **Sweep Frequency:** Configurable via cron (default: every 10 minutes)
- **File Locking:** Skip files currently being written (check file modification time)
- **Cleanup:** Auto-delete processed files after 30 days
- **Maximum Files Per Sweep:** 100 files to prevent memory issues

---

## 🚨 8. Error Handling

### 8.1 Error Types
- `INVALID_FORMAT`: File format not supported
- `PARSE_ERROR`: Unable to parse transcript content
- `DUPLICATE_FILE`: File already imported
- `SIZE_EXCEEDED`: File too large
- `PROCESSING_ERROR`: Internal processing failure

### 8.2 Error Recovery
- Automatic retry for transient errors (max 3 attempts)
- Move failed files to error folder with error log
- Email notification for critical failures
- Manual re-processing option

---

## 📊 9. Monitoring & Alerts

### 9.1 Metrics
- Import success rate
- Average processing time
- Queue size and backlog
- Error rate by type

### 9.2 Alerts
- Import folder not accessible
- High failure rate (>20%)
- Processing queue backlog (>50 files)
- Storage space low (<1GB)

---

## 🔗 10. Integration Points

- **AI Service:** Automatic summary generation trigger
- **Notification Service:** Email/webhook on import completion
- **Storage Service:** File archival after processing
- **Analytics Service:** Import statistics and trends

---

## 📝 11. Configuration

### Environment Variables
```env
IMPORT_FOLDER_PATH=/shared/transcripts/import
PROCESSED_FOLDER_PATH=/shared/transcripts/processed
ERROR_FOLDER_PATH=/shared/transcripts/error
IMPORT_CRON_SCHEDULE=*/10 * * * *
MAX_FILE_SIZE_MB=10
ENABLE_AUTO_IMPORT=true
MAX_FILES_PER_SWEEP=100
```

---

## 🧪 12. Testing Scenarios

1. **Happy Path:** Valid file import and processing
2. **Duplicate Detection:** Same file imported twice
3. **Error Handling:** Malformed file content
4. **Performance:** Bulk import of 100+ files
5. **Concurrent Access:** Multiple files added simultaneously
6. **Recovery:** Service restart during processing