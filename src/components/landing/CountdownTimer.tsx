'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endsAt: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(endsAt: string): TimeLeft {
  const endDate = new Date(endsAt);
  const now = new Date();
  const difference = endDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
}

export function CountdownTimer({ endsAt, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endsAt));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  // Evitar hydration mismatch
  if (!mounted) {
    return (
      <div className={`bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">Tempo Limitado!</span>
        </div>
        <div className="flex justify-center gap-3">
          {[0, 0, 0, 0].map((_, i) => (
            <div key={i} className="text-center">
              <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[50px]">
                <span className="text-2xl font-bold">--</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className={`bg-gray-100 text-gray-600 rounded-xl p-4 text-center ${className}`}>
        <span className="font-medium">Desafio encerrado</span>
      </div>
    );
  }

  // Se restam menos de 24 horas, mostrar urgência
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`${isUrgent ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} text-white rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Clock className="w-5 h-5" />
        <span className="font-semibold">
          {isUrgent ? 'Termina em breve!' : 'Tempo restante'}
        </span>
      </div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="dias" />
        )}
        <TimeUnit value={timeLeft.hours} label="hrs" />
        <TimeUnit value={timeLeft.minutes} label="min" />
        <TimeUnit value={timeLeft.seconds} label="seg" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-2 min-w-[45px] sm:min-w-[55px]">
        <span className="text-xl sm:text-2xl font-bold">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs mt-1 block opacity-90">{label}</span>
    </div>
  );
}
