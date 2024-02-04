import { BackGround, Border, MarginPadding, Shadow, Slider, WidthHeight } from "@types";

export type ProductGalleryStyleSetting = {
  layout?: {
    isMobile?: boolean;
    name: "Grid" | "Carousel" | "Mix";
    options?: {
      itemPerRow?: number;
      spacing?: number;
      navType?: "Thumbnail" | "Dots" | "None";
      navPosition?: "Bottom" | "Left" | "Right";
    };
  };
  itemRadius?: number;
  position?: {
    label?: string;
    type?: "Auto" | "Manual";
  };
  align?: {
    label?: string;
    type: "Left" | "Center" | "Right";
  };
  width?: {
    label?: string;
    value?: WidthHeight;
    is_on?: boolean;
  };
  background?: {
    label?: string;
    value?: BackGround;
  };
  border?: {
    label?: string;
    value?: Border;
  };
  opacity?: {
    label?: string;
    config?: Slider;
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

export type ProductGalleryStyleValue = {
  layout?: string;
  itemRadius?: number;
  position?: string;
  align?: string;
  width?: {
    unit?: string;
    value?: number;
  };
  opacity?: number;
  radius?: number;
  padding?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  margin?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  background?: {
    activeTab?: string;
    color?: {
      preset?: number;
    };
  };
};

export type ProductGalleryContentSetting = {
  photoList?: "All photos" | "Only show variant photos";
  mediaRatio?: "square" | "portrait" | "landscape";
};

export type ProductGalleryLayoutType = "Grid" | "Mix" | "Carousel";
