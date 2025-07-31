# 📘 Feature Specification: AI Chat

**Feature ID**: FR-04  
**Feature Name**: AI Chat  
**Owner**: Product / Engineering  
**Last Updated**: 2025-07-31

---

## 🎯 1. Overview

This feature enables AI-powered conversational Q&A for meeting transcripts, allowing users to ask questions about specific transcripts or search across all transcript in recurring meeting . The system uses advanced NLP to understand queries, retrieve relevant information, and provide contextual answers with source referen ces.

---

## 🧱 2. Functional Specification

### 2.1 Chat Modes

The AI Chat feature operates in two distinct modes:

1. **Single Transcript Mode**: Ask questions about the currently viewed transcript
2. **Meeting Series Mode**: Search across all transcripts from a selected recurring meeting

**Note on UR-4.4**: The requirement for searching "across previous meetings" is implemented as searching within a specific meeting series (e.g., all TRUEVC Weekly meetings), not across ALL meetings in the system. Users must first select which recurring meeting series to search within.

### 2.2 User Flows

#### Single Transcript Chat Flow
1. User navigates to summary view (`/summary/:transcriptId`)
2. Chat interface appears in sidebar/panel
3. User asks question about current transcript
4. AI responds with relevant answer including timestamps
5. User clicks timestamp to highlight section in transcript
6. User can ask follow-up questions with context preserved

#### Meeting Series Search Flow
1. User accesses chat from dashboard or dedicated page
2. User selects recurring meeting from dropdown (e.g., "TRUEVC Weekly")
3. Chat interface shows: "Searching in: [TRUEVC Weekly]"
4. User asks questions about topics across all historical meetings recurring
5. AI returns chronological results with meeting dates, times of meeting and timestamps of that related answer content in transcript
6. User can navigate to specific transcripts from results

### 2.3 Response Format

```json
{
  "answer": "The UAT discussion covered three main points...",
  "references": [
    {
      "transcriptId": "uuid-123",
      "meetingTitle": "TRUEVC Weekly",
      "meetingDate": "2025-01-15",
      "meetingTime": "09:50",
      "timestamp": "00:23:15",
      "excerpt": "...we need to schedule UAT with the client next week..."
    }
  ]
}
```

**MVP Note:** 
- Removed `confidence` scores (not essential for MVP)
- Removed `suggestedQuestions` (nice to have, can add later)

---

## 🔌 3. Backend & API Specification

### 3.1 Endpoints

#### Single Transcript Chat
```
POST /api/chat/transcript/:transcriptId
Content-Type: application/json

{
  "question": "What did They say about the budget?",
  "sessionId": "uuid-session",
  "includeContext": true
}

Response: {
  "answer": "...",
  "references": [...],
  "sessionId": "uuid-session"
}
```

#### Meeting Series Search
```
POST /api/chat/series
Content-Type: application/json

{
  "seriesName": "TRUEVC Weekly",  // Selected from dropdown
  "question": "what is the conditions that they talked about UAT ?",
  "sessionId": "uuid-session",
  "dateRange": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  }
}

Response: {
  "answer": "...",
  "references": [...],
  "totalResults": 3,
  "sessionId": "uuid-session"
}
```

#### Supporting Endpoints
```
GET /api/meetings/series - List all recurring meeting patterns from existing data
```
```
GET /api/chat/sessions/:sessionId - Retrieve conversation history
What it's for:
  - Gets the full conversation
  history for a specific chat
  session
  - Restores context when users
  return to a chat
  - Allows users to review
  previous Q&A exchanges

  Why we need it:
  - Context Restoration: If user
   refreshes page or comes back
  later, they can continue where
   they left off
  - Audit Trail: Keep record of
  what was asked and answered
  - Debugging: Helps developers
  troubleshoot issues
  - Export Feature: Future
  ability to export chat history

  Example use case:
  User asks "What did we discuss
   about UAT?" then closes
  browser. Next day, they return
   and want to see the previous
  answer and ask follow-up
  questions.
```
```
DELETE /api/chat/sessions/:sessionId - Clear conversation
What it's for:
  - Clears/deletes a specific
  chat session and all its
  messages
  - Frees up storage and removes
   sensitive conversation data
  - Allows users to start fresh

  Why we need it:
  - Privacy: Users may discuss
  sensitive topics and want to
  clear history
  - Fresh Start: Sometimes users
   want to reset context
  completely
  - Storage Management: Prevent
  unlimited growth of chat data
  - Compliance: May be required
  for GDPR "right to be
  forgotten"

  Example use cases:
  1. User discussed confidential
   project details and wants to
  clear the chat
  2. User wants to start a new
  line of questioning without
  previous context
  3. System admin doing periodic
   cleanup of old sessions
```
---

## 🧩 4. Data Model

### 4.1 MVP Approach - No Schema Changes Needed

For MVP, we'll use the existing `meetings` table structure without modifications. Meeting series will be identified by title patterns rather than a separate table.

