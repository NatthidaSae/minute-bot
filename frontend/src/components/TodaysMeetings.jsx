import MeetingList from './MeetingList';
import Badge from './ui/Badge';
import { sortMeetingsByDateTime } from '../utils/dateTime';

function TodaysMeetings({ meetings }) {
  // Sort meetings by time for today's view
  const sortedMeetings = sortMeetingsByDateTime(meetings);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl"></div>
      <div className="relative bg-white/70 backdrop-blur-sm rounded-xl border border-primary-200 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-primary-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Today's Meetings</h2>
              <p className="text-sm text-gray-600 mt-0.5">Stay on top of your daily schedule</p>
            </div>
          </div>
          <Badge variant={sortedMeetings.length > 0 ? "primary" : "default"} size="lg" dot>
            {sortedMeetings.length} meeting{sortedMeetings.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {sortedMeetings.length > 0 ? (
          <MeetingList meetings={sortedMeetings} />
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M20 12H4M10 8l-4 4 4 4M14 16l4-4-4-4" 
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No meetings scheduled for today</p>
            <p className="text-sm text-gray-500 mt-1">Enjoy your meeting-free day!</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TodaysMeetings;