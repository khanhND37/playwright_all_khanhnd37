import { SBPage } from "../page";
import { Page } from "@playwright/test";
import type { TrackingEvent } from "@types";

/**
 * Class for Facebook Tracking
 */
export class Facebook extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get list tracking event
   * @param type is type of tracking event
   * @param eventName is name of event
   */
  async getListTrackingEvent(type: string, eventName: string): Promise<TrackingEvent> {
    let dataEvent: TrackingEvent | undefined;
    do {
      const listTrackingEvent: Array<TrackingEvent> = await this.page.evaluate(`window.sbTrackingLogs('${type}')`);
      dataEvent = listTrackingEvent.find(event => event.event === eventName);
      await this.page.waitForTimeout(5000);
    } while (dataEvent === undefined);

    return dataEvent;
  }

  /**
   * Get value of tracking event by key
   * @param type is type of tracking event
   * @param eventName is name of event
   * @param key is key of tracking event
   */
  async getValueTrackingEventByKey(type: string, eventName: string, key: string): Promise<string> {
    await this.page.waitForLoadState("load");
    const trackingEvent = await this.getListTrackingEvent(type, eventName);
    return trackingEvent.value[key].toString();
  }
}
