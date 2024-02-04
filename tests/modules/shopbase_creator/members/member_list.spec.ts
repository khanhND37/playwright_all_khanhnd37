import { expect, test } from "@core/fixtures";
import { MemberPage } from "@pages/shopbase_creator/dashboard/member";
import { MemberAPI } from "@pages/shopbase_creator/dashboard/member_api";
import { generateEmail, snapshotDir } from "@core/utils/theme";
import { convertDate } from "@core/utils/datetime";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

test.describe("Verify member list", async () => {
  let memberPage: MemberPage;
  let memberAPI: MemberAPI;
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    memberPage = new MemberPage(dashboard, conf.suiteConf.domain);
    // create member
    const data = conf.caseConf.data_create_member;
    for (let i = 0; i < data.length; i++) {
      const email = generateEmail();
      await memberAPI.createMember({
        ...data[i],
        email: email,
      });
    }
    await memberPage.navigateToMenu("Contacts");
  });

  test.afterEach(async ({ conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
    const member = response.data;
    for (let i = 0; i < member.length; i++) {
      const id = member[i].id;
      await memberAPI.deleteMember(id);
    }
    //Delete product
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    await productAPI.deleteProduct(IdsArray);
  });

  test("Verify data trong màn Member list: Seller đã có member @SB_SC_SCM_1", async ({ conf }) => {
    const param = conf.suiteConf.paging_param;
    const memberInfo = conf.caseConf.member_info;
    await test.step("Verify các thông tin default của màn Member", async () => {
      await expect(memberPage.genLoc(memberPage.xpathTitlePage)).toHaveText("Contacts");
      await memberPage.genLoc(memberPage.xpathBtnExport).isVisible();
      await memberPage.genLoc(memberPage.xpathBtnImport).isVisible();
      await memberPage.genLoc(memberPage.xpathBtnSort).isVisible();
      await memberPage.genLoc(memberPage.xpathBtnFilter).isVisible();
      await memberPage.genLoc(memberPage.xpathIconSearch).isVisible();
      await memberPage.genLoc(memberPage.xpathPlaceHolderSearch).isVisible();
    });

    await test.step("Verify thông tin member ở page 1", async () => {
      const response = await memberAPI.getMembers(param);
      const member = response.data;
      for (let i = 0; i < member.length; i++) {
        const info = {
          avatar: "",
          name: "",
          email: member[i].email,
          addDate: convertDate(member[i].created_at),
          lastSignIn: "",
        };
        if (!member[i].avatar) {
          info.avatar = memberInfo.img;
        } else if (member[i].avatar) {
          info.avatar = member[i].avatar;
        }
        if (!member[i].first_name && !member[i].last_name) {
          info.name = memberInfo.last_signed_in;
        } else if (!member[i].first_name) {
          info.name = member[i].last_name;
        } else if (!member[i].last_name) {
          info.name = member[i].first_name;
        } else {
          info.name = `${member[i].first_name} ${member[i].last_name}`;
        }
        if (member[i].last_signed_in == null) {
          info.lastSignIn = memberInfo.last_signed_in;
        } else {
          const date = member[i].last_signed_in * 1000;
          info.lastSignIn = convertDate(date);
        }

        if (info.email) {
          info.email = info.email.trim();
        }

        const getMember = await memberPage.getMemberDataInTable();
        expect(info).toEqual(
          expect.objectContaining({
            avatar: getMember[i].avatar,
            name: getMember[i].name,
            email: getMember[i].email,
            addDate: getMember[i].addDate,
            lastSignIn: getMember[i].lastSignIn,
          }),
        );
      }
    });
  });

  test(`member_list - Verify chức năng search trong màn Member list @SB_SC_SCM_3`, async ({ conf }) => {
    await test.step("Verify thông tin list member sau khi search", async () => {
      await memberPage.genLoc(memberPage.xpathLoadingPage).isHidden();
      await memberPage.page.waitForSelector(memberPage.xpathColumnMember);
      const getMemberByKeyWord = await memberPage.getMemberByName(conf.caseConf.keyword);
      await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.caseConf.keyword);
      await memberPage.page.waitForSelector(memberPage.xpathColumnMember);
      const getMemberDataInTable = await memberPage.getMemberDataInTable();
      expect(getMemberDataInTable).toEqual(getMemberByKeyWord);
    });
    await test.step("Verify search member không tồn tại trong màn Member list", async () => {
      await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.caseConf.keyword_member_empty);
      await memberPage.genLoc(memberPage.xpathImageEmpty).isVisible();
      await expect(memberPage.genLoc(memberPage.xpathTitleEmpty)).toHaveText("No matching results found");
      await expect(memberPage.genLoc(memberPage.xpathDescriptionEmpty)).toHaveText(
        "Please try searching with other terms and conditions.",
      );
    });
  });

  test("member_list - Verify chức năng thêm 1 member @SB_SC_SCM_6", async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
  }) => {
    await test.step("Click btn Add member => Verify các trường của màn hình add member", async () => {
      await memberPage.clickOnBtnWithLabel("Add new");
      await memberPage.waitUtilSkeletonDisappear();
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='digital-product--member__container']",
        snapshotName: `add-member-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step("Nhập thông tin các trường -> click button Cancel -> Verify thông tin hiển thị tại màn Add Product", async () => {
      await memberPage.fillMemberForm(conf.caseConf.data_create_member[0]);
      await memberPage.clickButtonCreateMemberPage("Cancel");
      const label = conf.caseConf.list_label;
      for (let i = 0; i < label.length; i++) {
        expect(await memberPage.genLoc(memberPage.getXpathInputWithLabel(label[i])).inputValue()).toEqual("");
      }
      expect(await memberPage.genLoc(memberPage.xpathNotes).inputValue()).toEqual("");
    });

    await test.step("Nhập data vào các trường > click btn Add member > Verify thông tin hiển thị", async () => {
      // case add thành công member
      const dataSuccessful = conf.caseConf.list_data_create_member_successful;
      for (let i = 0; i < dataSuccessful.length; i++) {
        await test.step(`${dataSuccessful[i].description}`, async () => {
          await memberPage.fillMemberForm(dataSuccessful[i].data);
          await memberPage.clickButtonCreateMemberPage("Add member");
          await expect(memberPage.genLoc(memberPage.xpathMessage)).toHaveText("Added member successfully.");
          await memberPage.waitUntilElementInvisible(memberPage.xpathMessage);
          await memberPage.genLoc(memberPage.xpathLoading).isHidden();
          await memberPage.genLoc(memberPage.xpathIconBack).click();
          await memberPage.clickOnBtnWithLabel("Add new");
        });
      }

      // case add member fail
      const dataFalse = conf.caseConf.list_data_create_member_false;
      for (let i = 0; i < dataFalse.length; i++) {
        await test.step(`${dataFalse[i].description}`, async () => {
          await memberPage.fillMemberForm(dataFalse[i].data);
          await memberPage.clickButtonCreateMemberPage("Add member");
          const locatorMessage = memberPage.getLocatorMessage(dataFalse[i].label, dataFalse[i].message);
          await expect(locatorMessage).toBeVisible();
        });
      }
    });

    // await test.step(`Nhập Email trùng với Email đã có trong danh sách member
    // -> click button Save -> verify message hiển thị`, async () => {
    //   await memberPage.fillMemberForm(conf.caseConf.create_member_email_duplicate);
    //   await memberPage.clickButtonCreateMemberPage("Add member");
    //   await expect(memberPage.genLoc(memberPage.xpathMessage)).toHaveText(
    //     "Email already exists. Please try another email.",
    //   );
    // });

    await test.step(` Verify gửi email cho member -> Click vào button Sign in now tại email  -> Verify thông tin hiển thị`, async () => {
      const newTab = await context.newPage();
      await newTab.goto(`https://www.mailinator.com/`);
      const mailinator = await getMailinatorInstanceWithProxy(newTab);
      await mailinator.accessMail(conf.caseConf.email);
      await mailinator.readMail(conf.caseConf.subject_email_create_member);
      const contentEmail = await mailinator.getContentMail();
      expect(contentEmail.trim()).toEqual(
        `Welcome to ` + conf.suiteConf.shop_name + `! We are so glad to have you on board.`,
      );
      const getContentEmail = await mailinator.page
        .frameLocator(mailinator.iframe)
        .locator("(//tbody/tr[2]/th/div)[last()-1]")
        .textContent();
      expect(getContentEmail.trim()).toEqual(
        "To get started, please click the following link to sign in and activate your account:",
      );

      const [newTabSignin] = await Promise.all([
        context.waitForEvent("page"),
        await mailinator.page.frameLocator(mailinator.iframe).locator("//a[normalize-space()='Sign in now']").click(),
      ]);
      await newTabSignin.waitForLoadState("networkidle");
      await newTabSignin.isVisible("//h3[normalize-space()='Welcome']");
    });

    await test.step(` Verify không gửi email cho member khi tạo member untick Send welcome e-mail`, async () => {
      const newTab = await context.newPage();
      await newTab.goto(`https://www.mailinator.com/`);
      const mailinator = await getMailinatorInstanceWithProxy(newTab);
      await mailinator.accessMail(conf.caseConf.email_not_send);
      await mailinator.page.isHidden(
        `//tr[contains(@id,'row_')]/td[contains(text(),'${conf.caseConf.subject_email_create_member}')]`,
      );
    });
  });

  test("member_list - Verify chức năng filter theo product trong màn Member list @SB_SC_SCM_4", async ({
    conf,
    authRequest,
    dashboard,
  }) => {
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    // create product
    const productListData = conf.caseConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }
    await productPage.navigateToMenu("Products");
    await productPage.moreActionMultiProducts(conf.caseConf.publish_product);
    await productPage.navigateToMenu("Contacts");

    // Get member id
    const member = await memberAPI.getMembers(conf.suiteConf.paging_param);
    const memberIds = member?.data.map(item => item.id);

    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    const productId = IdsArray.join();

    // Add product cho member
    const addProductForMember = {
      shop_id: conf.suiteConf.shop_id,
      member_id: memberIds[1],
      product_ids: productId,
    };
    await memberAPI.addProductForMember(addProductForMember);

    await test.step("Click btn Filter by products -> Verify drop list hiển thị ", async () => {
      await memberPage.page.reload();
      await memberPage.genLoc(memberPage.xpathBtnFilter).click();
      let products = await memberPage.GetFilterProductName();
      products = [...products].reverse();
      for (let i = 0; i < products.length; i++) {
        expect(products[i]).toEqual(productListData[i].product.title);
      }
    });

    await test.step("Click vào 1 product title -> verify list member hiển thị", async () => {
      for (let i = 0; i < productListData.length; i++) {
        await memberPage.clickPOnProductFilter(productListData[i].product.title);
        const locatorFilterTag = memberPage.getLocatorFilterTag(productListData[i].product.title);
        await expect(locatorFilterTag).toBeVisible();
        await memberPage.page.waitForSelector(memberPage.xpathColumnMember);
        const countRow = await memberPage.genLoc(memberPage.xpathRow).count();
        for (let j = 1; j <= countRow; j++) {
          await memberPage.openMemberDetail(j);
          await memberPage.waitUntilElementVisible(memberPage.xpathProductAccess);
          const locatorProduct = memberPage.getLocatorProductName(productListData[i].product.title);
          await expect(locatorProduct).toBeVisible();
          await memberPage.navigateToMemberPage();
          await memberPage.genLoc(memberPage.xpathBtnFilter).click();
        }
      }
    });
  });

  test("member_list - Verify chức năng sort members @SB_SC_SCM_5", async ({ conf }) => {
    await test.step(`Trên menu bar, click dropdown button "Sort" > Select lần lượt các option sort`, async () => {
      await memberPage.page.waitForTimeout(conf.suiteConf.timeout);
      const sortOptions = await memberPage.getAllTextContents(memberPage.xpathSortMember);
      expect(sortOptions).toEqual(conf.caseConf.option_sort);
      for (let i = 0; i < conf.caseConf.sort_by.length; i++) {
        const sortOption = conf.caseConf.sort_by[i];
        await memberPage.selectSortMember(sortOption.selected_sort);
        await memberPage.page.waitForTimeout(conf.suiteConf.timeout);
        for (let j = 0; j < sortOption.length; j++) {
          const memberSort = sortOption.members_sorted[j];
          const memberName = await memberPage.getTextContent(`(${memberPage.xpathRow})[${j + 1}]//td[1]//p`);
          expect(memberName).toEqual(memberSort.member_name);
        }
      }
    });
  });
});

test(" Verify UI và data hiển thị tại màn Member List: Seller chưa có member @SB_SC_SCM_2", async ({
  dashboard,
  conf,
}) => {
  await test.step("Verify UI màn Member khi seller chưa có member", async () => {
    const memberPage = new MemberPage(dashboard, conf.caseConf.domain);
    await memberPage.navigateToMenu("Contacts");
    await memberPage.genLoc(memberPage.xpathImageEmpty).isVisible();
    await expect(memberPage.genLoc(memberPage.xpathTitleEmpty)).toHaveText("You have no members yet");
    await expect(memberPage.genLoc(memberPage.xpathDescriptionEmpty)).toHaveText(
      "When a member places an order, you'll find their details and purchase history here.",
    );
  });
});
