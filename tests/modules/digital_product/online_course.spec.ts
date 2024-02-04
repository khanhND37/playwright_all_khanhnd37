import { expect, test } from "@core/fixtures";
import { OnlineCoursePage } from "@pages/digital_product/online_course";
import { SignInDigital } from "@pages/digital_product/storefront/sign_in";
import type { LectureData } from "@types";

test.describe("Verify online course", async () => {
  let onlineCourse: OnlineCoursePage;
  let signInDigital: SignInDigital;
  let customerToken: string;
  let accessToken: string;
  let lectureData: LectureData;

  test.beforeEach(async ({ page, conf, token }) => {
    signInDigital = new SignInDigital(page, conf.suiteConf.domain);
    onlineCourse = new OnlineCoursePage(page, conf.suiteConf.domain);
    await signInDigital.login(conf.suiteConf.email, conf.suiteConf.password);
    customerToken = await signInDigital.page.evaluate(() => window.localStorage.getItem("customerToken"));
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.user_email,
      password: conf.suiteConf.pwd_dashboard,
    });
    accessToken = shopToken.access_token;
  });

  test(`Kiểm tra hiển thị UI màn Course Online detail @TC_SB_DP_SF_PROD_36`, async ({ page, conf }) => {
    await test.step(`Tại màn My product, click vào một khóa học
    -> kiểm tra UI màn Course content player khóa học`, async () => {
      for (let i = 0; i < conf.caseConf.data.length; i++) {
        const key = conf.caseConf.data[i];
        const productDashboard = await onlineCourse.getProductDetailByApi(key.product_id, accessToken);
        const productSF = await onlineCourse.getDataProductSFByAPI(key.handle, customerToken);
        await onlineCourse.navigateToOnlineCourse(key.product_name);
        const numberCheckbox = await page.locator("//div[@class='check-mark-icon']").count();
        if (productSF.result.percent_complete == 0) {
          lectureData = await onlineCourse.lectureData();
          expect(await onlineCourse.getProgressBar()).toEqual("0% complete");
          for (let i = 1; i <= numberCheckbox; i++) {
            await expect(
              page.locator(`(//div[@class='check-mark-icon']//*[name()='svg']/*[local-name()='circle'])[${i}]`),
            ).toBeVisible();
          }
          expect(lectureData.lectureTitle).toEqual(productDashboard.data.products[0].sections[0].lectures[0].title);
          await expect(page.locator("//button[text()='Previous lecture']")).toBeHidden();
          await page.locator("//span[text()='Back to My Products']").click();
          expect(page.url()).toContain("/my-products");
        } else if (productSF.result.percent_complete == 100) {
          expect(
            await page.locator("//div[@class='check-mark-icon']//*[name()='svg']/*[local-name()='path']").count(),
          ).toEqual(numberCheckbox);
          expect(await onlineCourse.getProgressBar()).toEqual("100% complete");
          expect(await onlineCourse.getTextCongratulate()).toEqual(
            `Congratulations! You have completed ${productDashboard.data.products[0].product.title}`,
          );
          await page.locator("//button[text()='View other products']").click();
          expect(page.url()).toContain("/my-products");
        } else {
          lectureData = await onlineCourse.lectureData();
          const lectureTitleCurrent = await onlineCourse.getNextLectureByApi(key.handle, customerToken);
          expect(await onlineCourse.getProgressBar()).toEqual(`${productSF.result.percent_complete}% complete`);
          expect(lectureData).toEqual(
            expect.objectContaining({
              urlImage: lectureTitleCurrent.urlImage,
              urlVideo: lectureTitleCurrent.urlVideo,
              lectureTitle: lectureTitleCurrent.lectureTitle,
              lectureContent: lectureTitleCurrent.lectureContent,
              lectureFile: lectureTitleCurrent.lectureFile,
            }),
          );
        }
      }
    });
  });

  test(`Kiểm tra tên và thông tin các section của khóa học ở sidebar @TC_SB_DP_SF_PROD_37`, async ({ page, conf }) => {
    await onlineCourse.navigateToOnlineCourse(conf.caseConf.product_name);
    const productDashboard = await onlineCourse.getProductDetailByApi(conf.caseConf.product_id, accessToken);
    const productSF = await onlineCourse.getDataProductSFByAPI(conf.caseConf.handle, customerToken);

    await test.step(`Kiểm tra hiển thị tên, các section, lecture của khóa học.`, async () => {
      const lectureInSidebar = await onlineCourse.getDataLectureInSidebar();
      const numberSection = await page.locator("//div[@class='flex justify-space-between px8']").count();
      const handle = conf.caseConf.handle;
      const section = await onlineCourse.getSectionInSidebarByApi(handle, customerToken);
      expect(await onlineCourse.getCourseTitle()).toEqual(productDashboard.data.products[0].product.title);
      expect(numberSection).toEqual(productSF.result.sections.length);
      for (let i = 0; i < numberSection; i++) {
        expect(lectureInSidebar[i]).toEqual(
          expect.objectContaining({
            sectionTitle: section[i].sectionTitle,
            lectures: section[i].lecture,
          }),
        );
      }
    });

    await test.step(`Click vào vùng hiển thị của một section ở sidebar -> kiểm tra ẩn các lecture`, async () => {
      await onlineCourse.expandAndCollapseLecture();
      const numberSection = await page
        .locator("//div[@class='flex justify-space-between px8']//*[name()='svg']")
        .count();
      for (let i = 1; i <= numberSection; i++) {
        await expect(
          page.locator(
            `((//div[contains(@class,'flex direction-column dp-video-course__main__sidebar__sections__item')])[${i}]` +
              `//div[contains(@class,'check-mark-icon')])[1]`,
          ),
        ).toBeHidden();
      }
    });

    await test.step(`Click lại vào section đó -> kiểm tra hiển thị các lecture`, async () => {
      await onlineCourse.expandAndCollapseLecture();
      const numberSection = await page
        .locator("//div[@class='flex justify-space-between px8']//*[name()='svg']")
        .count();
      for (let i = 1; i <= numberSection; i++) {
        await expect(
          page.locator(
            `((//div[contains(@class,'flex direction-column dp-video-course__main__sidebar__sections__item')])[${i}]` +
              `//div[contains(@class,'check-mark-icon')])[1]`,
          ),
        ).toBeVisible();
      }
    });
  });

  test(`Kiểm tra nội dung của lecture có image @TC_SB_DP_SF_PROD_38`, async ({ conf }) => {
    await onlineCourse.navigateToOnlineCourse(conf.caseConf.product_name);
    for (let i = 0; i < conf.caseConf.lectures.length; i++) {
      const key = conf.caseConf.lectures[i];
      const result = await onlineCourse.getLectureInfByApi(
        conf.caseConf.handle,
        customerToken,
        key.lecture_title,
        key.section,
      );

      await test.step(`Click vào lecture có image -> Kiểm tra nội dung chi tiết của lecture.`, async () => {
        await onlineCourse.navigateToLecture(key.lecture_title);
        lectureData = await onlineCourse.lectureData();
        expect(lectureData).toEqual(
          expect.objectContaining({
            lectureTitle: result.lectureTitle,
            lectureContent: result.lectureContent,
            lectureFile: result.lectureFile,
            urlImage: result.urlImage,
            urlVideo: result.urlVideo,
          }),
        );
      });
    }

    await test.step(`Click button Resources trong lecture ở sidebar.`, async () => {
      const resourcesFiles = await onlineCourse.getResourceFiles();
      const files = await onlineCourse.getFileDownload();
      expect(resourcesFiles.length).toEqual(files.length);
      for (let i = 0; i < files.length; i++) {
        expect(resourcesFiles[i]).toEqual(files[i].fileTitle);
      }
    });
  });
});

test(`Kiểm tra mở trang Course  trực tiếp từ link URL @TC_SB_DP_SF_PROD_23`, async ({ page, conf }) => {
  await test.step(`Mở browser -> nhập link URL của khóa học và ấn phím Enter`, async () => {
    await page.goto(`https://${conf.suiteConf.domain}${conf.suiteConf.param_course}${conf.caseConf.handle_course}`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("//div[@class='login-template__header customer-container']//p[text()='Sign in']"),
    ).toBeVisible();
  });

  await test.step(`Điền đúng thông tin đăng nhập của khóa học -> click button Sign in`, async () => {
    const signInDigital = new SignInDigital(page, conf.suiteConf.domain);
    await signInDigital.inputAndClickSignIn(conf.suiteConf.email, conf.suiteConf.password);
    expect(await page.innerText("//p[@class='dp-video-course__main__sidebar__title']")).toEqual(
      conf.caseConf.course_title,
    );
  });

  await test.step(`Click button Back to My Products`, async () => {
    await page.locator("//span[text()='Back to My Products']").click();
    expect(page.url()).toContain("/my-products");
  });
});
