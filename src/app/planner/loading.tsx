export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white h-24 rounded-xl shadow-sm animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}