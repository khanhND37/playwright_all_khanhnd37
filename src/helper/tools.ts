import { APIRequestContext } from "@playwright/test";
import type { StorePlanInfo } from "@types";
import { getUnixTime, addMinutes, addDays } from "@utils/datetime";

export class Tools {
  /**
   * To be use for frozen shop, reset charge in case auto top up fail
   * @param domain is shop domain need to update
   * @param userId is user id of shop
   * @param request use for API
   */
  async updateTopUpPending(domain: string, userId: number, request: APIRequestContext) {
    const autoTopup = await request.post(`https://${domain}/admin/qc-tools/global-market.json`, {
      data: {
        user_id: userId,
        action: "update_topup",
        status: "pending",
        scheduled_at: 1,
      },
    });
    if (!autoTopup.ok()) {
      return Promise.reject("Error: update user id");
    }
  }

  /**
   *
   * @param api
   * @param request
   * @param freeTrialInfo
   * @returns
   */
  async updateFreeTrialDate(api: string, request: APIRequestContext, freeTrialInfo: StorePlanInfo): Promise<number> {
    if (freeTrialInfo.end_free_trial_at && freeTrialInfo.end_free_trial_at_minute) {
      freeTrialInfo.end_free_trial_at = getUnixTime(addMinutes(freeTrialInfo.end_free_trial_at_minute)) / 1000;
      freeTrialInfo.subscription_expired_at =
        getUnixTime(addMinutes(freeTrialInfo.subscription_expired_at_minute)) / 1000;
    } else {
      freeTrialInfo.end_free_trial_at = getUnixTime(addDays(freeTrialInfo.end_free_trial_at)) / 1000;
      freeTrialInfo.subscription_expired_at = getUnixTime(addDays(freeTrialInfo.subscription_expired_at)) / 1000;
    }
    freeTrialInfo.created_at = new Date(getUnixTime(addDays(freeTrialInfo.created_at)) / 1000).getTime();
    const res = await request.post(`${api}/admin/qc-tools/update-qc-shop`, {
      data: freeTrialInfo,
    });
    return res.status();
  }

  /**
   * this tool used to change some params for anystore:
   * status
   * payment status
   * end free trial at
   * subscription expired at
   * package
   * package type
   *
   * @param api
   * @param request
   * @param storePlanInfo is an object include all params that can change for store
   * @returns
   */
  async updateStorePlan(api: string, request: APIRequestContext, storePlanInfo: StorePlanInfo) {
    const res = await request.post(`${api}/admin/qc-tools/update-qc-shop`, {
      data: storePlanInfo,
    });
    if (!res.ok()) {
      return Promise.reject("Error -> response status: " + (await res.status()));
    }
  }
}
