/* eslint-disable no-case-declarations */
import { expect, test } from "@fixtures/theme";
import { AccountPage } from "@pages/dashboard/accounts";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { StoreURLScheduleDataType } from "./store_url";
import { OnlineStoreDomainPage } from "@pages/dashboard/online_store_domains";

let onlineStorePage: OnlineStorePage;
let onlineStoreDomainPage: OnlineStoreDomainPage;

test.describe("User name/link Creator", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf.domain);
    onlineStoreDomainPage = new OnlineStoreDomainPage(dashboard, conf.suiteConf.domain);
    await onlineStorePage.gotoOnlineStore();
    await onlineStorePage.waitForProfileRequest();
  });

  test.afterEach(async ({ conf }) => {
    if (conf.caseConf.fallback_to_default) {
      // Fallback to default username for test next case
      const defaultShopName = onlineStorePage.getShopName(conf.suiteConf.domain);
      await onlineStorePage.changeStoreUsername(defaultShopName);
    }
  });

  test("Check edit user name của shop @SB_CUN_03", async ({ dashboard, conf, context }) => {
    const creatorUrl: string = conf.suiteConf.creator_url;
    const shopUserName = onlineStorePage.getShopName(conf.suiteConf.domain);
    const newLocation = {
      domain: "",
      username: "",
    };

    await test.step("Mở Online Store > Design", async () => {
      await expect(dashboard.locator(onlineStorePage.xpathStoreUrlText)).toBeVisible();
      expect(await dashboard.locator(onlineStorePage.xpathStoreDomainLabel).textContent()).toBe(creatorUrl.concat("/"));
      expect(await dashboard.locator(onlineStorePage.xpathStoreNameInput).inputValue()).toBe(shopUserName);
      let accessLink = await dashboard.locator(onlineStorePage.xpathAccessStoreLink).textContent();
      accessLink = accessLink.replace(/\s/g, "");
      expect(accessLink).toBe(`${creatorUrl}/${shopUserName}`);
    });

    for (const dataSetting of conf.caseConf.store_usernames) {
      await test.step(dataSetting.case_description, async () => {
        if (dataSetting.input.includes("{env}")) {
          dataSetting.input = dataSetting.input.replace("{env}", process.env.ENV);
        }
        await onlineStorePage.changeStoreUsername(dataSetting.input);
        if (dataSetting.expect.type === "message") {
          const messageText = await dashboard.locator(onlineStorePage.xpathUsernameFormMessage).textContent();
          expect(messageText.trim()).toBe(dataSetting.expect.output_message);
        }
        if (dataSetting.expect.type === "validateNewUsername") {
          const { host } = await dashboard.evaluate(() => document.location);
          newLocation.domain = host.replace(onlineStorePage.getShopName(host), dataSetting.input);
          newLocation.username = dataSetting.input;

          await onlineStorePage.waitForProfileRequest();

          const accountPage = new AccountPage(dashboard, newLocation.domain);
          await onlineStorePage.withPromiseRace(
            accountPage.login({
              email: conf.suiteConf.username,
              password: conf.suiteConf.password,
            }),
          );

          await onlineStorePage.gotoOnlineStore();
          await onlineStorePage.waitForProfileRequest();

          expect(dashboard.url()).toContain(dataSetting.input);

          const accessLink = await dashboard.locator(onlineStorePage.xpathAccessStoreLink).textContent();
          expect(accessLink.replace(/\s/g, "")).toBe(`${creatorUrl}/${dataSetting.input}`);

          expect(await dashboard.locator(onlineStorePage.xpathStoreNameInput).inputValue()).toBe(dataSetting.input);
        }
      });
    }

    const newStoreUrl = `${creatorUrl}/${newLocation.username}`;

    await test.step("Click view your store", async () => {
      const [viewStoreTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(onlineStorePage.xpathViewYourStoreButton).click(),
      ]);
      await viewStoreTab.waitForLoadState();
      const { origin, pathname } = await viewStoreTab.evaluate(() => document.location);
      expect(`${origin}/${pathname.replaceAll("/", "")}`).toBe(newStoreUrl);
      viewStoreTab.close();
    });

    await test.step("CLick vào link shop bên cạnh message: Your customers can access to your store using this link", async () => {
      const [accessStoreLinkTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(onlineStorePage.xpathAccessStoreLink).click(),
      ]);
      await accessStoreLinkTab.waitForLoadState();
      const { origin, pathname } = await accessStoreLinkTab.evaluate(() => document.location);
      expect(`${origin}/${pathname.replaceAll("/", "")}`).toBe(newStoreUrl);
      accessStoreLinkTab.close();
    });

    await test.step("Open a new tab Mở shop bằng link URL mới", async () => {
      const newShopUrlTab = await context.newPage();
      await newShopUrlTab.goto(newStoreUrl);
      await newShopUrlTab.waitForLoadState("networkidle");
      const initialState = JSON.parse(await newShopUrlTab.locator(onlineStorePage.xpathShopInitialState).textContent());
      expect(initialState.shop.id).toBe(conf.suiteConf.shop_id);
      newShopUrlTab.close();
    });
  });

  test("Check Domain setting tại Store URL @SB_CUN_05", async ({ dashboard, conf, context, scheduler }) => {
    const creatorUrl: string = conf.suiteConf.creator_url;
    const parseCreatorUrl = new URL(creatorUrl);
    const shopUserName = onlineStorePage.getShopName(conf.suiteConf.domain);
    const connectedToDomain = conf.caseConf.connected_to_domain;
    let scheduleData: StoreURLScheduleDataType = {
      creatorUrl: "",
      shopUserName: "",
    };
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as StoreURLScheduleDataType;
    }

    await test.step("Mở Online Store > Design", async () => {
      if (!scheduleData.creatorUrl) {
        await expect(dashboard.locator(onlineStorePage.xpathStoreUrlText)).toBeVisible();
        expect(await dashboard.locator(onlineStorePage.xpathStoreDomainLabel).textContent()).toBe(
          creatorUrl.concat("/"),
        );
        expect(await dashboard.locator(onlineStorePage.xpathStoreNameInput).inputValue()).toBe(shopUserName);
        let accessLink = await dashboard.locator(onlineStorePage.xpathAccessStoreLink).textContent();
        accessLink = accessLink.replace(/\s/g, "");
        expect(accessLink).toBe(`${creatorUrl}/${shopUserName}`);
      }
    });

    await test.step("Click Domain Setting", async () => {
      if (!scheduleData.creatorUrl) {
        await onlineStoreDomainPage.gotoDomainPage();
        await dashboard.waitForResponse(
          response => response.url().includes("/admin/setting/domains.json") && response.status() === 200,
        );
        // Check primary domain
        const primaryDomain = await onlineStoreDomainPage.getPrimaryDomain();
        expect(primaryDomain.replace(/\s/g, "")).toBe(`${parseCreatorUrl.host}/${shopUserName}`);
      }
    });

    await test.step("Click connect existing domain", async () => {
      if (!scheduleData.creatorUrl) {
        await dashboard.locator(onlineStoreDomainPage.xpathConnectExistingDomain).click();
        await dashboard.waitForSelector(onlineStoreDomainPage.xpathInputDomain);
        await dashboard.locator(onlineStoreDomainPage.xpathInputDomain).fill(connectedToDomain);
        await dashboard.locator(onlineStoreDomainPage.xpathConnectExistingDomainNextBtn).click();
        await dashboard.waitForResponse(
          response => response.url().includes("/admin/domains/connect.json") && response.status() === 200,
        );
        await expect(dashboard.locator(onlineStoreDomainPage.xpathConnectExistingDomainVerifyBtn)).toBeVisible();

        await dashboard.locator(onlineStoreDomainPage.xpathConnectExistingDomainVerifyBtn).click();
        await dashboard.waitForResponse(
          response => response.url().includes("/admin/setting/domains.json") && response.status() === 200,
        );
        await dashboard.waitForURL(/\/admin\/domain/gm);
      }
    });

    await test.step("Check domain connected", async () => {
      if (!scheduleData.creatorUrl) {
        const domains = await onlineStoreDomainPage.getConnectedDomains();
        // Check domains
        expect(domains).toContain(connectedToDomain);
      }
    });

    await test.step("Click Change primary domain?", async () => {
      if (!scheduleData.creatorUrl) {
        await dashboard.locator(onlineStoreDomainPage.xpathChangePrimaryDomain).click();
        await dashboard.waitForSelector(onlineStoreDomainPage.xpathModal);
        await dashboard.locator(`//input[@value="${connectedToDomain}"]/..`).click();
      }
    });

    await test.step("Chọn domain trong list domain làm primary domain Click Save", async () => {
      if (!scheduleData.creatorUrl) {
        await dashboard.locator(onlineStoreDomainPage.xpathModalPrimaryBtn).click();

        await dashboard.waitForResponse(
          response => response.url().includes("/admin/setting/domains/set_primary.json") && response.status() === 200,
        );
      }
    });

    await test.step('Quay lại "Online store > Design"', async () => {
      if (!scheduleData.creatorUrl) {
        await dashboard.locator(onlineStorePage.xpathMenuDesign).click();
        await onlineStorePage.waitForProfileRequest();
        const accessLink = await dashboard.locator(onlineStorePage.xpathAccessStoreLink).textContent();
        expect(accessLink.replace(/\s/g, "")).toBe(connectedToDomain);
      }
    });

    await test.step("Mở shop bằng domain", async () => {
      if (!scheduleData.creatorUrl) {
        const newShopDomainTab = await context.newPage();
        await newShopDomainTab.goto(`http://${connectedToDomain}`);
        await newShopDomainTab.waitForLoadState("networkidle");
        const initialState = JSON.parse(
          await newShopDomainTab.locator(onlineStorePage.xpathShopInitialState).textContent(),
        );
        expect(initialState.shop.id).toBe(conf.suiteConf.shop_id);
        newShopDomainTab.close();
      }
    });

    await test.step("Click Domain Setting", async () => {
      if (!scheduleData.creatorUrl) {
        await onlineStoreDomainPage.gotoDomainPage();
        // Check primary domain
        const primaryDomain = await onlineStoreDomainPage.getPrimaryDomain();
        expect(primaryDomain.replace(/\s/g, "")).toBe(connectedToDomain);
        // Check connected domains list
        const domains = await onlineStoreDomainPage.getConnectedDomains();
        // Check domains
        expect(domains).toContain(connectedToDomain);
      }
    });

    await test.step("Click Remove các domain đang connect tại shop", async () => {
      if (!scheduleData.creatorUrl) {
        let domains = await onlineStoreDomainPage.getConnectedDomains();
        domains = domains.filter(domain => domain != `${parseCreatorUrl.host}/${shopUserName}`);
        for (let i = 0; i < domains.length; ++i) {
          const removeBtn = dashboard.locator(onlineStoreDomainPage.xpathRemoveDomain);
          if (!removeBtn || !(await removeBtn.isVisible())) {
            break;
          }
          await removeBtn.click();
          await dashboard.waitForSelector(onlineStoreDomainPage.xpathModal);
          await dashboard.locator(onlineStoreDomainPage.xpathModalPrimaryBtn).click();
          await dashboard.waitForResponse(
            response => response.url().includes("/admin/setting/domains.json") && response.status() === 200,
          );
        }
        scheduleData = {
          creatorUrl,
          shopUserName,
        };
        await scheduler.setData(scheduleData);
      }
    });

    await test.step("Quay lại Online store", async () => {
      await dashboard.locator(onlineStorePage.xpathMenuDesign).click();
      await onlineStorePage.waitForProfileRequest();
      await expect(dashboard.locator(onlineStorePage.xpathStoreUrlText)).toBeVisible();
      expect(await dashboard.locator(onlineStorePage.xpathStoreDomainLabel).textContent()).toBe(creatorUrl.concat("/"));
      expect(await dashboard.locator(onlineStorePage.xpathStoreNameInput).inputValue()).toBe(shopUserName);
      let accessLink = await dashboard.locator(onlineStorePage.xpathAccessStoreLink).textContent();
      accessLink = accessLink.replace(/\s/g, "");
      if (accessLink != `${scheduleData.creatorUrl}/${scheduleData.shopUserName}`) {
        await scheduler.schedule({ mode: "later", minutes: 5 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      expect(accessLink).toBe(`${scheduleData.creatorUrl}/${scheduleData.shopUserName}`);
    });

    await test.step("Mở shop bằng URL", async () => {
      const newShopUrlTab = await context.newPage();
      await newShopUrlTab.goto(`${scheduleData.creatorUrl}/${scheduleData.shopUserName}`);
      await newShopUrlTab.waitForLoadState("networkidle");
      const initialState = JSON.parse(await newShopUrlTab.locator(onlineStorePage.xpathShopInitialState).textContent());
      expect(initialState.shop.id).toBe(conf.suiteConf.shop_id);
      newShopUrlTab.close();
    });
  });
});
