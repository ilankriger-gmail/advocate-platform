'use client';

interface NPSScoreSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
  error?: string;
}

export function NPSScoreSelector({ value, onChange, error }: NPSScoreSelectorProps) {
  const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Cores baseadas na classificacao NPS
  const getScoreStyle = (score: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white border-surface-300 text-surface-700 hover:border-pink-400 hover:bg-pink-50';
    }

    // Detratores (0-6): Vermelho/Rosa
    if (score <= 6) {
      return 'bg-gradient-to-r from-red-500 to-pink-500 border-red-500 text-white shadow-lg shadow-red-200 scale-110';
    }
    // Neutros (7-8): Laranja
    if (score <= 8) {
      return 'bg-gradient-to-r from-orange-500 to-yellow-500 border-orange-500 text-white shadow-lg shadow-orange-200 scale-110';
    }
    // Promotores (9-10): Verde
    return 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg shadow-green-200 scale-110';
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Scores em linha unica - nunca quebra */}
      <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 min-w-max px-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`
              w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12
              flex items-center justify-center flex-shrink-0
              text-sm sm:text-base md:text-lg font-semibold
              border-2 rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              ${getScoreStyle(score, value === score)}
            `}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex justify-between mt-4 text-sm text-surface-500 px-2">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>

      {/* Erro */}
      {error && (
        <p className="mt-3 text-sm text-red-500 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
