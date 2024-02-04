import { expect, test } from "@core/fixtures";
import { MemberPage } from "@pages/shopbase_creator/dashboard/member";
import { MemberAPI } from "@pages/shopbase_creator/dashboard/member_api";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { formatDate } from "@core/utils/datetime";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

test.describe("Verify member detail", async () => {
  let memberPage: MemberPage;
  let memberAPI: MemberAPI;
  let productAPI: ProductAPI;
  let productPage: ProductPage;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    memberPage = new MemberPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    // create product
    const productListData = conf.suiteConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }
    // create member
    const data = conf.suiteConf.data_create_member;
    for (let i = 0; i < data.length; i++) {
      await memberAPI.createMember({
        ...data[i],
      });
    }
    await productPage.navigateToMenu("Products");
    await productPage.moreActionMultiProducts(conf.suiteConf.publish_product);
    await productPage.navigateToMenu("Contacts");
    await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.suiteConf.keyword);
    await memberPage.openMemberDetail(1);
    await memberPage.genLoc(memberPage.xpathLoading).isHidden();
  });

  test.afterEach(async ({ conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
    const member = response.data;
    for (let i = 0; i < member.length; i++) {
      const id = member[i].id;
      await memberAPI.deleteMember(id);
    }
    //delete product
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    await productAPI.deleteProduct(IdsArray);
  });

  test(`Verify thông tin của member trong màn Member detail @SB_SC_SCM_9`, async ({ conf }) => {
    await test.step(`Verify thông tin chung của member`, async () => {
      const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
      const memberID = response.data[0].id;
      const resMemberDetail = await memberAPI.getMemberDetail(memberID);
      const getMemberDetailAPI = {
        email: resMemberDetail.customer.email,
        first_name: resMemberDetail.customer.first_name,
        last_name: resMemberDetail.customer.last_name,
        note: resMemberDetail.customer.note,
        phone: resMemberDetail.customer.phone,
        calling_code: resMemberDetail.customer.calling_code,
        tags: resMemberDetail.customer.tags,
        country_id: resMemberDetail.country_id,
      };
      expect(getMemberDetailAPI).toEqual(conf.suiteConf.data_create_member[0]);
      const getImg = await memberPage.getImgAndDesMemberDetail();
      const image = conf.caseConf.image;
      expect(getImg).toEqual(
        expect.objectContaining({
          imageAvatar: image.image_avatar,
          imageLastActivity: image.image_last_activity,
          imageSales: image.image_sales,
          imageOrders: image.image_orders,
          imageProductAccessEmpty: image.image_product_access_empty,
          descriptionProductAccessEmpty: image.description_product_access_empty,
          imageRecentOrderEmpty: image.image_recent_order_empty,
          descriptionOrderEmpty: image.description_order_empty,
        }),
      );
      await memberPage.genLoc(memberPage.xpathBtnDelete).isVisible();
      await memberPage.genLoc(memberPage.xpathBtnGrantAccess).isVisible();
    });
  });

  test(`Member_detail - Verify thông tin Product access của member trong màn Member detail @SB_SC_SCM_10`, async ({
    conf,
  }) => {
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
      member_id: memberIds[0],
      product_ids: productId,
    };
    await memberAPI.addProductForMember(addProductForMember);

    await test.step(`Thực hiện sreach member-> Click vào row của member để vào detail -> Verify thông tin products mà member access`, async () => {
      const today = formatDate(new Date(), "MMM DD, YYYY");
      await memberPage.page.reload();
      await expect(memberPage.genLoc(memberPage.xpathProdAccess)).toHaveText("Internet Security");
      await expect(memberPage.genLoc(memberPage.xpathProgress)).toHaveText("N/A");
      await memberPage.genLoc(memberPage.xpathIconDelete).isVisible();
      const date = await memberPage.getTextContent(memberPage.xpathDate);
      expect(date).toEqual(today);
    });
  });

  test(`Member_detail - Verify delete Product của Menber tại màn member detail @SB_SC_SCM_11`, async ({
    conf,
    page,
    context,
  }) => {
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
      member_id: memberIds[0],
      product_ids: productId,
    };
    await memberAPI.addProductForMember(addProductForMember);

    await test.step(`Click vào icon delete -> Verify thông tin hiển thị`, async () => {
      await memberPage.page.reload();
      await memberPage.genLoc(memberPage.xpathLoading).isHidden();
      await memberPage.genLoc(memberPage.xpathIconDelete).click();
      await expect(memberPage.genLoc(memberPage.xpathTitlePopup)).toHaveText("Remove access");
      await expect(memberPage.genLoc(memberPage.xpathDescriptionPopup)).toHaveText(
        "This member will no longer have access to this product, but their progress won't be affected. Are you sure you want to continue?",
      );
      await expect(memberPage.genLoc(memberPage.xpathBtnCancel)).toHaveText("Cancel");
      await expect(memberPage.genLoc(memberPage.xpathBtnPopup)).toHaveText("Remove access");
    });

    await test.step(`Click button Cancel trên popup -> Verify thông tin hiển thị`, async () => {
      await memberPage.genLoc(memberPage.xpathBtnCancel).click();
      await expect(memberPage.genLoc(memberPage.xpathPopup)).toBeHidden();
    });

    await test.step(`Click button Remove access trên popup -> Verify thông tin hiển thị tại dashboard và ngoài SF`, async () => {
      await memberPage.genLoc(memberPage.xpathIconDelete).click();
      await memberPage.genLoc(memberPage.xpathBtnPopup).click();
      await expect(memberPage.genLoc(memberPage.xpathPopup)).toBeHidden();
      await memberPage.genLoc(memberPage.xpathSkeleton).isHidden();
      await expect(memberPage.genLoc(memberPage.xpathProdAccess)).toBeHidden();
    });

    await test.step(`Login vào màn My product của buyer -> Verify product vừa vừa được add vào cho member`, async () => {
      const myAccount = new MyAccountPage(page, conf.suiteConf.domain);
      await myAccount.login(conf.caseConf.email, conf.caseConf.subject_email, context);
      await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeHidden();
      await expect(myAccount.genLoc(`//h5[normalize-space()='${conf.caseConf.product}']`)).toBeHidden();
    });
  });

  test("Member_list - Verify chức năng Edit member @SB_SC_SCM_14", async ({ page, context, conf }) => {
    await test.step("Click btn Edit member => Verify thông tin các trường của member", async () => {
      await memberPage.genLoc(memberPage.xpathBtnEdit).click();
      await memberPage.waitForElementVisibleThenInvisible("//div[@class='sb-skeleton']");
      const label = conf.caseConf.list_label_add_member;
      for (let i = 0; i < label.length; i++) {
        const xpathLabel = memberPage.getLocatorLabel(i + 1);
        await expect(xpathLabel).toHaveText(label[i]);
      }
      await expect(memberPage.genLoc(memberPage.getXpathInputWithLabel("Email"))).toBeDisabled();
    });

    const dataSuccessful = conf.caseConf.list_data_edit_member_successful;
    for (let i = 0; i < dataSuccessful.length; i++) {
      await test.step(`${dataSuccessful[i].description}`, async () => {
        await memberPage.fillMemberForm(dataSuccessful[i].data);
        await memberPage.clickButtonCreateMemberPage("Save");
        await expect(memberPage.genLoc(memberPage.xpathMessage)).toHaveText("All changes were successfully saved.");
        await memberPage.waitForElementVisibleThenInvisible(memberPage.xpathMessage);
        if (dataSuccessful[i].data.first_name) {
          expect(await memberPage.genLoc(memberPage.getXpathInputWithLabel("First name")).inputValue()).toEqual(
            dataSuccessful[i].data.first_name,
          );
        }
        if (dataSuccessful[i].data.last_name) {
          expect(await memberPage.genLoc(memberPage.getXpathInputWithLabel("Last name")).inputValue()).toEqual(
            dataSuccessful[i].data.last_name,
          );
        }
        if (dataSuccessful[i].data.country) {
          expect(await memberPage.genLoc(memberPage.getXpathInputWithLabel("Country")).inputValue()).toEqual(
            dataSuccessful[i].data.country,
          );
        }
        if (dataSuccessful[i].data.phone) {
          expect(await memberPage.genLoc(memberPage.getXpathInputWithLabel("Phone number")).inputValue()).toEqual(
            dataSuccessful[i].data.phone,
          );
        }
        if (dataSuccessful[i].data.note) {
          expect(await memberPage.genLoc(memberPage.xpathNotes).inputValue()).toEqual(dataSuccessful[i].data.note);
        }
        if (dataSuccessful[i].data.tags) {
          expect(await memberPage.genLoc(memberPage.getXpathInputWithLabel("Tags")).inputValue()).toEqual(
            dataSuccessful[i].data.tags,
          );
        }
      });
    }

    await test.step(`Nhập phone sai định dạng (nhập khác các ký tự: a-z,._%+-)`, async () => {
      const dataFalse = conf.caseConf.list_data_edit_member_false;
      await memberPage.fillMemberForm(dataFalse.data);
      await memberPage.clickButtonCreateMemberPage("Save");
      const locatorMessage = memberPage.getLocatorMessage(dataFalse.label, dataFalse.message);
      await expect(locatorMessage).toBeVisible();
    });

    await test.step(`Ngoài SF thưc hiện login vào acc của buyer theo data -> My profile verify thông tin của buyer`, async () => {
      const data = conf.caseConf.info_member_SF;
      const myAccount = new MyAccountPage(page, conf.suiteConf.domain);
      await myAccount.login(conf.caseConf.email, conf.caseConf.subject_email, context);
      await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeHidden();
      await myAccount.page.click("//span[normalize-space()='My profile']");
      const userName = await myAccount.genLoc(myAccount.xpathUsername).innerText();
      expect(userName).toEqual(`${data.first_name} ${data.last_name}`);
      expect(await myAccount.genLoc("//input[@name='first-name']").inputValue()).toEqual(data.first_name);
      expect(await myAccount.genLoc("//input[@name='last-name']").inputValue()).toEqual(data.last_name);
      expect(await myAccount.genLoc("//input[@name='phone']").inputValue()).toEqual(data.phone);
    });
  });

  test(`member_detail - Verify add Product cho Member tại màn member detail @SB_SC_SCM_12`, async ({
    conf,
    context,
    page,
  }) => {
    await test.step(`1. open member detail
    2. Click vào hyperlink Grant access -> Select Chọn product
    3. Click button Save`, async () => {
      await memberPage.genLoc(memberPage.xpathBtnGrantAccess).click();
      await memberPage.genLoc(memberPage.xpathSearchProduct).fill("Internet Security");
      await memberPage.genLoc("(//div[@class='grant-product-list']//span[@class='sb-check'])[1]").click();
      await memberPage.clickButtonOnPopup(conf.caseConf.btn_grant_access);
      await expect(memberPage.genLoc(memberPage.xpathProdAccess)).toHaveText("Internet Security");
    });

    await test.step(`Verify email gửi cho member`, async () => {
      const newTab = await context.newPage();
      await newTab.goto(`https://www.mailinator.com/`);
      const mailinator = await getMailinatorInstanceWithProxy(newTab);
      await mailinator.accessMail(conf.caseConf.email);
      await mailinator.readMail(conf.caseConf.subject_email_create_member);
      await expect(
        mailinator.page.frameLocator(mailinator.iframe).locator("(//div[@class='sans-serif']//div)[1]"),
      ).toHaveText("Welcome to " + conf.suiteConf.shop_name + "!");
      const contentEmail = await mailinator.page
        .frameLocator(mailinator.iframe)
        .locator(mailinator.xpathContentEmail)
        .innerText();
      expect(contentEmail).toEqual(
        `Congratulations! You've been granted access to ` +
          conf.caseConf.product +
          ` on our site for this email: ` +
          conf.caseConf.email +
          `. Please visit this link to access this product.`,
      );
    });

    await test.step(`Login vào màn My product của buyer -> Verify product vừa vừa được add vào cho member`, async () => {
      const myAccount = new MyAccountPage(page, conf.suiteConf.domain);
      await myAccount.login(conf.caseConf.email, conf.caseConf.subject_email, context);
      await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeHidden();
      await expect(myAccount.genLoc(`//h5[normalize-space()='${conf.caseConf.product}']`)).toBeVisible();
    });
  });
});
