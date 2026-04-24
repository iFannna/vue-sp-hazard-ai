import { request } from './http';

export interface DashboardMetricVO {
  label: string;
  value: string;
  trend: string;
}

export interface DashboardTaskStatusVO {
  label: string;
  count: number;
  color: string;
}

export interface DashboardDistributionVO {
  label: string;
  percent: string;
  width: string;
  color: string;
}

export interface DashboardSystemStatusVO {
  label: string;
  value: string;
  tagType: 'success' | 'warning' | 'primary' | 'danger';
}

export interface DashboardLatestTaskVO {
  code: string;
  type: string;
  status: string;
  tagType: 'success' | 'warning' | 'primary' | 'danger';
}

export interface DashboardSummaryVO {
  metrics: DashboardMetricVO[];
  taskStatus: DashboardTaskStatusVO[];
  hazardDistribution: DashboardDistributionVO[];
  systemStatus: DashboardSystemStatusVO[];
  latestTasks: DashboardLatestTaskVO[];
}

export function getDashboardSummary() {
  return request<DashboardSummaryVO>('/api/dashboard/summary');
}
