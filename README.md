# Meeting Dashboard Application

A full-stack application for managing and viewing meeting summaries with a paginated dashboard.

## Tech Stack

- **Frontend**: React with Vite, Tailwind CSS, React Router
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL installed and running
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE meeting_dashboard;
```

2. Update the database connection string in `backend/.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/meeting_dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on http://localhost:5000

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will start on http://localhost:5173

## Features Implemented

- ✅ Paginated dashboard listing meetings
- ✅ Today's meetings section
- ✅ Meeting status indicators (pending, done, error)
- ✅ "View Summary" button for completed meetings
- ✅ Responsive design with Tailwind CSS
- ✅ Loading, empty, and error states
- ✅ Pagination controls
- ✅ PostgreSQL database with proper schema
- ✅ RESTful API endpoints

## API Endpoints

- `GET /api/meetings?page=1` - Get paginated meetings
- `GET /api/meetings/today` - Get today's meetings

## Database Schema

- **users**: User information
- **meetings**: Meeting records with title and date
- **transcripts**: Meeting transcripts with status tracking
- **summaries**: AI-generated meeting summaries

## Development Notes

- The application seeds test data on first run
- Meeting statuses: `pending`, `done`, `error`
- Summaries are only available for meetings with `done` status# minute-bot
