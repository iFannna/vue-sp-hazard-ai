import { request } from './http';

export interface OptionVO {
  value: number;
  label: string;
}

export interface PlatformOptionsVO {
  dataSources: OptionVO[];
  sites: OptionVO[];
  modelVersions: OptionVO[];
  hazardLevels: OptionVO[];
}

export function getPlatformOptions() {
  return request<PlatformOptionsVO>('/api/platform/options');
}
