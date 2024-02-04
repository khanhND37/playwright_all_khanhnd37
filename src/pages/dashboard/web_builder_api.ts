/* eslint-disable max-len */
import { APIRequestContext } from "@playwright/test";
import {
  CreateProductTemplateParams,
  CreateProductTemplateResponse,
  LearningWBResponse,
  ListTemplateParams,
  ListTemplateResponse,
  OnboardingWBResponse,
  RenameProductTemplatePayload,
  RenameProductTemplateResponse,
} from "@types";

export class WebBuilderAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get status onboarding web builder
   * @returns onboarding web builder, include status onboarding, step onboarding,...
   */
  async getOnboardingWB(): Promise<OnboardingWBResponse> {
    const rawResponse = await this.request.get(`https://${this.domain}/admin/themes/builder/onboarding.json`);

    if (rawResponse.ok()) {
      const res = await rawResponse.json();
      return res;
    }
  }

  /**
   * Get list card learning onboarding
   * @returns list card learning onboarding
   */
  async getListCardOnboarding(): Promise<LearningWBResponse> {
    const rawResponse = await this.request.get(`https://${this.domain}/admin/themes/builder/onboarding/learning.json`);

    if (rawResponse.ok()) {
      const res = await rawResponse.json();
      return res;
    }
  }

  /**
   * API request to reset onboarding web builder
   * @returns list card learning onboarding
   */
  async resetOnboarding(): Promise<LearningWBResponse> {
    const rawResponse = await this.request.put(
      `https://${this.domain}/admin/themes/builder/onboarding.json?status=true`,
    );

    if (rawResponse.ok()) {
      const res = await rawResponse.json();
      return res;
    }
    return Promise.reject("Error in resetOnboarding");
  }

  /**
   * Reset status trigger card onboarding first time
   * @param trigger trigger code. Ex: click_element:button_insert, click_element:styling_settings_site_buttons,...
   * @returns list card learning onboarding
   */
  async statusTriggerCardOnboarding(trigger: string, status: string): Promise<LearningWBResponse> {
    const rawResponse = await this.request.get(
      `https://${this.domain}/admin/themes/builder/onboarding/learning/${trigger}.json?status=${status}}`,
    );
    if (rawResponse.ok()) {
      const res = await rawResponse.json();
      return res;
    }
    return Promise.reject("Error in statusTriggerCardOnboarding");
  }

  /**
   * Get list of custom product template
   * @param themeId shop theme id
   * @returns list of custom product template
   */
  async getListTemplate(params: ListTemplateParams): Promise<ListTemplateResponse> {
    const res = await this.request.get(`https://${this.domain}/admin/themes/builder/pages.json`, {
      params,
    });
    if (res.ok()) {
      const resJson = await res.json();
      return resJson;
    }
    throw new Error("Rename template failed");
  }

  /**
   * Create custom product template
   * @param title Name of template
   * @param templateId Name of template
   * @returns return true if request success
   */
  async createProductTemplate(params: CreateProductTemplateParams): Promise<CreateProductTemplateResponse> {
    const res = await this.request.post(`https://${this.domain}/admin/themes/builder/page.json`, {
      data: params,
    });
    if (!res.ok()) {
      throw new Error("Create template failed");
    }

    const resJson = await res.json();
    // api sẽ trả về success = false nếu tạo template thất bại
    if (!resJson.success) {
      throw new Error("Create template failed");
    }
    return resJson.success;
  }

  /**
   * Rename custom product template
   * @param id ID of template
   * @param payload Object contains edited data
   * @returns return true if request success
   */
  async renameProductTemplate(
    id: number,
    payload: RenameProductTemplatePayload,
  ): Promise<RenameProductTemplateResponse> {
    const res = await this.request.put(`https://${this.domain}/admin/themes/builder/pagev2/${id}.json`, {
      data: { ...payload },
    });
    if (res.ok()) {
      const resJson = await res.json();
      return resJson.success;
    }
    throw new Error("Rename template failed");
  }
  /**
   * Delete custom product template
   * @param id ID of template
   * @returns return true if request success
   */

  async deleteProductTemplate(id: number): Promise<RenameProductTemplateResponse> {
    try {
      const res = await this.request.delete(`https://${this.domain}/admin/themes/builder/page/${id}.json`);
      const resJson = await res.json();
      return resJson.success;
    } catch (error) {
      throw new Error("Delete template failed");
    }
  }
}
