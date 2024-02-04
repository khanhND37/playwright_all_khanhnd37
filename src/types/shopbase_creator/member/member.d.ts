export type Member = {
  avatar: string;
  name: string;
  email: string;
  addDate: string;
  lastSignIn: string;
};

export type MemberDetail = {
  email?: string;
  first_name?: string;
  last_name?: string;
  note?: string;
  phone?: string;
  tags?: string;
  country?: string;
  not_send_email?: boolean;
};

export type MemberDetailImageAndDescription = {
  imageAvatar: string;
  imageLastActivity: string;
  imageSales: string;
  imageOrders: string;
  imageProductAccessEmpty: string;
  descriptionProductAccessEmpty: string;
  imageRecentOrderEmpty: string;
  descriptionOrderEmpty: string;
};
