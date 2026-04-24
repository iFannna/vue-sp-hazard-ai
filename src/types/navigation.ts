export interface NavItem {
  label: string;
  name: string;
  path: string;
  permission?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface AppRouteMeta {
  title: string;
  subtitle?: string;
  permission?: string;
}
