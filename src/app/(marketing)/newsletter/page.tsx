'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Você está na lista! 🎉');
        setEmail('');
        setName('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Algo deu errado. Tenta de novo?');
      }
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tenta de novo?');
    }
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0a0a0a;
          color: #fff;
          min-height: 100vh;
          overflow-x: hidden;
        }
      `}</style>
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
        }
        .glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .card {
          max-width: 480px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .emoji-hero {
          font-size: 64px;
          margin-bottom: 24px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .badge {
          display: inline-block;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 40px;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: 18px;
          color: #999;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .subtitle strong {
          color: #ef4444;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .arena-notice {
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.3);
          color: #fbbf24;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 24px;
          line-height: 1.5;
          text-align: center;
        }
        .arena-notice strong {
          font-weight: 700;
        }
        input {
          width: 100%;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1.5px solid #444;
          background: #1a1a1a;
          color: #fff;
          font-size: 16px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #ef4444;
          background: #1e1e1e;
        }
        input::placeholder {
          color: #888;
        }
        button {
          width: 100%;
          padding: 16px 20px;
          border-radius: 12px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }
        button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .success-box {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          color: #22c55e;
          padding: 20px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          margin-top: 8px;
        }
        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-top: 8px;
        }
        .features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 40px;
          text-align: left;
        }
        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #777;
          font-size: 14px;
        }
        .feature-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid #1a1a1a;
        }
        .stat {
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #ef4444;
        }
        .stat-label {
          font-size: 12px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .footer {
          margin-top: 48px;
          color: #333;
          font-size: 12px;
        }
        .footer a {
          color: #555;
          text-decoration: none;
        }
        @media (max-width: 480px) {
          h1 { font-size: 32px; }
          .subtitle { font-size: 16px; }
          .emoji-hero { font-size: 48px; }
        }
      `}</style>

      <div className="container">
        <div className="glow" />
        <div className="card">
          <div className="emoji-hero">❤️‍🔥</div>
          <div className="badge">Newsletter Exclusiva</div>
          <h1>Novidades do O Moço do Te Amo</h1>
          <p className="subtitle">
            Bastidores, ideias, desafios e tudo que eu não posto nas redes. 
            <strong> De graça, toda semana.</strong>
          </p>

          <div className="arena-notice">
            ⚠️ <strong>Arena Te Amo</strong> deu uma pausa e não está aceitando novos membros no momento. Inscreva-se aqui pra ficar por dentro das novidades!
          </div>

          {status === 'success' ? (
            <div className="success-box">{message}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Seu melhor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Inscrevendo...' : 'Quero receber! 🚀'}
              </button>
              {status === 'error' && <div className="error-box">{message}</div>}
            </form>
          )}

          <div className="features">
            <div className="feature">
              <span className="feature-icon">🎬</span>
              Bastidores dos vídeos e desafios
            </div>
            <div className="feature">
              <span className="feature-icon">🎁</span>
              Conteúdo exclusivo que não vai pras redes
            </div>
            <div className="feature">
              <span className="feature-icon">🚫</span>
              Sem spam. Cancela quando quiser.
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-number">40M+</div>
              <div className="stat-label">Seguidores</div>
            </div>
            <div className="stat">
              <div className="stat-number">7B+</div>
              <div className="stat-label">Views</div>
            </div>
            <div className="stat">
              <div className="stat-number">❤️</div>
              <div className="stat-label">Te Amo</div>
            </div>
          </div>

          <div style={{
            marginTop: '40px',
            padding: '20px',
            background: 'rgba(239,68,68,0.08)',
            border: '2px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
              🐛 Encontrou um bug?
            </p>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              Nos ajude a melhorar! Reporte qualquer problema que encontrar.
            </p>
            <a
              href="mailto:ilankriger@gmail.com?subject=Bug%20Report%20-%20Arena%20Te%20Amo&body=Descreva%20o%20bug%20aqui..."
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              🐛 Reportar Bug
            </a>
          </div>

          <div className="footer">
            <a href="https://instagram.com/nextleveldj" target="_blank" rel="noopener">@nextleveldj</a>
          </div>
        </div>
      </div>
    </>
  );
}
