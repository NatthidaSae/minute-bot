🧩 1. ปัญหาคืออะไร (Problem) : ไฟล์ติดปัญหาเรื่องกรองชื่อเก็บเข้า database เเล้วไฟล์มีตติ้งเดียวกัน แต่สร้าง row ใหม่ จริงๆควรใช้ไอดี meeting เดียวกัน
อธิบาย "เกิดอะไรขึ้น"


โดยตอนแรกที่ลองเทสระบบให้มันกว้านไฟล์ได้สำเร็จ แล้วเปิดระบบทิ้งไว้ ทำให้เจอปัญหานี้คือ การทำงาน cronjob ที่มันทำงานทุก 10 นาทีคือมันรวมถึงการกว้านไฟล์ทั้งหมดที่แม้แต่ไฟล์ที่เคยสรุปไปแล้ว กลับนำกลับเข้ากระบวนการมาใหม่ นำไปสรุปใหม่กับ llm เเล้วส่งกลับมาระบบยังบันทึกลงดาต้าเบสแถวใหม่ซ้ำ วนไฟล์เดียวไปเรื่อยๆทุกสิบนาที


🎯 2. ผลกระทบ (Impact)
ทำให้เมนเทอร์รู้ว่าทำไมต้องรีบแก้


มันทำให้เห็นว่าเราเขียน condition function  ยังไม่ครอบคลุม เพราะไม่งั้นระบบจะรันข้อมูลเดิมๆซ้ำ เปลืองพื้นที่ เปลืองพลังงาน เปลือง token ไม่จำเป็น 


🛠 3. วิธีที่แก้ไปแล้ว (What I did)
ในตอนแรก พอรู้ปัญหาที่เกิดขึ้นแล้ว ก็ย้อนกลับไปคิด flow การทำงานของระบบ สาเหตุที่มันทำงานซ้ำๆน่าจะเกิดจากการที่ระบบเราไม่ได้มีการเช็คเลยว่าไฟล์ไหนคือไฟล์ที่สรุปไปแล้ว เวลากว้านไฟล์มาเลยเลือกทั้งหมดที่เจอทำซ้ำ ทุกรอบ ซึ่งจริงๆมี data status ของ summary เอาไว้ใน table ด้วยอยู่แล้วเวลามันบอก done / error / process ที่แสดงบน ui web page ดังนั้นเลยใช้ status นี้ สร้าง function มาเช็ค status ว่าถ้า done แล้ว skip, process = skip, error = ทำอีกครั้ง

ผลลัพย์หลังแก้ - ไม่ insert ซ้ำ ,UI แสดงถูก, ประหยัด token

### 📝 Related Code:

#### 1. Database Schema - Status Field Definition
**File:** `/Users/natthida.sae/bot/backend/src/config/schema.sql:29`
```sql
status TEXT CHECK (status IN ('process', 'done', 'error')) NOT NULL DEFAULT 'process'
```

#### 2. Main Skip Logic
**File:** `/Users/natthida.sae/bot/backend/src/services/googleDriveFileWatcher.js:134-161`
```javascript
// Check if file already exists
const existingTranscript = await db.query(
  'SELECT id, status FROM transcripts WHERE file_name = $1 AND user_id = $2',
  [fileName, userId]
);

if (existingTranscript.rows.length > 0) {
  const { id, status } = existingTranscript.rows[0];
  
  // Skip if already processed or in process
  if (status === 'done' || status === 'process') {
    console.log(`Skipping ${fileName} - already ${status}`);
    continue;
  }
  
  // Retry if previous attempt failed
  if (status === 'error') {
    console.log(`Retrying ${fileName} - previous attempt failed`);
    // Update status to process for retry
    await db.query(
      'UPDATE transcripts SET status = $1 WHERE id = $2',
      ['process', id]
    );
  }
}
```

#### 3. Status Updates
**File:** `/Users/natthida.sae/bot/backend/src/services/googleDriveFileWatcher.js`
- Line 181: New transcripts created with `status='process'`
- Lines 260-263: Update to `status='done'` after successful summary
- Lines 294-297: Update to `status='error'` on failure

🧩 1. ปัญหาคืออะไร (Problem) : ไฟล์ติดปัญหาเรื่องกรองชื่อเก็บเข้า database เเล้วไฟล์มีตติ้งเดียวกัน แต่สร้าง row ใหม่ จริงๆควรใช้ไอดี meeting เดียวกัน ติดปัญหาระบบกวาดไฟล์ทุกครั้ง เเล้วเพิ่มลงดาต้าเบส row ใหม่ในทรานสคริปต์ตลอด (ทุกสิบนาที)
อธิบาย "เกิดอะไรขึ้น"


