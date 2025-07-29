#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const googleDriveService = require('../services/googleDriveService');

async function testGoogleDriveAccess() {
  console.log('🔍 Testing Google Drive File Access\n');
  
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  if (!folderId) {
    console.error('❌ ERROR: GOOGLE_DRIVE_FOLDER_ID is not set in environment variables');
    process.exit(1);
  }
  
  console.log('📁 Folder ID:', folderId);
  console.log('🔑 Service Account:', process.env.GOOGLE_SERVICE_ACCOUNT_PATH);
  console.log('\n');
  
  try {
    // Initialize Google Drive service
    console.log('🚀 Initializing Google Drive service...');
    await googleDriveService.initialize();
    console.log('✅ Google Drive service initialized\n');
    
    // Test 1: Check folder access
    console.log('📋 Test 1: Checking folder access...');
    try {
      const folderMetadata = await googleDriveService.drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, permissions'
      });
      
      console.log('✅ Folder found!');
      console.log(`   Name: ${folderMetadata.data.name}`);
      console.log(`   Type: ${folderMetadata.data.mimeType}`);
      console.log(`   ID: ${folderMetadata.data.id}`);
      
      if (folderMetadata.data.permissions) {
        console.log('   Permissions:');
        folderMetadata.data.permissions.forEach(perm => {
          console.log(`     - ${perm.emailAddress || perm.displayName} (${perm.role})`);
        });
      }
    } catch (error) {
      console.error('❌ Cannot access folder:', error.message);
      if (error.code === 404) {
        console.error('   The folder ID might be incorrect or the service account lacks permission.');
      }
    }
    
    console.log('\n');
    
    // Test 2: List all files
    console.log('📋 Test 2: Listing ALL files in folder...');
    const allFiles = await googleDriveService.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime)',
      pageSize: 100
    });
    
    if (allFiles.data.files && allFiles.data.files.length > 0) {
      console.log(`✅ Found ${allFiles.data.files.length} total files:`);
      allFiles.data.files.forEach(file => {
        const size = file.size ? `${(parseInt(file.size) / 1024).toFixed(2)} KB` : 'N/A';
        console.log(`   - ${file.name}`);
        console.log(`     Type: ${file.mimeType}`);
        console.log(`     Size: ${size}`);
        console.log(`     Created: ${new Date(file.createdTime).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No files found in the folder');
      console.log('   Make sure:');
      console.log('   1. The folder contains files');
      console.log('   2. The service account has permission to view the folder');
      console.log('   3. The folder is shared with: minutebot@minutebot.iam.gserviceaccount.com');
    }
    
    console.log('\n');
    
    // Test 3: List processable files (txt and Google Docs)
    console.log('📋 Test 3: Listing processable files (.txt and Google Docs)...');
    const processableFiles = await googleDriveService.listFiles(folderId);
    
    if (processableFiles.length > 0) {
      console.log(`✅ Found ${processableFiles.length} processable files:`);
      processableFiles.forEach(file => {
        const type = file.mimeType === 'application/vnd.google-apps.document' ? 'Google Doc' : 'Text file';
        console.log(`   - ${file.name} (${type})`);
      });
    } else {
      console.log('❌ No processable files found');
    }
    
    console.log('\n');
    
    // Test 4: Try different queries
    console.log('📋 Test 4: Testing different file queries...');
    
    // Query without extension filter
    const query1 = await googleDriveService.drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(name)',
      pageSize: 5
    });
    console.log(`   Query 1 (all files): ${query1.data.files?.length || 0} files`);
    
    // Query with name contains
    const query2 = await googleDriveService.drive.files.list({
      q: `'${folderId}' in parents and name contains 'txt'`,
      fields: 'files(name)',
      pageSize: 5
    });
    console.log(`   Query 2 (name contains 'txt'): ${query2.data.files?.length || 0} files`);
    
    // Query with full name match
    const query3 = await googleDriveService.drive.files.list({
      q: `'${folderId}' in parents and name contains '.txt'`,
      fields: 'files(name)',
      pageSize: 5
    });
    console.log(`   Query 3 (name contains '.txt'): ${query3.data.files?.length || 0} files`);
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 403) {
      console.error('\n🔐 Permission Error!');
      console.error('Make sure the folder is shared with the service account:');
      console.error('Email: minutebot@minutebot.iam.gserviceaccount.com');
      console.error('Permission: Viewer or Editor');
    }
    
    if (error.response) {
      console.error('\nAPI Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Google Drive File Access Test\n');
console.log('This script will test access to your Google Drive folder');
console.log('and help diagnose why files are not being detected.\n');

testGoogleDriveAccess();