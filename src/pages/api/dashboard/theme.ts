import { APIRequestContext, Page, expect } from "@playwright/test";

export class ThemeAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  async getListThemes() {
    const res = await this.request.get(`https://${this.domain}/admin/themes.json`);
    expect(res.status()).toBe(200);
    const jsonRes = await res.json();
    return jsonRes.shop_themes;
  }

  async deleteTheme(id: number) {
    const res = await this.request.delete(`https://${this.domain}/admin/themes/${id}.json`);
    expect(res.status()).toBe(200);
  }

  async getPublishedThemeInfo() {
    const res = await this.request.get(`https://${this.domain}/api/bootstrap/next.json`);
    expect(res.status()).toBe(200);
    const jsonRes = await res.json();
    return jsonRes.result.theme;
  }

  async getPreviewThemeInfo(id: number) {
    const res = await this.request.get(`https://${this.domain}/api/bootstrap/next.json`, {
      params: {
        theme_preview_id: id,
      },
    });
    expect(res.status()).toBe(200);
    const jsonRes = await res.json();
    return jsonRes.result.theme;
  }

  async renameTheme(id: number, name: string) {
    const res = await this.request.put(`https://${this.domain}/admin/themes/${id}.json`, {
      data: {
        id: id,
        name: name,
      },
    });
    expect(res.status()).toBe(200);
  }
}
