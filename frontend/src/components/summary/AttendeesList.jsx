function AttendeesList({ attendees }) {
  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Attendees</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {attendees.map((attendee, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
              {attendee.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <span className="text-gray-700 font-medium">{attendee}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendeesList;