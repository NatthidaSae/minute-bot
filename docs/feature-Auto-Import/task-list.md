# ✅ Task List: Auto Import Transcripts (FR-03)

---

## 🔧 1. Backend Tasks

### 1.1 Database Setup
- [ ] Create `import_logs` table with schema from specification
- [ ] Add indexes for `status` and `file_hash` columns
- [ ] Create migration script for database changes
- [ ] Add seed data for testing import logs

### 1.2 File Sweeper Service
- [ ] Create file sweeper service module (`/backend/src/services/fileSweeper.js`)
- [ ] Implement cron job scheduling using node-cron
- [ ] Create configuration loader for import paths
- [ ] Implement file scanning logic
- [ ] Add file validation (format, size, encoding)
- [ ] Implement SHA-256 hash generation for files
- [ ] Create duplicate detection using file hash

### 1.3 Import Processing Service
- [ ] Create import service module (`/backend/src/services/importService.js`)
- [ ] Implement text file parser (.txt format)
- [ ] Implement JSON file parser (.json format)
- [ ] Implement Markdown file parser (.md format)
- [ ] Extract meeting metadata from files
- [ ] Create meeting records in database
- [ ] Create transcript records in database
- [ ] Log import results to `import_logs` table
- [ ] Implement file moving (to processed/error folders)

### 1.4 API Implementation
- [ ] Implement `POST /api/import/sweep` endpoint
- [ ] Implement `GET /api/import/status` endpoint
- [ ] Implement `GET /api/import/history` endpoint
- [ ] Add pagination to history endpoint
- [ ] Add filtering by status to history endpoint
- [ ] Create ImportController class
- [ ] Add import routes to Express router
- [ ] Add authentication middleware to import endpoints

### 1.5 Integration
- [ ] Integrate with existing AI summary generation trigger
- [ ] Add import success/failure notifications
- [ ] Create file archival service integration
- [ ] Add import metrics collection

---

## 🖥️ 2. Frontend Tasks

### 2.1 Import Status Dashboard
- [ ] Create ImportStatus page component
- [ ] Add route `/import-status` to React Router
- [ ] Create ImportStatistics card component
- [ ] Display success rate and total processed count
- [ ] Create RecentImports table component
- [ ] Add status indicator badges (success/failed/duplicate)
- [ ] Create FileFormatGuide component
- [ ] Add manual upload drag & drop area
- [ ] Implement file upload API call

### 2.2 Import History Page
- [ ] Create ImportHistory page component
- [ ] Create sortable/filterable table
- [ ] Add pagination controls
- [ ] Add status filter dropdown
- [ ] Create error details modal
- [ ] Add links to view generated summaries
- [ ] Implement re-process button for failed imports
- [ ] Add export history to CSV feature

### 2.3 API Integration
- [ ] Create import service module (`/frontend/src/services/importService.js`)
- [ ] Implement `triggerSweep()` function
- [ ] Implement `getImportStatus()` function
- [ ] Implement `getImportHistory()` function
- [ ] Add error handling for API calls
- [ ] Create loading states for all operations

### 2.4 UI Components
- [ ] Create ImportStatusBadge component
- [ ] Create FileUploadZone component
- [ ] Create ImportErrorDetails component
- [ ] Add import notifications to existing notification system
- [ ] Create ImportProgressBar component

---

## 🧪 3. Testing Tasks

### 3.1 Unit Tests (Backend)
- [ ] Test file hash generation
- [ ] Test duplicate detection logic
- [ ] Test file parsers (txt, json, md)
- [ ] Test metadata extraction
- [ ] Test file validation rules
- [ ] Test cron job scheduling
- [ ] Test API endpoints with mock data

### 3.2 Unit Tests (Frontend)
- [ ] Test ImportStatus component rendering
- [ ] Test ImportHistory component with data
- [ ] Test file upload functionality
- [ ] Test error handling in components
- [ ] Test pagination and filtering

### 3.3 Integration Tests
- [ ] Test complete import flow (file → database → summary)
- [ ] Test file movement to processed/error folders
- [ ] Test concurrent file processing
- [ ] Test import with various file formats
- [ ] Test duplicate file handling
- [ ] Test error recovery mechanisms

---

## 🚀 4. Deployment & Configuration

### 4.1 Environment Setup
- [ ] Create import folders structure on server
- [ ] Set folder permissions (read/write access)
- [ ] Configure environment variables
- [ ] Set up cron job on production server
- [ ] Configure file size limits

### 4.2 Monitoring Setup
- [ ] Add import metrics to monitoring dashboard
- [ ] Configure alerts for high failure rates
- [ ] Set up alerts for folder access issues
- [ ] Add import performance tracking
- [ ] Create import success rate reports

---

## 📚 5. Documentation

### 5.1 User Documentation
- [ ] Create user guide for file formats
- [ ] Document supported transcript formats with examples
- [ ] Create troubleshooting guide
- [ ] Add FAQ section for common issues

### 5.2 Technical Documentation
- [ ] Document API endpoints with examples
- [ ] Create system architecture diagram
- [ ] Document file processing flow
- [ ] Add database schema documentation
- [ ] Create deployment guide

---

## 🔒 6. Security & Performance

### 6.1 Security Implementation
- [ ] Implement file size validation (10MB limit)
- [ ] Add virus scanning integration (optional)
- [ ] Implement access control for import folders
- [ ] Add audit logging for all imports
- [ ] Validate file content for malicious code

### 6.2 Performance Optimization
- [ ] Implement file processing queue
- [ ] Add batch processing optimization
- [ ] Implement file locking mechanism
- [ ] Add cleanup job for old processed files
- [ ] Optimize database queries with proper indexing

---

## 🎯 7. Acceptance Criteria

### 7.1 Functional Requirements
- [ ] Files placed in import folder are automatically processed
- [ ] System correctly identifies and skips duplicate files
- [ ] Failed imports are moved to error folder with logs
- [ ] Users can view import history and status
- [ ] Manual trigger for import sweep works correctly

### 7.2 Non-Functional Requirements
- [ ] Import process completes within 2 minutes for 100 files
- [ ] System handles files up to 10MB without issues
- [ ] Error rate stays below 5% for valid files
- [ ] Import status updates in real-time
- [ ] System recovers gracefully from failures

---

## 📋 8. Definition of Done

- [ ] All code is reviewed and approved
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass
- [ ] Documentation is complete
- [ ] Feature is deployed to staging
- [ ] Performance benchmarks are met
- [ ] Security review is completed
- [ ] User acceptance testing is passed