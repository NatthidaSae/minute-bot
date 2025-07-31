import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { meetingService } from '../../services/meetingService';
import Badge from '../ui/Badge';
import { formatTime } from '../../utils/dateTime';

function TranscriptSidebar({ meetingId, meetingTitle }) {
  const { transcriptId } = useParams();
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [groupedTranscripts, setGroupedTranscripts] = useState({});
  const [showAllOccurrences, setShowAllOccurrences] = useState(true);

  useEffect(() => {
    if (meetingId) {
      fetchTranscripts();
    }
  }, [meetingId, showAllOccurrences]);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      // Fetch either all series transcripts or just this meeting's transcripts
      const response = showAllOccurrences 
        ? await meetingService.getMeetingSeriesTranscripts(meetingId)
        : await meetingService.getMeetingTranscripts(meetingId);
      setTranscripts(response.data || []);
      
      // Group transcripts by date
      const grouped = (response.data || []).reduce((acc, transcript) => {
        const date = transcript.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(transcript);
        return acc;
      }, {});
      
      setGroupedTranscripts(grouped);
    } catch (error) {
      console.error('Failed to fetch transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusIcon = (status) => {
    if (status === 'done') {
      return (
        <svg className="w-3.5 h-3.5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else if (status === 'process') {
      return (
        <svg className="w-3.5 h-3.5 text-warning-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-full ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex-1 mr-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {meetingTitle || 'Meeting Transcripts'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
                {showAllOccurrences && transcripts.some(t => t.isCurrentMeeting) && ' (all occurrences)'}
              </p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isCollapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'} 
              />
            </svg>
          </button>
        </div>
        
        {/* Toggle for showing all occurrences */}
        {!isCollapsed && transcripts.length > 0 && (
          <div className="mt-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showAllOccurrences}
                onChange={(e) => setShowAllOccurrences(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-9 h-5 rounded-full transition-colors ${
                showAllOccurrences ? 'bg-primary-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  showAllOccurrences ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
              <span className="ml-2 text-xs text-gray-600">
                Show all occurrences
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Transcript List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedTranscripts).length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No transcripts found
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedTranscripts).map(([date, dateTranscripts]) => (
              <div key={date} className="mb-4">
                {!isCollapsed && (
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {formatDate(date)}
                  </div>
                )}
                <div className="space-y-1">
                  {dateTranscripts.map((transcript) => {
                    const isActive = transcript.id === transcriptId;
                    // Use meeting time if available, otherwise fall back to creation time
                    const timeStr = transcript.time 
                      ? formatTime(transcript.time)
                      : new Date(transcript.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                    
                    return (
                      <Link
                        key={transcript.id}
                        to={`/summary/${transcript.id}`}
                        className={`
                          flex items-center px-2 py-2 rounded-lg text-sm transition-all relative
                          ${isActive 
                            ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                          }
                          ${showAllOccurrences && transcript.isCurrentMeeting && !isActive 
                            ? 'ring-1 ring-primary-300' 
                            : ''
                          }
                        `}
                        title={isCollapsed ? `${transcript.title || timeStr}${transcript.isCurrentMeeting ? ' (current meeting)' : ''}` : ''}
                      >
                        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                          {getStatusIcon(transcript.status)}
                        </div>
                        {!isCollapsed && (
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate flex-1">
                                {transcript.title || `Transcript - ${timeStr}`}
                              </p>
                              {showAllOccurrences && transcript.isCurrentMeeting && (
                                <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                                  current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {timeStr}
                            </p>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && transcripts.length > 5 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Showing all {transcripts.length} transcripts
          </p>
        </div>
      )}
    </aside>
  );
}

export default TranscriptSidebar;