หลังจากที่เราแก้ให้ระบบ extract ชื่อ วันที่ ได้จาก ชื่อไฟล์ transcript ที่เราเอามาจาก google drive folder ในตอนแรกแล้ว เราก็เก็บเข้า database ของระบบเราโดยจากตัวอย่างชื่อไฟล์ เป็นหนึ่งในฟอร์มตัวอย่างชื่อที่เจอ [TrueVC] [Pegasus] Morning sync up_2025-07-17T02_54_32+00_00.docx 
โดยระบบเรามี data structure ที่มีความสัมพันธ์ meeting one to many กับ transcript , transcript one to one กับ summary ดังนั้น จากตัวอย่างชื่อ เราเก็บ TrueVC_Pegasus ใน meeting table คอลัมน์ meeting.title,เก็บ  Morning sync up ใน transcript table คอลัมน์ transcript.title และ date ตามลำดับโดยทั้งหมดที่ fk เชื่อมกันจากความสัมพันธ์ จากแนวคิดนี้ในระบบทำให้เกิดปัญหาที่บางครั้ง transcript ที่เข้ามามีชื่อเหมือนกันต่างแค่วันที่และเวลาด้านท้าย ถึงแม้ระบบจะเจอว่าชื่อมีตติ้งเหมือนกันระบบไม่ได้มีส่วนที่มา detect ตรงนี้ทำให้มันสร้าง meetings row ใหม่เรื่อยๆ ทั้งที่จริงๆเเล้วมันคือ meetings เดียวกัน transcript พวกนั้นควรอ้างอิงมาที่ ไอดี meeting เดียวกัน  
🎯 2. ผลกระทบ (Impact)
ทำให้เมนเทอร์รู้ว่าทำไมต้องรีบแก้


ทำให้ระบบเราเก็บข้อมูลผิดวิธี เพราะในความเข้าใจของเราคิดว่า meeting เดียวกัน ต่าง transcript (เพราะคนละวันกัน ) ควรมีความสัมพันธ์ relate กันไปที่ id meeting เดียวกัน ไม่งั้นปัญหาที่เกิดตอนนี้จะทำให้ทุกครั้งที่เจอสคริปต์มันก็สร้าง meeting มาให้ใหม่ สัมพันธ์กับ transcript นั้นอันเดียว เท่ากับ มันคือ one to one relation ไม่ใช่ one to many relation ในตอนแรกที่เราวางแผน data structure ไว้


🛠 3. วิธีที่แก้ไปแล้ว (What I did)
ตอนแรกหลังเจอปัญหานี้ต้องกลับไปดู data structure พอเข้าใจว่าระบบไม่ได้เก็บข้อมูลมาแบบเดียวกับที่เราวางแผนไว้ก็เริ่มไปดูที่โค้ด โดยสาเหตุมันเกิดจากทุกชื่อที่ระบบเจอจากไฟล์มันจะสร้าง meeting ใหม่ทุกครั้ง จาก transcript นั้น เราสร้าง function เพื่อเช็คว่าหลังจากได้ชื่อไฟล์นี้มา เราเคยมีชื่อ meeting title นี้อยู่เเล้วมั้ย ถ้ามีอยู่เเล้วเชื่อมกับ meeting id ที่มีข้อมูลอยู่แล้วได้เลย หรือถ้ายังไม่มีก็ให้สร้างใหม่

ผลกระทบ
รายละเอียด
❌ DB redundancy
เก็บ meeting เดิมซ้ำซ้อนหลายรอบ
❌ UI listing ผิด
แสดง meeting หลายอัน ทั้งที่ควรเป็นอันเดียว
❌ ความสัมพันธ์พัง
transcript ไม่ grouped ตาม meeting ที่ควรเป็น

### 📝 Related Code:

