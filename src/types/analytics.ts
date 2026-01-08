/**
 * Tipos para Analytics Avancado
 * Inclui cohort analysis, engagement funnels, churn prediction, benchmarks e insight reports
 */

/**
 * Periodo de tempo para analise
 */
export type TimePeriod = 'weekly' | 'monthly';

/**
 * Tipo de metrica para analise de tendencia
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Nivel de risco de churn
 */
export type ChurnRiskLevel = 'low' | 'medium' | 'high';

/**
 * Tipo de insight automatico
 */
export type InsightType =
  | 'retention_improving'
  | 'retention_declining'
  | 'engagement_spike'
  | 'engagement_drop'
  | 'high_churn_risk'
  | 'funnel_bottleneck'
  | 'above_benchmark'
  | 'below_benchmark';

/**
 * Dados de um cohort especifico
 * Representa um grupo de usuarios que se registraram no mesmo periodo
 */
export interface CohortData {
  /** Identificador do cohort (ex: "2024-W01", "2024-M01") */
  cohort_id: string;

  /** Data de inicio do cohort */
  cohort_date: string;

  /** Label legivel do cohort (ex: "Semana 1 - Jan 2024") */
  cohort_label: string;

  /** Numero total de usuarios no cohort */
  size: number;

  /** Taxa de retencao por periodo (indice = numero de periodos desde registro) */
  retention_rates: number[];

  /** Usuarios ativos por periodo */
  active_users: number[];
}

/**
 * Analise completa de cohorts
 */
export interface CohortAnalysis {
  /** Periodo de analise (semanal ou mensal) */
  period: TimePeriod;

  /** Lista de cohorts ordenados por data */
  cohorts: CohortData[];

  /** Data da analise */
  analyzed_at: string;

  /** Numero total de periodos analisados */
  total_periods: number;

  /** Taxa media de retencao no primeiro periodo */
  avg_retention_period_1: number;

  /** Taxa media de retencao no terceiro periodo */
  avg_retention_period_3: number;
}

/**
 * Estagio do funil de engajamento
 */
export interface FunnelStage {
  /** Nome do estagio */
  stage: 'view' | 'participate' | 'complete' | 'return';

  /** Label legivel do estagio */
  label: string;

  /** Numero de usuarios neste estagio */
  count: number;

  /** Percentual em relacao ao estagio anterior */
  conversion_rate: number;

  /** Percentual em relacao ao total inicial */
  percentage_of_total: number;
}

/**
 * Funil de engajamento completo
 */
export interface EngagementFunnel {
  /** Estagios do funil em ordem */
  stages: FunnelStage[];

  /** Taxa de conversao total (view → return) */
  overall_conversion_rate: number;

  /** Estagio com maior drop-off */
  biggest_dropoff_stage: string;

  /** Percentual de drop-off do maior gargalo */
  biggest_dropoff_rate: number;

  /** Data da analise */
  analyzed_at: string;

  /** Periodo analisado (ultimos N dias) */
  period_days: number;
}

/**
 * Usuario com risco de churn
 */
export interface ChurnRiskUser {
  /** ID do usuario */
  user_id: string;

  /** Nome do usuario */
  full_name: string | null;

  /** Avatar do usuario */
  avatar_url: string | null;

  /** Nivel de risco */
  risk_level: ChurnRiskLevel;

  /** Score de risco (0-100, quanto maior, maior o risco) */
  risk_score: number;

  /** Data do ultimo login */
  last_login_at: string | null;

  /** Dias desde o ultimo login */
  days_since_login: number;

  /** Data da ultima atividade (post, comment, like, etc) */
  last_activity_at: string | null;

  /** Dias desde a ultima atividade */
  days_since_activity: number;

  /** Tendencia de engajamento (percentual de mudanca) */
  engagement_trend: number;

  /** Numero de atividades no periodo recente */
  recent_activity_count: number;

  /** Numero de atividades no periodo anterior */
  previous_activity_count: number;
}

/**
 * Indicadores de churn
 */
export interface ChurnIndicators {
  /** Usuarios em risco */
  at_risk_users: ChurnRiskUser[];

  /** Total de usuarios analisados */
  total_users: number;

  /** Numero de usuarios em alto risco */
  high_risk_count: number;

  /** Numero de usuarios em medio risco */
  medium_risk_count: number;

  /** Numero de usuarios em baixo risco */
  low_risk_count: number;

  /** Percentual de usuarios em risco (medio + alto) */
  overall_risk_percentage: number;

