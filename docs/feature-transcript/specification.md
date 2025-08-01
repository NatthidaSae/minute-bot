

# 📘 Feature Specification: Transcripts 

**Feature ID**: FR-03
**Feature Name**: Transcripts (MVP)
**Owner**: Product / Engineering
**Last Updated**: 2025-07-25

---

## 🎯 1. Overview

This feature supports automated detection and processing of `.txt` meeting transcripts placed in a shared folder. During this MVP sprint, the system will extract transcript content, process it through an LLM to generate structured summaries, store the results in the existing `transcripts` and `summaries` tables, and expose data to the dashboard.

---

## 🧱 2. Functional Specification

### 2.1 Supported Flow

1. **Folder Watch**: Cron job or background worker scans a synced local directory for new .txt files every 10 minutes.
2. **Duplicate Check**: Hash comparison to avoid reprocessing same file.
3. **Extraction**: Reads transcript content from file.
Database Insert: Stores transcript record with status = pending.
4. **Save Transcript**: Stores transcript data into databases `transcripts` table and updating with `status = pending`.
5. **LLM Summary Generation**: Send content to Openrouter.ai to call API LLM with a structured prompt for summary transcript.
6. **Save Summary**: Store LLM result (summary transcript) to databases in `summaries` table.
7. **Update Status**: Mark status processing as `done` or `error`.
8. **Write Output**: Write `.summary.txt` file next to original in same folder.
9. **Dashboard View**: Transcript and summary can be browsed for user in web UI.

## 🔌 3. Backend & API Specification

### 3.1 Cronjob / Folder Watcher

* **Frequency**: Every 10 minutes
* **Target Path**: `/mnt/gdrive/transcripts`
* **File Type**: `.txt` only
* **Validation**:

  * File size < 10MB
  * No duplicates (via SHA256)
  
### 3.2 Filename Parsing

* **Expected Format**: `MeetingName_YYYY-MM-DD.txt` or `MeetingName_DD-MM-YYYY.txt`
* **Examples**:
  * `TeamStandup_2025-07-25.txt`
  * `ClientReview_25-07-2025.txt`
  * `ProjectKickoff_2025-07-25.txt`
* **Extraction Logic**:
  * Meeting Name: Everything before the date pattern
  * Meeting Date: Parse from filename using regex
  * Fallback: If no date found, use file creation date

### 3.3 LLM Integration

* **Model**: has not been selected yet
* **Prompt Output Format**:

```json
{
  "attendees": ,
  "keyDecisions": ,
  "actionItems": ,
  "discussionHighlights": ,
  "nextSteps": ,
  "transcriptContent": ,
}
```

## 🧩 4. Processing Pipeline
```
flowchart LR
    %% Sources
    TLDV([TLDV]) --> transcriptFile["transcript .txt<br>meeting"]
    transcriptFile --> gdrive[(Google Drive<br>Folder)]

    %% Cronjob process
    gdrive -->|Cronjob| system[Our System]

    %% OpenRouter call
    system -->|API| openrouter[openrouter.ai]
    openrouter -->|call API req| llm[LLM Model<br><i>not sure about model</i>]
    llm -->|res| openrouter
    openrouter -->|summary format| system

    %% Save to DB
    system -->|store original<br>transcript| db1[(Database:<br>table: transcripts)]
    system -->|store summary| db2[(Database:<br>table: summary)]

    %% Write back to file
    system -->|write back<br>summary form in file| gdrive

    %% UI and user interaction
    system --> ui[UI Webpage]
    ui --> user[User]
    user -->|can see today summary<br>many meetings| ui
```

---

## 🔒 5. Security & Validation

| Validation     | Description                                      |
| -------------- | ------------------------------------------------ |
| File Extension | Accept `.txt` only                               |
| File Size      | Max 10MB                                         |
| Hashing        | Use SHA256 to detect duplicates                  |
| File Read      | Read with UTF-8 encoding                         |
| Error Logging  | All failure points logged with reason            |

---

## 📊 6. Monitoring & Logging 

### 6.1 Required Logs

* Detected files with timestamp
* Duplicate detections
* LLM request/response metadata
* Summary generation success/failure
* Error messages (LLM, file, DB)
* Output file write status

# tech stack
| Layer               | Technology                        | Notes                                             |
| ------------------- | --------------------------------- | ------------------------------------------------- |
| **Frontend**        | React.js Vite                     | Web dashboard to display transcripts & summaries  |
| **Backend API**     | Node.js with Express.js.          | REST API to serve data                          |
| **Database**        | PostgreSQL                        | Store transcripts and summaries                   |
| **File Processing** | Node.js script with `fs` module   | Reads files, generates hashes, etc.               |
| **Scheduler**       | `linux-cron`                      | Runs every 10 mins to detect new transcript files 
| **LLM Integration** | has not been selected yet.        | LLM summary generation                            |


