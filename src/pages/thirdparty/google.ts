import type { GoogleAnalyticEvent } from "@types";
import { Page } from "@playwright/test";
import { SBPage } from "../page";

export class GoogleAnalytic extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  googleTagAssistantDomain = "https://tagassistant.google.com";

  /**
   * Get events list to Google Analytic
   * @param tracking keyword for tracking
   * @param eventName name of event
   * @returns events list match with event name
   */
  async getEventsList(eventName: Array<string>, tracking = "google"): Promise<Array<GoogleAnalyticEvent>> {
    const events: Array<GoogleAnalyticEvent> = [];
    let trackingEvents: Array<GoogleAnalyticEvent>;
    do {
      trackingEvents = await this.page.evaluate(`window.sbTrackingLogs('${tracking}')`);
      await this.page.waitForTimeout(5000);
    } while (trackingEvents.length == 0);
    for (const name of eventName) {
      events.push(
        trackingEvents.reverse().find(event => {
          return event.event === name;
        }),
      );
    }
    return events;
  }

  /**
   * Get events list to Google Analytic
   * @param tracking keyword for tracking
   * @param eventName name of event
   * @returns events list match with event name
   */
  async connectDomainTagAssistant(domain: string): Promise<string> {
    await this.page.goto(this.googleTagAssistantDomain);
    await this.page.waitForLoadState("networkidle");
    this.page.locator('//button[contains(@class,"btn--new-domain") and normalize-space()="Add domain"]').click();
    await this.page.waitForSelector('//input[@id="domain-start-url"]');
    this.page.locator('//input[@id="domain-start-url"]').type("https://" + domain);
    this.page.locator('//button[@id="domain-start-button"]').click();
    const popup = await this.page.waitForEvent("popup");
    return popup.title();
  }
}
