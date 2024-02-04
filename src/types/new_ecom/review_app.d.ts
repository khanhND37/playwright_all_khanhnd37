export type ContentAlertWarning = {
  title: string;
  text: string;
};

export type ImportReview = {
  type: "AliExpress" | "CSV file";
  fileName: string;
};

export type paramCountRviews = {
  review_type?: string;
  product_id?: number;
};

export type filterReview = {
  filter?: string;
  per_page?: string;
};

export type settingReviewRating = {
  icon?: "Star" | "Star Rounded" | "Heart";
  rating_color?: {
    preset: number;
    hexText?: string;
    colorBar?: number;
    palette?: {
      left: number;
      top: number;
    };
  };
};
