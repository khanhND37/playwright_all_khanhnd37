import { test as base } from "@fixtures/theme";
import { buildQueryString } from "@utils/string";
import type {
  FixtureWebBuilder,
  LibrariesBuilder,
  CreateLibraryResponse,
  LibraryBuilder,
  CreateTemplateResponse,
  CreateUpsellOfferResponse,
  CreatePageResponse,
  UpsellOffers,
  CategoriesBuilder,
  CreateCategoryResponse,
  PageBuilder,
  PageWebBuilderInfo,
  ComponentResponse,
  Templates,
  Tags,
  YourTemplates,
  SettingCheckoutForm,
  WebBuilderElement,
  WebBuilderPage,
} from "@types";

export const test = base.extend<{
  builder: FixtureWebBuilder;
}>({
  builder: [
    async ({ conf, api }, use) => {
      const builder: FixtureWebBuilder = {
        /**
         * Get domain
         * @param authConfig
         */
        domain(authConfig) {
          return authConfig ? authConfig.domain : conf.suiteConf.domain;
        },

        /**
         * Get library list
         */
        async listLibrary(params, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: { libraries: Array<LibrariesBuilder> } }>(
            {
              url: `https://${domain}/admin/themes/builder/libraries.json`,
              method: "GET",
              request: {
                params: params,
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result.libraries;
        },
        /**
         * Get lastest ID of library list
         */
        async getLastestLibraryID() {
          const libraryData = await builder.listLibrary({ action: "all" });
          const userLibraries = libraryData.filter(library => !library.published);
          const sortedUserLibraries = userLibraries.sort((previous, current) => (previous.id > current.id ? -1 : 1));
          const firstId = sortedUserLibraries[0].id;
          return firstId;
        },
        /**
         * Get category list
         */
        async listCategory(authConfig) {
          const domain = this.domain(authConfig);
          const libraryId = await builder.getLastestLibraryID();
          const response = await api.request<{ result: { result: Array<CategoriesBuilder> } }>(
            {
              url: `https://${domain}/admin/themes/builder/categories.json?library_id=${libraryId}`,
              method: "GET",
              request: {
                params: {
                  action: "all",
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result.result;
        },

        /**
         * Get tag list of all templates or in each page of select page template popup
         */
        async listTag(params, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: { tags: Array<string> } }>(
            {
              url: `https://${domain}/admin/themes/builder/tags.json`,
              method: "GET",
              request: {
                params: params,
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result.tags;
        },

        /**
         * Create new library
         * @param params
         * @param authConfig
         */
        async createLibrary(params, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const response = await api.request<{ result: CreateLibraryResponse }>(
              {
                url: `https://${domain}/admin/themes/builder/library.json`,
                method: "POST",
                request: {
                  data: {
                    title: params.title,
                    description: params.description,
                    types: params.types,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return response.data.result;
          } catch (e) {
            throw new Error(`Error while creating library`);
          }
        },
        /**
         * Create new category
         * @param params
         * @param authConfig
         */
        async createCategoryByAPI(params, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: CreateCategoryResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/category.json`,
              method: "POST",
              request: {
                data: {
                  title: params.title,
                  type: params.type,
                  library_id: params.library_id,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Delete category
         * @param cateId
         * @param authConfig
         * @returns
         */
        async deleteCategory(cateId, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const response = await api.request<{ success: boolean }>(
              {
                url: `https://${domain}/admin/themes/builder/category/${cateId}.json`,
                method: "DELETE",
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
            return response.data.success;
          } catch (e) {
            throw new Error("Delete category failed");
          }
        },

        /**
         * Hàm delete section, block trong category thuộc library detail
         * @param id
         * @param authConfig
         * @returns
         */
        async deleteComponent(id, authConfig) {
          const domain = this.domain(authConfig);
          try {
            const response = await api.request<{ success: boolean }>(
              {
                url: `https://${domain}/admin/themes/builder/template/component/${id}.json`,
                method: "DELETE",
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
            return response.data.success;
          } catch (e) {
            throw new Error("Delete component failed");
          }
        },

        /**
         * Get Template list của 1 library
         */
        async libraryDetail(libId, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: LibraryBuilder }>(
            {
              url: `https://${domain}/admin/themes/builder/library/${libId}.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Update a library by id
         * @param id
         * @param params
         * @param authConfig
         */
        async updateLibrary(id, params, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: CreateLibraryResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/library/${id}.json`,
              method: "PUT",
              request: {
                data: params,
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        async updateLinkedLib(id, params) {
          const domain = this.domain();
          const response = await api.request<{ result: CreateLibraryResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/library-linked/${id}.json`,
              method: "PUT",
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
          return response.data.result;
        },

        /**
         * Update trạng thái của template
         * @param id
         * @param params
         * @param authConfig
         */
        async updateTemplate(id, status, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: CreateTemplateResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/template/page/${id}.json`,
              method: "PUT",
              request: {
                data: {
                  id: id,
                  status: status,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Create library linked
         * @param id
         * @param authConfig
         */
        async createLibraryLinked(id, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: LibrariesBuilder }>(
            {
              url: `https://${domain}/admin/themes/builder/library-linked.json`,
              method: "POST",
              request: {
                data: {
                  library_id: id,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Delete library linked
         * @param id
         * @param authConfig
         */
        async deleteLibraryLinked(id, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: object }>(
            {
              url: `https://${domain}/admin/themes/builder/library-linked/${id}.json`,
              method: "DELETE",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Delete shop library
         * @param id
         * @param authConfig
         */
        async deleteLibrary(id, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: object }>(
            {
              url: `https://${domain}/admin/themes/builder/library/${id}.json`,
              method: "DELETE",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Hàm create template trong 1 library cụ thể
         */
        async createTemplateInLib(params, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: CreateTemplateResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/template/page.json`,
              method: "POST",
              request: {
                data: params,
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Delete all template on the library
         * @param libraryID
         * @param authConfig
         * @returns
         */
        async deleteAllTemplateOnLibrary(libraryID, authConfig) {
          const templateIds = [];
          let responseDelete;
          const domain = this.domain(authConfig);
          const responseGet = await this.libraryDetail(libraryID, authConfig);
          const templateList = responseGet.themes;
          for (const themeInfo of templateList) {
            templateIds.push(themeInfo.id);
          }
          if (templateIds.length > 0) {
            try {
              for (const templateId of templateIds) {
                responseDelete = await api.request<{ result: boolean }>(
                  {
                    url: `https://${domain}/admin/themes/builder/template/theme/${templateId}.json`,
                    method: "DELETE",
                    request: {},
                    response: {
                      status: 200,
                      data: {},
                    },
                  },
                  { autoAuth: true, conf: authConfig },
                );
              }
              return responseDelete.data;
            } catch (e) {
              throw new Error("Delete template fail");
            }
          }
        },

        async createOfferInDPro(params) {
          const domain = this.domain();
          const response = await api.request<CreateUpsellOfferResponse>(
            {
              url: `https://${domain}/admin/offers/batch.json`,
              method: "POST",
              request: {
                data: {
                  offers: [params],
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

        async createWebsitePage(title) {
          const domain = this.domain();
          const response = await api.request<{ page: CreatePageResponse }>(
            {
              url: `https://${domain}/admin/pages.json`,
              method: "POST",
              request: {
                data: {
                  page: {
                    title: title,
                  },
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          return response.data.page;
        },

        async applyTemplate(params, authConfig) {
          try {
            const domain = this.domain(authConfig);
            const response = await api.request<{ result: PageWebBuilderInfo }>(
              {
                url: `https://${domain}/admin/themes/builder/page.json`,
                method: "POST",
                request: {
                  data: {
                    entity_id: params.productId,
                    template_id: params.templateId,
                    type: params.type,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return response.data.result;
          } catch (e) {
            throw Error("Apply template failed");
          }
        },

        async getDProOffer(dProId) {
          const domain = this.domain();
          const response = await api.request<[UpsellOffers]>(
            {
              url: `https://${domain}/admin/offers/list.json`,
              method: "GET",
              request: {
                params: {
                  ref_ids: dProId,
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

        /**
         * Get page builder by id. ( For Shop creator)
         * @param pageId
         */
        async pageBuilder(pageId) {
          const domain = this.domain();
          const response = await api.request<{ result: PageBuilder }>(
            {
              url: `https://${domain}/admin/themes/builder/page/${pageId}.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );

          if (response.ok) {
            return response.data.result;
          }

          return Promise.reject("Error: Get page builder fail");
        },

        /**
         * Update page builder
         * @param pageId
         * @param settingsData
         */
        async updatePageBuilder(pageId, settingsData) {
          const domain = this.domain();
          const response = await api.request<{ success: boolean }>(
            {
              url: `https://${domain}/admin/themes/builder/page/${pageId}.json`,
              method: "PUT",
              request: {
                data: {
                  settings_data: settingsData,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          if (response.ok) {
            return response.data.success;
          }

          return Promise.reject("Error: Update page builder fail");
        },

        /**
         * Get page info by product id
         */
        async getPageInfoByProductId(productId, type, limit) {
          try {
            const domain = this.domain();
            const response = await api.request<{ result: { result: PageWebBuilderInfo } }>(
              {
                url: `https://${domain}/admin/themes/builder/page.json`,
                method: "GET",
                request: {
                  params: {
                    limit: limit,
                    ref_id: productId,
                    page_handle: type,
                    type: type,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result["page"];
          } catch (e) {
            throw Error("Error: Get page info fail");
          }
        },

        /**
         * Get info checkout form by id
         * @param themeId
         */
        async getInfoCheckoutForm(themeId) {
          const domain = this.domain();
          const response = await api.request<{ result: WebBuilderPage }>(
            {
              url: `https://${domain}/admin/themes/builder/site/${themeId}.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );

          if (response.ok) {
            return response.data.result;
          }

          return Promise.reject("Error: Get info checkout form fail");
        },

        /**
         * Update setting checkout form
         * @param themeId
         * @param {SettingCheckoutForm} settingCheckoutForm
         */
        async updateSettingCheckoutForm(themeId: number, settingCheckoutForm: SettingCheckoutForm): Promise<boolean> {
          const domain = this.domain();
          let checkoutForm: WebBuilderElement;
          const currentData: WebBuilderPage = await builder.getInfoCheckoutForm(themeId);
          const dataCheckoutPage = currentData.settings_data.pages.checkout.default;

          // find element Checkout form
          const findCheckoutFormElement = (element: WebBuilderElement) => {
            if (element.component === "checkout-container") {
              return element;
            }
            for (const childElement of element.elements) {
              const found = findCheckoutFormElement(childElement);
              if (found) {
                return found;
              }
            }
            return null;
          };

          for (const childElement of dataCheckoutPage.elements) {
            const found = findCheckoutFormElement(childElement);
            if (found) {
              checkoutForm = found.settings;
              checkoutForm = Object.assign(found.settings, settingCheckoutForm);
            }
          }

          if (checkoutForm !== null) {
            const response = await api.request<{ success: boolean }>(
              {
                url: `https://${domain}/admin/themes/builder/site/${themeId}.json`,
                method: "PUT",
                request: {
                  data: {
                    settings_data: currentData.settings_data,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            if (response.ok) {
              return response.data.success;
            }
            return Promise.reject("Error: Update setting checkout form fail");
          }
        },

        /**
         * Setting data in web builder
         * if updateSettings is Array: update all sections. else, update section by indexSection
         */
        async settingSections(data) {
          const variant = Object.keys(data.settingData.pages.product)[0];
          if (Array.isArray(data.updateSettings)) {
            data.settingData.pages.product[variant].sections = data.updateSettings;
          } else {
            data.settingData.pages.product[variant].sections[data.indexSection] = data.updateSettings;
          }
          return await this.updatePageBuilder(data.pageId, data.settingData);
        },

        /**
         * Get page site builder by id
         * @param pageId
         */
        async pageSiteBuilder(pageId) {
          const domain = this.domain();
          const response = await api.request<{ result: PageBuilder }>(
            {
              url: `https://${domain}/admin/themes/builder/site/${pageId}.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );

          if (response.ok) {
            return response.data.result;
          }

          return Promise.reject("Error: Get page builder fail");
        },

        /**
         * Update site builder
         * @param shopThemeId
         * @param settingsData
         */
        async updateSiteBuilder(shopThemeId, settingsData) {
          const domain = this.domain();
          const response = await api.request<{ success: boolean }>(
            {
              url: `https://${domain}/admin/themes/builder/site/${shopThemeId}.json`,
              method: "PUT",
              request: {
                data: {
                  settings_data: settingsData,
                },
              },
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );
          if (response.ok) {
            return response.data.success;
          }

          return Promise.reject("Error: Update site builder fail");
        },

        /**
         * Update section data
         * @param pageName
         * @param themeId
         * @param indexOfSection
         * @param sectionData
         * @param builder
         */
        async updateSiteSection(pageName, themeId, indexOfSection, sectionData, builder) {
          const currentData = await builder.pageSiteBuilder(themeId);
          currentData.settings_data.pages[pageName].default.elements[indexOfSection] = sectionData;
          await builder.updateSiteBuilder(themeId, currentData.settings_data);
        },

        /**
         * Tạo template section, block trong category
         * @param data
         * @param authConfig
         * @returns
         */
        async createComponent(data, authConfig) {
          const domain = this.domain();
          const response = await api.request<{ result: ComponentResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/template/component.json`,
              method: "POST",
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
          return response.data.result;
        },

        /***
         * Get list tag in template store
         */
        async getListTagTemplateStore(domain: string) {
          try {
            const response = await api.request<{ result: Tags }>(
              {
                url: `https://${domain}/admin/themes/builder/tags.json?template_active=true&action=template-store`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result;
          } catch (e) {
            throw Error("Error: Get tag list in Template store fail");
          }
        },

        /***
         * Get list theme template in template store
         */
        async getThemeTemplateStore(domain: string, keyword?: string, tag?: string) {
          try {
            const params = Object.assign({ limit: 40, page: 1, action: "template-store", search: keyword, tags: tag });
            const response = await api.request<{ result: { templates: Templates } }>(
              {
                url: `https://${domain}/admin/themes/builder/template/themes.json${buildQueryString(params)}`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result.templates;
          } catch (e) {
            throw Error("Error: Get theme template fail");
          }
        },

        /***
         * Get list theme template in template popup
         */
        async getThemeTemplateInPopup(domain: string, storeType: string, keyword?: string, tag?: string) {
          try {
            const params = Object.assign({
              limit: 40,
              page: 1,
              action: "select_template",
              store_types: storeType,
              search: keyword,
              tags: tag,
            });
            const response = await api.request<{ result: { templates: Templates } }>(
              {
                url: `https://${domain}/admin/themes/builder/template/themes.json${buildQueryString(params)}`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result.templates;
          } catch (e) {
            throw Error("Error: Get theme template fail");
          }
        },

        /***
         * Get shop library theme infomation in template popup
         */
        async getShopLibThemeInfoInPopup(
          domain: string,
          storeType: string,
          libraryIds?: string,
          keyword?: string,
          tag?: string,
        ) {
          try {
            let isLibrary: boolean;
            if (libraryIds != null) {
              isLibrary = true;
            } else {
              isLibrary = false;
            }
            const params = Object.assign({
              limit: 40,
              page: 1,
              action: "select_template",
              store_types: storeType,
              library_ids: libraryIds,
              search: keyword,
              tags: tag,
              is_library: isLibrary,
            });
            const response = await api.request<{ result: YourTemplates }>(
              {
                url: `https://${domain}/admin/themes/builder/template/themes.json${buildQueryString(params)}`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result;
          } catch (e) {
            throw Error("Error: Get theme template fail");
          }
        },

        /***
         * Get list page template in template store
         */
        async getPageTemplateStore(domain: string, payload?: Record<string, string>) {
          try {
            const params = Object.assign({ limit: 250, page: 1, action: "template-store" }, payload);
            const response = await api.request<{ result: { templates: Templates } }>(
              {
                url: `https://${domain}/admin/themes/builder/template/pages.json${buildQueryString(params)}`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result.templates;
          } catch (e) {
            throw Error("Error: Get page template fail");
          }
        },

        /**
         * Get infor page template trong 1 library
         */
        async getInforPageTemplate(id, authConfig) {
          const domain = this.domain(authConfig);
          const response = await api.request<{ result: CreateTemplateResponse }>(
            {
              url: `https://${domain}/admin/themes/builder/template/page/${id}.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true, conf: authConfig },
          );
          return response.data.result;
        },

        /**
         * Get page page template by id
         * @param pageId
         */
        async getPageTemplate(id) {
          const domain = this.domain();
          const response = await api.request<{ result: PageBuilder }>(
            {
              url: `https://${domain}/admin/themes/builder/template/${id}.json`,
              method: "GET",
              request: {},
              response: {
                status: 200,
                data: {},
              },
            },
            { autoAuth: true },
          );

          if (response.ok) {
            return response.data.result;
          }

          return Promise.reject("Error: Get page template fail");
        },

        /***
         * Get list page template in template popup
         */
        async getPageTemplateInPopup(
          domain: string,
          storeType: string,
          type?: string,
          keyword?: string,
          tag?: string,
          libraryIds = "1",
        ) {
          try {
            // tag special được dùng khi tag có chứa các ký tự đặc biệt (dấu cách, &, ...)
            const tagSpecial = tag ? tag.replaceAll(" ", "%20").replaceAll("&", "%26") : "";
            const params = Object.assign({
              limit: 40,
              page: 1,
              action: "select_template",
              store_types: storeType,
              type: type,
              library_ids: libraryIds,
              search: keyword,
              tags: tagSpecial,
            });
            const response = await api.request<{ result: { templates: Templates } }>(
              {
                url: `https://${domain}/admin/themes/builder/template/pages.json${buildQueryString(params)}`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result.templates;
          } catch (e) {
            throw Error("Error: Get theme template fail");
          }
        },

        /***
         * Get shop library page infomation in template popup
         */
        async getShopLibPageInfoInPopup(
          domain: string,
          storeType: string,
          type: string,
          libraryIds?: string,
          keyword?: string,
          tag?: string,
        ) {
          try {
            let isLibrary: boolean;
            if (libraryIds != null) {
              isLibrary = true;
            } else {
              isLibrary = false;
            }
            const params = Object.assign({
              limit: 40,
              page: 1,
              action: "select_template",
              store_types: storeType,
              type: type,
              library_ids: libraryIds,
              search: keyword,
              tags: tag,
              is_library: isLibrary,
            });
            const response = await api.request<{ result: YourTemplates }>(
              {
                url: `https://${domain}/admin/themes/builder/template/pages.json${buildQueryString(params)}`,
                method: "GET",
                request: {},
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true },
            );
            return response.data.result;
          } catch (e) {
            throw Error("Error: Get theme template fail");
          }
        },

        /**
         * Hàm set custom product page design
         * @param productId
         * @param templateId
         */
        async setProductPageDesign(productId: number, templateId: number, authConfig) {
          try {
            const domain = this.domain(authConfig);
            const info = await api.request<{ result: PageWebBuilderInfo }>(
              {
                url: `https://${domain}/admin/themes/builder/page.json`,
                method: "POST",
                request: {
                  data: {
                    entity_id: productId,
                    template_id: templateId,
                    type: "product",
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            await api.request<void>(
              {
                url: `https://${domain}/admin/themes/layout-product/active.json`,
                method: "POST",
                request: {
                  data: {
                    data: `product-${productId}`,
                    product_id: productId,
                  },
                },
                response: {
                  status: 200,
                  data: {},
                },
              },
              { autoAuth: true, conf: authConfig },
            );
            return info.data.result;
          } catch (e) {
            throw Error("Apply template failed");
          }
        },
      };
      await use(builder);
    },
    { scope: "test" },
  ],
});
export { expect } from "@playwright/test";
