const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./config/initDb');
const googleDriveFileWatcher = require('./services/googleDriveFileWatcher');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/summaries', require('./routes/summaries'));
app.use('/api/transcripts', require('./routes/transcripts'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    // Start Google Drive file watcher service
    if (process.env.ENABLE_FILE_WATCHER !== 'false') {
      try {
        await googleDriveFileWatcher.start();
        console.log('Google Drive API file watcher service started');
      } catch (watcherError) {
        console.error('Failed to start Google Drive file watcher service:', watcherError);
        // Continue running server even if watcher fails
      }
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  googleDriveFileWatcher.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  googleDriveFileWatcher.stop();
  process.exit(0);
});

startServer();