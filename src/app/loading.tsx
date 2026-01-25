export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        {/* Coração pulsando */}
        <div className="relative">
          <div className="text-7xl animate-pulse">❤️</div>
          <div className="absolute inset-0 text-7xl animate-ping opacity-30">❤️</div>
        </div>
        
        {/* Texto */}
        <p className="mt-6 text-gray-600 font-medium">
          Carregando...
        </p>
        
        {/* Barra de progresso animada */}
        <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-loading-bar" />
        </div>
      </div>
      
      {/* CSS da animação */}
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
