import { request } from './http';

export interface StatsMetricVO {
  label: string;
  value: string;
  trend: string;
}

export interface StatsRankingVO {
  rank: string;
  name: string;
  count: string;
  percent: string;
}

export interface StatsRegionRiskVO {
  label: string;
  risk: string;
  width: string;
  color: string;
}

export interface StatsSummaryVO {
  metrics: StatsMetricVO[];
  ranking: StatsRankingVO[];
  regionRisks: StatsRegionRiskVO[];
}

export function getStatsSummary() {
  return request<StatsSummaryVO>('/api/stats/summary');
}