```sql
-- Example: Find all meetings in a series by title pattern
SELECT DISTINCT 
  SPLIT_PART(title, ' - ', 1) as series_name,
  COUNT(*) as meeting_count
FROM meetings
GROUP BY series_name
ORDER BY meeting_count DESC;

-- Example: Get all transcripts for "TRUEVC Weekly" series
SELECT t.*, m.meeting_date, m.meeting_time
FROM transcripts t
JOIN meetings m ON t.meeting_id = m.id
WHERE m.title LIKE 'TRUEVC Weekly%'
ORDER BY m.meeting_date DESC;
```

### 4.2 New Tables

#### chat_sessions
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  mode TEXT CHECK (mode IN ('transcript', 'series')) NOT NULL,
  
  -- Context columns
  transcript_id UUID REFERENCES transcripts(id),
  series_name TEXT,  -- For series mode, store the pattern like "TRUEVC Weekly"
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  
  -- Ensure only one context is set
  CONSTRAINT check_single_context CHECK (
    (transcript_id IS NOT NULL AND series_name IS NULL) OR
    (transcript_id IS NULL AND series_name IS NOT NULL)
  )
);

-- Index for session cleanup
CREATE INDEX idx_sessions_expires ON chat_sessions(expires_at);
```

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
```

#### transcript_embeddings
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE transcript_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient search
CREATE INDEX idx_embeddings_transcript ON transcript_embeddings(transcript_id);
CREATE INDEX idx_embeddings_vector ON transcript_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

### 4.3 Entity Relationships
```
Existing relationships:
  users (1) → (N) meetings
  meetings (1) → (N) transcripts
  transcripts (1) → (1) summaries

New relationships:
  users (1) → (N) chat_sessions
  chat_sessions (1) → (N) chat_messages
  transcripts (1) → (N) transcript_embeddings
```

**Note**: Meeting series are identified by title patterns, not foreign keys. This simplifies the MVP implementation.

---

## 🖥 5. UI Layout Specification

### 5.1 Single Transcript Chat (Summary View Integration)

```
┌─────────────────────────────────────────────────┐
│ Summary View                                     │
├─────────────────────────┬───────────────────────┤
│                         │  AI Chat              │
│  Meeting Summary        │  ┌─────────────────┐ │
│  - Attendees           │  │ 💬 Ask about    │ │
│  - Key Decisions       │  │ this meeting    │ │
│  - Action Items        │  └─────────────────┘ │
│                         │                       │
│  Meeting Transcript     │  User: What about   │
│  [Expandable]          │  the budget?        │
│                         │                       │
│  00:15:30 - John:      │  AI: John mentioned │
│  "The budget needs..." │  the budget at      │
│  [HIGHLIGHTED]         │  [00:15:30] saying  │
│                         │  it needs review... │
│                         │                       │
│                         │  [Input box...]     │
└─────────────────────────┴───────────────────────┘
```

### 5.2 Meeting Series Search Interface

```
┌──────────────────────────────────────────────────┐
│ AI Meeting Search                                │
├──────────────────────────────────────────────────┤
│ Search in: [TRUEVC Weekly ▼] [Date Range ▼]     │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 💬 Ask about TRUEVC Weekly meetings      │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Recent Conversations:                            │
│ • "When did we discuss UAT?"                    │
│ • "Who is responsible for deployments?"         │
│                                                  │
│ ─────────────────────────────────────────────   │
│                                                  │
│ User: Has anyone mentioned the API redesign?    │
│                                                  │
│ AI: The API redesign was discussed in 3         │
│ TRUEVC Weekly meetings:                         │
│                                                  │
│ 📅 2025-01-22 [00:34:20]                       │
│ "We need to redesign the API to support..."     │
│ [View Transcript →]                              │
│                                                  │
│ 📅 2025-01-15 [00:12:45]                       │
│ "The API redesign timeline is set for Q2..."    │
│ [View Transcript →]                              │
│                                                  │
│ [Show more results...]                           │
│                                                  │
│ [Ask a follow-up question...]                    │
└──────────────────────────────────────────────────┘
```

### 5.3 UI Components

- **Chat Input**: Multi-line text input with send button
- **Message Bubbles**: User questions (right) and AI responses (left)
- **Timestamp Links**: Clickable, formatted as [HH:MM:SS]
- **Meeting Series Selector**: Dropdown with search functionality
- **Date Range Picker**: Optional date filtering
- **Loading States**: Typing indicators and skeleton loaders
- **Error States**: Inline error messages with retry options

---

## 🧠 6. Technical Architecture

### 6.1 RAG (Retrieval-Augmented Generation) Pipeline

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ User Query   │────▶│  Embedding  │────▶│Vector Search │
└──────────────┘     └─────────────┘     └──────┬───────┘
                                                  │
