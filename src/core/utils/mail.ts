import { Mailinator } from "@helper/mailinator";
import { Page } from "@playwright/test";
import { getProxyPage } from "@utils/proxy_page";
import { MailBox } from "@pages/thirdparty/mailbox";

/**
  Generate a mail to this by date time to verify email
 */
export const generateRandomMailToThisEmail = (): string => {
  const timestamp = new Date().getTime();
  return `shopbase${timestamp}@maildrop.cc`;
};

/**
  Mail content of Import campaign
 */

export type ImportCampStatusInMail = {
  success?: string;
  fail?: string;
  skip?: string;
  image_status?: string;
};

export const getMailinatorInstanceWithProxy = async (page: Page): Promise<Mailinator> => {
  let mailInstance: Mailinator;
  if (process.env.ENV !== "local" && process.env.PROXY_US_SERVER) {
    // In localhost, we do not have config, so we need fallback here
    const proxyPage = await getProxyPage();
    mailInstance = new Mailinator(proxyPage);
  } else {
    mailInstance = new Mailinator(page);
  }

  return mailInstance;
};

export const getMailboxInstanceWithProxy = async (page: Page, domain: string): Promise<MailBox> => {
  let mailBox: MailBox;
  if (process.env.ENV !== "local" && process.env.PROXY_US_SERVER) {
    // In localhost, we do not have config, so we need fallback here
    const proxyPage = await getProxyPage();
    mailBox = new MailBox(proxyPage, domain);
  } else {
    mailBox = new MailBox(page, domain);
  }

  return mailBox;
};
