import { Page } from "@playwright/test";
import { SFProduct } from "@sf_pages/product";
import appRoot from "app-root-path";
import { SFHome } from "@sf_pages/homepage";

/*
 *After launch campaign, campaign has status Available, open product on StoreFront
 */
export class Campaign extends SFProduct {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathFirstProductImage = "(//div[@id='product-image-gallery']//div[@role='tabpanel']/img)[1]";
  xpathModalContent = "//div[contains(@class,'modal__body__content')]";
  xpathBtnNextInPopupPreview =
    "(//div[contains(@class,'modal__body__content')]//button[@aria-label = 'Next page'][1])[1]";

  /*
   *Select variant of campaign
   */
  async selectVariant(variant: string) {
    //select campaign variant
    await this.page.click(
      `//div[contains(@class,'product__variant')]//button[descendant-or-self::*[normalize-space()='${variant}']]`,
    );
  }

  xpathListSelectOption =
    "//select[@name='properties[Select]']//option[not(contains(normalize-space(),'Please select the option'))]";

  /*
   *Select color of campaign
   */
  async selectColor(color: string) {
    const xpathBtnColor = "(//button[contains(@class,'product__option--color')])";
    const xpathLabel = "//span[normalize-space()='Color:']//following-sibling::label";
    for (let i = 1; i <= (await this.genLoc(xpathBtnColor).count()); i++) {
      const xpathChooseColor = xpathBtnColor + `[${i}]`;
      await this.page.click(xpathChooseColor);
      if ((await this.page.textContent(xpathLabel)) === color) {
        break;
      }
    }
  }

  /*
   *Select style of campaign
   */
  async selectStyle(style: string) {
    const xpathBtnColor = "(//img[contains(@class,'product__image-option')])";
    const xpathLabel = "//span[normalize-space()='Style:']//following-sibling::label";
    for (let i = 1; i <= (await this.genLoc(xpathBtnColor).count()); i++) {
      const xpathChooseColor = xpathBtnColor + `[${i}]`;
      await this.page.click(xpathChooseColor);
      if ((await this.page.textContent(xpathLabel)) === style) {
        break;
      }
    }
  }

  /*
   *get sale price and compare at price on storefront
   */
  async getPrice(label: string) {
    // get value of sale price with index = 1
    let index = 1;
    if (label === "Compare at price") {
      // get value of Compare at price with index = 2
      index = 2;
    }
    if (label === "Save price") {
      // get value of Save price with index = 2
      index = 3;
    }
    //get sale price and compare at price
    const price = await this.getTextContent(
      `(//div[contains(@class,'product__price')]/span|//div[contains(@class,'product__price')]/p/span)[${index}]`,
    );
    return price;
  }

  /*
   *get number of image campaign on StoreFront
   */
  async countNumberOfImage() {
    return this.genLoc(
      "(//li[contains(@class,'thumbnail-carousel-slide')])|(//li[contains(@class, 'media-gallery-carousel')])",
    ).count();
  }

  /*
   *click to next image on list image on SF with theme Roller
   */
  async clickNextImage() {
    const nextPageBtn = "//button[@aria-label = 'Next page'][1]";
    await this.page.click(nextPageBtn, { delay: 500 });
  }

  /*
   *get image of campaign on storefront
   */
  async getImageOfCampaign() {
    const imgActive = await this.page.waitForSelector("#media-gallery-carousel .VueCarousel-slide-active img");
    await imgActive.waitForElementState("stable");
    return await this.genLoc("#media-gallery-carousel").screenshot({ animations: "disabled" });
  }

  /*
   *get title of campaign on storefront
   */
  async getCampaignTitle(): Promise<string> {
    return await this.page.textContent("//h1[contains(@class,'product__name')]");
  }

