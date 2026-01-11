import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso | Arena',
  description: 'Termos de Uso da plataforma Arena - Comunidade de Advocates',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/seja-arena"
            className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-2">
            Termos de Uso
          </h1>
          <p className="text-surface-500">
            Ultima atualizacao: Janeiro de 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-surface max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">1. Aceitacao dos Termos</h2>
            <p className="text-surface-600 mb-4">
              Ao acessar e utilizar a plataforma Arena (&quot;Plataforma&quot;), voce concorda em cumprir e estar sujeito a estes Termos de Uso.
              Se voce nao concordar com qualquer parte destes termos, nao devera utilizar a Plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">2. Descricao do Servico</h2>
            <p className="text-surface-600 mb-4">
              A Arena e uma plataforma de comunidade que conecta criadores de conteudo com seus fas e seguidores.
              Oferecemos recursos como:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Participacao em desafios e competicoes</li>
              <li>Sistema de recompensas e moedas virtuais</li>
              <li>Interacao com outros membros da comunidade</li>
              <li>Acesso a conteudos exclusivos</li>
              <li>Participacao em eventos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">3. Cadastro e Conta</h2>
            <p className="text-surface-600 mb-4">
              Para utilizar a Plataforma, voce deve:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Ter pelo menos 18 anos de idade ou autorizacao dos responsaveis legais</li>
              <li>Fornecer informacoes verdadeiras e atualizadas</li>
              <li>Manter a seguranca de sua senha e conta</li>
              <li>Notificar imediatamente sobre qualquer uso nao autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">4. Conduta do Usuario</h2>
            <p className="text-surface-600 mb-4">
              Ao utilizar a Plataforma, voce concorda em nao:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Violar leis ou regulamentos aplicaveis</li>
              <li>Publicar conteudo ofensivo, difamatorio ou ilegal</li>
              <li>Assediar, ameacar ou intimidar outros usuarios</li>
              <li>Tentar acessar areas restritas da Plataforma</li>
              <li>Utilizar a Plataforma para fins comerciais nao autorizados</li>
              <li>Compartilhar sua conta com terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">5. Propriedade Intelectual</h2>
            <p className="text-surface-600 mb-4">
              Todo o conteudo da Plataforma, incluindo textos, graficos, logos, icones, imagens e software,
              e de propriedade exclusiva da Arena ou de seus licenciadores e esta protegido por leis de
              propriedade intelectual.
            </p>
            <p className="text-surface-600 mb-4">
              O conteudo gerado por usuarios permanece de propriedade do respectivo usuario, porem ao
              publica-lo na Plataforma, voce concede uma licenca nao exclusiva para uso, reproducao e
              distribuicao do conteudo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">6. Sistema de Recompensas</h2>
            <p className="text-surface-600 mb-4">
              A Plataforma oferece um sistema de moedas virtuais e recompensas:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Moedas sao obtidas atraves de participacao em atividades</li>
              <li>Moedas nao possuem valor monetario e nao podem ser convertidas em dinheiro</li>
              <li>Recompensas estao sujeitas a disponibilidade</li>
              <li>A Arena reserva-se o direito de modificar o sistema de recompensas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">7. Limitacao de Responsabilidade</h2>
            <p className="text-surface-600 mb-4">
              A Arena nao se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Interrupcoes ou falhas no servico</li>
              <li>Perda de dados ou conteudo</li>
              <li>Acoes de terceiros ou outros usuarios</li>
              <li>Danos indiretos ou consequenciais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">8. Modificacoes dos Termos</h2>
            <p className="text-surface-600 mb-4">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento.
              Alteracoes significativas serao comunicadas atraves da Plataforma ou por e-mail.
              O uso continuado apos as alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">9. Encerramento</h2>
            <p className="text-surface-600 mb-4">
              A Arena pode suspender ou encerrar sua conta a qualquer momento, com ou sem motivo,
              mediante aviso previo quando possivel. Voce tambem pode encerrar sua conta a qualquer
              momento entrando em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">10. Lei Aplicavel</h2>
            <p className="text-surface-600 mb-4">
              Estes Termos sao regidos pelas leis da Republica Federativa do Brasil.
              Qualquer disputa sera submetida ao foro da comarca de Sao Paulo, SP,
              com exclusao de qualquer outro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">11. Contato</h2>
            <p className="text-surface-600 mb-4">
              Para duvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <p className="text-surface-600">
              E-mail: <a href="mailto:contato@omocodoteamo.com.br" className="text-primary-600 hover:underline">contato@omocodoteamo.com.br</a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-surface-200">
          <p className="text-sm text-surface-500 text-center">
            Ao utilizar nossa plataforma, voce concorda com estes termos e com nossa{' '}
            <Link href="/privacidade" className="text-primary-600 hover:underline">
              Politica de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
