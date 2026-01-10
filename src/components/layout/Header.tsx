'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  className?: string;
  siteName?: string;
}

// Rotas onde o Header nao deve aparecer
const HIDDEN_HEADER_ROUTES = ['/seja-arena', '/login', '/registro'];

// Domínio comece onde o Header nunca aparece
const COMECE_DOMAIN = 'comece.omocodoteamo.com.br';

export function Header({ onMenuClick, showMenuButton = false, className, siteName = 'Arena Te Amo' }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [isComeceDomain, setIsComeceDomain] = useState(false);

  // Detectar domínio apenas no client-side (após hidratação)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsComeceDomain(window.location.hostname === COMECE_DOMAIN);
    }
  }, []);

  // Mostrar link admin se tiver role='admin' OU is_creator=true
  const showAdminLink = profile?.role === 'admin' || profile?.is_creator === true;

  // Nao renderizar Header no domínio comece (totalmente público)
  if (isComeceDomain) {
    return null;
  }

  // Nao renderizar Header em certas paginas
  if (HIDDEN_HEADER_ROUTES.some(route => pathname?.startsWith(route))) {
    return null;
  }

  const userName = user?.user_metadata?.full_name || 'Usuario';
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 sticky top-0 z-30',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Menu button + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            {showMenuButton && onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Abrir menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-800">
                {siteName}
              </span>
            </Link>
          </div>

          {/* Right: User menu or Login */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100">
                  <Avatar
                    name={userName}
                    src={userAvatar}
                    size="sm"
                  />
                  <svg className="w-4 h-4 text-gray-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/perfil"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Meu Perfil
                  </Link>
                  <Link
                    href="/premios"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Meus Premios
                  </Link>
                  <Link
                    href="/perfil/editar"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Configuracoes
                  </Link>
                  {showAdminLink && (
                    <>
                      <hr className="my-1" />
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Painel Admin
                      </Link>
                    </>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}