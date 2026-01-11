'use client';

import {
  calculatePasswordStrength,
  getPasswordRequirements,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  type PasswordStrength,
} from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Componente visual que mostra a força da senha em tempo real
 *
 * Exibe:
 * - Barra colorida indicando força (fraca/média/forte)
 * - Label descritivo da força
 * - Checklist de requisitos com status
 */
export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  // Se não houver senha, não exibe o indicador
  if (!password) {
    return null;
  }

  const { score, level } = calculatePasswordStrength(password);
  const requirements = getPasswordRequirements(password);
  const strengthLabel = getPasswordStrengthLabel(level);
  const strengthColor = getPasswordStrengthColor(level);

  // Cores da barra de progresso baseadas na força
  const barColorClass = getBarColorClass(level);
  const barWidthPercentage = score;

  return (
    <div className="space-y-3">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            Força da senha:
          </span>
          <span className={`text-xs font-semibold ${strengthColor}`}>
            {strengthLabel}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${barColorClass}`}
            style={{ width: `${barWidthPercentage}%` }}
            role="progressbar"
            aria-valuenow={barWidthPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Força da senha"
          />
        </div>
      </div>

      {/* Checklist de requisitos */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-700">Requisitos:</p>
        <ul className="space-y-1">
          {requirements.map((requirement, index) => (
            <li key={index} className="flex items-start gap-2 text-xs">
              <span
                className={`flex-shrink-0 mt-0.5 ${
                  requirement.met ? 'text-green-600' : 'text-gray-400'
                }`}
                aria-label={requirement.met ? 'Atendido' : 'Não atendido'}
              >
                {requirement.met ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span
                className={
                  requirement.met ? 'text-gray-700' : 'text-gray-500'
                }
              >
                {requirement.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Obtém a classe de cor da barra de progresso baseada na força
 *
 * @param strength - Nível de força da senha
 * @returns Classe CSS do Tailwind para cor de fundo
 */
function getBarColorClass(strength: PasswordStrength): string {
  const colors: Record<PasswordStrength, string> = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };
  return colors[strength];
}
