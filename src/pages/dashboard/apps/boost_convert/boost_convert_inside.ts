import { DashboardPage } from "@pages/dashboard/dashboard";
import { APIRequestContext, Page, expect } from "@playwright/test";
import { settingProductCountdownUI } from "@types";
import type {
  RealTimeVisitor,
  addCustomNoti,
  editCheckoutNotifications,
  editSalesNotifications,
  salesNotificationsList,
  settingSalesNotifications,
  settingSocialProof,
  settingVisitorUI,
} from "@types";
import { timeDifference } from "@utils/datetime";

export class BoostConvertInsidePage extends DashboardPage {
  selectProductOrCollectionPopup = {
    titlePopup: "//div[@class='s-modal-header']/*[text()='Select product']",
    selectProductBtn: "//button[@type='button']//span[normalize-space()='Select products']",
    searchBox: "//input[@placeholder='Enter keyword to search' and @class='s-input__inner']",
    loading: "//div[@class='content-product']/div[@class='products-no-offer']",
    addIcon: "//div[@class='product-selector__item']//span[contains(@class,'product-action')]",
    continueWithSelectedProducts: "//button[@type='button']/span[normalize-space()='Continue with selected products']",
    productSelected: "//p[contains(text(),'product selected')]",
  };
  Location = {
    dropdownBox: "//input[@placeholder='Type to search' and @class='s-input__inner']",
    dropdownPopup: "//div[contains(@class,'is-focusable')]//span[contains(@class,'is-hovered')]",
  };
  createNowBtn = "//button[@type='button']/span[normalize-space()='Create now']";
  titleNotifiList = "//h1[text()='Sales notifications list']";

  /**
   * Get xpath of input fields at Customize page
   * @param blockName get 3 options: Timer countdown, Product countdown, Real-time visitors
   * @param fieldName
   */
  xpathInputDataAtCustomize(blockName: string, fieldName: string) {
    return this.genLoc(
      `//div[text()='${blockName}']/following-sibling::div//label[text()='${fieldName}']/parent::div/following-sibling::div//input`,
    );
  }

  typeVisitor = "//label[text()='Type']/ancestor::div[@class='s-form-item__wrap-label']/following-sibling::div//select";
  saveBtn = "//button[@type='button']//span[normalize-space()='Save']";
  durationTimer = "//input[@type='number' and @class='s-input__inner']";
  createTimerBtn = "//div[@class='save-setting-fixed']//span[normalize-space()='Create timer']";
  titleTimerList = "//div[@id='timer-countdown-list']//div[text()='Timer list']";
  contentTimerCountdownSF = "//div[contains(@class,'copt-countdown-timer__block')]";
  contentStockCountdownSF = "//section[@component='stock-countdown']";

  numberTimerCountdownSF(timer: string) {
    return `//div[@class='copt-countdown-timer__digit' and text()='${timer}']`;
  }

  /**
   * This method is used to get xpath of Product countdown settings at Product countdown page
   * @param optionName get 3 options:
   *  Show your actual number of stocks|Percentage of items left in stock|Number of items left in stock
   */
  xpathChooseProductCountdown(optionName: string) {
    return `//span[normalize-space()='${optionName}']`;
  }

  success_message = "//div[contains(@class,'s-toast')]//div[text()='Your settings was updated successfully']";
  productCountdownSF = {
    message: "//div[@class='copt-product-countdown__message']",
    progressBar: "//div[contains(@class,'copt-product-countdown__progress')]",
  };
  contentRealTimeVisitorSF = "//div[contains(@class,'copt-realtime-visitors')]";
  numberRealTimeVisitorSF = "//div[contains(@class,'copt-realtime-visitors')]//span";
  changeBtn = "//button[@type='button']//span[text()='Change']";

  xpathRandomField(labelName: string) {
    return `//label[text()='${labelName}']//ancestor::div[contains(@class,'s-form-item')]//input[@class='s-input__inner']`;
  }

