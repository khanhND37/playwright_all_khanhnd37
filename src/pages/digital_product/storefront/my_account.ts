import { SBPage } from "@pages/page";

/**
 * @deprecated: use src/shopbase_creator/storefront/ instead
 */
export class MyAccountPage extends SBPage {
  /**
   * go to My profile page
   */
  async gotoProfilePage() {
    await this.genLoc("//a[normalize-space()='My profile']").click();
  }

  /**
   * go to Change password page
   */
  async gotoChangePassPage() {
    await this.genLoc("//a[normalize-space()='Change password']").click();
  }

  /**
   * update Profile
   * @param firstName
   * @param lastName
   * @param filePath
   */
  async updateProfile(firstName: string, lastName: string, filePath?: string) {
    await this.genLoc("//input[@name='first-name']").fill(firstName);
    await this.genLoc("//input[@name='last-name']").fill(lastName);
    if (filePath) {
      await this.page.setInputFiles("input[type='file']", filePath);
    }
  }

  /**
   * click button Save profile
   */
  async clickBtnUpdateProfile() {
    await this.genLoc("//button[normalize-space()='Save changes']").click();
  }

  /**
   * input current, new and confirm password and click btn Update
   * @param currentPass
   * @param newPass
   * @param confirmPass
   */
  async changePass(currentPass: string, newPass: string, confirmPass: string) {
    await this.genLoc("//input[@name='old-password']").fill(currentPass);
    await this.genLoc("//input[@name='password']").fill(newPass);
    await this.genLoc("//input[@name='password-confirm']").fill(confirmPass);
    await this.genLoc("//button[normalize-space()='Update password']").click();
  }
}
