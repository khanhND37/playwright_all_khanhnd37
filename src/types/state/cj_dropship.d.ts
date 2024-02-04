export type CJDropshipping = {
  pid: string;
  productNameEn: string;
  productSku: string;
  productImage: string;
  productWeight: number;
  productType: string;
  categoryId: string;
  categoryName: string;
  entryNameEn: string;
  packingWeight: number;
  productKeyEn: string;
  sellPrice: string;
  sourceFrom: 1;
  description: string;
  suggestSellPrice: string;
  listedNum: number;
  supplierName: string;
  supplierId: string;
  variants: Array<Varriants>;
};

export type Varriants = {
  vid: string;
  pid: string;
  variantName: string;
  variantNameEn: string;
  variantSku: string;
  variantUnit: string;
  variantProperty: string;
  variantKey: string;
  variantLength: number;
  variantWidth: number;
  variantHeight: number;
  variantVolume: number;
  variantWeight: number;
  variantSellPrice: number;
  createTime: string;
  variantStandard: string;
  variantSugSellPrice: number;
};

export type ShippingFeeCJ = {
  logisticPrice: number;
};

export type DataShipping = {
  startCountryCode: string;
  endCountryCode: string;
  products: Array<ProductCJ>;
};

export type ProductCJ = {
  quantity: 1;
  vid: string;
};
