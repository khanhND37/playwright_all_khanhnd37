import { Page } from "@playwright/test";
import { SBPage } from "../page";
import { GoogleAdsEvent } from "@types";

export class GoogleAds extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get events list to Google Analytic
   * @param tracking keyword for tracking
   * @param eventName name of event
   * @returns events list match with event name
   */
  async getEventsList(eventName: string, tracking = "google"): Promise<Array<GoogleAdsEvent>> {
    let listTrackingEvent: Array<GoogleAdsEvent>;
    let dataEvent: Array<GoogleAdsEvent> | undefined;
    do {
      listTrackingEvent = await await this.page.evaluate(`window.sbTrackingLogs('${tracking}')`);
      await this.page.waitForTimeout(5000);
      dataEvent = listTrackingEvent.reverse().filter(event => event.event === eventName);
    } while (dataEvent.length == 0);
    return dataEvent;
  }
}
