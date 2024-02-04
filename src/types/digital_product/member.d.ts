/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type MemberListInfo = {
  title: string;
  btnImport: boolean;
  btnExport: boolean;
  btnAdd: boolean;
  txtSearch: boolean;
  btnSort: boolean;
  btnFilter: boolean;
  titleColumn: string;
  memberPage1: number;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type ValueDefault = {
  img: string;
  value: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type Param = {
  limit?: number;
  page?: number;
  keyword?: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type Info = {
  avatar: string;
  name: string;
  email: string;
  sale: string;
  addDate: string;
  lastSignIn: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type MemberInfo = Array<Info>;

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type OptionExportOld = {
  option: string;
  file: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type ProgressPopup = {
  title: string;
  content: string;
  btnClose: boolean;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type InputMemberInfo = {
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  note?: string;
  zipCode?: string;
  phone?: string;
  tag?: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type DetailInfo = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  countryCode: string;
  phone: string;
  totalSale: number;
  totalOrder: number;
  tag: string;
  note: string;
};
