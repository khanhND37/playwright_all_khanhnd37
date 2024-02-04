import { expect, test } from "@core/fixtures";
import { MemberPage } from "@pages/shopbase_creator/dashboard/member";
import { MemberAPI } from "@pages/shopbase_creator/dashboard/member_api";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { convertDate, formatDate } from "@core/utils/datetime";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

test.describe("Verify member detail", async () => {
  let memberPage: MemberPage;
  let memberAPI: MemberAPI;
  let productAPI: ProductAPI;
  let checkoutPage: CheckoutForm;
  let productPage: ProductPage;
  let today: string;
  let orderID: string;
  test.beforeEach(async ({ page, dashboard, conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    memberPage = new MemberPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);

    // create product
    const productListData = conf.suiteConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }
    await productPage.navigateToMenu("Products");
    await productPage.moreActionMultiProducts(conf.suiteConf.publish_product);

    //checkout product
    await checkoutPage.goto(`products/${productListData[0].product.handle}`);
    await checkoutPage.enterEmail(conf.suiteConf.email);
    await checkoutPage.clickBtnCompleteOrder();
    await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
    today = formatDate(new Date(), "MMM DD, YYYY hh:mm A");
    orderID = await checkoutPage.getOrderName();
  });

  test.afterEach(async ({ conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
    const member = response.data;
    for (let i = 0; i < member.length; i++) {
      const id = member[i].id;
      await memberAPI.deleteMember(id);
    }
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });

  test(`Member_detail - Verify thông tin Recent orders của member trong màn Member detail @SB_SC_SCM_13`, async ({
    conf,
    dashboard,
  }) => {
    await memberPage.navigateToMemberPage();
    await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.suiteConf.keyword);
    await memberPage.openMemberDetail(1);
    await memberPage.genLoc(memberPage.xpathLoading).isHidden();

    await test.step(`Verify thông tin order product của member`, async () => {
      await expect(memberPage.genLoc(memberPage.xpathItemName)).toHaveText("Internet Security");
      const date = await memberPage.getTextContent(memberPage.xpathItemTime);
      expect(date).toEqual(today);
      await expect(memberPage.genLoc(memberPage.xpathItemPrice)).toHaveText("$0.00");
      await expect(memberPage.genLoc(memberPage.xpathOrderName)).toHaveText(`Order - ${orderID}`);
    });

    await test.step(`Click vào order name của member ->Verify thông tin hiển thi`, async () => {
      await memberPage.genLoc(memberPage.xpathOrderName).click();
      const orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
      await expect(orderPage.genLoc(orderPage.xpathOrderName)).toBeVisible();
    });

    await test.step(`Click vào product name của member ->Verify thông tin hiển thi`, async () => {
      await memberPage.genLoc(memberPage.xpathItemName).click();
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      await expect(productPage.genLoc(productPage.xpathNameProduct)).toBeVisible();
    });
  });

  test(`Member_detail Verify chức năng xóa member @SB_SC_SCM_15`, async ({ conf, context }) => {
    await memberPage.navigateToMemberPage();
    await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.suiteConf.keyword);
    await memberPage.openMemberDetail(1);
    await memberPage.genLoc(memberPage.xpathLoading).isHidden();

    await test.step("Click btn Delete -> Verify thông tin hiển thị", async () => {
      await memberPage.genLoc(memberPage.xpathBtnDelete).click();
      await expect(memberPage.genLoc(memberPage.xpathTitlePopup)).toHaveText("Delete member");
      await expect(memberPage.genLoc(memberPage.xpathDescriptionPopup)).toHaveText(
        "All member's information and product progress will be lost. This action cannot be undone. Are you sure you want to delete this member from your store?",
      );
      await expect(memberPage.genLoc(memberPage.xpathBtnCancel)).toHaveText("Cancel");
      await expect(memberPage.genLoc(memberPage.xpathBtnPopup)).toHaveText("Permanently delete");
    });

    await test.step("Click btn Cancel trên popup -> Verify thông tin hiển thị", async () => {
      await memberPage.genLoc(memberPage.xpathBtnCancel).click();
      await expect(memberPage.genLoc(memberPage.xpathPopup)).toBeHidden();
    });

    await test.step("Click btn Permanently delete trên popup -> Verify thông tin hiển thị", async () => {
      await memberPage.genLoc(memberPage.xpathBtnDelete).click();
      await memberPage.genLoc(memberPage.xpathBtnPopup).click();
      await expect(memberPage.genLoc(memberPage.xpathPopup)).toBeHidden();
      await expect(memberPage.genLoc(memberPage.xpathMessage)).toHaveText("Deleted member successfully.");
      await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.suiteConf.keyword);
      await expect(memberPage.genLoc(memberPage.xpathImageEmpty)).toBeVisible();
    });

    await test.step("SF login vào storefront digital bằng email đã bị xóa", async () => {
      const sfTab = await context.newPage();
      await sfTab.goto(`https://${conf.suiteConf.domain}/sign-in`);
      const myAccount = new MyAccountPage(sfTab);
      await myAccount.page.waitForSelector(myAccount.xpathSendCodeBtn);
      await myAccount.genLoc(myAccount.xpathInputEmail).fill(conf.suiteConf.email);
      await myAccount.page.locator(myAccount.xpathSendCodeBtn).click();
      //Verify email gửi cho member
      const newTab = await context.newPage();
      await newTab.goto(`https://www.mailinator.com/`);
      const mailinator = await getMailinatorInstanceWithProxy(newTab);
      await mailinator.accessMail(conf.suiteConf.email);
      await mailinator.readMail(conf.caseConf.subject_email);
      const contentEmail = await mailinator.page
        .frameLocator(mailinator.iframe)
        .locator("(//tbody/tr[2]/th/div)[last()-4]")
        .innerText();
      expect(contentEmail).toEqual(`Welcome to ${conf.suiteConf.shop_name}! We’re so glad you’ve decided to join us.`);
      //sign in to storefront
      const code = (await mailinator.getContentMail()).trim();
      await myAccount.genLoc(myAccount.xpathInputEmail).fill(code);
      await myAccount.page.locator(myAccount.xpathSignInBtn).click();
      await expect(myAccount.genLoc("//span[normalize-space()='My products']")).toBeVisible();
    });

    await test.step("Seller vào màn Dashboard member > tìm kiếm email", async () => {
      await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.caseConf.keyword);
      await expect(memberPage.genLoc(`//table//p[normalize-space()='${conf.suiteConf.email}']`)).toBeVisible();
    });
  });

  test(`Member_sf - Verify member được tạo ra khi buyer tạo acc ngoài SF @SB_SC_SCM_16`, async ({ conf, page }) => {
    await checkoutPage.genLoc("//button[normalize-space()='Access to my content']").click();
    await checkoutPage.page.waitForLoadState("networkidle");
    //edit profile của member
    const myAccount = new MyAccountPage(page, conf.suiteConf.domain);
    await myAccount.genLoc("//span[contains(@class,'menu-item--avatar')]").click();
    await myAccount.page.getByRole("button", { name: "My profile" }).click();
    const data = conf.caseConf.data_edit_profile_success;
    await myAccount.inputProfile(data.first_name, data.last_name, data.file_path, data.phone);
    await myAccount.genLoc(myAccount.xpathBtnSaveChange).click();
    await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeVisible();

    await test.step("Verify thông tin hiển thị tại màn hình list", async () => {
      await memberPage.navigateToMemberPage();
      await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.suiteConf.keyword);
      await memberPage.page.waitForSelector(memberPage.xpathColumnMember);
      const memberInfo = conf.caseConf.member_info;
      const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
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

    await test.step("Verify thông tin member tại màn hình detail", async () => {
      await memberPage.openMemberDetail(1);
      await expect(memberPage.genLoc(memberPage.xpathEmail)).toHaveText(`${conf.suiteConf.email}`);
      await expect(memberPage.genLoc(memberPage.xpathMemberName)).toHaveText(
        `${data.first_name}` + ` ${data.last_name}`,
      );
      await expect(memberPage.genLoc(memberPage.xpathPhoneMember)).toHaveText("+84" + `${data.phone}`);
      await expect(memberPage.genLoc(memberPage.xpathItemName)).toHaveText("Internet Security");
      await expect(memberPage.genLoc(memberPage.xpathProdAccess)).toHaveText("Internet Security");
    });
  });
});
