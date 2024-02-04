export type SizeChart = {
  description_html?: string;
  description_inc?: string;
  id?: number;
  image_url?: string;
  shop_id?: number;
  style?: string;
  tag?: string;
};

export type Settings = {
  enable: boolean;
};
export type ListSizeChart = {
  data: SizeChart[];
  settings: Settings;
};

export type DataSizeChart = {
  tag?: string;
  style: string;
  description_html?: string;
  image_url?: string;
  title?: string;
  description_inc?: string;
  shop_id?: number;
  id?: number;
};

export type BodyAPIChartInSf = {
  id: number;
  tags: string;
  use_setting: boolean;
};

export interface ChartResponseInSf {
  code: number;
  messages: null;
  result: ResultAPI;
}

export type ResultAPI = {
  has_size_chart: boolean;
  chart: Chart;
};

export type Chart = {
  id: number;
  title: string;
  image: string;
  description: string;
  option_id: number;
  option_name: string;
  option_ids: number[];
  shop_id: number;
};