  /** Data da analise */
  analyzed_at: string;
}

/**
 * Metrica individual para benchmark
 */
export interface BenchmarkMetric {
  /** Nome da metrica */
  name: string;

  /** Label legivel da metrica */
  label: string;

  /** Valor da comunidade */
  community_value: number;

  /** Valor medio da plataforma */
  platform_average: number;

  /** Diferenca percentual (positivo = acima da media) */
  difference_percentage: number;

  /** Direcao da tendencia */
  trend: TrendDirection;

  /** Se esta acima da media */
  is_above_average: boolean;

  /** Unidade da metrica (%, count, etc) */
  unit: string;
}

/**
 * Comparacao de benchmarks
 */
export interface BenchmarkComparison {
  /** Metricas comparadas */
  metrics: BenchmarkMetric[];

  /** Numero de metricas acima da media */
  above_average_count: number;

  /** Numero de metricas abaixo da media */
  below_average_count: number;

  /** Ranking geral (percentil, ex: "Top 25%") */
  overall_ranking: string;

  /** Data da analise */
  analyzed_at: string;
}

/**
 * Insight automatico gerado
 */
export interface AutomatedInsight {
  /** Tipo do insight */
  type: InsightType;

  /** Titulo do insight */
  title: string;

  /** Descricao detalhada */
  description: string;

  /** Nivel de importancia (1-5) */
  importance: number;

  /** Metrica relacionada */
  metric_name: string;

  /** Valor da metrica */
  metric_value: number;

  /** Mudanca percentual (se aplicavel) */
  change_percentage?: number;

  /** Recomendacao de acao */
  recommendation?: string;
}

/**
 * Relatorio de insights completo
 */
export interface InsightReport {
  /** ID do relatorio */
  report_id: string;

  /** Periodo do relatorio */
  period: TimePeriod;

  /** Data de inicio do periodo */
  period_start: string;

  /** Data de fim do periodo */
  period_end: string;

  /** Data de geracao do relatorio */
  generated_at: string;

  /** Resumo executivo */
  summary: {
    total_users: number;
    active_users: number;
    new_users: number;
    churned_users: number;
    engagement_rate: number;
    retention_rate: number;
  };

  /** Insights automaticos gerados */
  insights: AutomatedInsight[];

  /** Analise de cohort resumida */
  cohort_summary?: {
    total_cohorts: number;
    avg_retention: number;
    best_cohort_id: string;
    worst_cohort_id: string;
  };

  /** Funil de engajamento resumido */
  funnel_summary?: {
    total_views: number;
    conversion_rate: number;
    bottleneck_stage: string;
  };

  /** Risco de churn resumido */
  churn_summary?: {
    at_risk_count: number;
    risk_percentage: number;
    high_risk_count: number;
  };

  /** Benchmarks resumidos */
  benchmark_summary?: {
    above_average_metrics: number;
    overall_ranking: string;
  };
}

/**
 * Parametros para geracao de relatorio
 */
export interface ReportGenerationParams {
  /** Periodo do relatorio */
  period: TimePeriod;

  /** Data de inicio customizada (opcional) */
  start_date?: string;

  /** Data de fim customizada (opcional) */
  end_date?: string;

  /** Incluir analise de cohort */
  include_cohort?: boolean;

  /** Incluir funil de engajamento */
  include_funnel?: boolean;

  /** Incluir indicadores de churn */
  include_churn?: boolean;

  /** Incluir benchmarks */
  include_benchmarks?: boolean;
}

/**
 * Configuracoes de email de relatorio
 */
export interface ReportEmailSettings {
  /** Email habilitado */
  enabled: boolean;

  /** Frequencia (semanal ou mensal) */
  frequency: TimePeriod;

  /** Dia da semana para envio (1-7, 1 = Segunda) */
  day_of_week?: number;

  /** Dia do mes para envio (1-31) */
  day_of_month?: number;

  /** Lista de emails destinatarios */
  recipients: string[];

  /** Incluir PDF em anexo */
  include_pdf: boolean;
}

/**
 * Formato de exportacao de relatorio
 */
export type ExportFormat = 'pdf' | 'csv' | 'json';

/**
 * Parametros para exportacao de relatorio
 */
export interface ReportExportParams {
  /** ID do relatorio para exportar */
  report_id: string;

  /** Formato de exportacao */
  format: ExportFormat;

  /** Incluir graficos (apenas PDF) */
  include_charts?: boolean;
}
