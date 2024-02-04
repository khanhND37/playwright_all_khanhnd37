import { APIRequestContext, expect, Page } from "@playwright/test";
import type { ListPermissions } from "@types";
export class AccountSettingAPI {
  domain: string;
  request: APIRequestContext;
  page: Page;

  constructor(domain: string, request?: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  /**
   * edit Permissions can tick or untick permissions
   * @param staffId staff Id
   * @param permissions List Permissions
   * @param isFullAccess if true then is Full Access and don't care about param permissions else limit access
   */
  async editPermissions(staffId: number, isFullAccess: boolean, listPermissions?: ListPermissions): Promise<void> {
    const res = await this.request.put(`https://${this.domain}/admin/shop/staffs/${staffId}.json`, {
      data: {
        id: staffId,
        permissions: listPermissions,
        is_full_access: isFullAccess,
      },
    });

    await expect(res.status()).toBe(200);
  }
}