#### 1. Meeting Grouping Logic - findOrCreateMeeting
**File:** `/Users/natthida.sae/bot/backend/src/services/googleDriveFileWatcher.js:199-230`
```javascript
async function findOrCreateMeeting(meetingTitle, userId) {
  try {
    // Check if meeting already exists for this user
    const existingMeeting = await db.query(
      'SELECT id, title FROM meetings WHERE LOWER(TRIM(title)) = LOWER(TRIM($1)) AND user_id = $2 LIMIT 1',
      [meetingTitle, userId]
    );
    
    if (existingMeeting.rows.length > 0) {
      console.log(`Found existing meeting: ${existingMeeting.rows[0].title}`);
      return existingMeeting.rows[0].id;
    }
    
    // Create new meeting if not exists
    const newMeeting = await db.query(
      'INSERT INTO meetings (title, user_id) VALUES ($1, $2) RETURNING id',
      [meetingTitle, userId]
    );
    
    console.log(`Created new meeting: ${meetingTitle}`);
    return newMeeting.rows[0].id;
  } catch (error) {
    console.error('Error in findOrCreateMeeting:', error);
    throw error;
  }
}
```

#### 2. Meeting Title Extraction from Filename
**File:** `/Users/natthida.sae/bot/backend/src/utils/validation.js:104-178`
```javascript
function extractMeetingInfoFromFilename(filename) {
  // Multiple patterns to extract meeting info
  // Pattern 1: [Org] [Project] Description_DateTime
  // Pattern 2: [Org][Project][SubProject] Description_DateTime
  // Pattern 3: MeetingName_YYYY-MM-DD
  // ... handles various filename formats
}
```

#### 3. Meeting Title Normalization
**File:** `/Users/natthida.sae/bot/backend/src/utils/validation.js:78-97`
```javascript
function normalizeMeetingTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(call|calls)\b/g, 'meeting')
    .replace(/\b(sync|syncs)\b/g, 'meeting');
}
```

#### 4. Database Indexes for Performance
**File:** `/Users/natthida.sae/bot/backend/src/config/migrations/002_add_meeting_title_index.sql:5-8`
```sql
-- Index for case-insensitive meeting title searches
CREATE INDEX IF NOT EXISTS idx_meetings_title_lower ON meetings(LOWER(title));
-- Composite index for user and title
CREATE INDEX IF NOT EXISTS idx_meetings_user_title_lower ON meetings(user_id, LOWER(title));
```



🧩 1. ปัญหาคืออะไร (Problem) : แก้ปัญหาเรื่อง ไฟล์สามารถ summary ออกมาได้ผลลัพย์เเล้วเขียนลงดาต้าเบสได้สามารถดึงข้อมูลมาโชว์ใน ui  web app ได้แต่ติดปัญหาไม่สามารถเขียน summary ลง file เดิมใน google drive folder ได้ เพราะติดปัญหาเรื่อง system quota limit เพราะเป็น system sccount รอบก่อนทำเป็น user account เเล้วใช้ได้เพราะ user acc มี storage เป็นของตัวเอง (ตอนแรกติดปัญหาเพราะเขียนฟังก์ชั่นมาเป็น .txt เเต่ตัวไฟล์จริงคือ docx เลยต้อง import เครื่องไว้ สำหรับแปลงข้อมูลถอดเป็น docx เพิ่ม)
อธิบาย "เกิดอะไรขึ้น"


หลังจากที่ลองเทสใส่ไฟล์ transcript ลงใน folder เพื่อให้ระบบเรากว้านมันมาสรุป เจอว่าสามารถแสดง summary ได้ถูกต้องใน ui web app เเต่กลับไม่มีการเขียนลงไปใน file transcript เดิมใน google drive folder ได้ เพราะ ระบบเราก็ทำตาม flow ที่วางไว้ได้ถูก แต่เกิดปัญหาที่หลังจากที่ llm ส่ง result กลับมาให้ระบบ ระบบเราก็ insert ข้อมูล summary ที่ได้ ลงดาต้าเบสได้ถูกต้อง ทำให้ web app ui ที่ query จาก database แสดงผลถูก เท่ากับว่าเกิดปัญหาตรงฝั่งระบบเรากับส่วน google drive 
🎯 2. ผลกระทบ (Impact)
ทำให้เมนเทอร์รู้ว่าทำไมต้องรีบแก้


ต้องรีบแก้เพราะเป็นส่วนที่ requirement  user อยากให้สามารถเห็นผลลัพธ์ transcript ที่สรุปมาเเล้วลงไปในไฟล์เดิมใน google drive folder ได้


