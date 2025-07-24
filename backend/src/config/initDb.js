const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function initializeDatabase() {
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('Database tables created successfully');
    
    // Check if we need to seed data
    const { rows } = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count) === 0) {
      console.log('Seeding database with initial data...');
      await seedDatabase();
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create a test user
    const userResult = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
      ['Test User', 'test@example.com']
    );
    const userId = userResult.rows[0].id;
    
    // Create sample meetings with different dates
    const today = new Date();
    const meetings = [
      { title: 'Daily Standup - Today', date: today },
      { title: 'Sprint Planning', date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { title: 'Product Review', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { title: 'Tech Discussion', date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { title: 'Client Meeting', date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000) },
      { title: 'Retrospective', date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { title: 'Architecture Review', date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) },
      { title: 'Quarterly Planning', date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) },
      { title: 'Team Building', date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000) },
      { title: 'Performance Review', date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      { title: 'Annual Planning', date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000) },
      { title: 'Budget Review', date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000) }
    ];
    
    // Insert meetings and transcripts
    for (const meeting of meetings) {
      const meetingResult = await client.query(
        'INSERT INTO meetings (title, meeting_date, user_id) VALUES ($1, $2, $3) RETURNING id',
        [meeting.title, meeting.date, userId]
      );
      
      // Create transcript with varying statuses
      const statuses = ['done', 'done', 'done', 'pending', 'error'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const transcriptResult = await client.query(
        'INSERT INTO transcripts (meeting_id, meeting_date, content, status, error_msg) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [
          meetingResult.rows[0].id,
          meeting.date,
          `Transcript content for ${meeting.title}`,
          status,
          status === 'error' ? 'Failed to process transcript' : null
        ]
      );
      
      // If status is 'done', create a summary
      if (status === 'done') {
        await client.query(
          `INSERT INTO summaries (transcript_id, date, attendees, key_decisions, action_items, discussion_highlights, next_steps) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            transcriptResult.rows[0].id,
            meeting.date,
            JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']),
            JSON.stringify(['Decision 1', 'Decision 2']),
            JSON.stringify(['Action 1', 'Action 2']),
            JSON.stringify(['Highlight 1', 'Highlight 2']),
            JSON.stringify(['Next step 1', 'Next step 2'])
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    console.log('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initializeDatabase };