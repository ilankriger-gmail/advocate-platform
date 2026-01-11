'use client';

interface NPSScoreSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
  error?: string;
}

export function NPSScoreSelector({ value, onChange, error }: NPSScoreSelectorProps) {
  const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Cores baseadas na classificacao NPS - mais sutis
  const getScoreStyle = (score: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white border-surface-300 text-surface-700 hover:border-primary-400 hover:bg-primary-50';
    }

    // Detratores (0-6): Vermelho suave
    if (score <= 6) {
      return 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 scale-110';
    }
    // Neutros (7-8): Amarelo
    if (score <= 8) {
      return 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-200 scale-110';
    }
    // Promotores (9-10): Verde
    return 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 scale-110';
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
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
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
