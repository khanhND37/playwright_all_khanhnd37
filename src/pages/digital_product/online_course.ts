import { SBPage } from "@pages/page";
import { expect, Page } from "@playwright/test";
import type { LectureData, Section, FileDownloads, Sections } from "@types";

export class OnlineCoursePage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Đi đến màn detail một khóa học
   * @param productTitle
   */
  async navigateToOnlineCourse(productTitle: string) {
    await this.genLoc(`//h5[text()='${productTitle}'] `).click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Mở một lecture trong khóa học
   * @param lectureTitle
   */
  async navigateToLecture(lectureTitle: string) {
    await this.page
      .locator(`//div[@class='dp-video-course__main__sidebar__sections']//p[text()='${lectureTitle}']`)
      .click();
  }

  /**
   * Get thông tin của product từ api product ở dashboard
   * @param productId là id của product tạo trong dashboard
   * @param accessToken
   * @returns hàm này return file json chứa thông tin của product trong dashboard
   */
  async getProductDetailByApi(productId: number, accessToken: string) {
    const res = await this.page.request.get(
      `https://${this.domain}/admin/digital-products/product/${productId}.json?access_token=${accessToken}`,
    );
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * Get thông tin product từ api product ở storefront
   * @param handle là product handle
   * @param token
   * @returns hàm này return file json thông tin của product ở sf
   */
  async getDataProductSFByAPI(handle: string, token: string) {
    const response = await this.page.request.get(
      `https://${this.domain}/api/digital-products/product/${handle}.json?handle=${handle}&token=${token}&type=`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get thông tin của section bao gồm: section title; lecture title; trạng thái complete lecture từ api
   * @param handle là product handle
   * @param token
   * @returns hàm này return mảng chứa các section, trong 1 section có: section title, mảng lecture
   */
  async getSectionInSidebarByApi(handle: string, token: string): Promise<Section> {
    const respone = await this.getDataProductSFByAPI(handle, token);
    const section = respone.result.sections.map(item => {
      return {
        sectionTitle: item.title,
        lecture: item.lectures.map(key => {
          return {
            lectureTitle: key.title,
            isCompletedLecture: key.is_completed,
          };
        }),
      };
    });
    return section;
  }

  /**
   * Get thông tin next lecture (lecture chưa hoàn thành) bằng api
   * @param handle là product handle
   * @param token
   * @returns hàm này return lại object lectureData chứa: urlImage, urlVideo, lectureTitle, lectureContent, lectureFile
   */
  async getNextLectureByApi(handle: string, token: string): Promise<LectureData> {
    const jsonResponse = await this.getDataProductSFByAPI(handle, token);
    const nextSection = jsonResponse.result.next_section_id;
    const nextLecture = jsonResponse.result.next_lecture_id;
    const sectionData = jsonResponse.result.sections.filter(sections => sections.id == nextSection);
    const lectureData = sectionData[0].lectures.filter(lectures => lectures.id == nextLecture);
    const files = [];
    if (lectureData[0].files.length !== 0) {
      for (let i = 0; i < lectureData[0].files.length; i++) {
        const file = {
          fileSize: lectureData[0].files[i].size,
          fileTitle: lectureData[0].files[i].name,
        };
        files.push(file);
      }
    }
    const video = {
      url: lectureData[0].video.path,
      duration: lectureData[0].video.duration,
    };
    const lecture = {
      lectureTitle: lectureData[0].title,
      lectureContent: lectureData[0].description,
      lectureFile: files,
      urlVideo: video,
      urlImage: lectureData[0].image.path,
    };
    return lecture;
  }

  /**
   * Get thông tin của một lecture cụ thể bằng api
   * @param handle là product handle
   * @param token
   * @param lectureTitle
   * @param sectionTitle
   * @returns hàm này return lại object lectureData chứa: urlImage, urlVideo, lectureTitle, lectureContent, lectureFile
   */
  async getLectureInfByApi(
    handle: string,
    token: string,
    lectureTitle: string,
    sectionTitle: string,
  ): Promise<LectureData> {
    const jsonResponse = await this.getDataProductSFByAPI(handle, token);
    const sectionData = jsonResponse.result.sections.filter(sections => sections.title == sectionTitle);
    const lectureData = sectionData[0].lectures.filter(lectures => lectures.title == lectureTitle);
    const files = [];
    if (lectureData[0].files.length !== 0) {
      for (let i = 0; i < lectureData[0].files.length; i++) {
        const file = {
          fileSize: lectureData[0].files[i].size,
          fileTitle: lectureData[0].files[i].name,
        };
        files.push(file);
      }
    }
    const video = {
      url: lectureData[0].video.path,
      duration: lectureData[0].video.duration,
    };
    const lecture = {
      lectureTitle: lectureData[0].title,
      lectureContent: lectureData[0].description.replace(/(\r|\n)/gm, ""),
      lectureFile: files,
      urlVideo: video,
      urlImage: lectureData[0].image.path,
    };
    return lecture;
  }

  /**
   * Get tên khóa học
   * @returns
   */
  async getCourseTitle(): Promise<string> {
    return this.getTextContent("//p[@class='dp-video-course__main__sidebar__title']");
  }

  /**
   * Get giá trị hiển thị ở progress bar = % lecture đã hoàn thành
   * @returns
   */
  async getProgressBar(): Promise<string> {
    return this.getTextContent("//div[@class='dp-video-course__main__sidebar__wrap-progress']/p");
  }

  /**
   * Get text congratulate ở màn complete course
   * @returns
   */
  async getTextCongratulate(): Promise<string> {
    return (await this.page.innerText("//div[@class='dp-video-course__main__content__congratulations--text']")).replace(
      "\n",
      " ",
    );
  }

  /**
   * Get danh sách file download của 1 lecture khi click button Resourse ở sidebar
   * @returnshàm này return lại mảng FileDownloads chứa các file, trong mỗi file có thông tin fileTitle
   */
  async getResourceFiles(): Promise<FileDownloads> {
    await this.page
      .locator("//div[@class='dp-video-course__main__sidebar__sections__lectures--active px8']//button")
      .click();
    const number = await this.genLoc(
      "//div[@class='flex pr16 dp-video-course__main__sidebar__sections__lectures--modal__wrapper']",
    ).count();
    const files = [];
    for (let i = 1; i <= number; i++) {
      const file = await this.getTextContent(
        `(//div[@class='dp-video-course__main__sidebar__sections__lectures--modal__title'])[${i}]`,
      );
      files.push(file);
    }
    return files;
  }

  /**
   * Get các thông tin hiển thị của section ở sidebar: section title; lection title, trạng thái hoàn thành của lecture
   * @returns hàm này return lại mảng các object Section chứa các thông tin: sectionTitle, lecture
   */
  async getDataLectureInSidebar(): Promise<Sections> {
    const numberSection = await this.genLoc("//div[@class='flex justify-space-between px8']").count();
    const sectionInSidebars = [];
    for (let i = 1; i <= numberSection; i++) {
      const sectionTitle = await this.getTextContent(
        `(//div[@class='dp-video-course__main__sidebar__sections__item__title'])[${i}]`,
      );
      const numLecture = await this.genLoc(
        `(//div[contains(@class,'flex direction-column dp-video-course__main__sidebar__sections__item')])[${i}]` +
          `//div[contains(@class,'check-mark-icon')]`,
      ).count();
      let isCompletedLecture;
      const lectures = [];
      for (let j = 1; j <= numLecture; j++) {
        const lectureTitle = await this.getTextContent(
          `(((//div[@class='flex direction-column dp-video-course__main__sidebar__sections__item'])[${i}]` +
            `//div[@class='flex']//p))[${j}]`,
        );
        if (
          await this.genLoc(
            `((//div[@class='flex direction-column dp-video-course__main__sidebar__sections__item'])[${i}]` +
              `//div[@class='check-mark-icon']//*[name()='svg']/*[local-name()='path'])[${j}]`,
          ).isVisible()
        ) {
          isCompletedLecture = true;
        } else {
          isCompletedLecture = false;
        }
        const lecture = {
          lectureTitle: lectureTitle,
          isCompletedLecture: isCompletedLecture,
        };
        lectures.push(lecture);
      }
      const section = {
        sectionTitle: sectionTitle,
        lectures: lectures,
      };
      sectionInSidebars.push(section);
    }
    return sectionInSidebars;
  }

  /**
   * Thực hiện expand/collapse lecture
   */
  async expandAndCollapseLecture() {
    const numberSection = await this.page
      .locator("//div[@class='flex justify-space-between px8']//*[name()='svg']")
      .count();
    for (let i = 1; i <= numberSection; i++) {
      await this.page.locator(`(//div[@class='flex justify-space-between px8']//*[name()='svg'])[${i}]`).click();
    }
  }

  /**
   * Get các thông tin của file download thuộc lecture đang hiển thị ở màn hình nội dung
   * @returns hàm này return lại mảng các obj FileDownload chứa các thông tin: fileTitle, fileSize
   */
  async getFileDownload(): Promise<FileDownloads> {
    const files = [];
    if (await this.genLoc("(//div[@class='flex direction-column download-file-card'])[1]").isVisible()) {
      const number = await this.page.locator("//div[@class='flex direction-column download-file-card']").count();
      for (let i = 1; i <= number; i++) {
        const file = {
          fileTitle: await this.getTextContent(`(//div[@class='download-file-card__info--name']/span)[${i}]`),
          fileSize: await this.getTextContent(`(//div[@class='download-file-card__info--size']/span)[${i}]`),
        };
        files.push(file);
      }
    }
    return files;
  }

  /**
   * Get thông tin lecture ở màn hình view nội dung
   * @returns hàm này return lại object lectureData chứa: urlImage, urlVideo, lectureTitle, lectureContent, lectureFile
   */
  async lectureData(): Promise<LectureData> {
    const lectureTitle = await this.getTextContent("//p[@class='dp-video-course__main__content__info__title']");
    const lectureContent = await this.page.innerHTML(
      "//div[@class='dp-video-course__main__content__info__description mb16']",
    );
    let urlImage = "";
    if (await this.genLoc("//div[@class='mt24 mx24']").isVisible()) {
      const url = await this.page.getAttribute("//div[@class='mt24 mx24']/img", "src");
      const text1 = url.indexOf("0");
      const text2 = url.indexOf("@");
      urlImage = url.replace(url.slice(text1, text2 + 1), "");
    }
    let urlVideo = {
      url: "",
      duration: "",
    };
    if (await this.genLoc("//div[@class='wistia_responsive_wrapper']//iframe").isVisible()) {
      urlVideo = {
        url: await this.page.getAttribute("//div[@class='wistia_responsive_wrapper']//iframe", "src"),
        duration: await this.getTextContent(
          "//div[@class='dp-video-course__main__sidebar__sections__lectures__time__length']",
        ),
      };
    }
    const leture = {
      urlImage: urlImage,
      urlVideo: urlVideo,
      lectureTitle: lectureTitle,
      lectureContent: lectureContent.replace(/(\r|\n)/gm, ""),
      lectureFile: await this.getFileDownload(),
    };
    return leture;
  }
}
