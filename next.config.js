/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover console.log em produção para melhor performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Manter console.error e console.warn
    } : false,
  },
  // Configuração para permitir imagens do Supabase Storage e Google
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // Rewrite para subdomínio comece.omocodoteamo.com.br mostrar a landing page
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/seja-arena',
          has: [{ type: 'host', value: 'comece.omocodoteamo.com.br' }],
        },
      ],
    };
  },
  async headers() {
    return [
      {
        // Aplicar headers de segurança em todas as rotas
        source: '/:path*',
        headers: [
          {
            // X-Frame-Options: Previne clickjacking ao impedir que a página seja renderizada em frames
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // X-Content-Type-Options: Previne MIME type sniffing, forçando o navegador a respeitar o Content-Type declarado
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Referrer-Policy: Controla quanto de informação do referrer é enviado em requisições cross-origin
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // X-XSS-Protection: Ativa proteção XSS do navegador (legacy, mas ainda útil para navegadores antigos)
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Strict-Transport-Security (HSTS): Força o navegador a usar apenas HTTPS
            // max-age=31536000: Instrui o navegador a lembrar por 1 ano (31536000 segundos)
            // includeSubDomains: Aplica HTTPS também a todos os subdomínios
            // preload: Permite inclusão na lista de preload dos navegadores
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            // Permissions-Policy: Controla quais recursos e APIs do navegador podem ser acessados
            // camera=(): Desabilita acesso à câmera
            // microphone=(): Desabilita acesso ao microfone
            // geolocation=(): Desabilita acesso à geolocalização
            // payment=(): Desabilita API de pagamentos
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            // Content-Security-Policy (CSP): Define políticas de segurança para recursos carregados pela página
            // Previne XSS e injeção de código malicioso ao controlar quais recursos podem ser carregados
            //
            // NOTA DE SEGURANCA: 'unsafe-inline' e 'unsafe-eval' sao necessarios para Next.js funcionar.
            // Em projetos futuros, considerar implementar nonces (requer middleware customizado).
            // Mitigacoes atuais: DOMPurify para sanitizacao HTML, RLS para dados, validacao de inputs.
            key: 'Content-Security-Policy',
            value: [
              // default-src 'self': Por padrão, permite carregar recursos apenas da mesma origem
              "default-src 'self'",
              // script-src: Controla de onde scripts podem ser carregados
              // 'self': Scripts da mesma origem
              // 'unsafe-inline': Permite scripts inline (necessário para Next.js)
              // 'unsafe-eval': Permite eval() (necessário para Next.js)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // style-src: Controla de onde estilos podem ser carregados
              // 'self': Estilos da mesma origem
              // 'unsafe-inline': Permite estilos inline (necessário para Tailwind CSS e styled-components)
              "style-src 'self' 'unsafe-inline'",
              // img-src: Controla de onde imagens podem ser carregadas
              // 'self': Imagens da mesma origem
              // data:: Permite data URIs (imagens base64)
              // blob:: Permite blob URLs (usado para preview de uploads)
              // https://*.supabase.co: Permite imagens do Supabase Storage
              // https://*.googleusercontent.com: Permite avatares do Google
              "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://img.youtube.com https://i.ytimg.com",
              // connect-src: Controla para onde a aplicação pode fazer requisições (fetch, XHR, WebSocket)
              // 'self': Requisições para a mesma origem
              // https://*.supabase.co: Permite conexões com API do Supabase
              // wss://*.supabase.co: Permite WebSocket connections do Supabase Realtime
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              // font-src: Controla de onde fontes podem ser carregadas
              // 'self': Fontes da mesma origem
              // data:: Permite fontes em data URIs
              "font-src 'self' data:",
              // object-src: Controla de onde plugins (Flash, Java, etc.) podem ser carregados
              // 'none': Bloqueia completamente o carregamento de plugins (melhor prática de segurança)
              "object-src 'none'",
              // base-uri: Controla quais URLs podem ser usadas na tag <base>
              // 'self': Restringe a tag <base> apenas para URLs da mesma origem
              // Previne ataques de injeção de base que podem redirecionar recursos
              "base-uri 'self'",
              // form-action: Controla para onde formulários podem submeter dados
              // 'self': Permite submit apenas para a mesma origem
              // Previne que formulários sejam modificados para enviar dados para domínios maliciosos
              "form-action 'self'",
              // frame-ancestors: Controla onde esta página pode ser incorporada em frames
              // 'none': Previne que a página seja incorporada em iframes (proteção contra clickjacking)
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;