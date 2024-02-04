import { APIRequestContext, expect } from "@playwright/test";
import type {
  MemberMetaData,
  MembersAPIResponse,
  MemberProductAccess,
  ResponseMemberDetail,
  ResponseMember,
  MemberBody,
} from "@types";
import { printLog } from "@utils/logger";

export class MemberAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  async getMembers(param: MemberMetaData): Promise<MembersAPIResponse> {
    const response = await this.request.get(`https://${this.domain}/admin/dp-member.json?`, {
      params: {
        limit: param.limit,
        page: param.page,
        order: "created_at+desc",
        product_ids: "",
        includes: "metadata",
        query: "",
      },
    });
    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    return jsonResponse;
  }

  async deleteMember(id: number): Promise<boolean> {
    const jsonResponse = await this.request.delete(`https://${this.domain}/admin/dp-member/member/${id}.json`);
    if (!jsonResponse.ok()) {
      const responseText = await jsonResponse.text();
      printLog(responseText);
      return;
    }
    expect(jsonResponse.status()).toBe(200);
    const responseText = await jsonResponse.json();
    const success = responseText.success;
    return success;
  }

  async createMember(member: MemberBody): Promise<ResponseMember> {
    const res = await this.request.post(`https://${this.domain}/admin/dp-member/member.json`, {
      data: {
        member: {
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name,
          note: member.note,
          phone: member.phone,
          calling_code: member.calling_code,
          tags: member.tags,
        },
        country_id: member.country_id,
      },
    });
    if (!res.ok()) {
      const responseText = await res.text();
      printLog(responseText);
      return;
    }
    expect(res.status()).toBe(200);
    const jsonResponse = await res.json();
    return jsonResponse as ResponseMember;
  }

  async updateMember(member: MemberBody, memberId: number): Promise<ResponseMember> {
    const res = await this.request.put(`https://${this.domain}/admin/dp-member/member/${memberId}.json`, {
      data: {
        member: {
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name,
          note: member.note,
          phone: member.phone,
          calling_code: member.calling_code,
          tags: member.tags,
        },
        country_id: member.country_id,
      },
    });
    if (!res.ok()) {
      const responseText = await res.text();
      printLog(responseText);
      return;
    }
    expect(res.status()).toBe(200);
    const jsonResponse = await res.json();
    return jsonResponse as ResponseMember;
  }

  async addProductForMember(member: MemberProductAccess): Promise<string> {
    const res = await this.request.post(
      `https://${this.domain}/admin/dp-member/member/${member.member_id}/products/enroll.json`,
      {
        data: {
          shop_id: member.shop_id,
          member_id: member.member_id,
          product_ids: member.product_ids,
        },
      },
    );
    if (!res.ok()) {
      const responseText = await res.text();
      printLog(responseText);
      return;
    }
    expect(res.status()).toBe(200);
    const responseText = await res.json();
    const message = responseText.message;
    return message;
  }

  async updateProductForMember(member: MemberProductAccess): Promise<string> {
    const res = await this.request.put(`https://${this.domain}/admin/dp-member/member/product/control-access.json`, {
      data: {
        shop_id: member.shop_id,
        member_id: member.member_id,
        product_ids: member.product_ids,
      },
    });
    if (!res.ok()) {
      const responseText = await res.text();
      printLog(responseText);
      return;
    }
    expect(res.status()).toBe(200);
    const responseText = await res.json();
    const message = responseText.messages[0];
    return message;
  }

  async getMemberDetail(id: number): Promise<ResponseMemberDetail> {
    const response = await this.request.get(`https://${this.domain}/admin/dp-member/member/${id}.json`);
    if (!response.ok()) {
      const responseText = await response.text();
      printLog(responseText);
    }

    expect(response.status()).toBe(200);
    const jsonResponse = await response.json();
    return jsonResponse as ResponseMemberDetail;
  }
}
