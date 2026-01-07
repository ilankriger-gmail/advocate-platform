/**
 * Layout compartilhado para paginas de autenticacao
 * Centraliza o conteudo
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Entrar na Comunidade
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
