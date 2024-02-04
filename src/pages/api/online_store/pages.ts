import { APIRequestContext } from "@playwright/test";
import { ApplyTemplatePageResponse, PageData, PageResponse } from "@types";

export class PagesAPI {
  domain: string;
  request: APIRequestContext;
  requestURL: string;

  constructor(domain: string, request?: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get List pages on shop
   * @returns
   */
  async getListPages(): Promise<PageResponse> {
    const res = await this.request.get(`https://${this.domain}/admin/pages.json`, {
      params: {
        limit: 30,
        page: 1,
        total: true,
        order_by: "id",
        order_direction: "desc",
      },
    });
    if (res.ok()) {
      const resJson = await res.json();
      return resJson.pages;
    } else {
      throw new Error("Get list pages failed!");
    }
  }

  /**
   * Hàm tạo page khi shop publish theme v3
   * @param data
   * @param templateId: id của template apply (template store)
   * @returns
   */
  async createV3(data: PageData, templateId: number): Promise<[PageResponse, ApplyTemplatePageResponse]> {
    try {
      const resCreate = await this.request.post(`https://${this.domain}/admin/pages.json`, {
        data: {
          page: data,
        },
      });
      const resCreateJson = await resCreate.json();
      const resApply = await this.request.post(`https://${this.domain}/admin/themes/builder/page.json`, {
        data: {
          entity_id: resCreateJson.page.id,
          type: "page",
          template_id: templateId,
        },
      });
      const resApplyJson = await resApply.json();
      return [resCreateJson.page, resApplyJson.result];
    } catch (error) {
      throw new Error("Create page failed!");
    }
  }
}
