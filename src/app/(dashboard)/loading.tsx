export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {/* Coração pulsando */}
        <div className="relative">
          <div className="text-6xl animate-pulse">❤️</div>
        </div>
        
        {/* Texto */}
        <p className="mt-4 text-gray-500 text-sm">
          Carregando...
        </p>
      </div>
    </div>
  );
}
