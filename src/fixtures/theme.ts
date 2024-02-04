import { test as base } from "@core/fixtures";
import { expect } from "@core/fixtures";
import type { FixtureThemeApi, Bootstrap, ThemeSection, ShopTheme } from "@types";

export const test = base.extend<{
  theme: FixtureThemeApi;
}>({
  theme: [
    async ({ conf, authRequest, api }, use) => {
      const theme: FixtureThemeApi = {
        domain(authConfig) {
          return authConfig ? authConfig.domain : conf.suiteConf.domain;
        },

        /**
         * Get list shop theme
         */
        async list(authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_themes: Array<ShopTheme> }>(
              {
                url: `https://${domain}/admin/themes.json?order_by=created_at&order_direction=desc`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_themes;
          } catch (e) {
            throw new Error(`Get list themes failed ${e}`);
          }
        },

        /**
         * Get shop theme detail by shop theme id
         * @param shopThemeId
         * @param authConfig
         */
        async single(shopThemeId, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_theme: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/${shopThemeId}.json`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_theme;
          } catch (e) {
            throw new Error(`Get theme data failed: ${e}`);
          }
        },

        /**
         * Create a new theme by theme id
         * @param id
         * @param authConfig
         */
        async create(id, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_theme: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/add.json`,
                method: "POST",
                request: {
                  data: {
                    current_style: "",
                    theme_id: id,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_theme;
          } catch (e) {
            throw new Error("Create theme failed");
          }
        },

        /**
         * Duplicate theme
         * @param id
         * @param authConfig
         */
        async duplicate(id, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_theme: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/${id}.json`,
                method: "POST",
                request: {
                  data: {},
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_theme;
          } catch (e) {
            throw new Error("Duplicate theme failed");
          }
        },

        /**
         * Create a new ecom theme by theme id
         * @param id
         */
        async createEcom(id, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_theme: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/builder/site.json`,
                method: "POST",
                request: {
                  data: {
                    current_style: "",
                    theme_id: id,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_theme;
          } catch (e) {
            throw new Error("Create theme failed");
          }
        },

        /**
         * Apply template
         * @param id
         */
        async applyTemplate(id, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ result: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/builder/theme/add.json`,
                method: "POST",
                request: {
                  data: {
                    id: id,
                    override: false,
                    use_template_footer: false,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.result;
          } catch (e) {
            throw new Error(`Apply template failed, error: ${e}`);
          }
        },

        /**
         * Clone template
         * @param id
         */
        async cloneTemplate(id: number) {
          try {
            const domain = conf.suiteConf.domain;
            const userId = conf.suiteConf.user_id;
            const rawResponse = await authRequest.post(`https://${domain}/admin/themes/clone-theme.json`, {
              data: {
                clone_shop_theme_id: id,
                user_id: userId,
              },
            });
            if (rawResponse.ok()) {
              const res = await rawResponse.json();
              return res.shop_theme;
            }
          } catch (e) {
            throw new Error("Clone template failed");
          }
        },

        /**
         * Hàm update theme
         * @params shopThemeId: id template
         * @params data: settings_data hoặc name để thay đổi design + name của template
         * @params authConfig
         */
        async updateTheme(shopThemeId, data, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_theme: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/${shopThemeId}.json`,
                method: "PUT",
                request: {
                  data: data,
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_theme;
          } catch (e) {
            throw new Error("Update theme failed");
          }
        },

        /**
         * Update data of shop theme by shop theme id
         * @param shopThemeId
         * @param settingsData
         */
        async update(shopThemeId, settingsData, authConfig) {
          const shopTheme = await this.updateTheme(shopThemeId, { settings_data: settingsData }, authConfig);
          return shopTheme;
        },

        /**
         * Publish a shop theme by shop theme id
         * @param shopThemeId
         */
        async publish(shopThemeId, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ shop_theme: ShopTheme }>(
              {
                url: `https://${domain}/admin/themes/${shopThemeId}.json`,
                method: "PUT",
                request: {
                  data: {
                    active: true,
                    id: shopThemeId,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.shop_theme;
          } catch (e) {
            throw new Error("Publish theme failed");
          }
        },

        /**
         * Delete a shop theme by shop theme id
         * @param shopThemeId
         */
        async delete(shopThemeId, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const rawResponse = await api.request<{ success: boolean }>(
              {
                url: `https://${domain}/admin/themes/${shopThemeId}.json`,
                method: "DELETE",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return rawResponse.data.success;
          } catch (e) {
            throw new Error("Delete theme failed");
          }
        },

        /**
         * Get published shop theme
         */
        async getPublishedTheme(authConfig) {
          const response = await theme.list(authConfig);
          return response.find(shopTheme => shopTheme.active);
        },

        /**
         * Update a section of shop theme
         * @param updateSection
         * @param settingsData
         * @param shopThemeId
         */
        async updateSection({ updateSection, settingsData, shopThemeId }, authConfig) {
          Object.entries(settingsData).forEach(data => {
            const [sectionKey, sectionValue] = data;
            const sectionKeys = Object.keys(sectionValue);
            for (let i = 0; i < sectionKeys.length; i++) {
              const blockKey = sectionKeys[i];
              if (updateSection[blockKey]) {
                if (
                  settingsData[sectionKey][blockKey].default &&
                  Array.isArray(settingsData[sectionKey][blockKey].default)
                ) {
                  const indexSection = settingsData[sectionKey][blockKey].default.findIndex(
                    item => item.type === updateSection[blockKey].type,
                  );

                  if (indexSection > -1) {
                    Object.assign(settingsData[sectionKey][blockKey].default[indexSection], updateSection[blockKey]);
                  } else {
                    settingsData[sectionKey][blockKey].default.push(updateSection[blockKey]);
                  }
                } else {
                  settingsData[sectionKey][blockKey] = Object.assign(
                    settingsData[sectionKey][blockKey],
                    updateSection[blockKey],
                  );
                }
                break;
              }
            }
          });
          return await theme.update(shopThemeId, settingsData, authConfig);
        },

        /**
         * Update all data of a page, fixed, settings or all pages
         * @param updateSections
         * @param settingsData
         * @param shopThemeId
         */
        async updateThemeSettings({ updateSections, settingsData, shopThemeId }, authConfig) {
          let found = false;
          let keys = Object.keys(settingsData);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (updateSections[key]) {
              settingsData[key] = Object.assign({}, settingsData[key], updateSections[key]);
              found = true;
              break;
            }
          }

          if (!found) {
            keys = Object.keys(settingsData.pages);
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              if (updateSections[key]) {
                settingsData.pages[key] = updateSections[key] as Record<string, ThemeSection[]>;
                break;
              }
            }
          }
          return await theme.update(shopThemeId, settingsData, authConfig);
        },

        /**
         * Add a section into a pages of shop theme
         * @param shopThemeId
         * @param addSections
         * @param settingsData
         */
        async addSection({ shopThemeId, addSection, settingsData }) {
          Object.entries(addSection).forEach(data => {
            const [page, section] = data;
            (settingsData.pages[page].default as ThemeSection[]).push(section);
          });

          return await theme.update(shopThemeId, settingsData);
        },

        /* Get first ID of template */
        async getFirstIdOfTemplates(): Promise<number> {
          try {
            const endpoint = `https://${conf.suiteConf.domain}/admin/themes/templates.json`;
            const rawThemeResponse = await authRequest.get(endpoint);
            expect(rawThemeResponse.ok()).toBeTruthy();
            const response = await rawThemeResponse.json();
            return response.result.templates[0].id;
          } catch (e) {
            throw new Error("Get templateID failed");
          }
        },

        /* Get store ID of multiple storefronts */
        async getStoreId(): Promise<number> {
          try {
            const endpoint = `https://${conf.suiteConf.domain}/admin/shop/storefronts.json?limit=9&page=1&search=&status=&sort_field=created_at&sort_direction=desc`;
            const rawThemeResponse = await authRequest.get(endpoint);
            expect(rawThemeResponse.ok()).toBeTruthy();
            const response = await rawThemeResponse.json();
            return response.result.shops[0].id;
          } catch (e) {
            throw new Error("Get storeID failed");
          }
        },

        /*Create template by API*/
        async createTemplate({ templateData, shopThemeID }, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const endpoint = `https://${domain}/admin/themes/template.json`;
            const createTemplate = await api.request<boolean>(
              {
                url: endpoint,
                method: "POST",
                request: {
                  data: {
                    ...templateData,
                    shop_theme_id: shopThemeID,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return createTemplate.ok;
          } catch (e) {
            throw new Error("Create template failed");
          }
        },

        /*
          Get current data of template
          Update template name & template data
        */
        async updateTemplate({ templateId, templateName, addData }) {
          const endpoint = `https://${conf.suiteConf.domain}/admin/themes/template/${templateId}.json`;
          const rawThemeResponse = await authRequest.get(endpoint);
          expect(rawThemeResponse.ok()).toBeTruthy();
          const response = await rawThemeResponse.json();
          response.result.template.title = templateName;
          await response.result.template.settings_data.push(addData);
          const endpointUpdate = `https://${conf.suiteConf.domain}/admin/themes/template.json`;
          const updateTemplate = await authRequest.put(endpointUpdate, {
            data: response.result.template,
          });
          expect(updateTemplate.ok()).toBeTruthy();
          return updateTemplate.ok();
        },

        /*Delete template by API */
        async deleteTemplate({ templateId, shopThemeId }) {
          const endpoint =
            `https://${conf.suiteConf.domain}/admin/themes/template/` +
            `${templateId}.json?shop_theme_id=${shopThemeId}`;
          const response = await authRequest.delete(endpoint);
          expect(response.ok()).toBeTruthy();
          return response.ok();
        },

        /***
         * Add theme (inside|roller|name template ciadora)
         * @param nameTheme (note: add theme ciadora is a template name from webbase library)
         */
        async addTheme(nameTheme): Promise<ShopTheme> {
          try {
            let response;
            switch (nameTheme) {
              case "inside":
              case "roller": {
                const idThemeOld = nameTheme == "inside" ? 3 : 2;
                response = await authRequest.post(`https://${conf.suiteConf.domain}/admin/themes/add.json`, {
                  data: {
                    theme_id: idThemeOld,
                    current_style: "",
                  },
                });
                break;
              }

              default: {
                const ids = await this.getIdByNameTemplate(nameTheme);
                response = await authRequest.post(
                  `https://${conf.suiteConf.domain}/admin/themes/builder/theme/add.json`,
                  {
                    data: {
                      id: ids[0],
                      override: false,
                      use_template_footer: false,
                    },
                  },
                );
                break;
              }
            }
            const res = await response.json();
            return nameTheme == "inside" || nameTheme == "roller" ? res.shop_theme : res.result;
          } catch (e) {
            throw new Error(`Error add theme`);
          }
        },

        /***
         * Get id template by name template
         * @param nameTemplate from web base
         * @param libId
         */
        async getIdByNameTemplate(nameTemplate: string, libId = 1): Promise<number> {
          try {
            const response = await authRequest.get(
              `https://${conf.suiteConf.domain}/admin/themes/builder/library/${libId}/templates.json?type=theme&page=1&limit=15&search=&category_id=undefined&sort_field=priority&sort_direction=desc&setting_type=`,
              {},
            );
            const setting = await response.json();
            return setting.result.filter(item => item.title === nameTemplate).map(item => item.id);
          } catch (e) {
            throw new Error(`Template not found`);
          }
        },

        /**
         * Get bootstrap api
         * @param shopThemeId
         */
        async getBootstrap(shopThemeId) {
          let url = `https://${conf.suiteConf.domain}/api/bootstrap/next.json`;
          if (shopThemeId) {
            url = `${url}?theme_preview_id=${shopThemeId}`;
          }
          const response = await api.request<{ result: Bootstrap }>({
            url,
            method: "GET",
            request: {},
            response: {
              status: 200,
              data: {},
            },
          });
          return response.data.result;
        },
      };
      await use(theme);
    },
    { scope: "test" },
  ],
});

export { expect } from "@playwright/test";
