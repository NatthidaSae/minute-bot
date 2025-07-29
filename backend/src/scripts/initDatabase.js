#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { initializeDatabase } = require('../config/initDb');

async function init() {
  console.log('🚀 Initializing database...');
  
  try {
    await initializeDatabase();
    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

init();