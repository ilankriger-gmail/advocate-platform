'use client';

interface NPSScoreSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
  error?: string;
}

export function NPSScoreSelector({ value, onChange, error }: NPSScoreSelectorProps) {
  const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="w-full">
      {/* Scores em grid responsivo */}
      <div className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`
              w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-11 md:h-11
              flex items-center justify-center flex-shrink-0
              text-xs xs:text-sm sm:text-base font-medium
              border rounded-md sm:rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-500
              ${value === score
                ? 'bg-pink-500 border-pink-500 text-white scale-105'
                : 'bg-white border-surface-200 text-surface-600 hover:border-pink-300 hover:bg-pink-50'
              }
            `}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex justify-between mt-3 text-xs sm:text-sm text-surface-400 px-1">
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
