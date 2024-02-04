import { roundingTwoDecimalPlaces } from "@core/utils/string";

export class GlobalCurrency {
  readonly country: string;
  readonly marketCurrency: string;
  readonly storeCurrency: string;
  readonly exchangeRate: number;
  readonly priceAdjustment: number;
  readonly rounding: number;

  constructor(
    country: string,
    storeCurrency: string,
    marketCurrency: string,
    exchangeRate: number,
    priceAdjustment: number,
    rounding: number,
  ) {
    this.country = country;
    this.storeCurrency = storeCurrency;
    this.marketCurrency = marketCurrency;
    this.exchangeRate = exchangeRate;
    this.priceAdjustment = priceAdjustment;
    this.rounding = rounding;
  }

  static async GetGlobalCurrencyFromDashboardApi(
    country: string,
    storeCurrency?: string,
    marketCurrency?: string,
    exchangeRate?: number,
    priceAdjustment?: number,
    rounding?: number,
  ): Promise<GlobalCurrency> {
    return new GlobalCurrency(country, storeCurrency, marketCurrency, exchangeRate, priceAdjustment, rounding);
  }

  calculateExpectedProdPrice(originProdPrice): number {
    return this.roundingProductPrice(
      originProdPrice * this.exchangeRate * (1 + this.priceAdjustment / 100),
      this.rounding,
    );
  }

  roundingProductPrice(prodPrice: number, roundingVal: number) {
    const differ = prodPrice - Math.floor(prodPrice);
    if (roundingVal === 0) {
      return roundingTwoDecimalPlaces(prodPrice);
    } else if (roundingVal > differ) {
      return Math.floor(prodPrice) + roundingVal;
    }
    return Math.floor(prodPrice) + 1 + roundingVal;
  }
}
