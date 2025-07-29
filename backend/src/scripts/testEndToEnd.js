#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const googleDriveService = require('../services/googleDriveService');
const documentParser = require('../services/documentParser');
const { generateSummary } = require('../services/openaiService');
const { validateTranscriptFilename, extractMeetingInfoFromFilename } = require('../utils/validation');
const crypto = require('crypto');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`📋 ${title}`, 'bright');
  console.log('='.repeat(60));
}

async function testEndToEnd() {
  const startTime = Date.now();
  let testFile = null;
  let fileContent = null;
  let summary = null;

  try {
    // Step 1: Environment Check
    logSection('Step 1: Environment Configuration Check');
    
    const requiredEnvVars = [
      'GOOGLE_DRIVE_FOLDER_ID',
      'GOOGLE_SERVICE_ACCOUNT_PATH',
      'OPENROUTER_API_KEY'
    ];
    
    let envValid = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        log(`✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`, 'green');
      } else {
        log(`❌ ${envVar}: NOT SET`, 'red');
        envValid = false;
      }
    }
    
    if (!envValid) {
      throw new Error('Missing required environment variables');
    }

    // Step 2: Google Drive Connection
    logSection('Step 2: Google Drive Service Connection');
    
    log('Initializing Google Drive service...', 'yellow');
    await googleDriveService.initialize();
    log('✅ Google Drive service initialized', 'green');

    // Step 3: List Files
    logSection('Step 3: Listing Processable Files');
    
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    log(`Scanning folder: ${folderId}`, 'blue');
    
    const files = await googleDriveService.listFiles(folderId);
    
    if (files.length === 0) {
      throw new Error('No processable files found in the folder');
    }
    
    log(`✅ Found ${files.length} processable files:`, 'green');
    files.forEach((file, index) => {
      const type = file.mimeType === 'application/vnd.google-apps.document' ? 'Google Doc' :
                   file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word Doc' :
                   'Text File';
      console.log(`   ${index + 1}. ${file.name} (${type})`);
    });

    // Step 4: Select Test File
    logSection('Step 4: Selecting Test File');
    
    // Use the first file for testing
    testFile = files[0];
    log(`Selected: ${testFile.name}`, 'magenta');
    log(`Type: ${testFile.mimeType}`, 'blue');
    log(`Size: ${testFile.size || 'N/A'} bytes`, 'blue');

    // Step 5: Download/Export File Content
    logSection('Step 5: Extracting File Content');
    
    const downloadStart = Date.now();
    
    if (testFile.mimeType === 'application/vnd.google-apps.document') {
      log('Exporting Google Doc as text...', 'yellow');
      fileContent = await googleDriveService.exportGoogleDoc(testFile.id);
    } else if (testFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      log('Downloading and parsing .docx file...', 'yellow');
      const buffer = await googleDriveService.downloadFile(testFile.id);
      fileContent = await documentParser.parseDocx(buffer);
    } else {
      log('Downloading text file...', 'yellow');
      const buffer = await googleDriveService.downloadFile(testFile.id);
      fileContent = buffer.toString('utf-8');
    }
    
    const downloadTime = ((Date.now() - downloadStart) / 1000).toFixed(2);
    log(`✅ Content extracted in ${downloadTime}s`, 'green');
    log(`Content length: ${fileContent.length} characters`, 'blue');
    
    // Show preview
    console.log('\nContent preview:');
    console.log('---');
    console.log(fileContent.substring(0, 200) + '...');
    console.log('---');

    // Step 6: Validate Content
    logSection('Step 6: Content Validation');
    
    const wordCount = fileContent.trim().split(/\s+/).length;
    log(`Word count: ${wordCount}`, 'blue');
    
    if (wordCount < 20) {
      throw new Error('Content too short for meaningful summary');
    }
    log('✅ Content validation passed', 'green');

    // Step 7: Generate File Hash
    logSection('Step 7: Duplicate Detection Check');
    
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    log(`File hash: ${fileHash}`, 'blue');
    log('✅ Hash generated for duplicate detection', 'green');

    // Step 8: Extract Meeting Info
    logSection('Step 8: Meeting Information Extraction');
    
    const { meetingName, meetingDate } = extractMeetingInfoFromFilename(testFile.name);
    log(`Meeting name: ${meetingName}`, 'blue');
    log(`Meeting date: ${meetingDate || 'Not found in filename'}`, 'blue');

    // Step 9: LLM Summary Generation
    logSection('Step 9: LLM Summary Generation (OpenRouter)');
    
    log('Sending content to OpenRouter AI...', 'yellow');
    log(`Using model: openai/gpt-3.5-turbo`, 'blue');
    
    const llmStart = Date.now();
    summary = await generateSummary(fileContent);
    const llmTime = ((Date.now() - llmStart) / 1000).toFixed(2);
    
    log(`✅ Summary generated in ${llmTime}s`, 'green');

    // Step 10: Display Summary
    logSection('Step 10: Generated Summary');
    
    console.log('\n📊 Summary Details:');
    console.log(`Attendees (${summary.attendees.length}):`);
    summary.attendees.forEach(a => console.log(`  • ${a}`));
    
    console.log(`\nKey Decisions (${summary.key_decisions.length}):`);
    summary.key_decisions.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
    
    console.log(`\nAction Items (${summary.action_items.length}):`);
    summary.action_items.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.task}`);
      if (item.assignedTo.length > 0) {
        console.log(`     Assigned to: ${item.assignedTo.join(', ')}`);
      }
      if (item.dueDate) {
        console.log(`     Due: ${item.dueDate}`);
      }
    });
    
    console.log(`\nDiscussion Highlights (${summary.discussion_highlights.length}):`);
    summary.discussion_highlights.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
    
    console.log(`\nNext Steps (${summary.next_steps.length}):`);
    summary.next_steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

    // Step 11: Summary File Format
    logSection('Step 11: Summary File Preview');
    
    const summaryFilename = testFile.name.replace(/\.(txt|docx)$/i, '.summary.txt').replace(/\.summary\.txt$/, '.summary.txt');
    if (!testFile.name.match(/\.(txt|docx)$/i)) {
      // For Google Docs
      summaryFilename = testFile.name + '.summary.txt';
    }
    
    log(`Summary filename: ${summaryFilename}`, 'blue');
    
    const summaryText = `MEETING SUMMARY
