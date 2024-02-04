import { APIRequestContext, expect, Page } from "@playwright/test";
import { Market, MarketResponse } from "src/types/settings/global-market";
import { GlobalMarketListPage } from "./global-market-list";

export class GlobalMarketAddPage extends GlobalMarketListPage {
  constructor(page: Page, domain: string, request?: APIRequestContext) {
    super(page, domain);
    this.request = request;
  }
  selector = {
    addMarket: "//button[normalize-space()='Add Market']",
    table: {
      xpathAddCountriesRegion: "//span[contains(text(),'Add countries / regions')]",
    },
    popup: {
      popupAddCountries: "sb-popup__container",
      searchCountries: 'input[placeholder="Search countries / regions"]',
      btnAdd: "//button[normalize-space()='Add']",
      btnCancel: "//button[normalize-space()='Cancel']",
    },
  };

  /**
   * Add market with countries
   * @param name
   * @param countries
   * @param publish
   */
  async addMarket(name: string, countries: string[], publish: string) {
    await this.inputFieldWithLabel("", "Market name", name);
    await this.addOrEditCountry(countries);
    await this.publishMarket(publish);
    await this.page.locator(this.selector.addMarket).click();
  }

  /**
   * choose countries cho market
   * @param countries
   */
  async addOrEditCountry(countries: string[]) {
    await this.page.locator(this.selector.table.xpathAddCountriesRegion).click();
    await this.page.locator(this.selector.popup.popupAddCountries).waitFor();
    await this.page.locator(this.selector.popup.searchCountries).waitFor();
    for (const country in countries) {
      await this.page.locator(this.selector.popup.searchCountries).fill(country);
      await this.page.locator("").click();
    }
    await this.page.locator(this.selector.popup.btnAdd).click();
  }

  /**
   * publish or unpublish market
   * @param label
   */
  async publishMarket(label: string) {
    await this.page.locator(`//button[normalize-space()=${label}]`).click();
  }

  /**
   * Create new market
   */
  async createMarket(body: Market): Promise<MarketResponse> {
    const res = await this.request.post(`https://${this.domain}/admin/global-markets.json`, {
      data: body,
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody as MarketResponse;
  }

  async editMarketByAPI(body: Market, id: number): Promise<MarketResponse> {
    const res = await this.request.put(`https://${this.domain}/admin/global-markets/${id}.json`, { data: body });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody;
  }
}
