export type Widget = {
  id: number;
  tabs: Tabs;
};

export type Tabs = {
  logic: LogicTab;
  ui: UITab;
};

export type LogicTab = {
  name: string;
  status: boolean;
  screen: string;
  business_types?: string[];
  regions?: string[];
  packages?: string[];
};
export type UITab = {
  widget_type: string;
  title: string;
  description?: string;
  primary_button?: AryButton;
  secondary_button?: AryButton;
  image?: string;
  childs?: Child[];
};

export type Child = {
  title: string;
  descripition?: string;
  link?: string;
  image_url?: string;
};

export type AryButton = {
  text?: string;
  link?: string;
};
