function NextSteps({ steps }) {
  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Next Steps</h2>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex-shrink-0 mr-4">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-600 text-xs font-semibold">{index + 1}</span>
              </div>
            </div>
            <label className="text-gray-700 flex-1 cursor-pointer">{step}</label>
            <input
              type="checkbox"
              className="ml-4 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
              readOnly
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default NextSteps;