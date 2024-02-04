import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import type { TaxInfor } from "../../types/state/setting";
/**
 * Class for Setting Tax page
 */
export class TaxSetting extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  //Count number of tax regions which are existing on tax setting page
  async countNumOfTaxRegion(): Promise<number> {
    let numberOfTaxRegion = 0;
    await this.page.waitForSelector("//button//span[normalize-space()='Add a new country']");
    if (await this.page.locator("//span[normalize-space()='Country']").isVisible()) {
      const xpath = "//span[normalize-space()='Manage']";
      numberOfTaxRegion = await this.page.locator(xpath).count();
    }
    return numberOfTaxRegion;
  }

  //Delete all tax region on tax setting page
  async deleteAllTaxCountry() {
    const numberOfTaxRegion = await this.countNumOfTaxRegion();
    if (numberOfTaxRegion > 0) {
      for (let i = 0; i < numberOfTaxRegion; i++) {
        await this.page.click("(//button[span[normalize-space()='Manage']])[1]");
        await this.page.click("//span[normalize-space()='Delete country']");
        await this.page.click("//div[contains(@class, 'sb-popup__container')]//span[normalize-space()='Remove']");
      }
    }
  }

  /**
   * Input information of popup add or edit tax region
   * @param taxInfor all information of tax that you want to add or edit
   */
  async inputFormAddEditRegion(taxInfor: TaxInfor) {
    const xpathInput = `//label[normalize-space()='State' or normalize-space()='Country']//parent::div//input`;
    //input taxCountry
    if (taxInfor.country) {
      await this.page.locator(xpathInput).fill(taxInfor.country);
      await this.page.click(
        "//div[normalize-space()='" + taxInfor.country + "' and contains(@class, 'sb-text-body-medium')]",
      );
    } else if (taxInfor.taxState) {
      await this.page.locator(xpathInput).fill(taxInfor.taxState);
      await this.page.click(
        "//div[normalize-space()='" + taxInfor.taxState + "' and contains(@class, 'sb-text-body-medium')]",
      );
    }

    //input tax min item value
    if (taxInfor.minItemValue) {
      const strMin = taxInfor.minItemValue.toString();
      await this.page.locator("//label[normalize-space()='Minimum item value']//parent::div//input").fill(strMin);
    }

    //input tax max item value
    if (taxInfor.maxItemValue) {
      const strMax = taxInfor.maxItemValue.toString();
      await this.page.locator("//label[normalize-space()='Maximum item value']//parent::div//input").fill(strMax);
    }

    //input tax name
    if (taxInfor.taxName) {
      await this.page
        .locator(
          `//div[contains(@class, 'sb-popup__body')]//label[normalize-space()='Tax name']` + `//parent::div//input`,
        )
        .fill(taxInfor.taxName);
    }

    //input tax rate
    if (taxInfor.taxRate) {
      const strTaxRate = taxInfor.taxRate.toString();
      await this.page
        .locator(
          `//div[contains(@class, 'sb-popup__body')]//` + `label[normalize-space()='Tax rate']//parent::div//input`,
        )
        .fill(strTaxRate);
    }
    //click Done
    await this.page.click("//span[normalize-space()='Done']");
  }

  /**
   * Verify tax is existing
   * @param taxInfor all information of tax that you want to verify existing
   * @returns
   */
  async isTaxExisted(taxInfor: TaxInfor): Promise<boolean> {
    const xpathTaxName = "//div[normalize-space()='" + taxInfor.taxName + "']";
    await this.page.waitForSelector(xpathTaxName);
    return this.page.locator(xpathTaxName).isVisible();
  }

  /**
   * verify tax rate is true base on tax name
   * @param taxInfor all information of tax that you want to check
   * @returns
   */
  async isTaxRateDisplayed(taxInfor: TaxInfor): Promise<boolean> {
    const xpathTaxRate =
      "//td[//div[normalize-space()='" +
      taxInfor.taxName +
      "']]//div[contains(normalize-space(),'" +
      taxInfor.taxRate +
      "')]";
    // console.log(xpathTaxRate);
    await this.page.waitForSelector("//tr[@class='sb-table__row']");
    return this.page.locator(xpathTaxRate).isVisible();
  }

  /**
   * click Manage to view detail information page
   * @param taxInfor all information that you want to view detail
   */
  async clickManageTaxDetail(taxInfor: TaxInfor) {
    await this.page.click(
      "//tr[@class='sb-table__row' and//div[normalize-space()='" +
        taxInfor.taxName +
        "']]//button[span[normalize-space()='Manage']]",
    );
  }

  //Verify that tax detail page is displayed
  async isTaxDetailPageDisplayed(): Promise<boolean> {
    await this.page.waitForSelector("//div[normalize-space()='Base taxes']");
    const isBaseTaxVisible = await this.page.locator("//div[normalize-space()='Base taxes']").isVisible();
    const isCountryTaxVisible = await this.page.locator("//div[normalize-space()='Country tax']").isVisible();
    const isTaxOverridesVisible = await this.page.locator("//div[normalize-space()='Tax overrides']").isVisible();
    const isButtonDeleteVisible = await this.page.locator("//span[normalize-space()='Delete country']").isVisible();
    const isButtonSaveVisible = await this.page.locator("//span[normalize-space()='Save']").isVisible();
    const isButtonAddProductOverrideVisible = await this.page
      .locator("//span[normalize-space()" + "='Add product override']")
      .isVisible();

    return (
      isBaseTaxVisible &&
      isCountryTaxVisible &&
      isTaxOverridesVisible &&
      isButtonDeleteVisible &&
      isButtonSaveVisible &&
      isButtonAddProductOverrideVisible
    );
  }

  /**
   * edit tax name on tax detail page
   * @param taxInfor all information of tax that you want to edit
   */
  async editTaxName(taxInfor: TaxInfor) {
    await this.page.waitForSelector("//div[normalize-space()='Country tax']");
    const xpath = "//label[normalize-space()='Tax name']//parent::div//input";
    await this.page.click(xpath);
    await this.page.locator(xpath).fill(taxInfor.taxName);
  }

  /**
   * edit tax rate on tax detail page
   * @param taxInfor all information of tax that you want to edit
   */
  async editTaxRate(taxInfor: TaxInfor) {
    await this.page.waitForSelector("//div[normalize-space()='Base taxes']");
    await this.page.click("//label[normalize-space()='Tax rate']//parent::div//input");
    await this.page
      .locator("//label[normalize-space()='Tax rate']" + "//parent::div//input")
      .fill(taxInfor.taxRate.toString());
  }

  //Click on breadscrum icon
  async clickBreadScrumTaxes() {
    await this.page.click("//div[@id='page-header']//button");
  }

  /**
   * Verify tax state is existing
   * @param taxInfor all information of tax that you want to check
   * @returns
   */
  async isTaxStateExisted(taxInfor: TaxInfor): Promise<boolean> {
    const xpath =
      `//tr[//div[normalize-space()='` +
      taxInfor.taxState +
      `'] and @class='sb-table__row']` +
      `//div[@class='cell']//div[normalize-space()='` +
      taxInfor.taxName +
      `']`;

    await this.page.waitForSelector("//table[contains(@class, 'sb-table__header')]");
    return this.page.locator(xpath).isVisible();
  }

  /**
   * Choose edit or remove a tax rule
   * @param keyword
   * @param action
   */
  async chooseEditOrRemove(keyword: string, action: string) {
    const xpathMenuIcon =
      "//tr[td//div[normalize-space()='" + keyword + "']]//button[contains(@class, 'sb-popover__reference')]";
    await this.page.locator(xpathMenuIcon).scrollIntoViewIfNeeded();
    await this.page.click(xpathMenuIcon);
    const xpathAction = "//button//span[normalize-space()='" + action + "']";
    await this.page.locator(xpathAction).scrollIntoViewIfNeeded();
    await this.page.click("//button//span[normalize-space()='" + action + "']");
  }

  //Verify messsage required fieald is displayed
  async isRequiredMessageDisplayed(fieldName: string): Promise<boolean> {
    const xpath = "//label[normalize-space()='" + fieldName + "']//parent::div//div[contains(text(), 'Please enter')]";
    await this.page.waitForSelector(xpath);
    return this.page.locator(xpath).isVisible();
  }

  /**
   * Input information to popup edit override product
   * @param taxInfor data set of information will be use
   */
  async inputInformationToOverrideForm(taxInfor: TaxInfor) {
    const xpathColName = "//label[normalize-space()='Collection']//parent::div//input";
    const xpathLocation = "//label[normalize-space()='Location']//parent::div//input";
    const xpathMinItem = "//label[normalize-space()='Minimum item value']//parent::div//input";
    const xpathMaxItem = "//label[normalize-space()='Maximum item value']//parent::div//input";
    const xpathTaxName = "(//label[normalize-space()='Tax name']//parent::div//input)[2]";
    const xpathTaxRate = "(//label[normalize-space()='Tax rate']//parent::div//input)[2]";
    const xpathLocationOption =
      "//div[normalize-space()='" + taxInfor.location + "' and contains(@class, 'sb-text-body-medium')]";

    const xpathCollectionOption =
      "//div[contains(text(), '" + taxInfor.collection + "') and contains(@class, 'sb-text-body-medium')]";

    const xpathIconCleanCollection =
      "(//label[contains(text(), 'Collection')]" +
      "//parent::div//div[contains(@class, 'sb-form-item__content')]//span)[4]";
    const xpathIconCleanLocation =
      "(//label[contains(text(), 'Location')]" + "//parent::div//span[contains(@class, 'sb-input__suffix')])[2]";

    //clean field collection and fill Collection value
    if (taxInfor.collection) {
      const isIconCleanColDisplayed = await this.page.locator(xpathCollectionOption).isVisible();
      if (isIconCleanColDisplayed) {
        await this.page.click(xpathIconCleanCollection);
      }
      await this.page.locator(xpathColName).fill(taxInfor.collection);
      await this.page.waitForSelector(xpathCollectionOption);
      await this.page.click(xpathCollectionOption);
    }

    //clean field input Location and fill Location value
    if (taxInfor.location) {
      const isIconCleanLocationDisplayed = await this.page.locator(xpathIconCleanLocation).isVisible();

      if (isIconCleanLocationDisplayed) {
        await this.page.click(xpathIconCleanLocation);
      }
      await this.page.locator(xpathLocation).fill(taxInfor.location);
      await this.page.waitForSelector(xpathLocationOption);
      await this.page.click(xpathLocationOption);
    }

    if (taxInfor.minItemValue) {
      await this.page.locator(xpathMinItem).fill(taxInfor.minItemValue.toString());
    }
    if (taxInfor.maxItemValue) {
      await this.page.locator(xpathMaxItem).fill(taxInfor.maxItemValue.toString());
    }
    if (taxInfor.taxName) {
      await this.page.locator(xpathTaxName).fill(taxInfor.taxName);
    }
    if (taxInfor.taxRate) {
      await this.page.locator(xpathTaxRate).fill(taxInfor.taxRate.toString());
    }
  }
}
