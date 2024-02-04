export type OnboardFormData = {
  name?: string;
  store_type?: string;
  priority?: string;
  country?: string;
  status?: string;
  shop_id?: string;
  group_question?: GroupQuestion;
  data_content?: DataContent;
};

export type GroupQuestion = {
  condition?: string;
  content_question?: ContentQuestion[];
};

export type DataContent = {
  language?: string;
  onboard1?: ContentOnboard;
  onboard2?: ContentOnboard;
};
export type ContentQuestion = {
  questions?: Question[];
  condition?: string;
};
export type Question = {
  question?: string;
  condition?: string;
  answer?: string;
};
export type ContentOnboard = {
  onboard_title?: string;
  onboard_item_form_data?: OnboardItemFormData[];
};
export type OnboardItemFormData = {
  event?: string;
  title?: string;
  icon?: string;
  progress_bar_desc?: string;
  content?: Content;
  content_after_done: Content;
};
export type Content = {
  title?: string;
  desc?: string;
  button?: string;
  secondary_button?: string;
  link1?: string;
  link2?: string;
  Image?: string;
};

export type OnboardingQuestion = {
  question: string;
  answers: string[];
};
