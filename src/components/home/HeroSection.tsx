'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface HeroSectionProps {
  isLoggedIn: boolean;
  title?: string;
  subtitle?: string;
  siteName?: string;
  stats?: {
    membersCount: number;
    challengesCompleted: number;
    eventsCount: number;
  };
}

// Componente de contador animado
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function para desacelerar no final
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString('pt-BR')}</span>;
}

// Formatar número grande (1000 -> 1K, 1000000 -> 1M)
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function HeroSection({
  isLoggedIn,
  title = 'Arena Te Amo',
  subtitle = 'Comunidade oficial do O Moço do Te Amo | NextlevelDJ',
  siteName = 'Arena Te Amo',
  stats,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[280px] sm:min-h-[320px] overflow-hidden"
    >
      {/* Background com mesh gradient animado */}
      <div className="absolute inset-0 bg-indigo-600">
        {/* Blob 1 - Rosa */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-60 blur-3xl animate-hero-mesh"
          style={{
            background: 'radial-gradient(circle, #f472b6 0%, transparent 70%)',
            top: '-20%',
            right: '-10%',
          }}
        />
        {/* Blob 2 - Roxo */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-50 blur-3xl animate-hero-mesh"
          style={{
            background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
            bottom: '-30%',
            left: '-10%',
            animationDelay: '-5s',
          }}
        />
        {/* Blob 3 - Indigo */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-40 blur-3xl animate-hero-mesh"
          style={{
            background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
            top: '20%',
            left: '30%',
            animationDelay: '-10s',
          }}
        />
        {/* Overlay gradient para profundidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-900/30" />
      </div>

      {/* Floating hearts (decorativo) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/20 animate-float-up"
            style={{
              left: `${15 + i * 18}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${6 + i}s`,
              fontSize: `${14 + i * 4}px`,
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 py-10 sm:py-14 md:py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Glass Card */}
        <motion.div
          className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-6 sm:p-8 md:p-10 shadow-2xl"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          variants={itemVariants}
        >
          {/* Título com coração */}
          <motion.div className="text-center mb-4 sm:mb-6" variants={itemVariants}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              <span className="inline-block mr-2 sm:mr-3">❤️</span>
              {title}
            </h1>
          </motion.div>

          {/* Subtítulo */}
          <motion.p
            className="text-center text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 sm:mb-8"
            variants={itemVariants}
          >
            {subtitle}
          </motion.p>

          {/* Stats Section */}
          {stats && (
            <motion.div
              className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8"
              variants={itemVariants}
            >
              {/* Membros */}
              <motion.div
                className="text-center p-3 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                variants={statsVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={stats.membersCount} />
                  <span className="text-pink-300">+</span>
                </div>
                <div className="text-xs sm:text-sm text-white/70">Membros</div>
              </motion.div>

              {/* Desafios */}
              <motion.div
                className="text-center p-3 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                variants={statsVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={stats.challengesCompleted} />
                  <span className="text-pink-300">+</span>
                </div>
                <div className="text-xs sm:text-sm text-white/70">Desafios</div>
              </motion.div>

              {/* Eventos */}
              <motion.div
                className="text-center p-3 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                variants={statsVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={stats.eventsCount} />
                  <span className="text-pink-300">+</span>
                </div>
                <div className="text-xs sm:text-sm text-white/70">Eventos</div>
              </motion.div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            variants={itemVariants}
          >
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-pink-600 font-semibold rounded-full hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl min-h-[48px] animate-cta-glow"
                >
                  <span className="mr-2">🚀</span>
                  Entrar na {siteName}
                </Link>
                <Link
                  href="/desafios"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all min-h-[48px]"
                >
                  Ver Desafios
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/desafios"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-pink-600 font-semibold rounded-full hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl min-h-[48px]"
                >
                  <span className="mr-2">🎯</span>
                  Ver Desafios
                </Link>
                <Link
                  href="/eventos"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all min-h-[48px]"
                >
                  <span className="mr-2">📅</span>
                  Eventos
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
