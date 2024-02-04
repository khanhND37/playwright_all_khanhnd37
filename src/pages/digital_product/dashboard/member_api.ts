import { APIRequestContext, expect } from "@playwright/test";
import type { DetailInfo, MemberInfo, Param, ValueDefault } from "@types";
import { convertDate } from "@core/utils/datetime";

/**
 * @deprecated: Split function into each page in src/shopbase_creator/dashboard
 */
export class MemberByAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get member information into table by API
   * @param accessToken
   * @param valueDefault
   * @param param
   * @param product is product id
   * @returns array<object> MemberInfo: Get member information
   */
  async getMemberInfo(
    accessToken: string,
    valueDefault: ValueDefault,
    param: Param,
    product?: Array<number>,
  ): Promise<MemberInfo> {
    const jsonResponse = await this.getMemberList(accessToken, param, product);
    const number = jsonResponse.data.length;
    const memberInfo = [];
    for (let i = 0; i < number; i++) {
      const info = {
        avatar: jsonResponse.data[i].avatar ?? valueDefault.img,
        name: "",
        email: jsonResponse.data[i].email,
        sale: "",
        addDate: convertDate(jsonResponse.data[i].created_at),
        lastSignIn: jsonResponse.data[i].last_signed_in,
      };
      if (!jsonResponse.data[i].first_name && !jsonResponse.data[i].last_name) {
        info.name = valueDefault.value;
      } else if (!jsonResponse.data[i].first_name) {
        info.name = jsonResponse.data[i].last_name;
      } else if (!jsonResponse.data[i].last_name) {
        info.name = jsonResponse.data[i].first_name;
      } else {
        info.name = `${jsonResponse.data[i].first_name} ${jsonResponse.data[i].last_name}`;
      }

      if (info.lastSignIn == null) {
        info.lastSignIn = valueDefault.value;
      } else {
        const date = info.lastSignIn * 1000;
        info.lastSignIn = convertDate(date);
      }

      if (info.email) {
        info.email = info.email.trim();
      }

      if (!jsonResponse.data[i].total_spent) {
        info.sale = "$0.00";
      } else {
        info.sale = `$${jsonResponse.data[i].total_spent.toFixed(2)}`;
      }

      memberInfo.push(info);
    }
    return memberInfo;
  }

  /**
   * API member list
   * @param accessToken
   * @param param
   * @param product is product id
   * @returns <json> get member list
   */
  async getMemberList(accessToken: string, param: Param, product?: Array<number>) {
    let url =
      `https://${this.domain}/admin/dp-member.json?` +
      `order=created_at+desc&includes=metadata&access_token=${accessToken}`;
    if (param.limit) {
      url += `&limit=${param.limit}`;
    }
    if (param.page) {
      url += `&page=${param.page}`;
    }
    if (param.keyword) {
      url += `&query=${param.keyword}`;
    }
    if (product) {
      url += `&product_ids=${product}`;
    }
    const jsonResponse = await this.request.get(url);
    expect(jsonResponse.status()).toBe(200);
    return await jsonResponse.json();
  }

  /**
   * Get list member_id
   * @param accessToken
   * @param param
   * @param product is product id
   * @returns <array> member_id
   */
  async getMemberIdByAPI(accessToken: string, param: Param, product?: Array<number>): Promise<Array<number>> {
    const jsonResponse = await this.getMemberList(accessToken, param, product);
    const total = jsonResponse._metadata.page_count;
    const memberId = [];
    for (let i = 0; i < total; i++) {
      const id = jsonResponse.data[i].id;
      memberId.push(id);
    }
    return memberId;
  }

  /**
   * Get purchased products information
   * @param accessToken
   * @returns <json> purchased products information
   */
  async getProductOfMember(accessToken: string) {
    const jsonResponse = await this.request.get(
      `https://${this.domain}/admin/digital-products/product.json?page=1&limit=10?access_token=${accessToken}`,
    );
    expect(jsonResponse.status()).toBe(200);
    return await jsonResponse.json();
  }

  /**
   * Get list id of purchased products
   * @param accessToken
   * @param totalSelect is the number of selected products
   * @returns <Array> product_id
   */
  async getProductId(accessToken: string, totalSelect: number): Promise<Array<number>> {
    const products = await this.getProductInfo(accessToken, totalSelect);
    const productIds = products.map(product => product.id);
    return productIds;
  }

  /**
   * Get purchased products information
   * @param accessToken
   * @param totalSelect is the number of selected products
   * @returns <object> productInfo {id, name}
   */
  async getProductInfo(accessToken: string, totalSelect: number) {
    const jsonResponse = await this.getProductOfMember(accessToken);
    const products = [];
    for (let i = 0; i < totalSelect; i++) {
      const product = {
        id: jsonResponse.data[i].id,
        name: jsonResponse.data[i].title,
      };
      products.push(product);
    }
    return products;
  }

  /**
   * Export member by API
   * @param accessToken
   * @param id member_id
   * @returns <json> response body: {message: link file/ text, success: true/ false}
   */
  async exportMember(accessToken: string, id: Array<number>) {
    const jsonResponse = await this.request.post(
      `https://${this.domain}/admin/customers/export.json?platform=digital_product&access_token=${accessToken}`,
      {
        data: {
          ids: id,
        },
      },
    );
    return await jsonResponse.json();
  }

  /**
   * Get information of a member by API
   * @param id is member_id
   * @param accessToken
   * @returns <json> response: information of a member
   */
  async getMemberDetail(id: number, accessToken: string) {
    const jsonResponse = await this.request.get(
      `https://${this.domain}/admin/dp-member/member/${id}.json?access_token=${accessToken}`,
    );
    expect(jsonResponse.status()).toBe(200);
    return await jsonResponse.json();
  }

  /**
   * Push member information into object
   * @param id is member_id
   * @param accessToken
   * @returns <object> memberInfo = [{firstName: value,lastName: value , email: value...},..]
   */
  async getMemberDetailInfo(id: number, accessToken: string): Promise<DetailInfo> {
    const result = await this.getMemberDetail(id, accessToken);
    const info = {
      firstName: "",
      lastName: "",
      email: result.customer.email,
      country: "",
      countryCode: "",
      phone: "",
      totalSale: 0,
      totalOrder: 0,
      tag: "",
      note: "",
    };

    if (!result.customer.first_name) {
      info.firstName = "";
    } else {
      info.firstName = result.customer.first_name;
    }

    if (!result.customer.last_name) {
      info.lastName = "";
    } else {
      info.lastName = result.customer.last_name;
    }

    if (info.email) {
      info.email = info.email.trim();
    }

    if (!result.customer.addresses[0]) {
      info.country = "";
    } else {
      info.country = result.customer.addresses[0].country_name;
    }

    if (!result.customer.addresses[0]) {
      info.countryCode = "";
    } else {
      info.countryCode = result.customer.addresses[0].country_code;
    }

    if (!result.customer.phone) {
      info.phone = "";
    } else {
      info.phone = result.customer.phone;
    }

    if (!result.customer.total_spent) {
      info.totalSale = 0;
    } else {
      info.totalSale = result.customer.total_spent;
    }

    if (!result.customer.orders_count) {
      info.totalOrder = 0;
    } else {
      info.totalOrder = result.customer.orders_count;
    }

    if (!result.customer.tags) {
      info.tag = "";
    } else {
      info.tag = result.customer.tags.includes(",") ? `"${result.customer.tags}"` : result.customer.tags;
    }
    if (!result.customer.note) {
      info.note = "";
    } else {
      info.note = result.customer.note;
    }
    return info;
  }

  /**
   * Format member information to array<string>: 'firstname,lastname...'
   * @param memberId
   * @param accessToken
   * @returns <array<string>> Get value of fields and push into array: ['valueFirstName,valueLastName,..',..]
   */
  async formatDataMember(memberId: Array<number>, accessToken: string): Promise<string[]> {
    const members = [];
    for (let j = 0; j < memberId.length; j++) {
      const info = await this.getMemberDetailInfo(memberId[j], accessToken);
      const member = Object.values(info).join(",");
      members.push(member);
    }
    return members;
  }

  /**
   * Delete member by API
   * @param accessToken
   * @param id is member id
   * @returns <json> response: delete member success or failed
   */
  async deleteMemberByAPI(accessToken: string, id: number) {
    const jsonResponse = await this.request.delete(
      `https://${this.domain}/admin/dp-member/member/${id}.json?access_token=${accessToken}`,
    );
    expect(jsonResponse.status()).toBe(200);
    return await jsonResponse.json();
  }

  /**
   * Get information products access of a member by API
   * @param id is member_id
   * @param accessToken
   * @returns <json> response:  information products access
   */
  async getProductMemberAccess(id: number, accessToken: string) {
    const jsonResponse = await this.request.get(
      `https://${this.domain}/admin/dp-member/member/${id}/products.json?access_token=${accessToken}`,
    );
    expect(jsonResponse.status()).toBe(200);
    return await jsonResponse.json();
  }

  /**
   * Get information orders of a member by API
   * @param id is member_id
   * @param accessToken
   * @returns <json> response: information orders
   */
  async getOrdersMemberDetail(id: number, accessToken: string) {
    const jsonResponse = await this.request.get(
      `https://${this.domain}/admin/customers/${id}/orders.json?access_token=${accessToken}`,
    );
    expect(jsonResponse.status()).toBe(200);
    return await jsonResponse.json();
  }

  /**
   * Get Id of member
   * @param infoMember thông tin tại 1 member
   * */
  async getMemberId(infoMember: MemberInfo) {
    const response = await this.request.post(`https://${this.domain}/admin/dp-member/member.json`, {
      data: infoMember,
    });
    await expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.data.customer.id;
  }
}
