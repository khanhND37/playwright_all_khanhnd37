import { Page } from "@playwright/test";
import { PrintBasePage } from "@pages/dashboard/printbase";
import type { ConditionInfo, CustomOptionProductInfo, Layer, ProductValue } from "@types";
import { Campaign } from "@sf_pages/campaign";
import { AddLayersToGroupInfo, CustomizeGroup, GroupInfo } from "@types";

interface buttonClickOpenEditor {
  labelName: "Create Preview image" | "Create Print file" | "Next, create Print file" | "Create custom option only";
}

/**
 * Class for the Personalize page
 */

export class Personalize extends PrintBasePage {
  xpathType = "//div[child::label[contains(text(),'Type')]]//following-sibling::div//select";
  xpathValidate = "//div[child::label[normalize-space()='Type']]/parent::div[contains(@class,'is-required')]";
  xpathInputMinSize = "//div[child::label[normalize-space()='Min Size (optional)']]//following-sibling::div//input";
  xpathBlockValue = "(//div[child::div[normalize-space()='Value']]//parent::div)[1]";
  xpathInputPlaceholder =
    "//div[child::div[normalize-space()='Placeholder']]" + "//parent::div[contains(@class,'item__content')]//input";
  xpathMessageErrorValue =
    "(//div[child::div[normalize-space()='Value']]//parent::div//div[@class='s-form-item__error'])[1]";
  xpathIconPreview = "(//div[@class='s-tooltip-fixed']//span[@class='s-icon is-small'])[1]";
  xpathIconExitPreview = "//div[contains(@class,'border-header')]//i[contains(@class,'mdi-chevron-left')]";
  xpathPreviewPage = "//div[@id='app' and descendant::div[contains(@class,'new-editor-flow')]]";
  xpathImageEmptyPreviewPage = "//div[@class='editor__container']//img[@alt='empty editor']";
  xpathGoToCLipart = "//a[normalize-space()='Go to clipart library']";
  xpathImgeProduct =
    "(//div[contains(@class,'media-gallery-carousel--loaded')]" +
    "//img[contains(@class,'image sb-lazy priority progressive')])[1]";
  xpathImageCarousel =
    "//div[contains(@class,'media-gallery-carousel--loaded')]" +
    "//img[contains(@class,'image sb-lazy priority d-block')]";
  xpathProductSF = "//section[@class='container-page']//div[@class='row']";
  xpathErrorImageCO = "//div[contains(@class,'custom-options-warning cl-warning')]";
  xpathIconBackListCO =
    "//div[contains(@class,'custom-option-detail__container')]//i[contains(@class,'mdi-chevron-left')]";
  xpathIconDeleteCO = "//i[contains(@class,'mdi-delete')]";
  xpathTitleProduct = "//h2[normalize-space()='Title']";
  xpathPopupConditionalLogic =
    "//div[contains(@class,'animation-content s-modal-content') or contains(@class,'p-sm conditional-logic-container')]";
  xpathCOSF = "//div[contains(@class,'product-custom-option')]";
  xpathSelectOption = `${this.xpathPopupConditionalLogic}/div//div[contains(@class,'ruleIndex0')]/select//option`;
  xpathSelectOptionSF = "//div[contains(@class,'select-box')]//select//option";
  xpathError = `${this.xpathPopupConditionalLogic}//div//form[descendant::div[contains(@class,'s-select')]]//div[@class='s-form-item__error']`;
  xpathProgressUploadImage = "(//div[@class='s-progress-bar'])[1]";
  xpathInputLayerImage =
    "//button//following-sibling::label[normalize-space()= 'Add image']/following-sibling::input[@type='file']";