┌──────────────┐     ┌─────────────┐     ┌──────▼───────┐
│ AI Response  │◀────│ LLM Process │◀────│Context Build │
└──────────────┘     └─────────────┘     └──────────────┘
```

### 6.2 Vector Database Configuration

- **Extension**: PostgreSQL with pgvector
- **Embedding Model**: text-embedding-ada-002 (1536 dimensions)
- **Chunk Strategy**:
  - Size: 500 tokens with 50 token overlap
  - Include speaker names and timestamps
  - Store start/end timestamps per chunk

### 6.3 LLM Integration Details

- **Provider**: OpenRouter.ai
- **Primary Model**: claude-3-sonnet-20240229
- **Fallback Model**: gpt-3.5-turbo-16k
- **Context Window Management**:
  ```
  System Prompt (500 tokens)
  + Retrieved Chunks (3000 tokens)
  + Conversation History (2000 tokens)
  + User Question (500 tokens)
  = ~6000 tokens (leaving buffer)
  ```

### 6.4 Prompt Templates

```javascript
const SINGLE_TRANSCRIPT_PROMPT = `
You are an AI assistant analyzing a meeting transcript.
Current meeting: {meetingTitle} on {meetingDate}

Context from transcript:
{retrievedChunks}

Previous conversation:
{conversationHistory}

Instructions:
- Answer based ONLY on the provided transcript
- Include timestamps when referencing specific parts
- Be concise but comprehensive
- If information isn't in the transcript, say so

User question: {userQuestion}
`;

const MEETING_SERIES_PROMPT = `
You are searching across {seriesName} meetings.
Time range: {dateRange}

Relevant excerpts from multiple meetings:
{retrievedChunks}

Instructions:
- Summarize findings chronologically
- Include meeting dates and timestamps
- Highlight patterns or changes over time
- Be specific about which meeting contains what

User question: {userQuestion}
`;
```

### 6.5 Session Management Architecture

#### Option 1: With Redis (Recommended)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Redis    │────▶│ PostgreSQL  │
│  (Session)  │     │  (Active)   │     │ (Archived)  │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                     │
     └────────────────────┴─────────────────────┘
              Session ID (UUID) Flow
```

- **Redis Structure**:
  ```
  chat:session:{sessionId} = {
    userId, 
    mode,
    transcriptId,  // if mode = 'transcript'
    seriesId,      // if mode = 'series'
    messages: [...last 10],
    ttl: 3600
  }
  ```

#### Option 2: PostgreSQL-Only (MVP Alternative)
```
┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│ PostgreSQL  │
│  (Session)  │     │  (All Data) │
└─────────────┘     └─────────────┘
```

**MVP Note**: For initial deployment, using PostgreSQL-only is acceptable. Redis can be added later for performance optimization when user volume increases.

### 6.6 Caching Strategy (MVP)

```
L1 Cache (Redis) - Exact Matches
├── Key: chat:exact:{questionHash}:{transcriptId|seriesId}
├── TTL: 1 hour
└── Hit Rate Target: 30%

L2 Cache (Redis) - Embeddings
├── Key: chat:embedding:{textHash}
├── TTL: 24 hours
└── Hit Rate Target: 60%
```

**Note**: For MVP, we're using only Redis caching. PostgreSQL query caching (L3) is deferred to future iterations.

## 🔒 7. Security & Validation

### 7.1 Access Control
- Users can only access their own meeting transcripts
- Meeting series access based on meetings the user owns
- Session-based authentication required for all endpoints

### 7.2 Input Validation
- Question length: 1-500 characters
- XSS prevention: Sanitize all user inputs
- SQL injection protection: Use parameterized queries
- Series name validation: Must match existing patterns

### 7.3 Prompt Security
- Prompt injection detection and prevention
- System prompts isolated from user input
- Response filtering for sensitive information

### 7.4 Data Privacy
- No PII stored in embeddings
- Chat sessions auto-expire after 24 hours
- Session data encrypted at rest
- Audit logging for all queries

### 7.5 Rate Limiting
- 10 requests per minute per user
- 100 requests per hour per IP
- Graceful degradation when limits exceeded


---

## 🚫 8. MVP Limitations

### What's NOT Included in MVP:
1. **WebSocket Support** - Real-time streaming responses deferred
2. **Global Search** - Cannot search across ALL meetings, only within series
3. **Advanced Features**:
   - Confidence scores for answers
   - Suggested follow-up questions
   - Export chat history
   - Multi-language support
4. **Performance Features**:
   - L3 PostgreSQL caching
   - Advanced query optimization
   - Distributed processing
5. **UI Features**:
   - Voice input
   - Mobile-optimized interface
   - Dark mode support

### Simplified Approaches:
- **Meeting Series**: Using title patterns instead of dedicated table
- **Caching**: Redis optional, can use PostgreSQL-only
- **Embeddings**: Simple chunks without timestamp tracking
- **Session Management**: Basic implementation without advanced features

---

## 📎 9. Dependencies

### 9.1 External Services
- **OpenRouter.ai**: LLM API access
- **OpenAI API**: Embedding generation
- **Redis** (Optional): Session caching

### 9.2 Internal Dependencies
- Existing `transcripts` table with content
- Existing `meetings` and `users` tables
- Summary view feature (FR-02) completed
- Authentication system operational

### 9.3 Infrastructure
- PostgreSQL 15+ with pgvector extension
- Node.js 18+
- 8GB RAM minimum for vector operations

---

## ✅ 10. Success Metrics

- Average response time < 3 seconds
- User satisfaction score > 4.5/5
- 80% of questions answered without clarification
- 50% reduction in time spent searching transcripts
- Cache hit rate > 40% (when Redis enabled)

---
