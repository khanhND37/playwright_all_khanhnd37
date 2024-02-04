import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import type { CreateUpsellOfferUI } from "@types";

export class Apps extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathProgressBar = "//div[contains(@class,'ondoarding-progress')]";
  xpathOnboardingItem =
    "(//span[@class='sb-flex-inline sb-flex-justify-center sb-flex-items-center sb-icon sb-icon__medium sb-icon__custom sb-mr-small'])";
  xpathOnboardingContent =
    "//div[contains(@class,'sb-onboarding-content') and not(contains(@class, 'sb-onboarding__complete'))]";
  xpathOnboardingComplete = "//div[contains(@class,'sb-onboarding__complete')]";
  xpathPrivateAppsPage = ".private-apps-page";
  xpathConfirmPopup = "//div[@class='s-animation-content s-modal-content']";

  xpathBlockAppV2(appName: string) {
    return `//li[contains(@class,'app_list__items') and descendant::p[normalize-space()='${appName}']]`;
  }

  xpathAppName(appName: string) {
    return (
      `//p[@class="app_list__items-name type--bold" and normalize-space()="${appName}"]` +
      `|//div[contains(@class,"app-name") and normalize-space()="${appName}"]`
    );
  }

  /**
   * Open an app default to open app's dashboard
   */
  async openApp(appName: string) {
    await this.page.locator(this.xpathAppName(appName)).click();
    await this.page.waitForSelector("//img[@alt='logo apps']");
  }
  /**
   * Open menu in dashboard off an app (Upsell, Dashboard, settings...)
   */
  async openListMenu(menuName: string) {
    await this.page
      .locator(`//ul[contains(@class,'tree-menu-ul')]/descendant::a[normalize-space()="${menuName}"]`)
      .click();
  }

  private appToggleBtn(appName: string) {
    return `//div[@class="flex block"][. //div[normalize-space()='${appName}']]//label`;
  }
  /**
   * Check if toggle button is off -> turn it on, otherwise do nothing
   * @param status: true = On, false = Off
   */
  async turnOnOffApp(appName: string, turnOn: boolean) {
    await this.page.locator(this.appToggleBtn(appName)).setChecked(turnOn);
  }

  /**
   * goto Apps
   * @param appName
   * @param index
   */
  async gotoAppsNE(appName: string, index = 1) {
    await this.page
      .locator(`(//div[contains(@class,'app-name') and normalize-space()='${appName}'])[${index}]`)
      .click();
    await this.page.waitForLoadState("load");
  }
  /**
   * Edit CTA btn settings(pre-purchase, post-purchase, in-cart,...)
   * with behaviors(continue shopping, go to cart...)
   * @param offerType: title of offer in CTA button settings
   * @param behavior: After user add items of offer to cart will continue shopping, ...
   */
  async customizeCTABtnSettings(offerType: string[], behavior: string) {
    for (let i = 0; i < offerType.length; i++) {
      if (
        (await this.page
          .locator(`//*[normalize-space()='${offerType[i]}']/following-sibling::div[2]/descendant::select`)
          .inputValue()) !== behavior
      ) {
        await this.page
          .locator(`//*[normalize-space()='${offerType[i]}']/following-sibling::div[2]/descendant::select`)
          .selectOption({ value: behavior });
        await this.page.waitForSelector("//button[@type='button' and normalize-space()='Save changes']");
      }
    }
    const isChange = await this.page
      .locator("//button[@type='button' and normalize-space()='Save changes']")
      .isVisible();
    if (isChange) {
      await this.page.click("//button[@type='button' and normalize-space()='Save changes']");
      await this.page.waitForSelector(".s-toast", { state: "visible" });
      await this.page.waitForSelector("//button[@type='button' and normalize-space()='Save changes']", {
        state: "hidden",
      });
    }
  }

  /**
   * Create new offer and also turn on offer discount(if it's off) if we set the discount percent
   * @param offerInfo: input info to set offer
   */
  async createNewUpsellOffer(offerInfo: CreateUpsellOfferUI) {
    await this.page.locator("//button[normalize-space()='Create offer']").click();
    if (offerInfo.type) {
      await this.page.locator(`//div[text()='${offerInfo.type}']`).click();
    }
    if (offerInfo.name) {
      await this.page.locator("#input-offer-name").fill(offerInfo.name);
    }
    if (offerInfo.message) {
      await this.page.fill("//label[contains(text(),'message')]/following::div[2]/input", offerInfo.message);
    }
    if (offerInfo.title) {
      await this.page.fill("//label[contains(text(),'title')]/following::div[2]/input", offerInfo.title);
    }
    switch (offerInfo.target_type) {
      case "All products":
        break;
      case "Specific products":
      case "Specific collections":
        await this.page
          .locator(
            `//div[contains(@class,'up-sell-target-product']` +
              `/descendant::span[normalize-space()='${offerInfo.target_type}']`,
          )
          .click();
        await this.page.locator("//div[contains(@class, 'up-sell-target-product')]/descendant::button").click();
        for (let i = 0; i < offerInfo.target_prod_coll.length; i++) {
          await this.page.fill("//input[contains(@placeholder,'keyword')]", offerInfo.target_prod_coll[i]);
          await this.page.click(`
        //*[normalize-space()='${offerInfo.target_prod_coll[i]}']
        /parent::div/parent::div/following-sibling::span/span`);
        }
        await this.page.locator("//span[contains(text(),'Continue with selected')]").click();
        break;
    }
    switch (offerInfo.recommended_type) {
      case "Specific products":
      case "Specific collections":
        await this.page
          .locator(
            `//div[contains(@class,'up-sell-target-product']` +
              `/descendant::span[normalize-space()='${offerInfo.recommended_type}']`,
          )
          .click();
        await this.page.locator("//*[contains(@class,'up-sell-recommend-product']/descendant::button").click();
        for (let i = 0; i < offerInfo.recommended_prod_coll.length; i++) {
          await this.page.fill("//input[contains(@placeholder,'keyword')]", offerInfo.recommended_prod_coll[i]);
          await this.page.click(`
        //*[normalize-space()='${offerInfo.recommended_prod_coll[i]}']
        /parent::div/parent::div/following-sibling::span/span`);
        }
        await this.page.locator("//span[contains(text(),'Continue with selected')]").click();
        break;
      case "Same collection with target products":
      case "Most relevant products using automated rules":
        await this.page
          .locator(
            `//div[contains(@class,'up-sell-target-product']` +
              `/descendant::span[normalize-space()='${offerInfo.target_type}']`,
          )
          .click();
        break;
      case "Specific by base category":
        await this.page.click(
          `//div[contains(@class,'up-sell-target-product']` +
            `/descendant::span[normalize-space()='${offerInfo.target_type}']`,
        );
        offerInfo.categories.forEach(cate => {
          this.page.click(`//span[@class='s-control-label' and normalize-space()='${cate}']`);
        });
        break;
    }
    if (offerInfo.recommended_variant) {
      await this.page.selectOption("//div[@class='s-select']/select", { value: offerInfo.recommended_variant });
    }
    if (offerInfo.discount_percent) {
      await this.page.locator("//*[contains(text(),'discount')]/descendant::span[@class='s-check']").click();
      await this.page.locator("//input[@type='number']").fill(offerInfo.discount_percent);
      await this.page.locator("//span[normalize-space()='Submit offer']").click();
    }
  }

  /**
   * Create new Private app in menu Apps
   * @param name: Private app name
   * @param email: email
   */
  async createPrivateApp(name: string, email: string) {
    const xpathPrivateAppName = this.page.locator("//input[@id='private_app_name']");
    const xpathEmail = this.page.locator("//input[@id='private_app_email']");
    await xpathPrivateAppName.focus();
    await xpathPrivateAppName.fill(name);
    await xpathEmail.focus();
    await xpathEmail.fill(email);
    await this.clickOnBtnWithLabel("Save", 2);
    if ((await this.genLoc(this.xpathConfirmPopup).count()) > 0) {
      await this.clickOnBtnWithLabel("I understand, create the app");
      await this.waitUntilElementInvisible(this.xpathLoadingButton);
    }
    await this.waitForToastMessageHide("API credentials saved");
  }

  /**
   * Delete Private app in Private app list
   * @param appName: Private app name
   */
  async deletePrivateApp(appName: string) {
    await this.page
      .locator(`(//td[normalize-space()='${appName}']//ancestor::tr//i[contains(@class,'mdi-trash-can-outline')])[1]`)
      .click();
    if ((await this.genLoc(this.xpathConfirmPopup).count()) > 0) {
      await this.clickOnBtnWithLabel("Delete this private app");
      await this.waitUntilElementInvisible(this.xpathLoadingButton);
    }
    await this.page.waitForSelector(this.xpathToastMessage);
  }

  /**
   * Get status of app on V3: "true" = ON/ "false" = OFF
   * @param appName : app name
   * @returns
   */
  async getStatusOnOffAppByName(appName: string) {
    return await this.page
      .locator(
        `//div[normalize-space()='${appName}']//ancestor::div[@class='block-content']//input` +
          `|//p[normalize-space()='${appName}']//ancestor::li[contains(@class,'app_list__items')]//input`,
      )
      .getAttribute("value");
  }

  /**
   * Click btn Uninstall app
   * @param appName: name of app
   */
  async clickUninstallApp(appName: string) {
    const xpathBtnUninstall =
      `(${this.xpathAppName(appName)})` +
      `//ancestor::li[contains(@class,'app_list__items')]//i` +
      `|(//ancestor::div[@class='block-content']//div[normalize-space()='Uninstall'])[2]`;
    await this.page.locator(xpathBtnUninstall).click();
  }

  /**
   * Uninstall third app in menu Apps
   * @param thirdApp: name of third app
   * @param reason: reason for uninstalling app
   * @param description: describe your experience
   */
  async uninstallApp(reason?: string, description?: string) {
    if (reason) {
      await this.genLoc("//div[contains(@class, 's-modal-body')]//select").selectOption(reason);
    }
    if (description) {
      await this.genLoc("//div[@class='s-textarea']//textarea").fill(description);
    }
  }
}
