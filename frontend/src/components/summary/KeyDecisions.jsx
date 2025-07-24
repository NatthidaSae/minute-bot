function KeyDecisions({ decisions }) {
  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Key Decisions</h2>
      </div>
      <div className="space-y-4">
        {decisions.map((decision, index) => (
          <div key={index} className="flex items-start group">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5 group-hover:bg-green-200 transition-colors">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="ml-4 text-gray-700 leading-relaxed">{decision}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KeyDecisions;