export type MembersAPIResponse = {
  data: Array<MemberDetailAPI>;
  _metadata: MemberMetaData;
  success: boolean;
};

export type MemberBody = {
  email: string;
  first_name?: string;
  last_name?: string;
  note?: string;
  phone?: string;
  calling_code?: string;
  tags?: string;
  country_id?: string;
};

export type MemberMetaData = {
  limit: number;
  page: number;
  page_count?: number;
  total_count?: number;
};

export type MemberDetailAPI = {
  calling_code?: string;
  created_at?: string;
  email: string;
  first_name?: string;
  id: number;
  last_name?: string;
  last_signed_in?: number;
  state?: string;
  avatar?: string;
  total_spent?: number;
  phone: string;
  tag: string;
  note: string;
};

export type MemberProductAccess = {
  shop_id: number;
  member_id: number;
  product_ids: string;
};

export type ResponseMember = {
  data: ResponseMemberDetail;
};

export type ResponseMemberDetail = {
  country_id: number;
  customer: ResponseCustomerAPI;
};

export type ResponseCustomerAPI = {
  email: string;
  first_name: string;
  last_name: string;
  note: string;
  calling_code: string;
  phone: string;
  tags: string;
};
