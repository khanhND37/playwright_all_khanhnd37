import { Locator, Page } from "@playwright/test";
import { SFProduct } from "./product";

export class SFBlocks extends SFProduct {
  blockTabsLv0 = this.genLoc("[component=tabs][selector-id*=page-data]");
  blockTabsLv1 = this.blockTabsLv0.locator("[component=tabs]");
  tabsLayout = this.genLoc("div.tabs");
  blockAccordionLv0 = this.genLoc("[component=accordion][selector-id*=page-data]");
  blockAccordionLv1 = this.blockAccordionLv0.locator("[component=accordion]");
  accordionIcon = this.genLoc("i.accordion__icon");
  accordionItemGroup = this.genLoc(".accordion__item--group");
  variable = this.genLoc("span[data-type='variable']");
  tabsHeading = this.genLoc(".tabs__headings-wrapper");
  accordionHeading = this.genLoc(".accordion__heading");
  blockParagraph = this.genLoc("[component=paragraph]");
  tabsAccordionItem = this.genLoc("section.section");
  mainSF = this.genLoc("#wb-main");
  menuIcon = this.genLoc(".menu__material-icon");
  menuHamburger = this.genLoc(".items-center.menu__material-icon");
  menuPopover = this.genLoc(".menu-mobile__popover");
  menuContent = ".menu-mobile__content";
  menuExpandIcon = this.genLoc(".menu__item--expand-icon");
  menuBackParent = this.genLoc(".back-menu-parent");
  menuItems = ".menu-popover-item";
  section = this.genLoc(".section");
  shopLogo = "[component=block_image]";
  blockCollectionList = "[component=collection_list]";
  blockForm = "[component=block_form]";
  blockSocial = "[component=social]";
  blockFeaturedCollection = "[component=featured_collection]";
  blockAllReview = "[component=all_reviews]";
  blockProductList = "[component=product_list]";
  stickyAddToCart = this.genLoc(".sticky__container");
  sectionProductDetail = "//section[@data-section-id][3]";
  sectionHeader = "//section[@data-section-id][2]";
  blockmenu = "//div[@class='menu']";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get Locator của icon heading accordion
   * @param heading: Heading title
   * @param position
   * @returns
   */
  getAccordionHeadingIcon(block: Locator, heading: string, position?: "left" | "right"): Locator {
    const IconXpath = {
      left: "preceding-sibling",
      right: "following-sibling",
    };
    const ele = position
      ? block.locator(".accordion__heading").filter({ hasText: heading }).locator(`//${IconXpath[position]}::i`)
      : block.locator(".accordion__heading").filter({ hasText: heading });
    return ele;
  }

  /**
   * xpath Items Menu
   * @param item
   * @param index
   * @returns
   */
  xpathItemsMenu(item: string, index = 1): string {
    return `(//span[normalize-space()='${item}'])[${index}]`;
  }

  /**
   * xpath Expand Icon Of Item Menu
   * @param item
   * @returns
   */
  xpathExpandIconOfItemMenu(item: string): string {
    return `//div[@aria-haspopup='menu'][ .//span[normalize-space()='${item}']]//div[contains(@class,'menu__item--expand-icon')]`;
  }

  /**
   * xpath Sub Lv1 Of Item Menu
   * @param item
   * @returns
   */
  xpathSubLvOfItemMenu(subLV: "sub-lv1" | "sub-lv2"): string {
    return `//ul[contains(@class,'${subLV}')]`;
  }
}
