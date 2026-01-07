import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Criar Conta | Advocate Platform',
  description: 'Crie sua conta na plataforma de Advocate Marketing',
};

/**
 * Página de registro - Server Component que renderiza o formulário
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
      <RegisterForm />
    </>
  );
}
