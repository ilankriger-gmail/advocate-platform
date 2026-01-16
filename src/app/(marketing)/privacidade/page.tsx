import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Arena',
  description: 'Política de Privacidade e LGPD da plataforma Arena',
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
            Política de Privacidade
          </h1>
          <p className="text-surface-500">
            Última atualização: Janeiro de 2026
          </p>
          <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-lg">
            <p className="text-sm text-primary-800">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-surface max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">1. Introdução</h2>
            <p className="text-surface-600 mb-4">
              A Arena (&quot;nós&quot;, &quot;nosso&quot; ou &quot;Plataforma&quot;) está comprometida com a proteção da
              privacidade e dos dados pessoais de nossos usuários. Esta Política de Privacidade descreve
              como coletamos, usamos, armazenamos e protegemos suas informações.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">2. Dados Pessoais Coletados</h2>
            <p className="text-surface-600 mb-4">
              Coletamos os seguintes tipos de dados pessoais:
            </p>

            <h3 className="text-lg font-medium text-surface-800 mt-6 mb-3">2.1. Dados fornecidos por você:</h3>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Dados de identificação:</strong> nome completo, e-mail, telefone (WhatsApp)</li>
              <li><strong>Dados de conta:</strong> senha (armazenada de forma criptografada)</li>
              <li><strong>Dados de perfil:</strong> foto, biografia, redes sociais</li>
              <li><strong>Dados de feedback:</strong> nota NPS, comentários e avaliações</li>
            </ul>

            <h3 className="text-lg font-medium text-surface-800 mt-6 mb-3">2.2. Dados coletados automaticamente:</h3>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas</li>
              <li><strong>Dados de dispositivo:</strong> tipo de dispositivo, sistema operacional</li>
              <li><strong>Dados de uso:</strong> interações com a plataforma, participação em desafios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-surface-600 mb-4">
              Utilizamos seus dados pessoais para as seguintes finalidades:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Prestação do serviço:</strong> criar e gerenciar sua conta, permitir participação em desafios e eventos</li>
              <li><strong>Comunicação:</strong> enviar notificações sobre sua conta, desafios e recompensas</li>
              <li><strong>Melhoria do serviço:</strong> analisar uso da plataforma para aprimorar a experiência</li>
              <li><strong>Segurança:</strong> prevenir fraudes e proteger a integridade da plataforma</li>
              <li><strong>Obrigações legais:</strong> cumprir com requisitos legais e regulatórios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">4. Base Legal (LGPD)</h2>
            <p className="text-surface-600 mb-4">
              O tratamento de seus dados pessoais está fundamentado nas seguintes bases legais previstas na LGPD:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Consentimento (Art. 7, I):</strong> quando você aceita esta política e nossos termos</li>
              <li><strong>Execução de contrato (Art. 7, V):</strong> para prestação dos serviços contratados</li>
              <li><strong>Legítimo interesse (Art. 7, IX):</strong> para melhorias e segurança da plataforma</li>
              <li><strong>Cumprimento de obrigação legal (Art. 7, II):</strong> quando exigido por lei</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-surface-600 mb-4">
              Seus dados pessoais podem ser compartilhados com:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Prestadores de serviço:</strong> empresas que nos auxiliam na operação (hospedagem, e-mail, analytics)</li>
              <li><strong>Parceiros:</strong> quando necessário para entrega de recompensas</li>
              <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="text-surface-600 mt-4">
              <strong>Não vendemos seus dados pessoais</strong> para terceiros para fins de marketing ou publicidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">6. Armazenamento e Segurança</h2>
            <p className="text-surface-600 mb-4">
              Adotamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Criptografia de senhas (bcrypt)</li>
              <li>Controle de acesso restrito aos dados</li>
              <li>Monitoramento de segurança contínuo</li>
              <li>Backups regulares</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Seus dados são armazenados em servidores seguros, podendo estar localizados fora do Brasil,
              sempre em conformidade com a LGPD e acordos de transferência internacional de dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">7. Retenção de Dados</h2>
            <p className="text-surface-600 mb-4">
              Mantemos seus dados pessoais pelo tempo necessário para:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li>Enquanto sua conta estiver ativa</li>
              <li>Cumprir obrigações legais (ex: registros fiscais por 5 anos)</li>
              <li>Resolver disputas ou fazer cumprir nossos acordos</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Após o encerramento da conta, seus dados serão anonimizados ou excluídos em até 30 dias,
              exceto quando houver obrigação legal de retenção.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">8. Seus Direitos (LGPD)</h2>
            <p className="text-surface-600 mb-4">
              De acordo com a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessar as informações</li>
              <li><strong>Correção:</strong> solicitar correção de dados incompletos ou desatualizados</li>
              <li><strong>Anonimização ou exclusão:</strong> solicitar anonimização ou exclusão de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> solicitar a transferência de seus dados para outro fornecedor</li>
              <li><strong>Informação sobre compartilhamento:</strong> saber com quem seus dados são compartilhados</li>
              <li><strong>Revogação do consentimento:</strong> revogar o consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento em determinadas situações</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Para exercer seus direitos, entre em contato conosco através do e-mail indicado ao final desta política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">9. Cookies e Tecnologias Similares</h2>
            <p className="text-surface-600 mb-4">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 text-surface-600 space-y-2">
              <li><strong>Cookies essenciais:</strong> necessários para funcionamento da plataforma</li>
              <li><strong>Cookies de sessão:</strong> manter você logado durante a navegação</li>
              <li><strong>Cookies de analytics:</strong> entender como você usa a plataforma (anonimizado)</li>
            </ul>
            <p className="text-surface-600 mt-4">
              Você pode gerenciar as preferências de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">10. Menores de Idade</h2>
            <p className="text-surface-600 mb-4">
              Nossa plataforma não é destinada a menores de 18 anos. Se você é menor de idade,
              deve obter autorização de seus pais ou responsáveis legais antes de utilizar a plataforma.
              Não coletamos intencionalmente dados de menores sem consentimento dos responsáveis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">11. Alterações desta Política</h2>
            <p className="text-surface-600 mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas
              serão comunicadas por e-mail ou através de aviso na plataforma. Recomendamos revisar
              esta página regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">12. Contato e Encarregado de Dados</h2>
            <p className="text-surface-600 mb-4">
              Para dúvidas, solicitações ou exercício de seus direitos relacionados a esta Política
              de Privacidade e à proteção de dados, entre em contato:
            </p>
            <div className="bg-surface-50 p-4 rounded-lg mt-4">
              <p className="text-surface-700 mb-2">
                <strong>E-mail:</strong>{' '}
                <a href="mailto:privacidade@omocodoteamo.com.br" className="text-primary-600 hover:underline">
                  privacidade@omocodoteamo.com.br
                </a>
              </p>
              <p className="text-surface-700">
                <strong>Encarregado de Dados (DPO):</strong> Disponível no e-mail acima
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-surface-900 mb-4">13. Autoridade Nacional de Proteção de Dados</h2>
            <p className="text-surface-600 mb-4">
              Se você acredita que seus direitos não foram atendidos, você pode apresentar uma
              reclamação à Autoridade Nacional de Proteção de Dados (ANPD):
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
            Ao utilizar nossa plataforma, você concorda com esta Política de Privacidade e com nossos{' '}
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
