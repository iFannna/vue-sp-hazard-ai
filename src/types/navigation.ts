export interface NavItem {
  label: string;
  name: string;
  path: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface AppRouteMeta {
  title: string;
  subtitle?: string;
}
