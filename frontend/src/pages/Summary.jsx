import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSummaryByTranscriptId } from '../services/summaryService';
import ErrorState from '../components/ErrorState';
import AttendeesList from '../components/summary/AttendeesList';
import KeyDecisions from '../components/summary/KeyDecisions';
import ActionItemsList from '../components/summary/ActionItemsList';
import DiscussionHighlights from '../components/summary/DiscussionHighlights';
import MeetingTranscript from '../components/summary/MeetingTranscript';
import SectionNavigationSidebar from '../components/summary/SectionNavigationSidebar';
import TranscriptSidebar from '../components/summary/TranscriptSidebar';

function Summary() {
  const { transcriptId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetchSummary();
  }, [transcriptId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSummaryByTranscriptId(transcriptId);
      
      if (response.status === 'process') {
        setStatus('process');
      } else {
        setSummary(response);
        setStatus('done');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch summary');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchSummary();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-600 animate-pulse">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (status === 'process') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
        <div className="card p-12 text-center max-w-md animate-scale-in">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-primary-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Processing Summary</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">Our AI is analyzing the meeting transcript. This usually takes 30-60 seconds.</p>
          <button
            onClick={handleBackToDashboard}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error' || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <ErrorState 
          message={error}
          onRetry={handleRetry}
        />
        <button
          onClick={handleBackToDashboard}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-gray-600 mb-4">No summary found</p>
        <button
          onClick={handleBackToDashboard}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const sections = [
    { id: 'discussion-highlights', title: 'Discussion Highlights', show: summary.discussionHighlights?.length > 0 },
    { id: 'key-decisions', title: 'Key Decisions', show: summary.keyDecisions?.length > 0 },
    { id: 'action-items', title: 'Action Items', show: summary.actionItems?.length > 0 },
    { id: 'attendees', title: 'Attendees', show: summary.attendees?.length > 0 },
    { id: 'transcript', title: 'Meeting Transcript', show: !!summary.transcriptContent }
  ].filter(section => section.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Transcript Sidebar - Desktop */}
      <TranscriptSidebar 
        meetingId={summary.meetingId} 
        meetingTitle={summary.meetingTitle}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Modern Header Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={handleBackToDashboard}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              
              <div className="text-center">
                <h1 className="text-lg font-semibold text-gray-900">Meeting Summary</h1>
                <p className="text-sm text-gray-500">
                  {summary.date && new Date(summary.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="w-32"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex gap-8">
            {/* Main Content */}
            <main className="flex-1 animate-fade-in">
              <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card p-6 text-center">
                  <div className="text-3xl font-bold text-primary-600">{summary.attendees?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Attendees</div>
                </div>
                <div className="card p-6 text-center">
                  <div className="text-3xl font-bold text-primary-600">{summary.actionItems?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Action Items</div>
                </div>
                <div className="card p-6 text-center">
                  <div className="text-3xl font-bold text-primary-600">{summary.keyDecisions?.length || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Key Decisions</div>
                </div>
              </div>

              {summary.discussionHighlights?.length > 0 && (
                <section id="discussion-highlights" className="card p-8 animate-slide-up">
                  <DiscussionHighlights highlights={summary.discussionHighlights} />
                </section>
              )}

              {summary.keyDecisions?.length > 0 && (
                <section id="key-decisions" className="card p-8 animate-slide-up">
                  <KeyDecisions decisions={summary.keyDecisions} />
                </section>
              )}

              {summary.actionItems?.length > 0 && (
                <section id="action-items" className="card p-8 animate-slide-up">
                  <ActionItemsList actionItems={summary.actionItems} />
                </section>
              )}

              {summary.attendees?.length > 0 && (
                <section id="attendees" className="card p-8 animate-slide-up">
                  <AttendeesList attendees={summary.attendees} />
                </section>
              )}

              {summary.transcriptContent && (
                <section id="transcript" className="card p-8 animate-slide-up">
                  <MeetingTranscript transcriptContent={summary.transcriptContent} />
                </section>
              )}
            </div>
          </main>

          {/* Sidebar Navigation - Desktop Only */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <SectionNavigationSidebar sections={sections} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
  );
}

export default Summary;