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
            Última atualização: Janeiro de 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-surface max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-surface-600 mb-4">
              Ao acessar e utilizar a plataforma Arena (&quot;Plataforma&quot;), você concorda em cumprir e estar sujeito a estes Termos de Uso.
              Se você não concordar com qualquer parte destes termos, não deverá utilizar a Plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-surface-600 mb-4">
              A Arena é uma plataforma de comunidade que conecta criadores de conteúdo com seus fãs e seguidores.
              Oferecemos recursos como:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Participação em desafios e competições</li>
              <li>Sistema de recompensas e moedas virtuais</li>
              <li>Interação com outros membros da comunidade</li>
              <li>Acesso a conteúdos exclusivos</li>
              <li>Participação em eventos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">3. Cadastro e Conta</h2>
            <p className="text-surface-600 mb-4">
              Para utilizar a Plataforma, você deve:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Ter pelo menos 18 anos de idade ou autorização dos responsáveis legais</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a segurança de sua senha e conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">4. Conduta do Usuário</h2>
            <p className="text-surface-600 mb-4">
              Ao utilizar a Plataforma, você concorda em não:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Violar leis ou regulamentos aplicáveis</li>
              <li>Publicar conteúdo ofensivo, difamatório ou ilegal</li>
              <li>Assediar, ameaçar ou intimidar outros usuários</li>
              <li>Tentar acessar áreas restritas da Plataforma</li>
              <li>Utilizar a Plataforma para fins comerciais não autorizados</li>
              <li>Compartilhar sua conta com terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">5. Propriedade Intelectual</h2>
            <p className="text-surface-600 mb-4">
              Todo o conteúdo da Plataforma, incluindo textos, gráficos, logos, ícones, imagens e software,
              é de propriedade exclusiva da Arena ou de seus licenciadores e está protegido por leis de
              propriedade intelectual.
            </p>
            <p className="text-surface-600 mb-4">
              O conteúdo gerado por usuários permanece de propriedade do respectivo usuário, porém ao
              publicá-lo na Plataforma, você concede uma licença não exclusiva para uso, reprodução e
              distribuição do conteúdo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">6. Sistema de Recompensas</h2>
            <p className="text-surface-600 mb-4">
              A Plataforma oferece um sistema de moedas virtuais e recompensas:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Moedas são obtidas através de participação em atividades</li>
              <li>Moedas não possuem valor monetário e não podem ser convertidas em dinheiro</li>
              <li>Recompensas estão sujeitas a disponibilidade</li>
              <li>A Arena reserva-se o direito de modificar o sistema de recompensas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-surface-600 mb-4">
              A Arena não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Interrupções ou falhas no serviço</li>
              <li>Perda de dados ou conteúdo</li>
              <li>Ações de terceiros ou outros usuários</li>
              <li>Danos indiretos ou consequenciais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">8. Modificações dos Termos</h2>
            <p className="text-surface-600 mb-4">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento.
              Alterações significativas serão comunicadas através da Plataforma ou por e-mail.
              O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">9. Encerramento</h2>
            <p className="text-surface-600 mb-4">
              A Arena pode suspender ou encerrar sua conta a qualquer momento, com ou sem motivo,
              mediante aviso prévio quando possível. Você também pode encerrar sua conta a qualquer
              momento entrando em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">10. Lei Aplicável</h2>
            <p className="text-surface-600 mb-4">
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
              Qualquer disputa será submetida ao foro da comarca de São Paulo, SP,
              com exclusão de qualquer outro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">11. Contato</h2>
            <p className="text-surface-600 mb-4">
              Para dúvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <p className="text-surface-600">
              E-mail: <a href="mailto:contato@omocodoteamo.com.br" className="text-primary-600 hover:underline">contato@omocodoteamo.com.br</a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-surface-200">
          <p className="text-sm text-surface-500 text-center">
            Ao utilizar nossa plataforma, você concorda com estes termos e com nossa{' '}
            <Link href="/privacidade" className="text-primary-600 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
