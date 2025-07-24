function SummaryHeader({ date, onBackClick }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mb-6">
      <button
        onClick={onBackClick}
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold text-gray-900">Meeting Summary</h1>
      <p className="text-gray-600 mt-2">{formatDate(date)}</p>
    </div>
  );
}

export default SummaryHeader;