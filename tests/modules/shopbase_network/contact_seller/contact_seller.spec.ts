import { ContactForm } from "@pages/shopbaseNetwork/contact_seller";
import { expect, test } from "@core/fixtures";

test.describe("@TS_SB_MP_CR", async () => {
  test("Contact seller successfully @TC_SB_MP_CR_1", async ({ page, conf }) => {
    const contactForm = new ContactForm(page, conf.caseConf.domain);

    //Open listing detail page
    await test.step("Open listing detail page", async () => {
      await contactForm.gotoListingDetail();
    });

    //Verify button Sign in to contact seller khi chưa login
    await test.step("Verify button Sign in to contact seller", async () => {
      await page.locator(`//*[normalize-space()='Sign in to contact']`).isVisible();
      await page.locator(`//*[normalize-space()='Sign in to contact']`).click();
    });

    //Login shopbase network
    await test.step("Login shopbase network", async () => {
      const email = conf.caseConf.username;
      const password = conf.caseConf.password;
      await contactForm.loginShopBaseNetwork({
        email: email,
        password: password,
      });
    });

    //Verify button Contact seller
    await test.step("Verify button Contact seller", async () => {
      expect(await page.locator(`//*[normalize-space()='Contact seller']`).isVisible());
    });

    //Fill infor to contact form
    await test.step("Fill infor contact form", async () => {
      await page.locator(`//*[normalize-space()='Contact seller']`).click();
      const selectedStore = conf.caseConf.selected_store;
      const describeTheProblem = conf.caseConf.describe_the_problem;
      await contactForm.fillInforContactForm(selectedStore, describeTheProblem);
      await expect(page.locator("//div[normalize-space()='Submit contact successfully']")).toBeVisible();
      await expect(page.locator("//div[normalize-space()='You contacted this seller just now']")).toBeVisible();
    });
  });
});
