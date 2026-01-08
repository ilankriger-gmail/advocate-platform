'use client';

interface NPSScoreSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
  error?: string;
}

export function NPSScoreSelector({ value, onChange, error }: NPSScoreSelectorProps) {
  // Cores baseadas na classificacao NPS
  const getScoreColor = (score: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white border-gray-300 text-gray-700 hover:border-gray-400';
    }

    // Detratores (0-6): Vermelho
    if (score <= 6) {
      return 'bg-red-500 border-red-500 text-white';
    }
    // Neutros (7-8): Amarelo
    if (score <= 8) {
      return 'bg-yellow-500 border-yellow-500 text-white';
    }
    // Promotores (9-10): Verde
    return 'bg-green-500 border-green-500 text-white';
  };

  const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Qual a chance de você indicar o Moço do Te Amo para um amigo ou familiar?
      </label>

      {/* Grid de botoes - mobile first */}
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`
              min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]
              flex items-center justify-center
              text-lg font-semibold
              border-2 rounded-xl
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              active:scale-95
              ${getScoreColor(score, value === score)}
            `}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Nada provável</span>
        <span>Muito provavel</span>
      </div>

      {/* Erro */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
