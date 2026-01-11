/**
 * Validação de Arquivos - Magic Bytes
 *
 * Valida o conteúdo real de arquivos verificando os magic bytes (primeiros bytes)
 * para prevenir upload de arquivos maliciosos disfarçados como imagens.
 *
 * IMPORTANTE: Nunca confie apenas no MIME type fornecido pelo cliente.
 * Atacantes podem facilmente modificar file.type para falsificar o tipo de arquivo.
 */

/**
 * Assinaturas de magic bytes para formatos de imagem suportados
 * Cada formato tem uma sequência única de bytes no início do arquivo
 */
export const MAGIC_BYTES = {
  // JPEG: FF D8 FF
  jpeg: {
    signatures: [
      [0xFF, 0xD8, 0xFF],
    ],
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['jpg', 'jpeg'],
  },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: {
    signatures: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    ],
    mimeTypes: ['image/png'],
    extensions: ['png'],
  },
  // GIF: 47 49 46 38 37 61 (GIF87a) ou 47 49 46 38 39 61 (GIF89a)
  gif: {
    signatures: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    mimeTypes: ['image/gif'],
    extensions: ['gif'],
  },
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  // Os primeiros 4 bytes são "RIFF" e os bytes 8-11 são "WEBP"
  webp: {
    signatures: [
      [0x52, 0x49, 0x46, 0x46], // Primeiros 4 bytes "RIFF"
    ],
    // Verificação adicional: bytes 8-11 devem ser "WEBP"
    webpSignature: [0x57, 0x45, 0x42, 0x50], // "WEBP" na posição 8-11
    mimeTypes: ['image/webp'],
    extensions: ['webp'],
  },
  // ICO: 00 00 01 00 (Windows Icon)
  ico: {
    signatures: [
      [0x00, 0x00, 0x01, 0x00],
    ],
    mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon'],
    extensions: ['ico'],
  },
  // SVG: texto XML que contém tag <svg
  // SVG é especial pois é baseado em texto, não em bytes binários
  svg: {
    signatures: [], // SVG usa validação de texto
    mimeTypes: ['image/svg+xml'],
    extensions: ['svg'],
  },
} as const;

export type SupportedImageFormat = keyof typeof MAGIC_BYTES;

export interface FileValidationResult {
  valid: boolean;
  detectedFormat?: SupportedImageFormat;
  detectedMimeType?: string;
  error?: string;
}

/**
 * Verifica se um array de bytes corresponde a uma assinatura de magic bytes
 */
