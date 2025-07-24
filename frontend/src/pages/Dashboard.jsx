import { useState, useEffect } from 'react';
import { meetingService } from '../services/meetingService';
import MeetingList from '../components/MeetingList';
import Pagination from '../components/Pagination';
import TodaysMeetings from '../components/TodaysMeetings';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMeetings(currentPage);
    fetchTodaysMeetings();
  }, [currentPage]);

  const fetchMeetings = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await meetingService.getMeetings(page);
      setMeetings(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysMeetings = async () => {
    try {
      const response = await meetingService.getTodaysMeetings();
      setTodaysMeetings(response.data);
    } catch (err) {
      console.error('Failed to fetch today\'s meetings:', err);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchMeetings(currentPage)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Meetings</h1>
              <p className="text-gray-600 mt-1">Track and review all your meeting summaries</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back!</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in space-y-8">
          {/* Today's Meetings Section - Always visible */}
          <div>
            <TodaysMeetings meetings={todaysMeetings} />
          </div>

          {/* All Meetings Section */}
          <section className="card">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">All Meetings</h2>
                <span className="text-sm text-gray-500">
                  {meta.totalCount} total meetings
                </span>
              </div>
              
              {meetings.length === 0 ? (
                <EmptyState message="No meetings found" />
              ) : (
                <>
                  <MeetingList meetings={meetings} />
                  <div className="mt-6">
                    <Pagination
                      currentPage={meta.page}
                      totalPages={meta.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;