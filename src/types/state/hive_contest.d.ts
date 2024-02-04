export type Prize = {
  threshold: number;
  prize: string;
};

export type Metrics = {
  metric_type: string;
  data?: Metric[];
};
export type Metric = {
  condition: string;
  value: number;
};

export type ContestUI = {
  pre_contest: Contest;
  in_contest: Contest;
  after_contest: Record<string, Contest>;
};

export type TextSettings = {
  message: string;
  size: number;
  color: string;
};
export type Contest = {
  template: string;
  message_header: TextSettings;
  message_subtext?: TextSettings;
  learn_more_btn?: BtnSettings;
  link?: TextSettings;
  learn_more_link?: string;
  box_color?: string;
};

export type BtnSettings = {
  size: number;
  primary_color: string;
  secondary_color: string;
  link: string;
};