  xpathAddOptionGroup = "//a[normalize-space()='Add other options']";
  xpathCustomizeGroupDetail = "//div[@class='customize-group__container']";
  xpathListValuesGroupInCG = "//div[contains(@class,'group__item')]//div//span[1]";
  xpathRadioSF = "//div[@class='product-property__field']";
  xpathSectionCustomOption = "//div[contains(@class,'product-info')]//div[contains(@class,'section-custom-options')]";
  xpathPopupCancelOnEditor =
    "//div[@class='s-dialog s-modal is-active']//div[@class='s-modal-card s-animation-content']";
  xpathHeaderEditor = "//div[contains(@class,'new-editor-flow')]";
  xpathListCO = "//div[contains(@class,'product-property product-custom-option')]";
  xpathContainerCustomOption =
    "//div[contains(@class, 'line-height-normal') or @class ='text-detail__container' " +
    "or contains(@class,'s-form-item help-text__container') or contains(@class,'s-form-item custom-s-form')] | " +
    "//p[normalize-space()='* Note: By default, the first option will be selected']";
  xpathSidebarCustomOption = "//div[@class='right-sidebar__container expand']";
  xpathOpenOptionSidebar = ".expand-action__container > .s-icon > .mdi";
  xpathEditOption = ".custom-option__item .content__center";
  defaultValueFieldMsg = this.page.locator(this.xpathMessageError("Default value (prefill on storefront)"));

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathLinkTextPrintFile(label: string, index = 1): string {
    return `(//div[contains(text(),'${label}')])[${index}]`;
  }

  /**
   * get xpath image product in Order detail page
   * @param productTitle
   */
  getXpathImageProductInOrderDetail(productTitle: string, index = 1): string {
    return `(//div[@class='unfulfilled-card-container' and descendant::p[normalize-space()='${productTitle}']]//span[@class='image__wrapper']//img)[${index}]`;
  }

  /**
   /**
   * Xpath for message error
   * @param label
   * @returns xpathMessageError
   */
  xpathMessageError(label: string): string {
    return `//div[contains(@class,'s-form-item') and descendant::label[normalize-space()='${label}']]//div[@class='s-form-item__error']`;
  }

  /**
   * xpath for iframe of CO
   */
  xpathIframeCO(index = 1): string {
    return `(//following-sibling::div[@role='tabpanel']//iframe[contains(@id,'tiny-vue')])[${index}]`;
  }

  /**
   *
   * @param fontSide you can input "Back side"| "Front side" to check
   * @returns Function return list artwork of group
   */
  xpathListArtworkInGroup(fontSide: "Back side" | "Front side"): string {
    return `//span[normalize-space()='${fontSide}']/ancestor::div[contains(@class,'multiple-artwork')]`;
  }

  /**
   * xpath for custom option value on cart
   * @param titleProduct
   * @param index
   */
  xpathCustomOptionValue(titleProduct: string, index = 1): string {
    return (
      `(//div[contains(@class,'product-cart__details') and descendant::p[normalize-space() = '${titleProduct}']]` +
      `//p[contains(@class,'product-cart__property')])[${index}]`
    );
  }

  /**
   * xpath for icon add/remove conditional logic
   * @param classname is add or remove
   */
  xpathIconAddOrRemoveCondition(classname: string): string {
    return `//div[contains(@class,'actions')]//i[contains(@class,'${classname}')]`;
  }

  /**
   * xpath for check value of image on SF
   * @param imageClipart
   */
  xpathCheckValueImageOnSF(imageClipart: string): string {
    return (
      `//div[parent::div[contains(@class,'product-property')]]` +
      `//input[@value='${imageClipart}']/following-sibling::span`
    );
  }

  xpathCustomOptionList(): string {
    return this.getXpathByTagNameAndClass("div", "s-collapse custom-option-listing");
  }

  xpathValueCOShowOnSF(valueShow: string): string {
    return this.getXpathByTagNameAndClass("div", `${valueShow}`);
  }

  xpathDataCO(): string {
    return this.getXpathByTagNameAndClass("div", "s-collapse-item draggable-item is-active");
  }

  xpathBlockPictureChoice(): string {
    return this.getXpathByTagNameAndClass("div", "custom-option-detail__container");
  }

  xpathCollapseCO(): string {
    return "(//div[@class='s-collapse-item draggable-item']//div)[1]";
  }

  xpathActionImageWithLabel(label: string): string {
    return `//div[@id= 'editor-content']//span[contains(@data-label,'${label}')]`;
  }

  /**
   * click on icon delete image mockup
   */
  async clickOnIconDeleteMockup(): Promise<void> {
    await this.page.click("//div[@id= 'editor-content']//span[contains(@data-label,'Delete')]//i");
  }

  /**
   * xpath upload mockup preview image or print file
   * @param btnName
   */
  xpathBtnUploadMockup(btnName: string): string {
    return `//label[normalize-space()='${btnName}']//parent::div//following-sibling::input`;
  }

