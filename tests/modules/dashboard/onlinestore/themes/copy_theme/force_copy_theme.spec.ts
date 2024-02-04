import { expect, test } from "@core/fixtures";
import { ForceShareTheme } from "@pages/dashboard/force_copy_theme";
import type { LongThemeInfo, ThemeInfo } from "@types";

test.describe(`Verify feature Share themes by passing permission @TS_SB_OLS_THE_FUT`, async () => {
  let accessToken: string;
  let forceShareTheme: ForceShareTheme;
  test.beforeEach(async ({ dashboard, conf, token }) => {
    forceShareTheme = new ForceShareTheme(dashboard, conf.caseConf.domain);
    const tokenObject = await token.getWithCredentials({
      domain: conf.caseConf.shop_name,
      username: conf.caseConf.username,
      password: conf.caseConf.password,
    });
    accessToken = tokenObject.access_token;
    await forceShareTheme.navigateToMenu("Online Store");
  });

  test(`Roller-Verify copy theme Private:user là staff của shop @TC_SB_OLS_THE_FUT_73`, async ({
    dashboard,
    conf,
    token,
  }) => {
    let curThemeInfo: ThemeInfo;
    let moreThemeInfo: LongThemeInfo;
    let forceShareTheme2: ForceShareTheme;
    let themeNumber: number;
    const themeName = conf.suiteConf.theme_name;
    const expectTime = conf.suiteConf.time;
    const msg = conf.suiteConf.message;
    const status = conf.suiteConf.type.private;
    const limitTheme = conf.suiteConf.limit_theme;
    //get token
    const tokenObject2 = await token.getWithCredentials({
      domain: conf.caseConf.shop_name_2,
      username: conf.caseConf.username_2,
      password: conf.caseConf.password_2,
    });
    const accessToken2 = tokenObject2.access_token;

    await test.step(`Tại store 1, thực hiện lấy Theme ID của theme ở mục Current theme và mục More theme`, async () => {
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type.toLowerCase(),
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: expectCurTheme.type,
        }),
      );

      // get more themeId
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
        time: "",
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
          time: "",
        }),
      );

      // log out
      await forceShareTheme.clickMenuUserSetting();
      await Promise.all([
        dashboard.waitForNavigation(/*{ url: 'https://accounts.dev.shopbase.net/sign-in' }*/),
        dashboard.locator("text=Logout").click(),
      ]);
    });

    await test.step(`Login store 2, đi đến trang Theme`, async () => {
      forceShareTheme2 = new ForceShareTheme(dashboard, conf.caseConf.domain_2);
      await Promise.all([
        dashboard.waitForNavigation(/*{ url: 'https://accounts.dev.shopbase.net/shop/select' }*/),
        dashboard.locator("text=Logout").click(),
      ]);
      await forceShareTheme2.login({
        userId: conf.caseConf.user_id_2,
        shopId: conf.caseConf.shop_id_2,
        email: conf.caseConf.username_2,
        password: conf.caseConf.password_2,
      }),
      await forceShareTheme2.navigateToMenu("Online Store");
      await dashboard.waitForSelector("//div[normalize-space()='Theme name']");
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
    });

    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`Điền Current themeID đã copy ở step 1 vào trường Theme ID > click button Copy theme`, async () => {
      await forceShareTheme2.completeCopiedTheme(curThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeVisible();

      //get copied theme
      const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status);
      const copiedThemeInfo = {
        theme_id: copiedTheme.theme_id,
        type: copiedTheme.type.toLowerCase(),
        time: copiedTheme.time,
      };
      const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
        conf.caseConf.domain_2,
        accessToken2,
        themeName,
        status.toLowerCase(),
      );
      expect(copiedThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCopiedTheme.themeId.toString(),
          type: expectCopiedTheme.type,
          time: expectTime,
        }),
      );
    });

    await test.step(`Click button Copy a theme`, async () => {
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`copy theme ở More theme của store 1 sang store 2`, async () => {
      await forceShareTheme2.completeCopiedTheme(moreThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeVisible();
      await dashboard.reload();

      //get copied theme
      const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status);
      const copiedThemeInfo = {
        theme_id: copiedTheme.theme_id,
        type: copiedTheme.type.toLowerCase(),
        time: copiedTheme.time,
      };
      const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
        conf.caseConf.domain_2,
        accessToken2,
        themeName,
        status.toLowerCase(),
      );
      expect(copiedThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCopiedTheme.themeId.toString(),
          type: expectCopiedTheme.type,
          time: expectTime,
        }),
      );
    });
  });

  test(`Roller-Verify copy theme Private:user không là staff của shop @TC_SB_OLS_THE_FUT_72`, async ({
    dashboard,
    conf,
  }) => {
    let curThemeInfo: ThemeInfo;
    let moreThemeInfo: LongThemeInfo;
    let themeNumber: number;
    let forceShareTheme2: ForceShareTheme;
    const themeName = conf.suiteConf.theme_name;
    const msg = conf.suiteConf.message;
    const status = conf.suiteConf.type.private;
    const limitTheme = conf.suiteConf.limit_theme;
    await test.step(`Tại store 1, thực hiện lấy Theme ID của theme ở mục Current theme và mục More theme`, async () => {
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type.toLowerCase(),
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: expectCurTheme.type,
        }),
      );

      // get more theme
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
        time: "",
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
          time: "",
        }),
      );

      // log out
      await forceShareTheme.clickMenuUserSetting();
      await Promise.all([
        dashboard.waitForNavigation(/*{ url: 'https://accounts.dev.shopbase.net/sign-in' }*/),
        dashboard.locator("text=Logout").click(),
      ]);
    });

    await test.step(`Login store 2, đi đến trang Theme`, async () => {
      forceShareTheme2 = new ForceShareTheme(dashboard, conf.caseConf.domain_2);
      await Promise.all([dashboard.waitForNavigation(), dashboard.locator('button:has-text("Sign in")').click()]);
      await forceShareTheme2.login({
        userId: conf.caseConf.user_id_2,
        shopId: conf.caseConf.shop_id_2,
        email: conf.caseConf.username_2,
        password: conf.caseConf.password_2,
      }),
      //get theme number
      await forceShareTheme2.navigateToMenu("Online Store");
      await dashboard.waitForSelector("//div[normalize-space()='Theme name']");
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
    });

    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`Điền Current themeID đã copy ở step 1 vào trường Theme ID > click button Copy theme`, async () => {
      await forceShareTheme2.completeCopiedTheme(curThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_error}")]`)).toBeEnabled();
      await expect(dashboard.locator(`//div[@class="s-modal-wrapper"]`)).toBeVisible();

      //close popup copy theme
      await forceShareTheme2.closePopupCopyTheme();
      await expect(dashboard.locator(`//div[@class="s-modal-wrapper"]`)).not.toBeVisible();
      await dashboard.reload();

      //get number theme in more theme list
      const newThemeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      expect(themeNumber).toEqual(newThemeNumber);
    });

    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`copy theme ở More theme của store 1 sang store 2`, async () => {
      await forceShareTheme2.completeCopiedTheme(moreThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_error}")]`)).toBeEnabled();
      await expect(dashboard.locator(`//div[@class="s-modal-wrapper"]`)).toBeVisible();

      //close popup copy theme
      await forceShareTheme2.closePopupCopyTheme();
      await expect(dashboard.locator(`//div[@class="s-modal-wrapper"]`)).not.toBeVisible();
      await dashboard.reload();

      //get number theme in more theme list
      const newThemeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      expect(themeNumber).toEqual(newThemeNumber);
    });
  });

  test(`Roller-Verify copy theme Private: 2 shop thuộc cùng user @TC_SB_OLS_THE_FUT_71`, async ({
    dashboard,
    conf,
    token,
  }) => {
    let curThemeInfo: ThemeInfo;
    let moreThemeInfo: LongThemeInfo;
    let accessToken2: string;
    let themeNumber: number;
    let forceShareTheme2: ForceShareTheme;
    const themeName = conf.suiteConf.theme_name;
    const msg = conf.suiteConf.message;
    const status = conf.suiteConf.type.private;
    const expectTime = conf.suiteConf.time;
    const limitTheme = conf.suiteConf.limit_theme;

    await test.step(`Tại store 1, thực hiện lấy Theme ID của theme ở mục Current theme và mục More theme`, async () => {
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type.toLowerCase(),
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: expectCurTheme.type,
        }),
      );

      // get more themeId
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
        time: "",
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
          time: "",
        }),
      );
    });
    await test.step(`Login store 2, đi đến trang Theme`, async () => {
      forceShareTheme2 = new ForceShareTheme(dashboard, conf.caseConf.domain_2);
      //get token
      const tokenObject2 = await token.getWithCredentials({
        domain: conf.caseConf.shop_name_2,
        username: conf.caseConf.username,
        password: conf.caseConf.password,
      });
      accessToken2 = tokenObject2.access_token;
      await forceShareTheme2.goto(`/admin?x_key=${accessToken2}`);
      await forceShareTheme2.navigateToMenu("Online Store");

      //get number theme in more theme list
      await dashboard.waitForSelector("//div[normalize-space()='Theme name']");
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
    });
    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });
    await test.step(`Điền Current themeID đã copy ở step 1 vào trường Theme ID > click button Copy theme`, async () => {
      await forceShareTheme2.completeCopiedTheme(curThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeEnabled();

      //get new number theme in more theme list
      const newThemeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      if (newThemeNumber == themeNumber + 1) {
        //get copied theme
        const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status);
        const copiedThemeInfo = {
          theme_id: copiedTheme.theme_id,
          type: copiedTheme.type.toLowerCase(),
          time: copiedTheme.time,
        };
        const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
          conf.caseConf.domain_2,
          accessToken2,
          themeName,
          status.toLowerCase(),
        );
        expect(copiedThemeInfo).toEqual(
          expect.objectContaining({
            theme_id: expectCopiedTheme.themeId.toString(),
            type: expectCopiedTheme.type,
            time: expectTime,
          }),
        );
      }
    });
    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });
    await test.step(`copy theme ở More theme của store 1 sang store 2`, async () => {
      await forceShareTheme2.completeCopiedTheme(moreThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeEnabled();

      //get new number theme in more theme list
      const newThemeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      if (newThemeNumber == themeNumber + 2) {
        //get copied theme
        const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status);
        const copiedThemeInfo = {
          theme_id: copiedTheme.theme_id,
          type: copiedTheme.type.toLowerCase(),
        };
        const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
          conf.caseConf.domain_2,
          accessToken2,
          themeName,
          status.toLowerCase(),
        );
        expect(copiedThemeInfo).toEqual(
          expect.objectContaining({
            theme_id: expectCopiedTheme.themeId.toString(),
            type: expectCopiedTheme.type,
          }),
        );
      }
    });
  });

  test(`Roller-Verify copy theme Public: 2 store khác user @TC_SB_OLS_THE_FUT_70`, async ({
    dashboard,
    conf,
    token,
  }) => {
    let curThemeInfo: ThemeInfo;
    let moreThemeInfo: LongThemeInfo;
    let accessToken2: string;
    let themeNumber: number;
    let forceShareTheme2: ForceShareTheme;
    const themeName = conf.suiteConf.theme_name;
    const msg = conf.suiteConf.message;
    const status = conf.suiteConf.type;
    const limitTheme = conf.suiteConf.limit_theme;
    const expectTime = conf.suiteConf.time;

    await test.step(`Tại store 1, thực hiện lấy Theme ID của theme ở mục Current theme và mục More theme`, async () => {
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type.toLowerCase(),
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: expectCurTheme.type,
        }),
      );

      // get more themeId
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status.public);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
        time: "",
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.public.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
          time: "",
        }),
      );

      // log out
      await forceShareTheme.clickMenuUserSetting();
      await Promise.all([
        dashboard.waitForNavigation(/*{ url: 'https://accounts.dev.shopbase.net/sign-in' }*/),
        dashboard.locator("text=Logout").click(),
      ]);
    });

    await test.step(`Login store 2, đi đến trang Theme`, async () => {
      forceShareTheme2 = new ForceShareTheme(dashboard, conf.caseConf.domain_2);
      await Promise.all([
        dashboard.waitForNavigation(/*{ url: 'https://accounts.dev.shopbase.net/shop/select' }*/),
        dashboard.locator('button:has-text("Sign in")').click(),
      ]);
      await forceShareTheme2.login({
        userId: conf.caseConf.user_id_2,
        shopId: conf.caseConf.shop_id_2,
        email: conf.caseConf.username_2,
        password: conf.caseConf.password_2,
      });
      //get token
      const tokenObject2 = await token.getWithCredentials({
        domain: conf.caseConf.shop_name_2,
        username: conf.caseConf.username_2,
        password: conf.caseConf.password_2,
      });
      accessToken2 = tokenObject2.access_token;
      await forceShareTheme2.navigateToMenu("Online Store");

      //get number theme in more theme list
      await dashboard.waitForSelector("//div[normalize-space()='Theme name']");
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
    });

    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`Điền Current themeID đã copy ở step 1 vào trường Theme ID > click button Copy theme`, async () => {
      await forceShareTheme2.completeCopiedTheme(curThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeVisible();

      //get copied theme
      const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status.private);
      const copiedThemeInfo = {
        theme_id: copiedTheme.theme_id,
        type: copiedTheme.type.toLowerCase(),
        time: copiedTheme.time,
      };
      const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
        conf.caseConf.domain_2,
        accessToken2,
        themeName,
        status.private.toLowerCase(),
      );
      expect(copiedThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCopiedTheme.themeId.toString(),
          type: expectCopiedTheme.type,
          time: expectTime,
        }),
      );
    });

    await test.step(`Click button Copy a theme`, async () => {
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`copy theme ở More theme của store 1 sang store 2`, async () => {
      await forceShareTheme2.completeCopiedTheme(moreThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeEnabled();
      await dashboard.reload();

      //get copied theme
      const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status.private);
      const copiedThemeInfo = {
        theme_id: copiedTheme.theme_id,
        type: copiedTheme.type.toLowerCase(),
        time: copiedTheme.time,
      };
      const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
        conf.caseConf.domain_2,
        accessToken2,
        themeName,
        status.private.toLowerCase(),
      );
      expect(copiedThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCopiedTheme.themeId.toString(),
          type: expectCopiedTheme.type,
          time: expectTime,
        }),
      );
    });
  });

  test(`Roller-Verify copy theme Public: 2 shop thuộc cùng user @TC_SB_OLS_THE_FUT_69`, async ({
    dashboard,
    conf,
    token,
  }) => {
    let curThemeInfo: ThemeInfo;
    let moreThemeInfo: LongThemeInfo;
    let accessToken2: string;
    let themeNumber: number;
    let forceShareTheme2: ForceShareTheme;
    const themeName = conf.suiteConf.theme_name;
    const msg = conf.suiteConf.message;
    const status = conf.suiteConf.type;
    const limitTheme = conf.suiteConf.limit_theme;
    const expectTime = conf.suiteConf.time;

    await test.step(`Tại store 1, thực hiện lấy Theme ID của theme ở mục Current theme và mục More theme`, async () => {
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type.toLowerCase(),
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: expectCurTheme.type,
        }),
      );

      // get more themeId
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status.public);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
        time: "",
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.public.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
          time: "",
        }),
      );
    });

    await test.step(`Login store 2, đi đến trang Theme`, async () => {
      forceShareTheme2 = new ForceShareTheme(dashboard, conf.caseConf.domain_2);
      //get token
      const tokenObject2 = await token.getWithCredentials({
        domain: conf.caseConf.shop_name_2,
        username: conf.caseConf.username,
        password: conf.caseConf.password,
      });
      accessToken2 = tokenObject2.access_token;
      await forceShareTheme2.goto(`/admin?x_key=${accessToken2}`);
      await forceShareTheme2.navigateToMenu("Online Store");

      //get number theme in more theme list
      await dashboard.waitForSelector("//div[normalize-space()='Theme name']");
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
    });

    await test.step(`Click button Copy a theme`, async () => {
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`Điền Current themeID đã copy ở step 1 vào trường Theme ID > click button Copy theme`, async () => {
      await forceShareTheme2.completeCopiedTheme(curThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeEnabled();
      await dashboard.reload();

      //get copied theme
      const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status.private);
      const copiedThemeInfo = {
        theme_id: copiedTheme.theme_id,
        type: copiedTheme.type.toLowerCase(),
        time: copiedTheme.time,
      };
      const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
        conf.caseConf.domain_2,
        accessToken2,
        themeName,
        status.private.toLowerCase(),
      );
      expect(copiedThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCopiedTheme.themeId.toString(),
          type: expectCopiedTheme.type,
          time: expectTime,
        }),
      );
    });

    await test.step(`Click button Copy a theme`, async () => {
      themeNumber = await forceShareTheme2.getThemeNumberInMoreTheme();
      if (themeNumber >= limitTheme) {
        await forceShareTheme2.removeTheme(conf.suiteConf.index_remove);
        await forceShareTheme2.clickBtnCopyTheme();
      } else {
        await forceShareTheme2.clickBtnCopyTheme();
      }
    });

    await test.step(`copy theme ở More theme của store 1 sang store 2`, async () => {
      await forceShareTheme2.completeCopiedTheme(moreThemeInfo.theme_id);
      await expect(dashboard.locator(`//*[contains(text(),"${msg.copied_success}")]`)).toBeEnabled();
      await dashboard.reload();

      //get copied theme
      const copiedTheme = await forceShareTheme2.getThemeInMoreTheme(status.private);
      const copiedThemeInfo = {
        theme_id: copiedTheme.theme_id,
        type: copiedTheme.type.toLowerCase(),
        time: copiedTheme.time,
      };
      const expectCopiedTheme = await forceShareTheme2.getMoreThemeByAPI(
        conf.caseConf.domain_2,
        accessToken2,
        themeName,
        status.private.toLowerCase(),
      );
      expect(copiedThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCopiedTheme.themeId.toString(),
          type: expectCopiedTheme.type,
          time: expectTime,
        }),
      );
    });
  });

  test(`Roller-Verify Mark theme as Public/Private theme @TC_SB_OLS_THE_FUT_67`, async ({
    dashboard,
    conf,
    context,
  }) => {
    let curThemeInfo: ThemeInfo;
    let moreThemeInfo: ThemeInfo;
    const modalPublic = conf.suiteConf.modal_public;
    const modalPrivate = conf.suiteConf.modal_private;
    const msg = conf.suiteConf.message;
    const status = conf.suiteConf.type;
    const themeName = conf.suiteConf.theme_name;

    await test.step(`Tại mục Current theme, click "Action" -> Chọn option "Mark theme as Public"`, async () => {
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type,
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: status.private,
        }),
      );
      // click btn Actions
      await forceShareTheme.clickBtnAction(curThemeInfo.theme_id, true);
      const itemList = await forceShareTheme.getItemIntoDroplist();
      const expectItem = conf.caseConf.cur_action_item;
      expect(itemList).toEqual(expectItem);

      // click btn Mark As
      await forceShareTheme.clickBtnMarkAs(true);
      const modalInfo = await forceShareTheme.getModalInfo();
      const markAsModal = {
        title: modalInfo.title,
        description: modalInfo.description,
        btnUpdate: modalInfo.btnUpdate,
        btnCancel: modalInfo.btnCancel,
      };
      expect(markAsModal).toEqual(
        expect.objectContaining({
          title: modalPublic.title,
          description: modalPublic.description,
          btnUpdate: modalPublic.btn_update,
          btnCancel: modalPublic.btn_cancel,
        }),
      );
    });

    await test.step(`Click Learn more link`, async () => {
      const [helpDoc] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.locator(`//div[@class='s-modal-body']//a`).click(),
      ]);
      expect(helpDoc.url()).toContain("https://help.shopbase.com/en/article/copy-a-theme-to-another-store-1vv828t");
      await helpDoc.close();
    });

    await test.step(`Thực hiện close popup bằng cách click icon X`, async () => {
      await forceShareTheme.closePopupMarkAsTheme(false);
      await expect(dashboard.locator(`//div[@class="s-animation-content s-modal-content"]`)).not.toBeVisible();
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type,
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: status.private,
        }),
      );
    });

    await test.step(`Thực hiện mở lại popup Mark theme:Tại mục Current theme, click mục Action `, async () => {
      await forceShareTheme.clickBtnAction(curThemeInfo.theme_id, true);
      await forceShareTheme.clickBtnMarkAs(true);
    });

    await test.step(`Thực hiện close popup bằng cách click button Cancel: Click button Cancel`, async () => {
      await forceShareTheme.closePopupMarkAsTheme(true);
      await expect(dashboard.locator(`//div[@class="s-animation-content s-modal-content"]`)).not.toBeVisible();
      // get current theme
      const curTheme = await forceShareTheme.getCurrentTheme();
      curThemeInfo = {
        theme_id: curTheme.theme_id,
        type: curTheme.type,
      };
      const expectCurTheme = await forceShareTheme.getCurrentThemeByAPI(conf.caseConf.domain, accessToken);
      expect(curThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectCurTheme.themeId.toString(),
          type: status.private,
        }),
      );
    });

    await test.step(`Tại mục Current theme, click mục Action >Click vào action Mark theme as Public`, async () => {
      await forceShareTheme.clickBtnAction(curThemeInfo.theme_id, true);
      await forceShareTheme.clickBtnMarkAs(true);
      await expect(dashboard.locator(`//*[contains(text(),'${modalPublic.title}')]`)).toBeEnabled();
    });

    await test.step(`Click button Update`, async () => {
      await forceShareTheme.clickBtnUpdate();
      await expect(dashboard.locator(`//*[contains(text(),'${msg.change_type_success}')]`)).toBeEnabled();
      await dashboard.reload();
      // get current theme
      const newCurTheme = await forceShareTheme.getCurrentTheme();
      const newCurThemeInfo = {
        theme_id: newCurTheme.theme_id,
        type: newCurTheme.type,
      };
      expect(newCurThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: curThemeInfo.theme_id,
          type: status.public,
        }),
      );
    });

    await test.step(`Tại mục Current theme, click mục Action > Click vào action Mark theme as Private`, async () => {
      await forceShareTheme.clickBtnAction(curThemeInfo.theme_id, true);
      await forceShareTheme.clickBtnMarkAs(true);
      //get popup Mark as info
      const modalInfo = await forceShareTheme.getModalInfo();
      const markAsModal = {
        title: modalInfo.title,
        description: modalInfo.description,
        btnUpdate: modalInfo.btnUpdate,
        btnCancel: modalInfo.btnCancel,
      };
      expect(markAsModal).toEqual(
        expect.objectContaining({
          title: modalPrivate.title,
          description: modalPrivate.description,
          btnUpdate: modalPrivate.btn_update,
          btnCancel: modalPrivate.btn_cancel,
        }),
      );
    });

    await test.step(`Click button Update`, async () => {
      await forceShareTheme.clickBtnUpdate();
      await expect(dashboard.locator(`//*[contains(text(),'${msg.change_type_success}')]`)).toBeEnabled();
      await dashboard.reload();
      //get current theme info
      const newCurTheme = await forceShareTheme.getCurrentTheme();
      const newCurThemeInfo = {
        theme_id: newCurTheme.theme_id,
        type: newCurTheme.type,
      };
      expect(newCurThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: curThemeInfo.theme_id,
          type: status.private,
        }),
      );
    });

    await test.step(`Tại mục More theme, click "Action" -> Chọn option "Mark theme as Public"`, async () => {
      // get more themeId
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status.private);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.private.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
        }),
      );
      // click btn Actions
      await forceShareTheme.clickBtnAction(moreThemeInfo.theme_id, false);
      const itemList = await forceShareTheme.getItemIntoDroplist();
      const expectItem = conf.caseConf.themList_action_item;
      expect(itemList).toEqual(expectItem);

      // click btn Mark As
      await forceShareTheme.clickBtnMarkAs(false);
      const modalInfo = await forceShareTheme.getModalInfo();
      const markAsModal = {
        title: modalInfo.title,
        description: modalInfo.description,
        btnUpdate: modalInfo.btnUpdate,
        btnCancel: modalInfo.btnCancel,
      };
      expect(markAsModal).toEqual(
        expect.objectContaining({
          title: modalPublic.title,
          description: modalPublic.description,
          btnUpdate: modalPublic.btn_update,
          btnCancel: modalPublic.btn_cancel,
        }),
      );
    });

    await test.step(`Click button Update`, async () => {
      await forceShareTheme.clickBtnUpdate();
      await expect(dashboard.locator(`//*[contains(text(),'${msg.change_type_success}')]`)).toBeEnabled();
      // get more theme
      const newMoreTheme = await forceShareTheme.getThemeInMoreTheme(status.public);
      const newMoreThemeInfo = {
        theme_id: newMoreTheme.theme_id,
        type: newMoreTheme.type,
      };
      expect(newMoreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: moreThemeInfo.theme_id,
          type: status.public,
        }),
      );
    });

    await test.step(`Tại mục More theme, click "Action" -> Chọn option "Mark theme as Private"`, async () => {
      // get more themeId
      const moreTheme = await forceShareTheme.getThemeInMoreTheme(status.public);
      moreThemeInfo = {
        theme_id: moreTheme.theme_id,
        type: moreTheme.type.toLowerCase(),
      };
      const expectMoreTheme = await forceShareTheme.getMoreThemeByAPI(
        conf.caseConf.domain,
        accessToken,
        themeName,
        status.public.toLowerCase(),
      );
      expect(moreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: expectMoreTheme.themeId.toString(),
          type: expectMoreTheme.type,
        }),
      );
      // click btn Actions
      await forceShareTheme.clickBtnAction(moreThemeInfo.theme_id, false);

      // click btn Mark As
      await forceShareTheme.clickBtnMarkAs(false);
      const modalInfo = await forceShareTheme.getModalInfo();
      const markAsModal = {
        title: modalInfo.title,
        description: modalInfo.description,
        btnUpdate: modalInfo.btnUpdate,
        btnCancel: modalInfo.btnCancel,
      };
      expect(markAsModal).toEqual(
        expect.objectContaining({
          title: modalPrivate.title,
          description: modalPrivate.description,
          btnUpdate: modalPrivate.btn_update,
          btnCancel: modalPrivate.btn_cancel,
        }),
      );
    });

    await test.step(`Click button Update`, async () => {
      await forceShareTheme.clickBtnUpdate();
      await expect(dashboard.locator(`//*[contains(text(),'${msg.change_type_success}')]`)).toBeEnabled();
      await dashboard.reload();
      // get more theme
      const newMoreTheme = await forceShareTheme.getThemeInMoreTheme(status.private);
      const newMoreThemeInfo = {
        theme_id: newMoreTheme.theme_id,
        type: newMoreTheme.type,
      };
      expect(newMoreThemeInfo).toEqual(
        expect.objectContaining({
          theme_id: moreThemeInfo.theme_id,
          type: status.private,
        }),
      );
    });
  });
});
