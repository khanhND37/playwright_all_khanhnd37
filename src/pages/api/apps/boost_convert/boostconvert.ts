import { AppsAPI } from "@pages/api/apps";
import { APIRequestContext, expect } from "@playwright/test";
import type { settingCustomize, editProductCountdown, editRealTimeVisitor } from "@types";

export class BoostConvertAPI extends AppsAPI {
  shopId: number;

  constructor(domain: string, shopId?: number, request?: APIRequestContext) {
    super(domain, request);
    this.shopId = shopId;
  }

  /**
   * Get ids list of notifications at Notifications list
   */
  async getIdsAtNotificationsList() {
    try {
      const res = await this.request.get(
        `https://${this.domain}/admin/copt/social-proof/sale-notifications.json?product_title=&types=&page=1&limit=5&sort_field=id&sort_mode=desc`,
      );
      expect(res.status()).toBe(200);
      const resBody = await res.json();
      let ids = [];
      if (resBody.notifications) {
        ids = resBody.notifications.map(notification => notification.id);
      }
      return ids;
    } catch (e) {
      throw new Error("Get Ids Notification list failed");
    }
  }

  /**
   * Delete notifications list by id of notifications
   */
  async deleteAllNotificationsList() {
    const getId = await this.getIdsAtNotificationsList();
    if (getId.length) {
      const res = await this.request.delete(`https://${this.domain}/admin/copt/social-proof/notifications.json`, {
        params: {
          ids: getId.join(","),
        },
      });
      expect(res.status()).toBe(200);
    }
  }

  /**
   * Get total of notifications on storefront
   */
  async getTotalNotiAtSF(locale?) {
    let res;
    if (locale) {
      res = await this.request.get(`https://${this.domain}/api/copt/sale-notifications.json?limit=50&page=1`, {
        headers: {
          "X-Lang": locale,
        },
      });
    } else {
      res = await this.request.get(`https://${this.domain}/api/copt/sale-notifications.json?limit=50&page=1`);
    }
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.total;
  }

  /**
   * Get response of Countdown Timer in dashboard
   */
  async getCountdownTimer() {
    const res = await this.request.get(`https://${this.domain}/admin/copt/timers.json?page=1`);
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * Delete countdown timer list in dashboard
   */
  async deleteAllCountdownTimer() {
    const getTimer = await this.getCountdownTimer();
    let ids = [];
    if (getTimer) {
      ids = getTimer.timers.map(timers => timers.id);
    }

    if (ids.length) {
      const res = await this.request.delete(`https://${this.domain}/admin/copt/timers/bulk-delete.json`, {
        data: {
          ids: ids,
        },
      });
      expect(res.status()).toBe(204);
    }
  }

  /**
   * Edit Customize page of Countdown Tools
   */
  async settingsCustomize(set: settingCustomize) {
    const res = await this.request.put(`https://${this.domain}/admin/copt/countdown/customize.json`, {
      data: {
        settings: set,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * This method is used to edit data of Product Countdown page
   */
  async editProductCountdown(data: editProductCountdown) {
    const res = await this.request.put(`https://${this.domain}/admin/copt/timers/product-countdown/settings.json`, {
      data: {
        settings: data,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * This method is used to edit data of RealTime Visitors page
   */
  async editRealtimeVisitor(set: editRealTimeVisitor) {
    const res = await this.request.put(`https://${this.domain}/admin/copt/timers/realtime-visitors/settings.json`, {
      data: {
        settings: set,
      },
    });
    expect(res.status()).toBe(200);
  }
}