  xpathItemWithProductNameOnPopup(productName: string) {
    return `//div[@class='product-selector__item']//div[contains(@class,'products-name') and text()='${productName}']`;
  }

  xpathTagByLocation(location: string) {
    return `//div[contains(@class,'s-taginput')]/following-sibling::span[contains(@class,'s-tag')]/span[normalize-space()='${location}']`;
  }

  xpathLocationInDropdown(location: string) {
    return `//span[@class='s-dropdown-item is-hovered']/span[normalize-space()='${location}']`;
  }

  xpathNotiStatusByProductName(productName: string) {
    return `//div[@class='noti-body' and text()='${productName}']/ancestor::td/following-sibling::td//span[@class='s-check']`;
  }

  xpathSaleNotiByProductAtSF(productName: string) {
    return `//div[@class='copt-notification__wrapper']//a[text()='${productName}']`;
  }

  xpathCheckoutNotiByProductAtSF(productName: string) {
    return `//div[contains(@class,'copt-notification__info')]//div[contains(text(),'has bought this ${productName} in the last 24 hours')]`;
  }

  /**
   *
   * @param productName
   * @param typeNoti get two options: Custom or Sync
   */
  xpathNotiTypeByProductName(productName: string, typeNoti: string) {
    return `//div[@class='noti-body' and text()='${productName}']/ancestor::td/following-sibling::td/div[normalize-space()='${typeNoti}']`;
  }

  authRequest: APIRequestContext;

  constructor(page: Page, domain: string, authRequest?: APIRequestContext) {
    super(page, domain);
    this.authRequest = authRequest;
  }

  /**
   * xpath Notifications SF
   * @returns
   */
  xpathNotificationsSF() {
    const xpath = {
      title: `${this.xpathNotiActivated}//div[contains(@class,'copt-notification__text')]`,
      product_name: `(${this.xpathNotiActivated}//*[self::a[@class='copt-pointer'] or self::div[contains(@class,'copt-notification__title')]])[1]`,
      time: `${this.xpathNotiActivated}//div[@class='copt-notification__pur-time']`,
    };
    return xpath;
  }

  xpathNotiActivated = "//div[contains(@class,'noti-activated')]";
  xpathNotificationList = "//span[normalize-space()='Notification list']";
  xpathBlankListNoti = "//p[normalize-space()='Sorry! Your search did not match any notification.']";
  xpathTitleCheckoutNotiSF = "//div[contains(@class,'copt-notification__title')]";

  /**
   * goto Real Time Visitors in boost convert
   */
  async gotoRealTimeVisitors() {
    await this.page.goto(`https://${this.domain}/admin/apps/boost-convert/ctool/realtime-visitors`);
    await this.page.waitForLoadState("load");
  }

  /**
   * goto Notifications List Social Proof in boost convert
   */
  async gotoSettingSocialProof() {
    await this.page.goto(`https://${this.domain}/admin/apps/boost-convert/social-proof/settings`);
    await this.page.waitForLoadState("load");
  }

  /**
   * edit Setting Real Time Visitors
   */
  async editSettingRealTimeVisitors(
    randomForm: number,
    randomTo: number,
  ): Promise<{ randomForm: number; randomTo: number }> {
    await this.clickOnBtnWithLabel("Change");
    await this.page
      .locator("//label[normalize-space()='Random from']//parent::div//following-sibling::div//input[@type='number']")
      .fill(randomForm.toString());
    await this.page
      .locator("//label[normalize-space()='to']//parent::div//following-sibling::div//input[@type='number']")
      .fill(randomTo.toString());
    await this.clickOnBtnWithLabel("Save");
    return { randomForm: randomForm, randomTo: randomTo };
  }

