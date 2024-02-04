import { expect, test } from "@core/fixtures";
import { generateEmail } from "@core/utils/theme";
import { MemberAPI } from "@pages/shopbase_creator/dashboard/member_api";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test(`[API] - POST thêm mới member thành công @SB_SC_SCM_22`, async ({ conf, authRequest }) => {
  const memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
  await test.step(`Nhập các trường thông tin: First name, Last name, Email, Country, Phone, Notes, Tag -> Verify thông tin member sau khi tạo`, async () => {
    const data = conf.caseConf.data_create_member;
    const email = generateEmail();
    const response = await memberAPI.createMember({
      ...data,
      email: email,
    });
    const member = response.data;
    const info = {
      first_name: member.customer.first_name,
      last_name: member.customer.last_name,
      note: member.customer.note,
      phone: member.customer.phone,
      calling_code: member.customer.calling_code,
      tags: member.customer.tags,
      country_id: member.country_id,
    };
    expect(info).toEqual(data);
  });
});

test(`[API] - Delete member thành công @SB_SC_SCM_20`, async ({ conf, authRequest }) => {
  const memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
  await test.step(`Send request delete member`, async () => {
    const response = await memberAPI.getMembers(conf.caseConf.paging_param);
    const member = response.data;
    for (let i = 0; i < member.length; i++) {
      const id = member[i].id;
      const res = await memberAPI.deleteMember(id);
      expect(res).toEqual(true);
    }
  });
});

test.describe(" API Member Dashboard SB Creator @SB_SC_SCM_", () => {
  let memberAPI: MemberAPI;
  test.beforeEach(async ({ conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    // create member
    const data = conf.caseConf.data_create_member;
    for (let i = 0; i < data.length; i++) {
      const email = generateEmail();
      await memberAPI.createMember({
        ...data[i],
        email: email,
      });
    }
  });

  test.afterEach(async ({ conf }) => {
    const response = await memberAPI.getMembers(conf.caseConf.paging_param);
    const member = response.data;
    for (let i = 0; i < member.length; i++) {
      const id = member[i].id;
      await memberAPI.deleteMember(id);
    }
  });

  test(`[API] - GET member detail @SB_SC_SCM_17`, async ({ conf }) => {
    const data = conf.caseConf.data_create_member[0];
    const response = await memberAPI.getMembers(conf.caseConf.paging_param);
    const memberId = response.data[0].id;
    const res = await memberAPI.getMemberDetail(memberId);
    const info = {
      first_name: res.customer.first_name,
      last_name: res.customer.last_name,
      note: res.customer.note,
      phone: res.customer.phone,
      calling_code: res.customer.calling_code,
      tags: res.customer.tags,
      country_id: res.country_id,
    };
    expect(info).toEqual(data);
  });

  test(`[API] - PUT xóa member khỏi khóa học thành công @SB_SC_SCM_18`, async ({ conf, authRequest }) => {
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    // create product
    const productListData = conf.caseConf.product_list;
    await productAPI.createProduct(productListData);

    //Get product id
    const products = await productAPI.getProducts(conf.caseConf.paging_param);
    const idsArray = products?.data?.map(item => item.id);
    const productId = idsArray.join();

    // Get member id
    const member = await memberAPI.getMembers(conf.caseConf.paging_param);
    const memberIds = member?.data.map(item => item.id);

    // Add product cho member
    const addProductForMember = {
      shop_id: conf.suiteConf.shop_id,
      member_id: memberIds[0],
      product_ids: productId,
    };
    expect(await memberAPI.addProductForMember(addProductForMember)).toEqual("success");
    // await memberAPI.addProductForMember(addProductForMember);

    await test.step(`Send request xóa khóa học cho member`, async () => {
      const response = await memberAPI.updateProductForMember(addProductForMember);
      expect(response).toEqual("Update success success");
    });

    //delete product
    await productAPI.deleteProduct(idsArray);
  });

  test(`[API] - POST thêm khóa học cho member @SB_SC_SCM_19`, async ({ conf, authRequest }) => {
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    // create product
    const productListData = conf.caseConf.product_list;
    await productAPI.createProduct(productListData);

    //Get product id
    const products = await productAPI.getProducts(conf.caseConf.paging_param);
    const idsArray = products?.data?.map(item => item.id);
    const productId = idsArray.join();

    // Get member id
    const member = await memberAPI.getMembers(conf.caseConf.paging_param);
    const memberIds = member?.data.map(item => item.id);

    // Add product cho member
    const addProductForMember = {
      shop_id: conf.suiteConf.shop_id,
      member_id: memberIds[0],
      product_ids: productId,
    };

    await test.step(`Send request thêm khóa học cho member`, async () => {
      const response = await memberAPI.addProductForMember(addProductForMember);
      expect(response).toEqual("success");
    });

    //delete product
    await productAPI.deleteProduct(idsArray);
  });

  test(`[API] - PUT update member thành công @SB_SC_SCM_21`, async ({ conf }) => {
    const member = await memberAPI.getMembers(conf.caseConf.paging_param);
    // Get member email
    const getEmail = member?.data.map(item => item.email);
    const emailMember = getEmail[0];
    // Get member id
    const memberIds = member?.data.map(item => item.id);
    const memberId = memberIds[0];

    await test.step(`Send request update thông tin member`, async () => {
      const dataUpdate = conf.caseConf.data_update_member;
      const response = await memberAPI.updateMember(
        {
          ...dataUpdate,
          email: emailMember,
        },
        memberId,
      );
      const res = response.data;
      const info = {
        first_name: res.customer.first_name,
        last_name: res.customer.last_name,
        note: res.customer.note,
        phone: res.customer.phone,
        calling_code: res.customer.calling_code,
        tags: res.customer.tags,
        country_id: res.country_id,
      };
      expect(info).toEqual(conf.caseConf.data_update_member);
    });
  });

  test(`[API] - GET member tại màn hình member list @SB_SC_SCM_25`, async ({ conf }) => {
    await test.step(`Send request get list member`, async () => {
      const response = await memberAPI.getMembers(conf.caseConf.paging_param);
      const member = response.data;
      const info = {
        first_name: member[0].first_name,
        last_name: member[0].last_name,
        note: member[0].note,
        phone: member[0].phone,
        calling_code: member[0].calling_code,
        tags: member[0].tag,
      };
      const data = conf.caseConf.data_create_member;
      const memberInfo = {
        first_name: data[0].first_name,
        last_name: data[0].last_name,
        note: data[0].note,
        phone: data[0].phone,
        calling_code: data[0].calling_code,
        tags: data[0].tag,
      };
      expect(info).toEqual(memberInfo);
    });
  });
});
