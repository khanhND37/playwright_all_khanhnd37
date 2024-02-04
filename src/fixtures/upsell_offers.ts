import { test as base } from "@core/fixtures";
import type { CreateUpsellOfferResponse, FixtureUpsellOffers, UpsellOffers } from "@types";

export const test = base.extend<{
  upsellOffer: FixtureUpsellOffers;
}>({
  upsellOffer: [
    async ({ api }, use) => {
      const upsellOffer: FixtureUpsellOffers = {
        async listOffers() {
          const domain = this.domain;
          const response = await api.request<Array<UpsellOffers>>(
            {
              url: `https://${domain}/admin/offers/list.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          return response.data;
        },

        async createOffer(params) {
          const domain = this.domain;
          const response = await api.request<CreateUpsellOfferResponse>(
            {
              url: `https://${domain}/admin/offers.json`,
              method: "POST",
              request: {
                data: params,
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          return response.data;
        },

        async deleteAllOffers(ids) {
          const domain = this.domain;
          const response = await api.request<object>(
            {
              url: `https://${domain}/admin/offers/delete.json`,
              method: "DELETE",
              request: {
                data: {
                  ids: ids,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          return response.data;
        },

        async settingsCTABtn(params) {
          const domain = this.domain;
          const response = await api.request<object>(
            {
              url: `https://${domain}/admin/setting/app.json`,
              method: "POST",
              request: {
                data: {
                  settings: params.settings,
                  app_code: params.app_code,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          return response.data;
        },
      };
      await use(upsellOffer);
    },
    { scope: "test" },
  ],
});
export { expect } from "@playwright/test";
