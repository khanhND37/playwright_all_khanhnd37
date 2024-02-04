import { expect, test } from "@core/fixtures";
import { CreatorPage } from "@pages/dashboard/creator";
import { snapshotDir } from "@core/utils/theme";
import { generateRandomCharacters } from "@core/utils/string";

test.describe("Verify update onboarding flow for merchant to create SB Creator @TC", async () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`Verify create SB Creator quickly for merchant who comes from landing page với
  url sign up creator @TC_SB_DP_DB_TC_CR_3`, async ({ page, conf, snapshotFixture }) => {
    const domain = conf.suiteConf.accounts_domain;
    const creatorPage = new CreatorPage(page, conf.suiteConf.domain);
    const rando = generateRandomCharacters(6).toLowerCase();

    await test.step(`Điều hướng accounts.shopbase.com với các url params signup creator `, async () => {
      await page.goto(`https://${domain}/sign-up?creator=true`);
      await snapshotFixture.verify({
        page: page,
        selector: creatorPage.xpathLogo,
        snapshotName: conf.caseConf.snapshot_logo,
      });
      const titlePage = await page.locator(creatorPage.xpathLoginTitle).innerText();
      expect(conf.caseConf.title_signup).toContain(titlePage);
    });

    await test.step(`Nhập Email, Password, Shopname -> Click Sign up. Verify hiển thị
    màn add new thông tin`, async () => {
      creatorPage.signUpCreatorStore(page, conf.caseConf.data, rando);
      await page.waitForSelector(creatorPage.xpathLabelCoutryStore);
      await snapshotFixture.verify({
        page: page,
        selector: creatorPage.xpathScreenAddYourContact,
        snapshotName: conf.caseConf.snapshot_add_new_contact,
      });
    });

    await test.step(`Điền thông tin màn Add your contact -> Click chọn btn Next.
    -> Verify hoàn tất flow onboarding`, async () => {
      await creatorPage.addYourContact(page, conf.caseConf.data);
      await page.locator(creatorPage.xpathBtnNext).click();
      await creatorPage.page.waitForSelector(creatorPage.getXpathStepCustomShop(1));
      await creatorPage.page.waitForSelector(creatorPage.getXpathStepCustomShop(2));
      await creatorPage.page.waitForSelector(creatorPage.getXpathStepCustomShop(3));
      await creatorPage.page.waitForSelector(creatorPage.xpathWelcome);
      const shopName = `${`${conf.suiteConf.shop_name} ${rando}`.replaceAll(" ", "-")}.${conf.suiteConf.env_domain}`;
      expect(await creatorPage.genLoc(creatorPage.xpathShopName).textContent()).toEqual(shopName);
    });

    await test.step(` Click thông tin account góc trái màn hình, chọn Select another shop
      -> Đi đến màn Select a shop`, async () => {
      await page.locator(creatorPage.xpathShopName).click();
      if (await page.locator(creatorPage.xpathSelectAnotherShop).isVisible()) {
        await page.locator(creatorPage.xpathSelectAnotherShop).click();
      } else {
        await page.locator(creatorPage.xpathSelectAnotherShopEnvProd).click();
      }
      await expect(page.locator(creatorPage.xpathTitleSelectShop)).toBeVisible();
    });

    await test.step(`Chọn Add a new shop -> Nhập Shop name -> click Create để tạo store thứ 2`, async () => {
      await creatorPage.addNewShop(page, `${conf.suiteConf.shop_name} ${rando + 1}`);
      await page.waitForSelector(creatorPage.xpathLabelCoutryStore);
      await snapshotFixture.verify({
        page: page,
        selector: creatorPage.xpathScreenAddYourContact,
        snapshotName: conf.caseConf.snapshot_confirm_contact,
      });
    });

    await test.step(`Click btn Next để xác nhận thông tin -> Verify đi đến màn chọn business model`, async () => {
      await creatorPage.addContact(page, conf.caseConf.data);
      await page.locator(creatorPage.xpathBtnNext).click();
      await expect(creatorPage.genLoc(creatorPage.xpathTitleChooseBusinessModel)).toBeVisible();
      if (await page.locator(creatorPage.xpathSellDigitalProducts).isVisible()) {
        await creatorPage.createCreatorStore(page, conf.caseConf.data);
        await creatorPage.page.waitForSelector(creatorPage.xpathWelcome);
        const shopName = `${`${conf.suiteConf.shop_name} ${rando + 1}`.replaceAll(" ", "-")}.${
          conf.suiteConf.env_domain
        }`;
        expect(await page.locator(creatorPage.xpathShopName).textContent()).toEqual(shopName);
      }
    });
  });

  test(`Verify create SB Creator quickly for merchant who comes from landing page với url
  params sign in creator quickly @TC_SB_DP_DB_TC_CR_4`, async ({ page, conf, snapshotFixture }) => {
    const creatorPage = new CreatorPage(page, conf.suiteConf.domain);
    const rando = generateRandomCharacters(6).toLowerCase();
    const domain = conf.suiteConf.accounts_domain;

    await test.step(`Điều hướng đến accounts.shopbase.com với các url params sign in creator quickly.
    -> Chọn Đăng nhập bằng tài khoản SB`, async () => {
      await page.goto(`https://${domain}/sign-in?creator=true`);
      const titleSignin = await page.locator(creatorPage.xpathMsgRemindLogin).innerText();
      expect(titleSignin).toEqual(conf.caseConf.title_signin);
      await snapshotFixture.verify({
        page: page,
        selector: creatorPage.xpathLogo,
        snapshotName: conf.caseConf.snapshot_logo,
      });
    });

    await test.step(`Đăng nhập tài khoản SB -> Nhập Shop name -> click Create để tạo store mới`, async () => {
      await creatorPage.loginCreator(page, conf.suiteConf.username, conf.suiteConf.password);
      const remindMessage = await page.locator(creatorPage.xpathMsgRemindEnterStoreName).innerText();
      expect(remindMessage).toEqual(conf.caseConf.remind_message);
      await creatorPage.createNewShop(page, conf.caseConf.data, rando);
      await expect(creatorPage.genLoc(creatorPage.xpathScreenAddYourContact)).toBeVisible();
    });

    await test.step(`Click Next xác nhận thông tin tài khoản -> Tạo thành công shop SB Creator`, async () => {
      await creatorPage.addContact(page, conf.caseConf.data);
      await creatorPage.page.locator(creatorPage.xpathBtnNext).click();
      await creatorPage.page.waitForSelector(creatorPage.getXpathStepCustomShop(1));
      await creatorPage.page.waitForSelector(creatorPage.getXpathStepCustomShop(2));
      await creatorPage.page.waitForSelector(creatorPage.getXpathStepCustomShop(3));
      await creatorPage.page.waitForSelector(creatorPage.xpathWelcome, {
        timeout: 30 * 1000,
      });
      const shopName = `${`${conf.caseConf.shop_name} ${rando + 1}`.replaceAll(" ", "-")}.${conf.suiteConf.env_domain}`;
      expect(await page.locator(creatorPage.xpathShopName).textContent()).toEqual(shopName);
    });

    await test.step(`Logout -> Điều hướng đến accounts.shopbase với các url sign in creator quickly`, async () => {
      await page.locator(creatorPage.xpathShopName).click();
      await page.locator(creatorPage.xpathLogout).click();
      await page.waitForSelector(creatorPage.xpathSignin);
      await page.goto(`https://${domain}/sign-in?creator=true`);
      await expect(creatorPage.genLoc(creatorPage.xpathSignin)).toBeVisible();
    });

    await test.step(`Click chọn Sign up. Verify điều hướng sang flow đăng ký tài khoản SB Creator`, async () => {
      await page.waitForURL(`https://${domain}/sign-in?creator=true`);
      await page.locator(creatorPage.xpathSignupInSigninScreen).click();
      const url = page.url().toString();
      expect(url).toEqual(`https://${domain}/sign-up?creator=true`);
    });
  });
});
