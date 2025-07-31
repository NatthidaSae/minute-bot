import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { formatDateTime } from '../utils/dateTime';

function MeetingList({ meetings }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'process':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'process':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return null;
    }
  };


  return (
    <div className="space-y-3">
      {meetings.map((meeting, index) => (
        <div
          key={meeting.id}
          className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {meeting.title}
                </h3>
                <Badge 
                  variant={getStatusVariant(meeting.status)} 
                  size="sm"
                  className="inline-flex items-center gap-1"
                >
                  {getStatusIcon(meeting.status)}
                  {meeting.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDateTime(meeting.date, meeting.time)}
                </span>
                {meeting.attendeeCount && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {meeting.attendeeCount} attendees
                  </span>
                )}
              </div>
            </div>
            
            {meeting.status === 'done' && meeting.transcriptId && (
              <Link to={`/summary/${meeting.transcriptId}`}>
                <Button variant="primary" size="sm">
                  View Summary
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MeetingList;