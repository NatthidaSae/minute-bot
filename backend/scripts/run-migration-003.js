#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigration() {
  try {
    console.log('Running migration 003: Add meeting_time and timezone columns...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/config/migrations/003_add_meeting_time_and_timezone.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added meeting_time column to meetings table');
    console.log('   - Added timezone column with UTC default');
    console.log('   - Added unique constraint on (title, meeting_date, meeting_time, user_id)');
    console.log('   - Updated existing meetings with time from transcript filenames');
    console.log('   - Created indexes for better query performance');
    
    // Show some stats
    const meetingsWithTime = await pool.query(
      'SELECT COUNT(*) FROM meetings WHERE meeting_time IS NOT NULL'
    );
    const totalMeetings = await pool.query(
      'SELECT COUNT(*) FROM meetings'
    );
    
    console.log(`\n📊 Migration stats:`);
    console.log(`   - Total meetings: ${totalMeetings.rows[0].count}`);
    console.log(`   - Meetings with time extracted: ${meetingsWithTime.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();