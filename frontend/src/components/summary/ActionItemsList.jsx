function ActionItemsList({ actionItems }) {
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (diffDays < 0) {
      return { text: formattedDate, status: 'overdue' };
    } else if (diffDays <= 3) {
      return { text: formattedDate, status: 'urgent' };
    } else {
      return { text: formattedDate, status: 'normal' };
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Action Items</h2>
      </div>
      <div className="grid gap-4">
        {actionItems.map((item, index) => {
          const dueDate = formatDueDate(item.dueDate);
          
          return (
            <div
              key={index}
              className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-soft transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-3">{item.task}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                      <span className="font-medium">{item.assignedTo?.join(', ') || 'Unassigned'}</span>
                    </div>
                    {dueDate && (
                      <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        dueDate.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        dueDate.status === 'urgent' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          />
                        </svg>
                        <span>{dueDate.text}</span>
                      </div>
                    )}
                  </div>
                </div>
                {dueDate && dueDate.status === 'overdue' && (
                  <div className="ml-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActionItemsList;