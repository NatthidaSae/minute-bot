import { useState } from 'react';

function MeetingTranscript({ transcriptContent }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format transcript content to display speaker names and line breaks properly
  const formatTranscript = (content) => {
    if (!content) return [];
    
    // Split by newline and filter empty lines
    const lines = content.split('\n').filter(line => line.trim());
    
    // Parse each line to identify speaker and text
    return lines.map((line, index) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const speaker = line.substring(0, colonIndex).trim();
        const text = line.substring(colonIndex + 1).trim();
        return { speaker, text, key: index };
      }
      return { speaker: null, text: line, key: index };
    });
  };

  const formattedTranscript = formatTranscript(transcriptContent);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Meeting Transcript</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`transition-all duration-300 overflow-hidden ${
        isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-gray-50 rounded-lg p-6 max-h-[700px] overflow-y-auto">
          {formattedTranscript.length > 0 ? (
            <div className="space-y-4">
              {formattedTranscript.map(({ speaker, text, key }) => (
                <div key={key} className="flex items-start gap-3">
                  {speaker ? (
                    <>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {speaker.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{speaker}</p>
                        <p className="text-gray-700 leading-relaxed">{text}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-700 leading-relaxed ml-11">{text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No transcript available</p>
          )}
        </div>
      </div>

      {/* Preview when collapsed */}
      {!isExpanded && formattedTranscript.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 italic">
            "{formattedTranscript[0].text.substring(0, 150)}..."
          </p>
          <p className="text-xs text-gray-500 mt-2">Click expand to view full transcript</p>
        </div>
      )}
    </div>
  );
}

export default MeetingTranscript;