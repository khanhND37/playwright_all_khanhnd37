import { APIRequestContext, Page, expect } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { GlobalMarketData, Market, MarketList } from "src/types/settings/global-market";

import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

export type dataCurrencyOfCountry = {
  exchangeRateAuto: number;
  isRouding: boolean;
  rounding: number;
  priceAddjustment: number;
};
export class GlobalMarketListPage extends DashboardPage {
  request: APIRequestContext;
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathPageList = {
    actionButton: {
      domains: "//button[normalize-space()='Domains']",
      addMarket: "//button[normalize-space()='Add market']",
    },
    descriptionText: "//div[contains(@class, 'sb-description')]//div[contains(@class, 'sb-more-content')]",
    table: {
      heading: (heading: "Primary Market" | "Other Markets") =>
        `//div[@role='tab' and contains(normalize-space(), '${heading}')]`,
      marketRows: (tabId: string) => `//div[@id='${tabId}']//tr[@class='sb-table__row']`,
    },
  };
  tableIndex = {
    country: 0,
    currency: 1,
    status: 2,
  };

  async clickActionButton(type: "domains" | "add market") {
    let xpath;

    switch (type) {
      case "domains":
        xpath = this.xpathPageList.actionButton.domains;
        break;
      case "add market":
        xpath = this.xpathPageList.actionButton.addMarket;
        break;
      default:
        logger.info("Wrong button type");
        throw new Error("wrong button type");
    }

    await this.page.click(xpath);
  }

  async getPrimaryMarket(): Promise<GlobalMarketData> {
    const tableId = await this.genLoc(this.xpathPageList.table.heading("Primary Market")).getAttribute("aria-controls");
    // primary market only have 1 row
    const marketRows = this.genLoc(this.xpathPageList.table.marketRows(tableId)).first();

    const marketColumns = await marketRows.locator("td").all();
    if (!marketColumns || marketColumns.length !== 3) {
      logger.info("Wrong market data");
      throw new Error("Wrong market data");
    }

    const country = await marketColumns[this.tableIndex.country].textContent();
    const currency = await marketColumns[this.tableIndex.currency].textContent();
    const status = await marketColumns[this.tableIndex.status].textContent();

    return {
      CountryOrRegion: country.trim(),
      CurrencyAndPricing: currency.trim(),
      Status: status.trim() === "Active",
    };
  }

  async getOtherMarkets(): Promise<GlobalMarketData[]> {
    const tableId = await this.genLoc(this.xpathPageList.table.heading("Other Markets")).getAttribute("aria-controls");
    // primary market only have 1 row
    const marketRows = await this.genLoc(this.xpathPageList.table.marketRows(tableId)).all();

    const markets: GlobalMarketData[] = [];
    for (let i = 0; i < marketRows.length; i++) {
      const marketRow = marketRows[i];
      const marketColumns = await marketRow.locator("td").all();
      if (!marketColumns || marketColumns.length !== 3) {
        logger.info("Wrong market data");
        throw new Error("Wrong market data");
      }

      const country = await marketColumns[this.tableIndex.country].textContent();
      const currency = await marketColumns[this.tableIndex.currency].textContent();
      const status = await marketColumns[this.tableIndex.status].textContent();

      markets.push({
        CountryOrRegion: country.trim(),
        CurrencyAndPricing: currency.trim(),
        Status: status.trim() === "Active",
      });
    }

    return markets;
  }

  async getAllMarketByAPI(): Promise<MarketList> {
    const res = await this.request.get(`https://${this.domain}/admin/global-markets/all.json`);
    expect(res.status()).toBe(200);
    const result = await res.json();
    return result;
  }

  async getAllOtherMarketByAPI(): Promise<Market[]> {
    const otherMarketList = (await this.getAllMarketByAPI()).result.filter(obj => obj.is_primary === false);
    return otherMarketList;
  }

  async deleteMarketByAPI(id: number) {
    const res = await this.request.delete(`https://${this.domain}/admin/global-markets/${id}.json`);
    expect(res.status()).toBe(200);
  }

  /**
   * Hàm get thông tin market chứa country
   * @param countryName
   * @returns
   */
  async getMarketInfoByCountryName(countryName: string): Promise<Market> {
    const allMarket = await this.getAllMarketByAPI();
    const market = allMarket.result.find(
      market => !!market.global_market_countries.find(gbCountry => gbCountry.country_name === countryName),
    );
    return market;
  }

  /**
   * Hàm get data setting currency theo country
   * @param countryName
   * @returns
   */
  async getDataCountry(countryName: string): Promise<dataCurrencyOfCountry> {
    const market = await this.getMarketInfoByCountryName(countryName);
    let isRouding: boolean, rounding: number, priceAddjustment: number;
    const country = market.global_market_countries.find(gbCountry => gbCountry.country_name === countryName);
    const exchangeRateAuto = country.exchange_rate_auto;
    if (market.is_multiple_currency) {
      isRouding = country.is_rounding;
      rounding = country.rounding;
      priceAddjustment = country.price_adjustment;
    } else {
      isRouding = market.is_rounding;
      rounding = market.rounding;
      priceAddjustment = market.price_adjustment;
    }
    return {
      exchangeRateAuto: exchangeRateAuto,
      isRouding: isRouding,
      rounding: rounding,
      priceAddjustment: priceAddjustment,
    };
  }

  /**
   * Hàm convert price product to market
   * @param country
   * @param price
   * @returns
   */
  async convertPriceToMarket(country: string, price: number): Promise<number> {
    let expectedPrice;
    const dataCountry = await this.getDataCountry(country);
    const convertPrice = price * dataCountry.exchangeRateAuto * (1 + dataCountry.priceAddjustment / 100);
    if (dataCountry.isRouding) {
      expectedPrice = await this.roundToNearest(convertPrice, dataCountry.rounding);
    } else {
      expectedPrice = convertPrice;
    }
    return expectedPrice;
  }

  /**
   * Hàm làm tròn khi switch currency global market
   * @param a
   * @param nearest
   * @returns
   */
  async roundToNearest(a: number, nearest: number): Promise<number> {
    const roundedValue = Math.floor(a); // Làm tròn xuống số nguyên gần nhất

    // Tính giá trị sau dấu phẩy của a
    let decimalPart = a - roundedValue;

    // Kiểm tra các trường hợp để làm tròn
    if (decimalPart >= 0.5) {
      if (nearest >= decimalPart) {
        decimalPart = nearest;
      } else {
        decimalPart = nearest + 1;
      }
    } else {
      decimalPart = nearest;
    }
    return roundedValue + decimalPart;
  }
}
