import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politica de Privacidade | Arena',
  description: 'Politica de Privacidade e LGPD da plataforma Arena',
};

export default function PrivacidadePage() {
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
            Politica de Privacidade
          </h1>
          <p className="text-surface-500">
            Ultima atualizacao: Janeiro de 2026
          </p>
          <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-lg">
            <p className="text-sm text-primary-800">
              Esta politica esta em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei n 13.709/2018).
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-surface max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">1. Introducao</h2>
            <p className="text-surface-600 mb-4">
              A Arena (&quot;nos&quot;, &quot;nosso&quot; ou &quot;Plataforma&quot;) esta comprometida com a protecao da
              privacidade e dos dados pessoais de nossos usuarios. Esta Politica de Privacidade descreve
              como coletamos, usamos, armazenamos e protegemos suas informacoes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">2. Dados Pessoais Coletados</h2>
            <p className="text-surface-600 mb-4">
              Coletamos os seguintes tipos de dados pessoais:
            </p>

            <h3 className="text-lg font-medium text-surface-800 mt-6 mb-3">2.1. Dados fornecidos por voce:</h3>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Dados de identificacao:</strong> nome completo, e-mail, telefone (WhatsApp)</li>
              <li><strong>Dados de conta:</strong> senha (armazenada de forma criptografada)</li>
              <li><strong>Dados de perfil:</strong> foto, biografia, redes sociais</li>
              <li><strong>Dados de feedback:</strong> nota NPS, comentarios e avaliacoes</li>
            </ul>

            <h3 className="text-lg font-medium text-surface-800 mt-6 mb-3">2.2. Dados coletados automaticamente:</h3>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Dados de navegacao:</strong> endereco IP, tipo de navegador, paginas visitadas</li>
              <li><strong>Dados de dispositivo:</strong> tipo de dispositivo, sistema operacional</li>
              <li><strong>Dados de uso:</strong> interacoes com a plataforma, participacao em desafios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-surface-600 mb-4">
              Utilizamos seus dados pessoais para as seguintes finalidades:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Prestacao do servico:</strong> criar e gerenciar sua conta, permitir participacao em desafios e eventos</li>
              <li><strong>Comunicacao:</strong> enviar notificacoes sobre sua conta, desafios e recompensas</li>
              <li><strong>Melhoria do servico:</strong> analisar uso da plataforma para aprimorar a experiencia</li>
              <li><strong>Seguranca:</strong> prevenir fraudes e proteger a integridade da plataforma</li>
              <li><strong>Obrigacoes legais:</strong> cumprir com requisitos legais e regulatorios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">4. Base Legal (LGPD)</h2>
            <p className="text-surface-600 mb-4">
              O tratamento de seus dados pessoais esta fundamentado nas seguintes bases legais previstas na LGPD:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Consentimento (Art. 7, I):</strong> quando voce aceita esta politica e nossos termos</li>
              <li><strong>Execucao de contrato (Art. 7, V):</strong> para prestacao dos servicos contratados</li>
              <li><strong>Legitimo interesse (Art. 7, IX):</strong> para melhorias e seguranca da plataforma</li>
              <li><strong>Cumprimento de obrigacao legal (Art. 7, II):</strong> quando exigido por lei</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-surface-600 mb-4">
              Seus dados pessoais podem ser compartilhados com:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Prestadores de servico:</strong> empresas que nos auxiliam na operacao (hospedagem, e-mail, analytics)</li>
              <li><strong>Parceiros:</strong> quando necessario para entrega de recompensas</li>
              <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="text-surface-600 mt-4">
              <strong>Nao vendemos seus dados pessoais</strong> para terceiros para fins de marketing ou publicidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">6. Armazenamento e Seguranca</h2>
            <p className="text-surface-600 mb-4">
              Adotamos medidas tecnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Criptografia de dados em transito (HTTPS/TLS)</li>
              <li>Criptografia de senhas (bcrypt)</li>
              <li>Controle de acesso restrito aos dados</li>
              <li>Monitoramento de seguranca continuo</li>
              <li>Backups regulares</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Seus dados sao armazenados em servidores seguros, podendo estar localizados fora do Brasil,
              sempre em conformidade com a LGPD e acordos de transferencia internacional de dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">7. Retencao de Dados</h2>
            <p className="text-surface-600 mb-4">
              Mantemos seus dados pessoais pelo tempo necessario para:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Enquanto sua conta estiver ativa</li>
              <li>Cumprir obrigacoes legais (ex: registros fiscais por 5 anos)</li>
              <li>Resolver disputas ou fazer cumprir nossos acordos</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Apos o encerramento da conta, seus dados serao anonimizados ou excluidos em ate 30 dias,
              exceto quando houver obrigacao legal de retencao.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">8. Seus Direitos (LGPD)</h2>
            <p className="text-surface-600 mb-4">
              De acordo com a LGPD, voce tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Confirmacao e acesso:</strong> saber se tratamos seus dados e acessar as informacoes</li>
              <li><strong>Correcao:</strong> solicitar correcao de dados incompletos ou desatualizados</li>
              <li><strong>Anonimizacao ou exclusao:</strong> solicitar anonimizacao ou exclusao de dados desnecessarios</li>
              <li><strong>Portabilidade:</strong> solicitar a transferencia de seus dados para outro fornecedor</li>
              <li><strong>Informacao sobre compartilhamento:</strong> saber com quem seus dados sao compartilhados</li>
              <li><strong>Revogacao do consentimento:</strong> revogar o consentimento a qualquer momento</li>
              <li><strong>Oposicao:</strong> opor-se ao tratamento em determinadas situacoes</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Para exercer seus direitos, entre em contato conosco atraves do e-mail indicado ao final desta politica.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">9. Cookies e Tecnologias Similares</h2>
            <p className="text-surface-600 mb-4">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Cookies essenciais:</strong> necessarios para funcionamento da plataforma</li>
              <li><strong>Cookies de sessao:</strong> manter voce logado durante a navegacao</li>
              <li><strong>Cookies de analytics:</strong> entender como voce usa a plataforma (anonimizado)</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Voce pode gerenciar as preferencias de cookies atraves das configuracoes do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">10. Menores de Idade</h2>
            <p className="text-surface-600 mb-4">
              Nossa plataforma nao e destinada a menores de 18 anos. Se voce e menor de idade,
              deve obter autorizacao de seus pais ou responsaveis legais antes de utilizar a plataforma.
              Nao coletamos intencionalmente dados de menores sem consentimento dos responsaveis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">11. Alteracoes desta Politica</h2>
            <p className="text-surface-600 mb-4">
              Podemos atualizar esta Politica de Privacidade periodicamente. Alteracoes significativas
              serao comunicadas por e-mail ou atraves de aviso na plataforma. Recomendamos revisar
              esta pagina regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">12. Contato e Encarregado de Dados</h2>
            <p className="text-surface-600 mb-4">
              Para duvidas, solicitacoes ou exercicio de seus direitos relacionados a esta Politica
              de Privacidade e a protecao de dados, entre em contato:
            </p>
            <div className="bg-surface-50 p-4 rounded-lg mt-4">
              <p className="text-surface-700 mb-2">
                <strong>E-mail:</strong>{' '}
                <a href="mailto:privacidade@omocodoteamo.com.br" className="text-primary-600 hover:underline">
                  privacidade@omocodoteamo.com.br
                </a>
              </p>
              <p className="text-surface-700">
                <strong>Encarregado de Dados (DPO):</strong> Disponivel no e-mail acima
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">13. Autoridade Nacional de Protecao de Dados</h2>
            <p className="text-surface-600 mb-4">
              Se voce acredita que seus direitos nao foram atendidos, voce pode apresentar uma
              reclamacao a Autoridade Nacional de Protecao de Dados (ANPD):
            </p>
            <p className="text-surface-600">
              Website:{' '}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                www.gov.br/anpd
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-surface-200">
          <p className="text-sm text-surface-500 text-center">
            Ao utilizar nossa plataforma, voce concorda com esta Politica de Privacidade e com nossos{' '}
            <Link href="/termos" className="text-primary-600 hover:underline">
              Termos de Uso
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
