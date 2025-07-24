const pool = require('./database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tables = await pool.query(tablesQuery);
    console.log('\n📊 Tables in database:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Count records in each table
    const tableNames = ['users', 'meetings', 'transcripts', 'summaries'];
    console.log('\n📈 Record counts:');
    
    for (const tableName of tableNames) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`  - ${tableName}: ${countResult.rows[0].count} records`);
      } catch (err) {
        console.log(`  - ${tableName}: Table doesn't exist or error occurred`);
      }
    }
    
    // Check for summaries with transcript data
    console.log('\n🔍 Checking summaries with transcripts:');
    const summariesQuery = `
      SELECT 
        s.id,
        s.transcript_id,
        t.status as transcript_status,
        m.title as meeting_title
      FROM summaries s
      JOIN transcripts t ON s.transcript_id = t.id
      JOIN meetings m ON t.meeting_id = m.id
      LIMIT 5;
    `;
    const summaries = await pool.query(summariesQuery);
    console.log(`Found ${summaries.rows.length} summaries with transcripts`);
    summaries.rows.forEach(row => {
      console.log(`  - Summary ${row.id.substring(0, 8)}... for meeting: "${row.meeting_title}" (status: ${row.transcript_status})`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testConnection();