import { expect, APIRequestContext } from "@playwright/test";

export class DomainAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get the first public proxy domain in domain page
   * @param shopID
   * @returns domain info contains domain id and domain name
   */
  async getProxyDomain(shopID: string) {
    const res = await this.request.get(`https://${this.domain}/admin/setting/domains.json?shop_id=${shopID}`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const domainList = resBody.shop_domains;
    const domainID = domainList.find(domain => domain.verify_status === "verified").id;
    const domainName = domainList.find(domain => domain.verify_status === "verified").public_domain;
    const domainInfo = { domain_id: domainID, domain_name: domainName };
    return domainInfo;
  }
}
