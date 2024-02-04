import { BackGround, Border, MarginPadding, Shadow, Slider, WidthHeight } from "@types";
import { Locator } from "@playwright/test";

export type PopupStylePosition = {
  position?: number;
  push_page_down?: boolean;
};
export type PopupStyle = {
  position?: PopupStylePosition;
  overlay?: number;
  width?: {
    label?: string;
    value?: WidthHeight;
  };
  height?: {
    label?: string;
    value?: WidthHeight;
  };
  background?: {
    label?: string;
    value?: BackGround;
  };
  border?: {
    label?: string;
    value?: Border;
  };
  radius?: {
    label?: string;
    config?: Slider;
  };
  shadow?: {
    label?: string;
    config?: Shadow;
  };
  padding?: {
    label?: string;
    value?: MarginPadding;
  };
  margin?: {
    label?: string;
    value?: MarginPadding;
  };
};

export type PopupContentSetting = {
  name?: string;
  icon?: string;
  close_button?: "none" | "line" | "ellipse" | "rectangle";
  trigger?: {
    type: "Delay" | "Page scroll" | "Exit intent" | "Mouse click";
    value?: number;
  };
  customer_trigger?: {
    type: "All Customers" | "New Visitors" | "Returning visitor";
    after_leave?: "Immediate" | "1 day" | "1 week" | "Custom";
    returning_time?: number;
  };
};

export type PopupSfLocators = {
  popup: Locator;
  closeButton: Locator;
  overlay: Locator;
  triggerButton?: Locator;
};

export type PopupSettings = {
  style?: PopupStyle;
  content?: PopupContentSetting;
  paragraph?: string;
  button?: {
    label: string;
    action: "Close current popup" | "Open a pop-up";
  };
};