  /**
   * xpath image personalize
   * @param type
   */
  xpathImagePersonalize(type: string): string {
    return `//h3[normalize-space()='${type}']//parent::div//following-sibling::div//div[contains(@class,'justify-content-center')]`;
  }

  /**
   * xpath icon personalize
   * @param type
   * @param index
   */
  xpathIconPersonalize(type: string, index: number): string {
    return `(//h3[normalize-space()='${type}']//parent::div//following-sibling::div//div[contains(@class,'justify-content-center')]//i[contains(@class,'icon')])[${index}]`;
  }

  /**
   * xpath layer by layer name
   * @param layerName
   */
  xpathLayer(layerName: string): string {
    return `(//div[@class='s-input']//following-sibling::span[normalize-space()="${layerName}"])[1]`;
  }

  xpathLayerName(layerName: string): string {
    return `//h3[normalize-space()='${layerName}']`;
  }

  getXpathGroupInCustomizeGroupDetail(groupName: string): string {
    return `(//div[contains(@class,'group__item')]//span[normalize-space()='${groupName}'])[1]`;
  }

  /**
   * edit layer name on Editor page
   * @param layerName
   * @param newName
   */
  async editLayerName(layerName: string, newName: string): Promise<void> {
    await this.page.dblclick(this.xpathLayerName(layerName));
    const xpathInputLayerName = `//div[h3[normalize-space()='${layerName}']]//input`;
    await this.clearInPutData(xpathInputLayerName);
    await this.page.fill("//div[h3[contains(@class,'text-nowrap-ellipsis')]]//input", newName);
    await this.page.click("//span[contains(text(),'X')]//parent::div[@class='s-input s-input--prefix']//input");
    await this.page.waitForTimeout(3000);
  }

  xpathIconEyeLayer(layerName: string): string {
    return (
      `//div[@class='single-layer__container' and descendant::span[normalize-space() = '${layerName}' ]]` +
      `//div[@class='s-tooltip-fixed display-inline-block']//i[contains(@class,'mdi-eye')]`
    );
  }

  xpathToolTipOfLayer(layerName: string): string {
    return (
      `//div[@class='single-layer__container' and descendant::span[normalize-space() = '${layerName}' ]]` +
      `//span[contains(@class,'s-tooltip-fixed-content top is-black')][preceding-sibling::span[contains(@class,'s-icon is-small')]]`
    );
  }

  /**
   * add product and upload image mockup on product page
   * @param productInfo include product name, product type, product price, product quantity
   * @param imageMockup
   * @param buttonClickOpenEditor is button click to open editor
   */
  async addProductAndUploadMockupPreviewOrPrintFile(
    productInfo: ProductValue,
    imageMockup: string,
    buttonClickOpenEditor: buttonClickOpenEditor["labelName"] = "Create Preview image",
  ): Promise<void> {
    await this.addNewProductWithData(productInfo);
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    await this.clickOnBtnWithLabel(buttonClickOpenEditor);
    await this.uploadImagePreviewOrPrintfile(imageMockup);
  }

  /**
   * xpath image preview/ print file
   */
  xpathPreviewImageWithLabel(label: string): string {
    return `//div[child::h3[contains(.,'${label}')]]/following-sibling::div//img`;
  }

  async waitXpathPreviewImageWithLabel(label: string, retries = 5) {
    await this.page.waitForTimeout(3000);
    for (let i = 0; i < retries; i++) {
      if (!(await this.page.locator(this.xpathPreviewImageWithLabel(label)).isVisible({ timeout: 5000 }))) {
        await this.page.waitForTimeout(5000);
        await this.page.reload();
      } else {
        break;
      }
    }
  }

  xpathIconActionPreviewImageWithLabel(label: string, index = 1): string {
    return `//div[child::h3[contains(.,'${label}')]]/following-sibling::div//i[${index}]`;
  }

