import { expect } from "@playwright/test";
import type { WidgetInfo } from "@types";
import { DashboardPage } from "./dashboard";

export class HomePage extends DashboardPage {
  xpathBlockWidgetWithTitle(type: string, widgetTitle: string): string {
    return `//h5[normalize-space()='${widgetTitle}']//ancestor::div[contains(@class,'widget-dashboard-${type}-type')]`;
  }

  getXpathValueWidgetWithFieldClass(widgetType: string, widgetTitle: string, fieldClass: string): string {
    return `${this.xpathBlockWidgetWithTitle(widgetType, widgetTitle)}//*[contains(@class,'${fieldClass}')]`;
  }

  async getWidgetInfoTypeBasic(widgetTitle: string): Promise<WidgetInfo> {
    let desciption = "";
    let primaryButtonText = "";
    let primaryButtonLink = "";
    let secondaryButtonText = "";
    let secondaryButtonLink = "";
    let image = false;

    const isDescriptionVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "main-description"),
    ).isVisible();
    if (isDescriptionVisible) {
      desciption = await this.page.innerText(
        this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "main-description"),
      );
    }

    const isPrimaryButtonVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "primary-button"),
    ).isVisible();
    if (isPrimaryButtonVisible) {
      primaryButtonText = await this.page.innerText(
        this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "primary-button"),
      );
      primaryButtonLink = await this.page.getAttribute(
        this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "primary-button"),
        "href",
      );
    }

    const isSecondaryButtonVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "secondary-button"),
    ).isVisible();
    if (isSecondaryButtonVisible) {
      secondaryButtonText = await this.page.innerText(
        this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "secondary-button"),
      );
      secondaryButtonLink = await this.page.getAttribute(
        this.getXpathValueWidgetWithFieldClass("basic", widgetTitle, "secondary-button"),
        "href",
      );
    }

    const isImageVisible = await this.genLoc(
      `${this.xpathBlockWidgetWithTitle("basic", widgetTitle)}//img`,
    ).isVisible();
    if (isImageVisible) {
      image = true;
    }
    return {
      desciption: desciption,
      primaryButtonText: primaryButtonText,
      primaryButtonLink: primaryButtonLink,
      secondaryButtonText: secondaryButtonText,
      secondaryButtonLink: secondaryButtonLink,
      image: image,
    };
  }

  async getWidgetInfoTypeCenter(widgetTitle: string): Promise<WidgetInfo> {
    let desciption = "";
    let primaryButtonText = "";
    let primaryButtonLink = "";
    let image = false;

    const isDescriptionVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("center", widgetTitle, "main-description"),
    ).isVisible();
    if (isDescriptionVisible) {
      desciption = await this.page.innerText(
        this.getXpathValueWidgetWithFieldClass("center", widgetTitle, "main-description"),
      );
    }

    const isPrimaryButtonVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("center", widgetTitle, "primary-button"),
    ).isVisible();
    if (isPrimaryButtonVisible) {
      primaryButtonText = await this.page.innerText(
        this.getXpathValueWidgetWithFieldClass("center", widgetTitle, "primary-button"),
      );
      primaryButtonLink = await this.page.getAttribute(
        this.getXpathValueWidgetWithFieldClass("center", widgetTitle, "primary-button"),
        "href",
      );
    }

    const isImageVisible = await this.genLoc(
      `${this.xpathBlockWidgetWithTitle("center", widgetTitle)}//img`,
    ).isVisible();
    if (isImageVisible) {
      image = true;
    }
    return {
      desciption: desciption,
      primaryButtonText: primaryButtonText,
      primaryButtonLink: primaryButtonLink,
      image: image,
    };
  }

  async getWidgetInfoTypeList(widgetTitle: string): Promise<{
    description: string;
    subList: Array<{ titleList: string; descriptionList: string; imageURL: string }>;
  }> {
    let description = "";
    let titleList = "";
    let descriptionList = "";
    let imageURL = "";
    const subList = [];

    const isDescriptionVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "main-description"),
    ).isVisible();
    if (isDescriptionVisible) {
      description = await this.page.innerText(
        this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "main-description"),
      );
    }

    const isSubListWidgetVisible = await this.genLoc(
      this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "sub-list"),
    ).isVisible();
    if (isSubListWidgetVisible) {
      const totalSubListWidget = await this.genLoc(
        this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "list-sub-item s-flex"),
      ).count();

      for (let i = 1; i <= totalSubListWidget; i++) {
        titleList = await this.page.innerText(
          `(${this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "sub-title")})[${i}]`,
        );

        const isSubDescriptionWidgetVisible = await this.genLoc(
          `(${this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "sub-description")})[${i}]`,
        ).isVisible();
        if (isSubDescriptionWidgetVisible) {
          descriptionList = await this.page.innerText(
            `(${this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "sub-description")})[${i}]`,
          );
        }

        const isSubLinkWidgetVisible = await this.genLoc(
          `(${this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "sub-item-assets")}//img)[${i}]`,
        ).isVisible();
        if (isSubLinkWidgetVisible) {
          imageURL = await this.page.getAttribute(
            `(${this.getXpathValueWidgetWithFieldClass("list", widgetTitle, "sub-item-assets")}//img)[${i}]`,
            "src",
          );
        }

        const subListWidget = {
          titleList: titleList,
          descriptionList: descriptionList,
          imageURL: imageURL,
        };
        subList.push(subListWidget);
      }
    }
    return {
      description: description,
      subList: subList,
    };
  }

  // clear cache để hiển thị widget ở dashboard sau khi tạo
  async clearCacheOfWidget(domain: string, accessToken: string, param: string): Promise<Array<number>> {
    const res = await this.page.request.get(`https://${domain}/admin/dashboards/widget-dashboard.json?${param}`, {
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
    expect(res.status()).toBe(200);
    const response = await res.json();
    const listWidgetId = response.list.map(item => {
      return item.id;
    });
    return listWidgetId;
  }
}
