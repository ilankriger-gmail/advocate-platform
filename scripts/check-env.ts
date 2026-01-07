#!/usr/bin/env ts-node
/**
 * Script de diagnóstico de ambiente
 *
 * Valida todas as variáveis de ambiente e conexões necessárias
 * para rodar a plataforma de Advocate Marketing.
 *
 * Uso:
 *   npm run check-env
 *   npx tsx scripts/check-env.ts
 *
 * O script verifica:
 * - Existência do arquivo .env.local
 * - Presença de todas as variáveis obrigatórias
 * - Formato válido de URLs
 * - Conexão com Supabase
 * - Conexão com Gemini API
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface CheckResult {
  success: boolean;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

interface EnvVar {
  name: string;
  required: boolean;
  type: 'url' | 'string' | 'api-key';
  description: string;
}

// ============================================================================
// CORES PARA OUTPUT (ANSI COLORS)
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// ============================================================================
// VARIÁVEIS DE AMBIENTE ESPERADAS
// ============================================================================

const expectedEnvVars: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    type: 'url',
    description: 'URL do projeto Supabase',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    type: 'api-key',
    description: 'Chave pública anônima do Supabase',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    type: 'url',
    description: 'URL pública do site',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    type: 'api-key',
    description: 'Chave de serviço do Supabase (opcional)',
  },
  {
    name: 'GEMINI_API_KEY',
    required: false,
    type: 'api-key',
    description: 'Chave da API Gemini para análise de vídeos',
  },
  {
    name: 'NEXT_PUBLIC_STORAGE_URL',
    required: false,
    type: 'url',
    description: 'URL do Supabase Storage',
  },
];

// ============================================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ============================================================================

function printHeader(text: string) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(70) + colors.reset);
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(70) + colors.reset + '\n');
}

function printSection(text: string) {
  console.log('\n' + colors.bright + colors.blue + '▶ ' + text + colors.reset);
  console.log(colors.dim + '-'.repeat(70) + colors.reset);
}

function printResult(result: CheckResult) {
  let icon: string;
  let color: string;

  switch (result.severity) {
    case 'success':
      icon = '✓';
      color = colors.green;
      break;
    case 'error':
      icon = '✗';
      color = colors.red;
      break;
    case 'warning':
      icon = '⚠';
      color = colors.yellow;
      break;
    case 'info':
      icon = 'ℹ';
      color = colors.blue;
      break;
  }

  console.log(color + icon + ' ' + result.message + colors.reset);

  if (result.suggestion) {
    console.log(colors.dim + '  → ' + result.suggestion + colors.reset);
  }
}

function printSummary(results: CheckResult[]) {
  const errors = results.filter(r => r.severity === 'error').length;
  const warnings = results.filter(r => r.severity === 'warning').length;
  const success = results.filter(r => r.severity === 'success').length;

  console.log('\n' + colors.bright + '━'.repeat(70) + colors.reset);
  console.log(colors.bright + 'RESUMO' + colors.reset);
  console.log(colors.dim + '━'.repeat(70) + colors.reset);

  console.log(colors.green + `✓ Sucessos: ${success}` + colors.reset);
  console.log(colors.yellow + `⚠ Avisos: ${warnings}` + colors.reset);
  console.log(colors.red + `✗ Erros: ${errors}` + colors.reset);

  if (errors > 0) {
    console.log('\n' + colors.bgRed + colors.bright + ' ATENÇÃO ' + colors.reset);
    console.log(colors.red + 'Existem erros críticos que impedem a execução da aplicação.' + colors.reset);
    console.log(colors.dim + 'Consulte: docs/TROUBLESHOOTING.md' + colors.reset);
  } else if (warnings > 0) {
    console.log('\n' + colors.bgYellow + colors.bright + ' AVISO ' + colors.reset);
    console.log(colors.yellow + 'Algumas funcionalidades opcionais não estão disponíveis.' + colors.reset);
    console.log(colors.dim + 'A aplicação pode rodar, mas com limitações.' + colors.reset);
  } else {
    console.log('\n' + colors.bgGreen + colors.bright + ' TUDO OK! ' + colors.reset);
    console.log(colors.green + 'Ambiente configurado corretamente. Pode executar a aplicação.' + colors.reset);
  }

  console.log('');
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

function checkEnvFileExists(): CheckResult {
  const envPath = path.join(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    return {
      success: true,
      message: 'Arquivo .env.local encontrado',
      severity: 'success',
    };
  }

  return {
    success: false,
    message: 'Arquivo .env.local não encontrado',
    suggestion: 'Copie .env.local.example para .env.local e configure suas chaves',
    severity: 'error',
  };
}

function loadEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const envVars: Record<string, string> = {};

  if (!fs.existsSync(envPath)) {
    return envVars;
  }

  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Ignorar comentários e linhas vazias
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value;
      }
    }
  } catch (error) {
    console.error('Erro ao ler .env.local:', error);
  }

  return envVars;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isPlaceholderValue(value: string): boolean {
  const placeholders = [
    'your-project.supabase.co',
    'your-anon-key',
    'your-service-role-key',
    'your-gemini-api-key',
    'localhost:3000', // Isto é válido, mas vamos avisar
  ];

  return placeholders.some(placeholder => value.includes(placeholder));
}

function checkEnvVar(envVar: EnvVar, envVars: Record<string, string>): CheckResult {
  const value = envVars[envVar.name];

  // Variável não definida
  if (!value) {
    if (envVar.required) {
      return {
        success: false,
        message: `${envVar.name} não está definida`,
        suggestion: `Configure ${envVar.description}. Consulte: docs/TROUBLESHOOTING.md#1-erros-de-variáveis-de-ambiente`,
        severity: 'error',
      };
    } else {
      return {
        success: false,
        message: `${envVar.name} não está definida (opcional)`,
        suggestion: `Esta variável é opcional, mas habilita: ${envVar.description}`,
        severity: 'warning',
      };
    }
  }

  // Verificar se é um valor placeholder
  if (isPlaceholderValue(value)) {
    return {
      success: false,
      message: `${envVar.name} contém valor de exemplo`,
      suggestion: 'Substitua pelo valor real. Consulte: docs/SETUP_SUPABASE.md',
      severity: 'error',
    };
  }

  // Validar formato de URL
  if (envVar.type === 'url' && !isValidUrl(value)) {
    return {
      success: false,
      message: `${envVar.name} não é uma URL válida`,
      suggestion: `Formato esperado: https://seu-projeto.supabase.co`,
      severity: 'error',
    };
  }

  // Validar comprimento de API key
  if (envVar.type === 'api-key' && value.length < 20) {
    return {
      success: false,
      message: `${envVar.name} parece ser muito curta`,
      suggestion: 'Verifique se copiou a chave completa',
      severity: 'warning',
    };
  }

  return {
    success: true,
    message: `${envVar.name} está configurada`,
    severity: 'success',
  };
}

async function checkSupabaseConnection(envVars: Record<string, string>): Promise<CheckResult> {
  const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      success: false,
      message: 'Não é possível testar conexão: variáveis faltando',
      severity: 'error',
    };
  }

  if (isPlaceholderValue(url) || isPlaceholderValue(key)) {
    return {
      success: false,
      message: 'Não é possível testar conexão: usando valores de exemplo',
      severity: 'error',
    };
  }

  try {
    // Testar endpoint de health do Supabase
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });

    if (response.ok || response.status === 404) {
      // 404 é ok, significa que o Supabase está acessível
      return {
        success: true,
        message: 'Conexão com Supabase estabelecida',
        severity: 'success',
      };
    }

    return {
      success: false,
      message: `Erro ao conectar com Supabase: ${response.status} ${response.statusText}`,
      suggestion: 'Verifique se as chaves estão corretas. Consulte: docs/TROUBLESHOOTING.md#31-erro-failed-to-fetch---erro-de-conexão',
      severity: 'error',
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Supabase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      suggestion: 'Verifique sua conexão com a internet e se a URL do Supabase está correta',
      severity: 'error',
    };
  }
}

async function checkGeminiConnection(envVars: Record<string, string>): Promise<CheckResult> {
  const apiKey = envVars.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      message: 'Gemini API não configurada (opcional)',
      suggestion: 'Análise automática de vídeos não estará disponível. Para configurar: docs/TROUBLESHOOTING.md#41-erro-api-gemini-não-configurada',
      severity: 'warning',
    };
  }

  if (isPlaceholderValue(apiKey)) {
    return {
      success: false,
      message: 'Gemini API usando valor de exemplo',
      suggestion: 'Configure uma chave real em: https://aistudio.google.com/app/apikey',
      severity: 'warning',
    };
  }

  try {
    // Testar conexão com Gemini API (usando uma chamada simples)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Hello',
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: 'Conexão com Gemini API estabelecida',
        severity: 'success',
      };
    }

    const errorText = await response.text();

    if (response.status === 400 && errorText.includes('API key not valid')) {
      return {
        success: false,
        message: 'Chave da Gemini API inválida',
        suggestion: 'Verifique se a chave está correta. Consulte: docs/TROUBLESHOOTING.md#43-erro-gemini-api-key-inválida',
        severity: 'error',
      };
    }

    return {
      success: false,
      message: `Erro ao conectar com Gemini API: ${response.status} ${response.statusText}`,
      suggestion: 'Verifique se a chave está correta e se você tem créditos disponíveis',
      severity: 'error',
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Gemini API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      suggestion: 'Verifique sua conexão com a internet',
      severity: 'error',
    };
  }
}

function checkStorageUrl(envVars: Record<string, string>): CheckResult {
  const storageUrl = envVars.NEXT_PUBLIC_STORAGE_URL;
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;

  if (!storageUrl) {
    if (supabaseUrl && !isPlaceholderValue(supabaseUrl)) {
      const expectedStorageUrl = `${supabaseUrl}/storage/v1`;
      return {
        success: false,
        message: 'NEXT_PUBLIC_STORAGE_URL não configurada',
        suggestion: `Configure como: ${expectedStorageUrl}`,
        severity: 'warning',
      };
    }

    return {
      success: false,
      message: 'NEXT_PUBLIC_STORAGE_URL não configurada (opcional)',
      severity: 'info',
    };
  }

  if (isPlaceholderValue(storageUrl)) {
    return {
      success: false,
      message: 'NEXT_PUBLIC_STORAGE_URL usando valor de exemplo',
      severity: 'warning',
    };
  }

  if (supabaseUrl && !isPlaceholderValue(supabaseUrl)) {
    const expectedStorageUrl = `${supabaseUrl}/storage/v1`;
    if (storageUrl !== expectedStorageUrl) {
      return {
        success: false,
        message: 'NEXT_PUBLIC_STORAGE_URL não corresponde ao projeto Supabase',
        suggestion: `Deveria ser: ${expectedStorageUrl}`,
        severity: 'warning',
      };
    }
  }

  return {
    success: true,
    message: 'NEXT_PUBLIC_STORAGE_URL configurada corretamente',
    severity: 'success',
  };
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  const results: CheckResult[] = [];

  printHeader('🔍 DIAGNÓSTICO DE AMBIENTE - ADVOCATE PLATFORM');

  // 1. Verificar se .env.local existe
  printSection('1. Verificando arquivo de configuração');
  const envFileCheck = checkEnvFileExists();
  results.push(envFileCheck);
  printResult(envFileCheck);

  if (!envFileCheck.success) {
    printSummary(results);
    process.exit(1);
  }

  // 2. Carregar variáveis de ambiente
  const envVars = loadEnvFile();

  // 3. Verificar cada variável de ambiente
  printSection('2. Verificando variáveis de ambiente');
  for (const envVar of expectedEnvVars) {
    const result = checkEnvVar(envVar, envVars);
    results.push(result);
    printResult(result);
  }

  // 4. Verificar consistência de Storage URL
  printSection('3. Verificando configurações derivadas');
  const storageCheck = checkStorageUrl(envVars);
  results.push(storageCheck);
  printResult(storageCheck);

  // 5. Testar conexão com Supabase
  printSection('4. Testando conexão com Supabase');
  console.log(colors.dim + 'Conectando...' + colors.reset);
  const supabaseCheck = await checkSupabaseConnection(envVars);
  results.push(supabaseCheck);
  printResult(supabaseCheck);

  // 6. Testar conexão com Gemini API
  printSection('5. Testando conexão com Gemini API');
  console.log(colors.dim + 'Conectando...' + colors.reset);
  const geminiCheck = await checkGeminiConnection(envVars);
  results.push(geminiCheck);
  printResult(geminiCheck);

  // 7. Mostrar resumo
  printSummary(results);

  // 8. Determinar exit code
  const hasErrors = results.some(r => r.severity === 'error');
  process.exit(hasErrors ? 1 : 0);
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main().catch((error) => {
  console.error(colors.red + 'Erro fatal ao executar diagnóstico:' + colors.reset);
  console.error(error);
  process.exit(1);
});
