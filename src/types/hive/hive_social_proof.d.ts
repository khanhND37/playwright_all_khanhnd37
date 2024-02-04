export type SocialProofFormData = {
  name?: string;
  display_time?: string;
  waiting_time?: string;
  delay_time?: string;
  data_content: SocialContentFormData[];
};

export type SocialContentFormData = {
  title?: string;
  content?: string;
  time?: string;
  image?: string;
  link?: string;
};