function matchesSignature(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Valida se um arquivo SVG é válido e seguro
 * SVG é texto XML, então verificamos a presença da tag <svg
 */
async function validateSVG(file: File): Promise<boolean> {
  try {
    const text = await file.text();

    // Verificar se é texto válido
    if (!text || text.length === 0) {
      return false;
    }

    // Verificar se contém tag SVG (case insensitive)
    // Aceita <?xml e <svg em qualquer ordem, com possíveis espaços/quebras
    const hasSvgTag = /<svg[\s>]/i.test(text);

    if (!hasSvgTag) {
      return false;
    }

    // Verificações de segurança básicas para prevenir SVG malicioso
    // Bloquear scripts embutidos
    const hasScript = /<script/i.test(text);
    const hasOnEvent = /on\w+\s*=/i.test(text); // onclick, onload, etc
    const hasJavascript = /javascript:/i.test(text);

    if (hasScript || hasOnEvent || hasJavascript) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Valida o conteúdo real de um arquivo verificando seus magic bytes
 *
 * @param file - Arquivo a ser validado
 * @param allowedFormats - Formatos permitidos (opcional, padrão: todos)
 * @returns Resultado da validação com formato detectado
 *
 * @example
 * const result = await validateFileMagicBytes(file, ['jpeg', 'png']);
 * if (!result.valid) {
 *   return { error: result.error };
 * }
 */
export async function validateFileMagicBytes(
  file: File,
  allowedFormats?: SupportedImageFormat[]
): Promise<FileValidationResult> {
  try {
    // Verificar se o arquivo foi fornecido
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo fornecido' };
    }

    // SVG é caso especial pois é texto
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const isSvgValid = await validateSVG(file);

      if (!isSvgValid) {
        return {
          valid: false,
          error: 'Arquivo SVG inválido ou contém conteúdo malicioso',
        };
      }

      // Verificar se SVG está nos formatos permitidos
      if (allowedFormats && !allowedFormats.includes('svg')) {
        return {
          valid: false,
          error: 'Formato SVG não é permitido neste upload',
        };
      }

      return {
        valid: true,
        detectedFormat: 'svg',
        detectedMimeType: 'image/svg+xml',
      };
    }

    // Para arquivos binários, ler os primeiros bytes
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Precisamos de pelo menos 12 bytes para validar WebP
    if (bytes.length < 12) {
      return {
        valid: false,
        error: 'Arquivo muito pequeno para ser uma imagem válida',
      };
    }

    // Verificar cada formato suportado
    for (const [format, config] of Object.entries(MAGIC_BYTES)) {
      if (format === 'svg') continue; // Já tratado acima

      // Verificar cada assinatura possível do formato
      for (const signature of config.signatures) {
        if (matchesSignature(bytes, signature)) {
          // Para WebP, verificar também a assinatura WEBP na posição 8-11
          if (format === 'webp') {
            const webpSig = MAGIC_BYTES.webp.webpSignature;
            const webpBytes = bytes.slice(8, 12);

            if (!matchesSignature(webpBytes, webpSig)) {
              continue; // Não é WebP, pode ser outro formato RIFF
            }
          }

          // Formato detectado! Verificar se está nos permitidos
          if (allowedFormats && !allowedFormats.includes(format as SupportedImageFormat)) {
            return {
              valid: false,
              detectedFormat: format as SupportedImageFormat,
              detectedMimeType: config.mimeTypes[0],
              error: `Formato ${format.toUpperCase()} não é permitido neste upload`,
            };
          }

          return {
            valid: true,
            detectedFormat: format as SupportedImageFormat,
            detectedMimeType: config.mimeTypes[0],
          };
        }
      }
    }

    // Nenhum magic byte reconhecido
    return {
      valid: false,
      error: 'Tipo de arquivo não reconhecido ou inválido. Apenas imagens são permitidas.',
    };
  } catch (error) {
    return {
      valid: false,
      error: `Erro ao validar arquivo: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    };
  }
}

/**
 * Retorna o tipo MIME real baseado nos magic bytes detectados
 *
 * @param file - Arquivo a ser analisado
 * @returns MIME type detectado ou null se inválido
 *
 * @example
 * const mimeType = await getFileTypeFromMagicBytes(file);
 * if (!mimeType) {
 *   return { error: 'Arquivo inválido' };
 * }
 */
export async function getFileTypeFromMagicBytes(file: File): Promise<string | null> {
  const result = await validateFileMagicBytes(file);

  if (!result.valid || !result.detectedMimeType) {
    return null;
  }

  return result.detectedMimeType;
}

/**
 * Valida se o MIME type declarado corresponde ao conteúdo real do arquivo
 *
 * @param file - Arquivo a ser validado
 * @returns true se o MIME type declarado corresponde ao real, false caso contrário
 *
 * @example
 * const isValid = await validateMimeTypeMatch(file);
 * if (!isValid) {
 *   return { error: 'Arquivo disfarçado detectado' };
 * }
 */
export async function validateMimeTypeMatch(file: File): Promise<boolean> {
  const detectedMimeType = await getFileTypeFromMagicBytes(file);

  if (!detectedMimeType) {
    return false;
  }

  // Normalizar MIME types para comparação
  const declaredType = file.type.toLowerCase();

  // Encontrar o formato baseado no MIME type detectado
  for (const config of Object.values(MAGIC_BYTES)) {
    const mimeTypes = config.mimeTypes as readonly string[];
    if (mimeTypes.includes(detectedMimeType)) {
      // Verificar se o tipo declarado também está na lista de tipos válidos
      return mimeTypes.some(mime => mime === declaredType);
    }
  }

  return false;
}
