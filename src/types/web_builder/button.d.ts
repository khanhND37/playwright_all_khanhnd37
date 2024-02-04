export type ButtonContentSetting = {
  label?: string;
  action?: string;
  popup?: string;
};

export type InsertButtonWithSetting = {
  position?: {
    section?: number;
    row?: number;
    column?: number;
  };
  contentSetting: ButtonContentSetting;
};