🛠 3. วิธีที่แก้ไปแล้ว (What I did)
ไปดูสาเหตุว่าเกิด error อะไร เจอ error ใน backend เกี่ยวกับเรื่อง quota limit เลยไปหาข้อมูลเพิ่มเติมทำให้รู้ว่าเพราะรอบนี้ ใช้ service account รอบก่อนทำเป็น user account เเล้วใช้ได้เพราะ user acc มี storage เป็นของตัวเอง อาจจะสามารถ create update file ได้ เเต่ service account ทำได้แค่ update file ได้ ตอนแรกติดปัญหาเพราะเขียนฟังก์ชั่นมาเป็น .txt เเต่ตัวไฟล์จริงคือ docx เลยต้อง import docx help ไว้สำหรับแปลงไฟล์ลงระบบไว้ สำหรับแปลงข้อมูลถอดเป็น docx เพิ่มในตอนเขียนกลับลงไปเป็น docx เดิมด้วยการ update

### 📝 Related Code:

#### 1. Google Drive Service - Authentication & File Updates
**File:** `/Users/natthida.sae/bot/backend/src/services/googleDriveService.js`

**Service Account Authentication (Lines 15-40):**
```javascript
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const authClient = await auth.getClient();
this.drive = google.drive({ version: 'v3', auth: authClient });
```

**Update Text/Google Docs (Lines 133-152):**
```javascript
async updateFile(fileId, content, mimeType = 'text/plain') {
  const media = {
    mimeType: mimeType,
    body: content,
  };
  
  const response = await this.drive.files.update({
    fileId: fileId,
    media: media,
  });
  
  return response.data;
}
```

**Update DOCX Files (Lines 170-199):**
```javascript
async updateDocxFile(fileId, modifyCallback) {
  // Download original file
  const response = await this.drive.files.get({
    fileId: fileId,
    alt: 'media'
  }, { responseType: 'arraybuffer' });
  
  // Apply modifications
  const modifiedBuffer = await modifyCallback(Buffer.from(response.data));
  
  // Upload modified file
  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    body: Readable.from(modifiedBuffer),
  };
  
  return await this.drive.files.update({
    fileId: fileId,
    media: media,
  });
}
```

#### 2. DOCX File Manipulation
**File:** `/Users/natthida.sae/bot/backend/src/utils/docxHelper.js`

**Libraries Used:**
```javascript
const { Document, Packer, Paragraph, TextRun } = require('docx'); // Line 1
const mammoth = require('mammoth'); // Line 2
```

**Append Summary to DOCX (Lines 14-77):**
```javascript
async function appendSummaryToDocx(docxBuffer, summaryText) {
  // Extract original text
  const result = await mammoth.extractRawText({ buffer: docxBuffer });
  const originalText = result.value;
  
  // Create new document with original + summary
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        ...createParagraphsFromText(originalText),
        new Paragraph({ text: "" }), // Empty line
        new Paragraph({
          children: [new TextRun({
            text: "=== AI SUMMARY ===",
            bold: true,
          })],
        }),
        ...formatSummaryContent(summaryText),
      ],
    }],
  });
  
  return await Packer.toBuffer(doc);
}
```

#### 3. Main Write Summary Function
**File:** `/Users/natthida.sae/bot/backend/src/services/googleDriveFileWatcher.js:303-408`

**Write Summary to Google Drive:**
```javascript
async writeSummaryToGoogleDrive(fileId, transcriptId, summary, mimeType) {
  try {
    // Format summary text
    const summaryText = formatSummaryText(summary);
    
    // Handle different file types
    if (mimeType.includes('wordprocessingml.document')) {
      // Handle .docx files
      await googleDriveService.updateDocxFile(fileId, async (originalBuffer) => {
        return await appendSummaryToDocx(originalBuffer, summaryText);
      });
    } else {
      // Handle text files and Google Docs
      const originalContent = await googleDriveService.downloadFile(fileId);
      const updatedContent = originalContent + '\n\n' + summaryText;
      await googleDriveService.updateFile(fileId, updatedContent, mimeType);
    }
    
    // Update file hash in database
    const updatedFile = await googleDriveService.getFile(fileId);
    await db.query(
      'UPDATE transcripts SET file_hash = $1 WHERE id = $2',
      [updatedFile.md5Checksum, transcriptId]
    );
  } catch (error) {
    console.error('Error writing summary to Google Drive:', error);
    throw error;
  }
}
```

#### 4. Summary Formatting
**File:** `/Users/natthida.sae/bot/backend/src/services/googleDriveFileWatcher.js:322-364`
```javascript
// Creates formatted summary with sections for:
// - Header with generation date
// - Attendees
// - Key Decisions  
// - Action Items
// - Discussion Highlights
```  
