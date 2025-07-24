function DiscussionHighlights({ highlights }) {
  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Discussion Highlights</h2>
      </div>
      <div className="space-y-4">
        {highlights.map((highlight, index) => (
          <div key={index} className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
            <blockquote className="pl-6 py-2">
              <p className="text-gray-700 text-lg leading-relaxed italic">
                "{highlight}"
              </p>
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiscussionHighlights;