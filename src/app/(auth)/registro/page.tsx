import { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { Skeleton } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Criar Conta | Advocate Platform',
  description: 'Crie sua conta na plataforma de Advocate Marketing',
};

/**
 * Pagina de registro - Server Component que renderiza o formulario
 */
export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Criar nova conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Comece a conectar sua marca com advocates engajados
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <RegisterForm />
      </Suspense>
    </>
  );
}
