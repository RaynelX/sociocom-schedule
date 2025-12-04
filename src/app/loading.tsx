export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-100 pb-20 font-sans">
      
      <div className="bg-blue-600 px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-1">
            <div className="h-6 w-32 bg-blue-500/50 rounded animate-pulse"></div>
            <div className="h-6 w-20 bg-blue-500/50 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between mt-2">
            <div className="h-5 w-5 bg-blue-500/50 rounded animate-pulse"></div>
            <div className="h-4 w-40 bg-blue-500/50 rounded animate-pulse"></div>
            <div className="h-5 w-5 bg-blue-500/50 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-3 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
             <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                </div>
                
                <div className="p-4 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
             </div>
        ))}
      </div>
    </div>
  );
}