  /**
   * input Custom option of Campaign on SF
   * @param customOptionValues list custom Option need input on SF
   * @param s3Path path of file upload to S3
   */
  async inputCustomOptionOnCampSF(customOptionValues: string, s3Path?: string) {
    const valueCO = customOptionValues.split(">").map(item => item.trim());
    const typeCO = valueCO[0];
    const customName = valueCO[1];
    const value = valueCO[2];
    const typeClipart = valueCO[3];
    const clipartName = valueCO[4];
    if (typeCO === "Picture choice" || typeCO === "Picture") {
      if (typeClipart === "Group") {
        await this.page.selectOption(`(//label[normalize-space()='${customName}']//following::select)[1]`, {
          label: value,
        });
        if (clipartName) {
          await this.page.click(
            `//div[contains(@class,'product-property')][descendant-or-self::*` +
              `[normalize-space()= '${customName}']]//input[@value='${clipartName}']/following-sibling::span`,
          );
        }
      } else {
        if (value) {
          await this.page.click(
            `//div[parent::div[contains(@class,'product-property')]][descendant-or-self::` +
              `*[normalize-space()= '${customName}']]//input[@value='${value}']/following-sibling::span`,
          );
        }
      }
    }
    if (typeCO === "Droplist") {
      await this.page.selectOption(`(//label[normalize-space()='${customName}']//following::select)[1]`, {
        label: value,
      });
    }
    if (typeCO === "Radio buttons" || typeCO === "Radio") {
      await this.page
        .locator(
          `//div[child::div[contains(@class,'radio-group')] and descendant-or-self::*` +
            `[normalize-space()= '${customName}']]//span[following-sibling::span[contains(.,'${value}')]]`,
        )
        .click();
    }
    if (typeCO === "Text field") {
      await this.page.fill(`//label[normalize-space()='${customName}']//following::input[1]`, value);
    }
    if (typeCO === "Text area") {
      await this.page.fill(`//label[normalize-space()='${customName}']//following::textarea[1]`, value);
    }
    if (typeCO === "Image") {
      let filePath;
      if (value) {
        if (s3Path) {
          filePath = s3Path;
        } else {
          filePath = appRoot + `/data/shopbase/${value}`;
        }
        await this.page.setInputFiles(`//label[normalize-space()='${customName}']//following::input[1]`, filePath);
        await this.page.waitForTimeout(2000);
        if (
          await this.page.locator("//div[contains(@class,'crop-image-modal__content')]").isVisible({ timeout: 3000 })
        ) {
          await this.page.click("//div[@id='modal-common']//button[contains(text(),'Crop')]");
        }
        await this.waitForElementVisibleThenInvisible("//div[contains(@class,'upload-progress')]");
      }
    }
    if (typeCO === "Checkbox") {
      await this.page.locator("//div[@class='checkbox-group']").scrollIntoViewIfNeeded();
      const xpathCheckbox = "//span[@class='s-check pointer']";
      const countCheckbox = await this.genLoc(xpathCheckbox).count();
      for (let i = 1; i <= countCheckbox; i++) {
        await this.page.uncheck(`(${xpathCheckbox})[${i}]`);
      }
      if (value) {
        const valueCO = value.split(",").map(item => item.trim());
        for (let i = 0; i < valueCO.length; i++) {
          await this.page
            .locator(`//label[descendant::span[normalize-space()= '${valueCO[i]}']]//span[@class='s-check pointer']`)
            .scrollIntoViewIfNeeded();
          await this.page.check(
            `//label[descendant::span[normalize-space()= '${valueCO[i]}']]//span[@class='s-check pointer']`,
          );
        }
      }
    }
    if (typeCO === "Picture choice group show droplist") {
      await this.page.selectOption(
        `//div[contains(@class,'select-box') and` + ` descendant::*[normalize-space()='${customName}']]//select`,
        {
          label: `${value}`,
        },
      );
      await this.page.selectOption(
        `(//div[contains(@class,'select-box') and` + ` descendant::*[normalize-space()='${value}']]//select)[2]`,
        {
          label: `${typeClipart}`,
        },
      );
    }
    if (typeCO === "Picture choice group show thumbnail") {
      await this.page.selectOption(
        `//div[contains(@class,'select-box') and` + ` descendant::*[normalize-space()='${customName}']]//select`,
        {
          label: `${value}`,
        },
      );
      await this.page.click(
        `//div[parent::div[contains(@class,'product-property')]]` +
          ` [descendant-or-self::*[normalize-space()='${value}']]` +
          `//input[@value='${typeClipart}']/following-sibling::span`,
      );
    }
    // wait for input custom option
    await this.page.waitForTimeout(5000);
  }

  /**
   * Go to home page then add custom option to cart
   * @param prodName is product name
   * @param customOptionShowSF is list custom option
   */
  async gotoHomePageThenAddCustomOptionToCart(
    homePage: SFHome,
    prodName: string,
    customOptionShowSF: string[],
    isAddToCart = true,
  ): Promise<void> {
    await homePage.gotoHomePage();
    await homePage.searchThenViewProduct(prodName);
    if (customOptionShowSF) {
      for (let i = 0; i < customOptionShowSF.length; i++) {
        await this.inputCustomOptionOnCampSF(customOptionShowSF[i]);
      }
    }
    if (isAddToCart) {
      await this.page.locator(this.getXpathWithLabel("Description")).scrollIntoViewIfNeeded();
      await this.clickOnBtnWithLabel("Add to cart");
    }
  }

  /**
   * Get xpath image mockup
   * @param: index of image
   */
  getXpathImageMockup(index: number) {
    return `(${this.xpathProductMockup} | ${this.xpathProductMockupActive})[${index}]`;
  }

  /**
   * Get xpath image mockup loading
   * @param: index of image
   */
  getXpathImageMockupLoading(index: number) {
    return `(//img[@class="image sb-lazy shape-sharp-t-l-b-r"])[${index}]`;
  }
}
