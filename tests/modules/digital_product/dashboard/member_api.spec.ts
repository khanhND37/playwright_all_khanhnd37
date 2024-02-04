import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { generateEmail } from "@core/utils/theme";
import { MemberByAPI } from "@pages/digital_product/dashboard/member_api";

test.describe(" API Member Dashboard SB Creator @TS_CR_MB", () => {
  let memberByAPI: MemberByAPI;
  let accessToken: string;

  test.beforeEach(async ({ conf, authRequest, token }) => {
    const tokenObject = await token.getWithCredentials({
      domain: conf.caseConf.domain,
      username: conf.caseConf.username,
      password: conf.caseConf.password,
    });
    accessToken = tokenObject.access_token;
    memberByAPI = new MemberByAPI(conf.caseConf.domain, authRequest);
  });

  test(`[API] - GET member detail với member đã mua product digital @TC_SB_DP_DB_MB_23`, async ({ api, conf }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const caseData = conf.caseConf.data[i];
      await test.step(`${caseData.description}`, async () => {
        for (const dataAPI of conf.caseConf.data) {
          const response = await api.request(dataAPI, { autoAuth: true });
          expect(response.status).toEqual(dataAPI.response.status);
          if (response.ok) {
            expect(dataAPI.response.data).toEqual(
              expect.objectContaining({
                email: response.data["customer"].email,
                first_order_id: response.data["customer"].first_order_id,
                last_order_id: response.data["customer"].last_order_id,
                orders_count: response.data["customer"].orders_count,
              }),
            );
          } else {
            expect(response.data["errors"]).toEqual(dataAPI.response.message);
          }
        }
      });
    }
  });

  test(`[API] - POST thêm mới member thành công @TC_SB_DP_DB_MB_17`, async ({ authRequest, conf, api }) => {
    await test.step(`Nhập các trường thông tin: First name, Last name, Email, Country, Phone, Notes, Tag`, async () => {
      const caseName = "TC_SB_DP_DB_MB_17";
      const data = loadData(__dirname, caseName);

      for (let i = 0; i < data.caseConf.data.length; i++) {
        const caseData = conf.caseConf.data[i];
        await test.step(`${caseData.case}`, async () => {
          switch (caseData.case) {
            case "Missing Email":
            case "Enter an existing email":
            case "Email is wrong format":
            case "Phone is wrong format": {
              const response = await api.request(
                {
                  ...caseData.data,
                  url: caseData.data.url,
                },
                { autoAuth: true },
              );
              expect(response.status).toEqual(caseData.data.response.status);
              expect(response.data["message"]).toEqual(caseData.data.response.message);
              break;
            }
            default: {
              const email = generateEmail();
              const response = await authRequest.post(`https://${conf.caseConf.domain}/admin/dp-member/member.json`, {
                data: {
                  member: {
                    email: email,
                    first_name: caseData.data.first_name,
                    last_name: caseData.data.last_name,
                    note: caseData.data.note,
                    phone: caseData.data.phone,
                    calling_code: caseData.data.calling_code,
                    tags: caseData.data.tags,
                  },
                  country_id: caseData.data.country_id,
                },
              });
              expect(response.status()).toEqual(caseData.response.status);
              break;
            }
          }
        });
      }
    });
  });

  test(`[API] - Delete member thành công @TC_SB_DP_DB_MB_19`, async ({ conf }) => {
    await test.step(`Send request delete member`, async () => {
      const preParam = conf.caseConf.param_before;
      const result = await memberByAPI.getMemberList(accessToken, preParam);
      await memberByAPI.deleteMemberByAPI(accessToken, result.data[0].id);
      const result1 = await memberByAPI.getMemberList(accessToken, preParam);
      expect(result1._metadata.total_count).toEqual(result._metadata.total_count - 1);
    });
  });

  test(`[API] - GET member list với store chưa có member @TC_SB_DP_DB_MB_13`, async ({ api, conf }) => {
    await test.step(`Send request với store chưa có members nào`, async () => {
      const response = await api.request(conf.caseConf.data, { autoAuth: true });
      expect(response.status).toEqual(conf.caseConf.data.response.status);
      expect(response.data["data"]).toEqual(conf.caseConf.data.response.data);
      expect(response.data["message"]).toEqual(conf.caseConf.data.response.message);
    });
  });

  test(`[API] - GET member list với store đã có member @TC_SB_DP_DB_MB_14`, async ({ api, conf }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const caseData = conf.caseConf.data[i];
      await test.step(`${caseData.description}`, async () => {
        for (const dataAPI of conf.caseConf.data) {
          const response = await api.request(dataAPI, { autoAuth: true });
          expect(response.status).toEqual(dataAPI.response.status);
          expect(response.data["_metadata"].limit).toEqual(dataAPI.response._metadata.limit);
          expect(response.data["_metadata"].page_count).toEqual(dataAPI.response._metadata.page_count);
          expect(response.data["_metadata"].total_count).toEqual(dataAPI.response._metadata.total_count);
          expect(response.data["data"].length).toEqual(dataAPI.response._metadata.page_count);
        }
      });
    }
  });

  test(`[API] - POST Export member @TC_SB_DP_DB_MB_16`, async ({ conf, api }) => {
    await test.step(`Send request export member của shop`, async () => {
      const response = await api.request(
        {
          ...conf.caseConf.data,
          url: conf.caseConf.data.url,
        },
        { autoAuth: true },
      );
      expect(response.status).toEqual(conf.caseConf.data.response.status);
      expect(response.data["link"]).toContain(conf.caseConf.data.response.data.link);
    });
  });

  test(`[API] - PUT update member thành công @TC_SB_DP_DB_MB_18`, async ({ conf, api }) => {
    await test.step(`Nhập lại các thông tin: First name, Last name, Email, Country, Phone, Notes, Tags `, async () => {
      const caseName = "TC_SB_DP_DB_MB_18";
      const data = loadData(__dirname, caseName);

      for (let i = 0; i < data.caseConf.data.length; i++) {
        const caseData = conf.caseConf.data[i];
        await test.step(`${caseData.case}`, async () => {
          const response = await api.request(
            {
              ...caseData.data,
              url: caseData.data.url,
            },
            { autoAuth: true },
          );

          if (response.ok) {
            expect(response.status).toEqual(caseData.data.response.status);
          } else {
            expect(response.data["message"]).toEqual(caseData.data.response.message);
          }
        });
      }
    });
  });

  test(`[API] - POST thêm member vào khóa học thành công @TC_SB_DP_DB_MB_20`, async ({ api, conf }) => {
    const caseName = "TC_SB_DP_DB_MB_20";
    const data = loadData(__dirname, caseName);

    for (let i = 0; i < data.caseConf.data.length; i++) {
      const caseData = conf.caseConf.data[i];
      await test.step(`${caseData.description}`, async () => {
        for (const dataAPI of conf.caseConf.data) {
          const response = await api.request(dataAPI, { autoAuth: true });
          expect(response.status).toEqual(dataAPI.response.status);
        }
      });
    }
  });

  test(`[API] - PUT xóa member khỏi khóa học thành công @TC_SB_DP_DB_MB_21`, async ({ api, conf }) => {
    const caseName = "TC_SB_DP_DB_MB_21";
    const data = loadData(__dirname, caseName);

    for (let i = 0; i < data.caseConf.data.length; i++) {
      const caseData = conf.caseConf.data[i];
      await test.step(`${caseData.description}`, async () => {
        for (const dataAPI of conf.caseConf.data) {
          const response = await api.request(dataAPI, { autoAuth: true });
          expect(response.status).toEqual(dataAPI.response.status);
          if (response.ok) {
            expect(response.data["messages"]).toEqual(caseData.response.data.messages);
          }
        }
      });
    }
  });
});
