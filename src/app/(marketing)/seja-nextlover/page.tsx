import { NPSForm } from './NPSForm';

export default function SejaNextloverPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo/Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Seja um NextLOVER
        </h1>
        <p className="mt-3 text-gray-600 max-w-md leading-relaxed">
          Ganhe produtos, dinheiro e participe de experiências exclusivas para os maiores fãs do O Moço do Te Amo
        </p>
      </div>

      {/* Card do formulario */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <NPSForm />
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-400">
        O Moço do Te Amo - Comunidade NextLOVERS
      </p>
    </main>
  );
}