===============

Date: ${new Date().toLocaleDateString()}
Generated from: ${testFile.name}

ATTENDEES
---------
${summary.attendees.join('\n')}

KEY DECISIONS
-------------
${summary.key_decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

[... rest of summary ...]`;

    console.log('\nSummary file preview:');
    console.log('---');
    console.log(summaryText.substring(0, 300) + '...');
    console.log('---');

    // Final Summary
    logSection('✅ End-to-End Test Complete!');
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`Total execution time: ${totalTime}s`, 'green');
    
    console.log('\n📊 Test Summary:');
    console.log(`  • Google Drive: ✅ Connected`);
    console.log(`  • File Access: ✅ ${testFile.name}`);
    console.log(`  • Content Extraction: ✅ ${fileContent.length} chars`);
    console.log(`  • OpenRouter AI: ✅ Summary generated`);
    console.log(`  • Processing Pipeline: ✅ All steps passed`);
    
    console.log('\n💡 Next Steps:');
    console.log('  1. The full pipeline would save this to the database');
    console.log('  2. Create summary file in Google Drive');
    console.log('  3. Update transcript status to "done"');

  } catch (error) {
    logSection('❌ Test Failed');
    log(`Error: ${error.message}`, 'red');
    
    if (error.response) {
      console.error('\nAPI Error Details:');
      console.error(error.response.data);
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Main execution
console.clear();
log('🚀 Transcript Processing End-to-End Test', 'bright');
log('=====================================\n', 'bright');

log('This test will validate the entire pipeline:', 'yellow');
console.log('  1. Connect to Google Drive');
console.log('  2. List processable files');
console.log('  3. Download/export file content');
console.log('  4. Generate summary with OpenRouter AI');
console.log('  5. Preview the summary output\n');

testEndToEnd();