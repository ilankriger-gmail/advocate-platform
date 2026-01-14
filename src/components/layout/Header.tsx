'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
  siteName?: string;
  logoUrl?: string;
}

// Rotas onde o Header nao deve aparecer
const HIDDEN_HEADER_ROUTES = ['/seja-arena', '/login', '/registro', '/lp'];

// Domínio comece onde o Header nunca aparece
const COMECE_DOMAIN = 'comece.omocodoteamo.com.br';

export function Header({ className, siteName = 'Arena Te Amo', logoUrl = '/logo.png' }: HeaderProps) {
  const { user, profile, signOut, isLoading } = useAuth();
  const pathname = usePathname();
  const [isComeceDomain, setIsComeceDomain] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detectar domínio comece
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsComeceDomain(window.location.hostname === COMECE_DOMAIN);
    }
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const userName = profile?.full_name || user?.user_metadata?.full_name || 'Usuário';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 sticky top-0 z-30',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Criar Post */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              {logoUrl.startsWith('/') ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              ) : (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 w-auto"
                />
              )}
            </Link>
            {/* Botão criar post - mobile only */}
            {user && (
              <Link
                href="/perfil/novo-post"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm hover:shadow-md transition-shadow"
                title="Criar post"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            )}
          </div>

          {/* Right: User menu or Login */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              /* Skeleton enquanto carrega */
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
                >
                  <Avatar
                    name={userName}
                    src={userAvatar}
                    size="sm"
                  />
                  <svg className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 transition-all ${isDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/perfil"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Meu Perfil
                  </Link>
                  <Link
                    href="/premios"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Prêmios
                  </Link>
                  <Link
                    href="/perfil/editar"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Configurações
                  </Link>
                  {showAdminLink && (
                    <>
                      <hr className="my-1" />
                      <Link
                        href="/admin"
                        onClick={() => setIsDropdownOpen(false)}
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