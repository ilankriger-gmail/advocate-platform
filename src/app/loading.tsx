export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        {/* Coração pulsando */}
        <div className="relative">
          <div className="text-7xl animate-pulse">❤️</div>
        </div>
        
        {/* Texto */}
        <p className="mt-6 text-gray-600 font-medium">
          Carregando...
        </p>
        
        {/* Spinner simples */}
        <div className="mt-4 flex justify-center">
          <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
