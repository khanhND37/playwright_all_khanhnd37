/**
 * Get data summary of promoter in affiliate partner dashboard
 */
export type DataSummary = {
  totalClick: number;
  totalRef: number;
  totalQualifiedCashback?: number;
  totalHoldCashback?: number;
  totalQualifiedItems?: number;
  totalHoldItem?: number;
  totalCashback?: number;
  totalRefInTime?: number;
};

/**
 * Get data of referee in shopbase affiliate partner dashboard
 * user: là email đăng kí account shopbase của referee, referDate: ngày sign up của referee,
 * qualifiedCashback: giá trị cashback hợp lệ, holdCashback: giá trị cashback đang bị hold
 */
export type DataRefShopBase = {
  user: string;
  referDate: string;
  qualifiedCashback: number;
  holdCashback: number;
};

/**
 * Get data of referee in printbase, plusbase affiliate partner dashboard
 * user: là email đăng kí account shopbase của referee,
 * referDate: ngày sign up của referee,
 * qualifiedItemsGB: số lượng item thuộc group gold base đã checkout hợp lệ,
 * holdItemsGB: số lượng item thuộc group gold base đã checkout đang bị hold
 * cashbackGB: là giá trị cashback mà promoter đạt được tương ứng với số item gold base hợp lệ,
 * qualifiedItemsSB: số lượng item thuộc group silver đã checkout hợp lệ,
 * holdItemsSB: số lượng item thuộc group silver base đã checkout đang bị hold
 * cashbackSB: là giá trị cashback mà promoter đạt được từ referee tương ứng với số item silver base hợp lệ,
 * totalCashback: là tổng giá trị cashback mà promoter đạt được từ referee trong cycle đã chọn
 */
export type DataRefPrintBaseOrPlusBase = {
  user?: string;
  referDate?: string;
  qualifiedItemsGB?: number;
  holdItemsGB?: number;
  cashbackGB?: number;
  qualifiedItemsSB?: number;
  holdItemsSB?: number;
  cashbackSB?: number;
  totalCashback?: number;
};

/**
 * Get value qualified items, hold items, cashback of group in printbase, plusbase affiliate partner dashboard
 */
export type ValueEachOfGroup = {
  qualifiedItems?: number;
  holdItems?: number;
  cashback?: number;
};

export type AffiliateCommission = {
  userId?: string;
  page?: number;
  limit?: number;
  email?: string;
  isSearch?: boolean;
  platform?: string;
  startDate?: number;
  endDate?: number;
  refId?: string;
  type?: string;
};
