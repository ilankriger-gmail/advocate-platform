/**
 * Utilitários para exportação de dados
 */

/**
 * Converte array de objetos para CSV
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  // Se headers não fornecidos, usar as chaves do primeiro objeto
  const keys = headers
    ? headers.map(h => h.key)
    : (Object.keys(data[0]) as (keyof T)[]);

  const headerLabels = headers
    ? headers.map(h => h.label)
    : keys.map(String);

  // Criar linhas do CSV
  const rows = data.map(item =>
    keys.map(key => {
      const value = item[key];
      // Escapar aspas e valores com vírgula
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  return [headerLabels.join(','), ...rows].join('\n');
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM para Excel
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados formatados como CSV e faz download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  const csv = arrayToCSV(data, headers);
  downloadCSV(csv, filename);
}

/**
 * Formata data para nome de arquivo
 */
export function formatDateForFilename(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Converte dados de cohort para formato exportável
 */
export function formatCohortDataForExport(
  cohorts: Array<{
    cohort_label?: string;
    cohort_date: string;
    size: number;
    retention_rates: number[];
  }>
): Array<Record<string, string | number>> {
  return cohorts.map(cohort => {
    const row: Record<string, string | number> = {
      cohort: cohort.cohort_label || cohort.cohort_date,
      usuarios: cohort.size,
    };

    // Adicionar taxas de retenção
    cohort.retention_rates.forEach((rate, index) => {
      row[`periodo_${index}`] = `${rate.toFixed(1)}%`;
    });

    return row;
  });
}

/**
 * Converte dados de tendência para formato exportável
 */
export function formatTrendDataForExport(
  data: Array<{
    date: string;
    posts: number;
    challenges: number;
    events: number;
    newUsers: number;
  }>
): Array<Record<string, string | number>> {
  return data.map(day => ({
    data: new Date(day.date).toLocaleDateString('pt-BR'),
    posts: day.posts,
    desafios: day.challenges,
    eventos: day.events,
    novos_usuarios: day.newUsers,
  }));
}

/**
 * Converte dados de segmento para formato exportável
 */
export function formatSegmentDataForExport(
  segments: Array<{
    name: string;
    count: number;
    percentage: number;
  }>,
  category: string
): Array<Record<string, string | number>> {
  return segments.map(segment => ({
    categoria: category,
    segmento: segment.name,
    usuarios: segment.count,
    percentual: `${segment.percentage.toFixed(1)}%`,
  }));
}
