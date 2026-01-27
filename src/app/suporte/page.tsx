import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Suporte | Arena Te Amo',
  description: 'Central de suporte e ajuda da comunidade Arena Te Amo',
};

export default function SuportePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Central de Suporte
          </h1>
          <p className="text-gray-400 text-lg">
            Precisa de ajuda? Estamos aqui pra te apoiar! 💜
          </p>
        </div>

        <div className="space-y-6">
          {/* Contato */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📩 Fale Conosco</h2>
            <p className="text-gray-300 mb-3">
              Para dúvidas, sugestões ou problemas técnicos:
            </p>
            <a
              href="mailto:suporte@omocodoteamo.com.br"
              className="text-purple-400 hover:text-purple-300 font-medium text-lg"
            >
              suporte@omocodoteamo.com.br
            </a>
          </div>

          {/* FAQ */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">❓ Perguntas Frequentes</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-medium">Como crio minha conta?</h3>
                <p className="text-gray-400 mt-1">
                  Acesse a plataforma, clique em &quot;Criar conta&quot; e preencha seus dados. Você também pode entrar com Google.
                </p>
              </div>
              <div>
                <h3 className="text-white font-medium">Como ganho corações?</h3>
                <p className="text-gray-400 mt-1">
                  Cada interação na comunidade gera corações: posts, curtidas, comentários, login diário e muito mais!
                </p>
              </div>
              <div>
                <h3 className="text-white font-medium">Esqueci minha senha, e agora?</h3>
                <p className="text-gray-400 mt-1">
                  Na tela de login, clique em &quot;Esqueci minha senha&quot; e siga as instruções para redefinir.
                </p>
              </div>
              <div>
                <h3 className="text-white font-medium">Como excluo minha conta?</h3>
                <p className="text-gray-400 mt-1">
                  Envie um email para suporte@omocodoteamo.com.br solicitando a exclusão. Processamos em até 48h.
                </p>
              </div>
            </div>
          </div>

          {/* Redes */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🌐 Redes Sociais</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://instagram.com/omocodoteamo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                📸 Instagram
              </a>
              <a
                href="https://tiktok.com/@omocodoteamo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                🎵 TikTok
              </a>
              <a
                href="https://youtube.com/@omocodoteamo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                ▶️ YouTube
              </a>
            </div>
          </div>

          {/* Privacidade */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🔒 Privacidade</h2>
            <p className="text-gray-300">
              Seus dados são protegidos. Não compartilhamos informações pessoais com terceiros.
              Para mais detalhes, consulte nossa{' '}
              <Link href="/privacidade" className="text-purple-400 hover:text-purple-300">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 transition"
          >
            ← Voltar para a comunidade
          </Link>
        </div>
      </div>
    </div>
  );
}
