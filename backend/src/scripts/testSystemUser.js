#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { SYSTEM_USER_ID, SYSTEM_USER } = require('../constants/system');
const pool = require('../config/database');

async function testSystemUser() {
  console.log('Testing System User Configuration\n');
  console.log('System User Constants:');
  console.log('- ID:', SYSTEM_USER_ID);
  console.log('- Name:', SYSTEM_USER.name);
  console.log('- Email:', SYSTEM_USER.email);
  
  try {
    // Check if system user exists in database
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [SYSTEM_USER_ID]
    );
    
    if (result.rows.length > 0) {
      console.log('\n✅ System user found in database:');
      console.log(result.rows[0]);
    } else {
      console.log('\n❌ System user not found in database');
    }
    
    // Check meetings created by system user
    const meetingsResult = await pool.query(
      'SELECT COUNT(*) FROM meetings WHERE user_id = $1',
      [SYSTEM_USER_ID]
    );
    
    console.log(`\n📊 Meetings created by system user: ${meetingsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testSystemUser();