  /**
   * get api setting Real Time Visitors
   * @returns data setting Real Time Visitors
   */
  async getDataSettingRealTimeVisitors(): Promise<RealTimeVisitor> {
    const response = await this.authRequest.get(
      `https://${this.domain}/admin/copt/timers/realtime-visitors/settings.json`,
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res;
  }

  /**
   *Edit Display Time in settings social-proof
   * @returns
   * @param displayTime
   */
  async EditDisplayTimeSettingsSocialProof(displayTime = Math.floor(Math.random() * 9999) + 1): Promise<number> {
    await this.page
      .locator("//div[normalize-space()='Display time']//following-sibling::div//input[@type='number']")
      .fill(displayTime.toString());
    await this.clickOnBtnWithLabel("Save changes");
    return displayTime;
  }

  /**
   * get data display time in setting Social Proof
   * @returns data field displayTime
   */
  async getDataSettingSocialProof(): Promise<settingSocialProof> {
    const response = await this.authRequest.get(`https://${this.domain}/admin/copt/social-proof/settings.json`);
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res;
  }

  /**
   * This method lets to choose product for creating a custom notification
   * @param productName
   */
  async selectProductToCreateNoti(productName: string) {
    await this.clickOnBtnWithLabel("Select products");
    await this.page.waitForSelector(this.selectProductOrCollectionPopup.titlePopup);
    await this.genLoc(this.selectProductOrCollectionPopup.searchBox).fill(productName);
    await this.waitForElementVisibleThenInvisible(this.selectProductOrCollectionPopup.loading);
    await this.page.waitForSelector(this.xpathItemWithProductNameOnPopup(productName));
    await this.genLoc(this.selectProductOrCollectionPopup.addIcon).click();
    await this.genLoc(this.selectProductOrCollectionPopup.continueWithSelectedProducts).click();
  }

  /**
   * This method lets to choose location for creating a custom notification
   * @param location
   */
  async selectLocationToCreateNoti(location: string) {
    await this.page.locator(this.Location.dropdownBox).fill(location);
    await this.page.waitForSelector(this.xpathLocationInDropdown(location));
    await this.page.locator(this.Location.dropdownPopup).click();
  }

  /**
   * This method is used to input data of Timer Countdown at Customize page
   * @param color
   * @param frontSize
   */
  async settingsTimerCountdown(color: string, frontSize: number) {
    await this.xpathInputDataAtCustomize("Timer countdown", "Color").fill(color);
    await this.xpathInputDataAtCustomize("Timer countdown", "Font size").fill(frontSize.toString());
  }

  /**
   * This method is used to input data for Product Countdown at Customize page
   * @param set
   */
  async settingsProductCountdown(set: settingProductCountdownUI) {
    await this.xpathInputDataAtCustomize("Product countdown", "Process color").fill(set.process_color);
    await this.xpathInputDataAtCustomize("Product countdown", "Background color").fill(set.background_color);
    await this.xpathInputDataAtCustomize("Product countdown", "Font size").fill(set.front_size.toString());
  }

  /**
   * This method is used to input data for Real-time Visitors at Customize page
   * @param set
   */
  async settingsVisitor(set: settingVisitorUI) {
    await this.xpathInputDataAtCustomize("Real-time visitors", "Text color").fill(set.text_color);
    await this.xpathInputDataAtCustomize("Real-time visitors", "Background color").fill(set.background_color);
    await this.xpathInputDataAtCustomize("Real-time visitors", "Number color").fill(set.number_color);
    await this.page.selectOption(this.typeVisitor, set.type);
    await this.xpathInputDataAtCustomize("Real-time visitors", "Font size").fill(set.font_size.toString());
  }

  /**
   * xpath Noti Toggle Btn
   * @param appName
   * @returns
   */
  private xpathNotiToggleBtn(appName: string) {
    return `//div[contains(@class,'copt-section ')][.//h4[normalize-space()='${appName}']]//label`;
  }

  /**
   * Check if toggle button is off -> turn it on, otherwise do nothing
   * @param appName
   * @param turnOn
   */
  async turnOnOffNotifications(appName: string, turnOn: boolean) {
    await this.page.locator(this.xpathNotiToggleBtn(appName)).setChecked(turnOn);
  }

  /**
   * get info Sale Notifications List has status = true
   * @returns
   */
  async getInfoSaleNotificationsList(): Promise<salesNotificationsList> {
    const listInfoNotifications: salesNotificationsList = [];
    const response = await this.authRequest.get(
      `https://${this.domain}/admin/copt/social-proof/sale-notifications.json`,
      { params: { limit: 1000 } },
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    if (!res.notifications) {
      return listInfoNotifications;
    } else {
      for (const notification of res.notifications) {
        if (notification.status == true) {
          const infoNotification = {
            id: notification.id,
            customer_address: notification.customer_address,
            customer_city: notification.customer_city,
            customer_country: notification.customer_country,
            customer_name: notification.customer_name,
            customer_first_name: notification.customer_first_name,
            customer_last_name: notification.customer_last_name,
            product_name: notification.product_name,
            order_created_at: notification.order_created_at,
            status: notification.status,
            type: notification.type,
          };
          listInfoNotifications.push(infoNotification);
        }
      }
    }
    return listInfoNotifications;
  }

  /**
   * create data Sales Notifications List by html code
   * @returns
   */
  async getDataSalesNotificationsList(): Promise<Array<settingSalesNotifications>> {
    const response = await this.authRequest.get(
      `https://${this.domain}/admin/copt/social-proof/settings/sale_notification.json`,
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    const message = res.settings.message;
    const info = await this.getInfoSaleNotificationsList();
    const updatedMessages = [];
    for (let i = 0; i < info.length; i++) {
      let updatedTitle = message.title;

      const keywords = ["{{first_name}}", "{{last_name}}", "{{full_name}}", "{{country}}", "{{city}}", "{{location}}"];
      for (const keyword of keywords) {
        switch (keyword) {
          case "{{first_name}}":
            if (updatedTitle.includes(keyword)) {
              updatedTitle = updatedTitle.replace(keyword, info[i].customer_first_name);
            }
            break;
          case "{{last_name}}":
            if (updatedTitle.includes(keyword)) {
              updatedTitle = updatedTitle.replace(keyword, info[i].customer_last_name);
            }
            break;
          case "{{full_name}}":
            if (updatedTitle.includes(keyword)) {
              updatedTitle = updatedTitle.replace(
                keyword,
                `${info[i].customer_first_name} ${info[i].customer_last_name}`,
              );
            }
            break;
          case "{{country}}":
            if (updatedTitle.includes(keyword)) {
              updatedTitle = updatedTitle.replace(keyword, info[i].customer_country);
            }
            break;
          case "{{city}}":
            if (updatedTitle.includes(keyword)) {
              updatedTitle = updatedTitle.replace(keyword, info[i].customer_city);
            }
            break;
          case "{{location}}":
            if (updatedTitle.includes(keyword)) {
              updatedTitle = updatedTitle.replace(keyword, info[i].customer_address);
            }
            break;
          default:
            break;
        }
      }

      let updatedProductName = message.product_name;
      if (updatedProductName.includes("{{product_title}}")) {
        updatedProductName = updatedProductName.replace(updatedProductName, info[i].product_name);
      }

      let updatedTime = message.time;
      if (updatedTime.includes("{{random_time_ago}}")) {
        updatedTime = updatedTime.replace(updatedTime, "ago");
      }
      if (updatedTime.includes("{{time_ago}}")) {
        updatedTime = updatedTime.replace(
          updatedTime,
          timeDifference(new Date(), new Date(info[i].order_created_at * 1000)),
        );
      }

      const updatedMessage = { ...message, title: updatedTitle, product_name: updatedProductName, time: updatedTime };
      updatedMessages.push(updatedMessage);
    }
    return updatedMessages;
  }

  /**
   * get info all Order
   * @returns
   */
  async getListCreateAtOrderById(productID: number): Promise<Array<Date>> {
    const response = await this.authRequest.get(
      `https://${this.domain}/admin/orders/v2.json?` +
        {
          params: {
            fields:
              "id,name,email,created_at,customer,financial_status,fulfillment_status,sales_channel,created_source,total_price,fulfillments,line_items,shop_id,closed_at,product_mappings,source_name,is_risk,note,print_file_status,shipment_status,payment_gateway,chargeback_deadline_at&line_item_fields=id,fulfillment_status,image_src,title,product_id,variant_title,created_at,quantity,raw_price,holding_time&tab=all",
            orderType: "order",
            limit: 50,
            page: 1,
            sort_field: "created_at",
            sort_mode: "desc",
            view_product_mapping: true,
            search_option: "order_name",
          },
        },
    );
    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    const listCreateAtOrder: Array<Date> = [];
    for (let i = 0; i < jsonResponse.orders.length; i++) {
      if (jsonResponse.orders[i].line_items[0].product_id === productID) {
        listCreateAtOrder.push(jsonResponse.orders[i].created_at);
      }
    }
    return listCreateAtOrder;
  }

  /**
   * get content checkout Notifications List
   * @param notiProductCheckout
   * @returns
   */
  async getContentCheckoutNotificationsList(productID: number): Promise<string> {
    const response = await this.authRequest.get(
      `https://${this.domain}/admin/copt/social-proof/settings/checkout_notification.json`,
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    const message = res.settings.message;
    const info = await this.getListCreateAtOrderById(productID);
    let count = 0;

    for (let i = 0; i < info.length; i++) {
      const timeNotiCreated = timeDifference(new Date(), new Date(info[i]));
      if (
        timeNotiCreated.includes("second(s) ago") ||
        timeNotiCreated.includes("minute(s) ago") ||
        timeNotiCreated.includes("hour(s) ago")
      ) {
        count += 1;
      }
    }
    let updatedMessage = message;
    if (updatedMessage.includes("{{purchased_number}}")) {
      updatedMessage = message.replace("{{purchased_number}}", count.toString());
    }
    return updatedMessage;
  }

  /**
   * click Btn Setting Notifications
   * @param settingName
   */
  async clickBtnSettingNotifications(settingName: "Sales notifications" | "Checkout notifications") {
    await this.page
      .locator(
        `//h4[normalize-space()='${settingName}']//parent::div//following-sibling::div//span[normalize-space()='Settings']`,
      )
      .click();
    await this.page.waitForSelector(`//h2[normalize-space()='${settingName}']`);
  }

  /**
   * edit Notifications
   * @param dataEdit
   */
  async editSalesNotifications(dataEdit: editSalesNotifications) {
    const xpathFieldTitleNoti = "//input[@id='title-noti']";
    const xpathFieldProductName = "//input[@id='product_name']";
    const xpathFieldTimeNoti = "//input[@id='time-noti']";

    await this.clickBtnSettingNotifications("Sales notifications");
    await this.page.click("//a[normalize-space()='Reset to default']");
    if (await this.page.locator("//div[contains(@class,'save-setting-content')]").isVisible()) {
      await this.clickOnBtnWithLabel("Save");
    }
    await this.isToastMsgVisible("Your settings was updated successfully");
    if (dataEdit.title) {
      await this.page.locator(xpathFieldTitleNoti).clear();
      await this.page.locator(xpathFieldTitleNoti).fill(dataEdit.title);
    }
    if (dataEdit.product_name) {
      await this.page.locator(xpathFieldProductName).clear();
      await this.page.locator(xpathFieldProductName).fill(dataEdit.product_name);
    }
    if (dataEdit.time) {
      await this.page.locator(xpathFieldTimeNoti).clear();
      await this.page.locator(xpathFieldTimeNoti).fill(dataEdit.time);
    }
    if (
      await this.page
        .locator(`//div[(@class='save-setting-fixed') and not(contains(@style,'display: none;'))]`)
        .isVisible()
    ) {
      await this.clickOnBtnWithLabel("Save");
      await this.isToastMsgVisible("Your settings was updated successfully");
    }
  }

  /**
   * edit checkout Notifications
   * @param dataEdit
   */
  async editCheckoutNotifications(dataEdit: editCheckoutNotifications) {
    const xpathFieldMessage = "//input[@id='title-noti']";
    const xpathChooseImgOption = `//div[@class='setting-image']//label[ .//span[normalize-space()='${dataEdit.image}']]`;
    const xpathChooseFileImg = "//input[@type='file']";

    await this.clickBtnSettingNotifications("Checkout notifications");
    await this.page.click("//a[normalize-space()='Reset to default']");
    if (dataEdit.message) {
      await this.page.locator(xpathFieldMessage).clear();
      await this.page.locator(xpathFieldMessage).fill(dataEdit.message);
    }
    if (dataEdit.image) {
      switch (dataEdit.image) {
        case "Choose an image from our library":
          await this.genLoc(xpathChooseImgOption).setChecked(true);
          await this.genLoc(
            `(//div[contains(@class,'image-demo')])[${dataEdit.choose_an_image_from_our_library.index_img}]`,
          ).click();
          break;
        case "Upload your own image":
          await this.genLoc(xpathChooseImgOption).setChecked(true);
          await this.page.setInputFiles(xpathChooseFileImg, dataEdit.upload_your_own_image.file_path);
          await this.genLoc(xpathChooseFileImg).isHidden();
          break;
        default:
          break;
      }
    }
    await this.page.locator(`.card__header`).click({ delay: 1000 });
    if (
      await this.page
        .locator(`//div[(@class='save-setting-fixed') and not(contains(@style,'display: none;'))]`)
        .isVisible()
    ) {
      await this.clickOnBtnWithLabel("Save");
      await this.isToastMsgVisible("Your settings was updated successfully");
    }
  }

  /**
   * search Notifications
   * @param fieldItem
   * @param searchProduct
   */
  async searchNotifications(
    fieldItem: "All notifications" | "Sync notifications" | "Custom notifications",
    searchProduct: string,
  ) {
    const xpathFieldSelect = "//div[@class='s-select']//select";
    const xpathFieldSearch = "//input[@placeholder='Search by product...']";
    await this.page.selectOption(xpathFieldSelect, fieldItem);
    await this.page.locator(xpathFieldSearch).click();
    await this.page.locator(xpathFieldSearch).clear();
    await this.page.locator(xpathFieldSearch).fill(searchProduct);
    await this.page.keyboard.press("Enter");
    await this.waitForElementVisibleThenInvisible("//img[@class='sbase-spinner']");
  }

  /**
   * count Noti in table by condition
   * @param prodTitle
   * @param type
   * @returns
   */
  async countNoti(prodTitle?: string, type = ""): Promise<number> {
    try {
      const response = await this.authRequest.get(
        `https://${this.domain}/admin/copt/social-proof/count-sale-notifications.json`,
        {
          params: {
            product_title: prodTitle,
            types: type,
          },
        },
      );

      const res = await response.json();
      if (!res.count) {
        res.count = 0;
      }
      return res.count;
    } catch (error) {
      throw new Error(`Count noti failed with error: ${error}`);
    }
  }

  /**
   * add Custom Noti
   * @param dataEdit
   */
  async addCustomNoti(dataEdit: addCustomNoti): Promise<void> {
    // xpath for step add product
    const xpathSelectOption = "//div[contains(@class,'s-select')]//select";
    const xpathContentProduct = "//div[@class='content-product']";
    const xpathFieldSearch = "//input[@placeholder='Enter keyword to search']";
    const xpathAddProduct = `//div[@class='product-selector__item'][ .//div[normalize-space()='${dataEdit.product_name}']]//span[contains(@class,'product-action')]`;
    const xpathAddCollection = `//div[contains(@class,'product-selector__item')][ .//div[normalize-space()='${dataEdit.collection_name}']]//div[@class='product-action']//span`;

    // xpath for step add locations
    const xpathTypeLocation = `//label[contains(@class,'s-radio-block')][ .//span[normalize-space()='${dataEdit.locations_option}']]`;
    const xpathFieldSearchRandom = "//input[@placeholder='Type to search']";
    const xpathSelectLocation = `//span[@class='s-dropdown-item']//span[normalize-space()='${dataEdit.random_location}']`;
    const xpathFieldTxtManually = "//textarea[@class='s-textarea__inner']";

    await this.clickOnBtnWithLabel("Add a custom notification");
    // add product
    switch (dataEdit.select_option) {
      case "Products":
        await this.page.selectOption(xpathSelectOption, dataEdit.select_option);
        await this.clickOnBtnWithLabel("Select products");
        await this.page.waitForSelector(xpathContentProduct);
        await this.page.locator(xpathFieldSearch).fill(dataEdit.product_name);
        await this.page.keyboard.press("Enter");
        await this.page.waitForSelector(xpathContentProduct);
        await this.page.click(xpathAddProduct);
        await this.clickOnBtnWithLabel("Continue with selected products");
        break;
      case "Collections":
        await this.page.selectOption(xpathSelectOption, dataEdit.select_option);
        await this.clickOnBtnWithLabel("Select collections");
        await this.page.waitForSelector(xpathContentProduct);
        await this.page.locator(xpathFieldSearch).fill(dataEdit.collection_name);
        await this.page.keyboard.press("Enter");
        await this.page.waitForSelector(xpathContentProduct);
        await this.page.click(xpathAddCollection);
        await this.clickOnBtnWithLabel("Continue with selected collections");
        break;
      case "All products":
        await this.page.selectOption(xpathSelectOption, dataEdit.select_option);
        break;
      default:
        break;
    }
    // add location
    switch (dataEdit.locations_option) {
      case "Random locations":
        await this.page.locator(xpathTypeLocation).setChecked(true);
        await this.page.locator(xpathFieldSearchRandom).fill(dataEdit.random_location);
        await this.page.locator(xpathSelectLocation).click();
        break;
      case "Manually select locations":
        await this.page.locator(xpathTypeLocation).setChecked(true);
        await this.page.locator(xpathFieldTxtManually).fill(dataEdit.manual_location);
        break;
      default:
        break;
    }
    await this.clickOnBtnWithLabel("Create now");
  }

  /**
   * Delete notifications list by id of notifications
   */
  async deleteAllNoti(): Promise<void> {
    const info = await this.getInfoSaleNotificationsList();
    const getId: Array<string> = [];
    for (const item of info) {
      getId.push(item.id);
    }

    if (getId.length) {
      const res = await this.authRequest.delete(`https://${this.domain}/admin/copt/social-proof/notifications.json`, {
        params: {
          ids: getId.join(","),
        },
      });
      expect(res.status()).toBe(200);
    }
  }

  /**
   * delete Cache Noti
   */
  async deleteCacheNoti(typeNoti: "Sale noti" | "Checkout noti", productID?: number): Promise<void> {
    let res;
    if (typeNoti === "Sale noti") {
      res = await this.authRequest.get(`https://${this.domain}/api/copt/sale-notifications.json`, {
        params: {
          skip_cache: true,
        },
      });
    } else {
      res = await this.authRequest.get(`https://${this.domain}/api/copt/checkout-notifications.json`, {
        params: {
          limit: 50,
          page: 1,
          product_ids: productID,
          skip_cache: true,
        },
      });
    }
    expect(res.status()).toBe(200);
  }
}
