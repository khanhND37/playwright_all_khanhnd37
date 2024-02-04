import type { CoursePlayerStyleSettings, CoursePlayerContentSettings } from "@types";
import { Page } from "@playwright/test";
import { WebBuilder } from "./web_builder";

export class WbBlockCoursePlayerPage extends WebBuilder {
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  xpathCoursePlayer = "(//div[contains(@class, 'course-player-block')])[1]";
  course_content_xpath = "//div[contains(@class,'flex direction-column text-align-left course-player-sidebar')]";
  hide_content_button_xpath = "//div[@class='tooltip-container course-player-sidebar__collapse--tooltip']/*[1]";
  show_content_button_xpath = "//div[contains(@class, 'course-player-sidebar__collapse-icon--open')]/*[1]";
  xpathResizeTop = `//div[@resize-mode="height" and @data-resize="top"]`;

  /**
   * Thực hiện các action exclusive phần Design widget course player.
   * @params CoursePlayerStyleSettings design settings
   * @return void
   * */
  async handleFormCoursePlayer(setting: CoursePlayerStyleSettings): Promise<void> {
    if (setting.sidebar) {
      const optionXpath = `//div[@id="widget-popover" and not(contains(@style,'display: none'))]//ul[@class='widget-select__list']//li[@value='${setting.sidebar}']`;
      await this.genLoc(`//div[@data-widget-id='sidebar']//div[@class='widget-select']`).click();
      await this.genLoc(optionXpath).click();
    }
  }

  /**
   * Thực hiện các action exclusive phần Content widget course player.
   * @params CoursePlayerContentSettings content settings
   * @return void
   * */
  async handleContentCoursePlayer(setting: CoursePlayerContentSettings): Promise<void> {
    if (setting.progress_type) {
      const activeProgressType = await this.genLoc(
        `//div[contains(@data-widget-id,'progress_type')]//span[@class='sb-button--label']`,
      ).innerText();
      if (activeProgressType.toLowerCase() !== setting.progress_type) {
        await this.genLoc(`//div[contains(@data-widget-id,'progress_type')]//div[@class='widget-select']`).click();
        await this.genLoc(`//li[@value='${setting.progress_type}']`).click();
      }
    }
    if (setting.progress_icon) {
      await this.selectIcon("progress_icon", setting.progress_icon, true);
    }
  }
}