  /**
   * verify condition logic of custom option on SF
   */
  async verifyConditionLogicSF(conditionLogicShow: ConditionInfo): Promise<boolean> {
    for (let i = 0; i < conditionLogicShow.list_custom.length; i++) {
      const campaignSF = new Campaign(this.page, this.domain);
      await campaignSF.inputCustomOptionOnCampSF(conditionLogicShow.list_custom[i]);
      const valueShow = conditionLogicShow.then_show_value[i].split(",").map(item => item.trim());
      for (let j = 0; j < valueShow.length; j++) {
        if (
          (await this.page.locator(this.xpathValueCOShowOnSF(valueShow[j])).isVisible()) !==
          conditionLogicShow.is_show_value[i]
        ) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Add product then add condition logic of custom option
   * @param productInfo is product info
   * @param imagePreview
   * @param layerList is list layer
   * @param customOptions is list custom option
   * @param conditionalLogicInfo is condition logic info
   * @param buttonClickOpenEditor is button click to open editor
   */
  async addProductAndAddConditionLogicCO(
    productInfo: ProductValue,
    imagePreview: string,
    layerList: Array<Layer>,
    customOptions: Array<CustomOptionProductInfo>,
    conditionalLogicInfo?: Array<ConditionInfo>,
    buttonClickOpenEditor: buttonClickOpenEditor["labelName"] = "Create Preview image",
    groupInfos?: Array<GroupInfo>,
    layersGroupInfos?: Array<AddLayersToGroupInfo>,
    customGroupInfos?: CustomizeGroup,
  ): Promise<void> {
    if (buttonClickOpenEditor) {
      if (buttonClickOpenEditor === "Create custom option only") {
        await this.addNewProductWithData(productInfo);
        await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
        await this.clickBtnCustomOptionOnly();
        for (let i = 0; i < customOptions.length; i++) {
          await this.addNewCustomOptionWithData(customOptions[i]);
        }
        await this.clickOnBtnWithLabel("Save changes");
      } else {
        if (buttonClickOpenEditor === "Create Print file") {
          await this.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview, "Create Print file");
        } else {
          await this.addProductAndUploadMockupPreviewOrPrintFile(productInfo, imagePreview, "Create Preview image");
        }
        if (layerList) {
          await this.addLayers(layerList);
        }
        if (groupInfos) {
          await this.createGroupLayers(groupInfos);
        }
        if (layersGroupInfos) {
          await this.addLayersToGroup(layersGroupInfos);
        }
        if (customOptions) {
          await this.page.click(this.xpathIconExpand);
          await this.clickOnBtnWithLabel("Customize layer", 1);
          await this.addListCustomOptionOnEditor(customOptions);
          if (conditionalLogicInfo) {
            await this.addListConditionLogic(conditionalLogicInfo);
          }
          await this.clickOnBtnWithLabel("Save");
          if (await this.checkButtonVisible("Create")) {
            await this.clickOnBtnWithLabel("Create");
          }
        }
        if (customGroupInfos) {
          if (
            await this.page
              .locator(
                "//div[@class='right-sidebar__container expand']|//div[@class='right-sidebar__container height-content-update-ui expand']",
              )
              .isHidden()
          ) {
            await this.removeLiveChat();
            await this.clickBtnExpand();
          }
          await this.setupCustomizeGroupForPB(customGroupInfos);
        }
        await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
      }
    } else {
      await this.addNewProductWithData(productInfo);
    }
  }

  /**
   * Delete value of custom option
   */
  async deleteValueOfCustomOption(values: string): Promise<void> {
    const value = values.split(",").map(item => item.trim());
    const xpathCount = "//div[child::div[normalize-space()='Value']]//following-sibling::div";
    const countValue = await this.page.locator(xpathCount).count();
    const xpathValue = `${xpathCount}//input[@placeholder='Enter a value']`;
    for (let i = 1; i <= countValue; i++) {
      const valueCO = await this.page.locator(`(${xpathValue})[${i}]`).inputValue();
      for (let j = 1; j <= value.length; j++) {
        if (valueCO === value[j]) {
          await this.clearInPutData(`(${xpathValue})[${i}]`);
        }
      }
    }
  }

  /**
   * verify image of CO picture choice on SF
   * @param imageClipart
   */
  async verifyImageVisibleOnSF(imageClipart: string): Promise<boolean> {
    const value = imageClipart.split(",").map(item => item.trim());
    for (let i = 0; i < value.length; i++) {
      const checkImage = await this.page
        .locator(this.xpathCheckValueImageOnSF(value[i].replace(/(\.png|\.jpeg)/g, "").trim()))
        .isVisible();
      if (!checkImage) {
        return false;
      }
    }
    return true;
  }

  /**
   * verify select value of CO picture choice on Dashboard
   * @param xpathSelectOption
   * @param valueExpect
   */
  async verifySelectOption(xpathSelectOption, valueExpect): Promise<boolean> {
    const count = await this.page.locator(xpathSelectOption).count();
    for (let i = 1; i <= count; i++) {
      const value = await this.page.locator(`(${xpathSelectOption})[${i}]`).textContent();
      if (value.replace(/\n/g, "").trim() === valueExpect.replace(/(\.png|\.jpeg|.jpg)/g, "").trim()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate print file on order detail page
   * @param sectionGenerateOrder is "Yes, generate file for all unfulfilled items"
   * or "No, only generate for this ordered"
   * @param isTurnOnGenerate is turn on generate print file
   */
  async generatePrintFileOnOrderDetail(sectionGenerateOrder: string, isTurnOnGenerate = true): Promise<void> {
    if (isTurnOnGenerate) {
      const xpathTurnOnGenerate =
        "//label[descendant::span[normalize-space() = 'Turn the Print file generating on']]//input";
      const getStatusCheckboxTurnOnGenerate = await (
        await (await this.page.locator(xpathTurnOnGenerate).elementHandle()).getProperty("checked")
      ).jsonValue();
      if (getStatusCheckboxTurnOnGenerate === false) {
        await this.page.click(xpathTurnOnGenerate + "//following-sibling::span[@class='s-check']");
      }
      if (sectionGenerateOrder) {
        await this.clickRadioButtonWithLabel(sectionGenerateOrder);
      }
      const isBtnCreate = await this.checkLocatorVisible(
        "(//button[normalize-space()='Create' or child::*[normalize-space()='Create']])[1]",
      );
      if (isBtnCreate) {
        await this.clickOnBtnWithLabel("Create");
      } else {
        await this.clickOnBtnWithLabel("Generate");
      }
    }
  }

  /**
   * Upload mockup then generate print file on Order detail page
   * @param buttonLabel is "Upload your Print template" or "Upload your Preview image"
   * @param imageUpload is image upload
   * @param layers is list layer
   * @param customOptionName is name of custom option
   * @param customOptionInfo is list custom option
   * @param selectOption is "Yes, generate file for all unfulfilled items" or "No, only generate for this ordered"
   */
  async uploadThenGeneratePrintFileOnOrderDetail(
    buttonLabel: string,
    imageUpload: string,
    layers: Array<Layer>,
    customOptionName: string,
    customOptionInfo: Array<CustomOptionProductInfo>,
    selectOption: string,
  ): Promise<void> {
    await this.page.setInputFiles(this.xpathBtnUploadMockup(buttonLabel), `./data/shopbase/${imageUpload}`);
    await this.waitForElementVisibleThenInvisible(this.xpathIconLoading);
    await this.waitForElementVisibleThenInvisible(this.xpathProgressUploadImage);
    await this.addLayers(layers);
    await this.page.click(this.xpathIconExpand);
    await this.page.waitForTimeout(3000);
    const checkCOName = await this.page
      .locator(this.xpathCustomOptionName(customOptionName))
      .isVisible({ timeout: 5000 });
    if (checkCOName === true) {
      await this.page.click(this.xpathCustomOptionName(customOptionName));
    } else {
      await this.clickOnBtnWithLabel("Customize layer", 1);
    }
    await this.addListCustomOptionOnEditor(customOptionInfo);
    await this.clickOnBtnWithLabel("Save", 1);
    await this.clickRadioButtonWithLabel(selectOption);
    await this.clickOnBtnWithLabel("Create");
    await this.clickOnBtnWithLabel("Cancel");
    if (await this.page.locator(this.xpathBtnWithLabel("Leave page")).isVisible({ timeout: 5000 })) {
      await this.clickOnBtnWithLabel("Leave page");
    }
  }

  /**
   * Xpath of option Custom option picture choice by Name
   */
  getXpathOptionCOPictureChoiceByName(nameCO: string): string {
    return `//div[@class='product-property__field'][descendant::*[normalize-space()='${nameCO}']]//select//option`;
  }
}
