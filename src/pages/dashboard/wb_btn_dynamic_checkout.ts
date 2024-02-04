import { WebBuilder } from "@pages/dashboard/web_builder";

export class WbBtnPaypal extends WebBuilder {
  btnClosePPCPopup = `//div[contains(@class,'post-purchase-offer__close')]`;
  xpathBtnAddPPC = "//span[normalize-space()='Add to order']";

  xpathBtnNoThanksPPC = `//a[normalize-space()="No thanks, I'll pass"]`;
}
