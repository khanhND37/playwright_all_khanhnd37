/* eslint-disable */
import { OcgLogger } from "@core/logger";
import { APIRequestContext, expect } from "@playwright/test";
import { TranslationBootstrapData, TranslationBootstrapRequest } from "@types";

const logger = OcgLogger.get();

const ignoreWidgets = ["pb-plb-footer"];
const menuIds = [];
let schemas, widgets;

/**
 * Get translation data from bootstrap
 * @param shopDomain domain of shop
 * @param authRequest authRequest from fixture
 * @param bootstrapRequest optional param: localeCode, themePreviewId
 * @returns TranslationBootstrapData
 */
export const getTranslationDataFromBootstrap = async (
  shopDomain: string,
  authRequest: APIRequestContext,
  bootstrapRequest: TranslationBootstrapRequest,
): Promise<TranslationBootstrapData> => {
  // Get bootstrap data
  const bootstrapUrl = getBootstrapUrl(shopDomain, bootstrapRequest);
  const bootstrapData = await getDataFromAPI(bootstrapUrl, authRequest, bootstrapRequest);
  // const bootstrapData = mockData;

  // Extract shop_theme_id
  const shopThemeId = getShopThemeId(bootstrapData);
  logger.info(shopThemeId);

  // Get schema
  const { blocks: tmp1, widgets: tmp2 } = await getTranslateSchemas(shopDomain, shopThemeId, authRequest);

  schemas = tmp1;
  widgets = tmp2;

  const result = {};
  for (const key in bootstrapData.result.theme.pages) {
    if (bootstrapData.result.theme.pages.hasOwnProperty(key)) {
      const elements = bootstrapData.result.theme.pages[key].default.elements;
      // Do something with the key-value pair
      try {
        const resultEachBlock = [];
        const blockData = getBlockData(elements);
        logger.info(`Process key ${key}, with ${elements.length} elements, ${blockData.length} blocks`);

        let groupData = {
          group: "",
          items: [],
        };

        for (const item of blockData) {
          if (item.isGroup) {
            // if old group exist & met new group ~> push old group to map & reset
            if (groupData.items.length) {
              resultEachBlock.push(JSON.parse(JSON.stringify(groupData)));

              groupData = {
                group: "",
                items: [],
              };
            }
            groupData.group = item.name;
            groupData.items = [];
          } else if (!item.isChildren) {
            // push the previous group to result
            if (groupData.items.length) {
              resultEachBlock.push(JSON.parse(JSON.stringify(groupData)));
            }

            // push this single item to a new group
            resultEachBlock.push(
              JSON.parse(
                JSON.stringify({
                  group: item.name,
                  items: [
                    {
                      name: item.name,
                      value: accessProp(item, item.schemaAccess),
                    },
                  ],
                }),
              ),
            );

            // reset group
            groupData = {
              group: "",
              items: [],
            };
          } else {
            const fieldName = item.name;
            groupData.items.push({
              name: fieldName,
              value: accessProp(item, item.schemaAccess),
            });
          }
        }

        result[key] = resultEachBlock;
      } catch (e) {
        logger.info(`Got err with key: ${key}`);
      }
    }
  }

  return result;
};

const getBootstrapUrl = (shopDomain: string, bootstrapRequest: TranslationBootstrapRequest): string => {
  let bootstrapUrl = `https://${shopDomain}/api/bootstrap/next.json`;

  if (bootstrapRequest.themePreviewId) {
    bootstrapUrl = `https://${shopDomain}/api/bootstrap/next.json?theme_preview_id=${bootstrapRequest.themePreviewId}`;
  }

  return bootstrapUrl;
};

const getDataFromAPI = async (
  apiUrl: string,
  req: APIRequestContext,
  bootstrapRequest?: TranslationBootstrapRequest,
) => {
  const requestHeaders = {};
  if (bootstrapRequest?.localeCode) {
    requestHeaders["X-Lang"] = bootstrapRequest.localeCode;
  }

  const res = await req.get(apiUrl, {
    headers: requestHeaders,
  });
  // logger.info(res.status());
  // const resBody1 = await res.json();
  // logger.info(resBody);
  if (!res.ok()) {
    return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
  }
  const resBody = await res.json();
  return resBody;
};

const getShopThemeId = (bootstrapData): number => {
  return bootstrapData.result.theme.shop_theme_id;
};

const getTranslateSchemas = async (shopDomain: string, shopThemeId: number, authRequest: APIRequestContext) => {
  // Get data from API
  const url = `https://${shopDomain}/admin/themes/builder/site/${shopThemeId}.json`;
  const data = await getDataFromAPI(url, authRequest);

  const { blocks, translate: { widgets = {} } = {} } = data.result.settings_schema;

  if (!Array.isArray(blocks)) return;

  return blocks.reduce(
    (accumulator, currBlock) => {
      const { type, settings } = currBlock;
      if (Array.isArray(settings)) {
        const filteredWidgets = settings.filter(({ widget }) => widgets.hasOwnProperty(widget));
        if (filteredWidgets.length) {
          accumulator.widgets[type] = filteredWidgets.map(w => widgets[w.widget]);
        }

        const filteredSettings = settings
          .filter(({ translate }) => translate)
          .map(setting => {
            return {
              id: `settings.${setting.id}`,
              label: setting.label,
            };
          });
        if (filteredSettings.length) {
          accumulator.blocks[type] = filteredSettings;
        }
      }

      return accumulator;
    },
    { blocks: [], widgets: [] },
  );
};

const isUndefined = value => {
  return value === undefined;
};

const isAToB = str => {
  if (str.includes("[") && str.endsWith("]")) {
    const parts = str.split("[");
    if (parts.length === 2) {
      return [true, parts[0], parts[1].slice(0, -1)];
    }
  }
  return [false, "", ""];
};

const stringToObject = (inputString, value) => {
  const splitted = inputString.split(".");
  let outputObject = {};

  for (let i = splitted.length - 1; i >= 0; i--) {
    if (i === splitted.length - 1) {
      outputObject = { [splitted[i]]: value };
    } else {
      outputObject = { [splitted[i]]: outputObject };
    }
  }

  return outputObject;
};

const accessProp = (obj, propStr, isCheckFieldWithId = false) => {
  if (isUndefined(obj)) {
    return "";
  }

  return propStr.split(".").reduce(function (prev, curr) {
    const [isFieldWithId, field, id] = isAToB(curr);
    if (isCheckFieldWithId && isFieldWithId && Array.isArray(prev[field])) {
      const idx = obj[field].findIndex(val => val.id === Number(id));
      if (idx > -1) {
        return obj[field][idx];
      }
    }

    return prev ? prev[curr] : null;
  }, obj || self);
};

const getBlockData = jsonData => {
  let blocks = [];

  if (Array.isArray(jsonData)) {
    for (let i = 0; i < jsonData.length; i++) {
      blocks = blocks.concat(getBlockData(jsonData[i]));
    }
  } else if (typeof jsonData === "object" && jsonData !== null) {
    // logger.info(`jsonData.type: `, jsonData.type);
    // logger.info(`schemas: `, schemas);
    if (jsonData.type === "block" && Object.keys(schemas).includes(jsonData.component)) {
      switch (true) {
        case jsonData.component === "menu":
          menuIds.push(jsonData.id);
          blocks.push({
            id: jsonData.id,
            name: jsonData.name,
            isGroup: true,
          });
          // eslint-disable-next-line no-case-declarations
          const menus = getMenu(jsonData.settings.items);
          menus.map(menu => {
            menu.parentId = jsonData.id;
            return menu;
          });
          blocks = blocks.concat(menus);
          break;
        case jsonData.component === "block_form":
          blocks.push({
            id: jsonData.id,
            name: jsonData.name,
            isGroup: true,
          });
          blocks = blocks.concat(getBlockForm(jsonData));
          break;
        case Object.keys(widgets).includes(jsonData.component) && !ignoreWidgets.includes(jsonData.component):
          blocks.push({
            id: jsonData.id,
            name: jsonData.name,
            isGroup: true,
          });
          blocks = blocks.concat(getBlockWidget(jsonData));
          break;
        case ["featured_collection", "pb-plb-footer"].includes(jsonData.component):
          blocks.push({
            id: jsonData.id,
            name: jsonData.name,
            isGroup: true,
          });
          dataSchemas(jsonData.component).forEach(schema => {
            const item = {
              id: jsonData.id,
              name: schema.label,
              component: jsonData.component,
              schemaId: schema.id,
              schemaLabel: jsonData.label,
              schemaAccess: schema.id,
              isChildren: true,
              ...stringToObject(schema.id, accessProp(jsonData, schema.id)),
            };
            blocks.push(item);
          });
          break;
        default:
          dataSchemas(jsonData.component).forEach(schema => {
            const item = {
              id: jsonData.id,
              name: jsonData.name,
              component: jsonData.component,
              schemaId: schema.id,
              schemaLabel: jsonData.label,
              schemaAccess: schema.id,
              ...stringToObject(schema.id, accessProp(jsonData, schema.id)),
            };
            blocks.push(item);
          });
      }
    } else if (jsonData.type === "group") {
      blocks.push({
        id: jsonData.id,
        name: jsonData.name,
        isGroup: true,
      });
      blocks = blocks.concat(getBlockWidget(jsonData));
    }
    for (const key in jsonData) {
      blocks = blocks.concat(getBlockData(jsonData[key]));
    }
  }

  return blocks;
};

const getBlockForm = dataForm => {
  const form = [];
  schemas["block_form"].forEach(schema => {
    if (!["settings.fields", "settings.fields_hello"].includes(schema.id)) {
      const item = {
        id: dataForm.id,
        name: convertTitle(schema.label),
        component: "block_form",
        schemaId: schema.id,
        schemaLabel: schema.label,
        schemaAccess: schema.id,
        isChildren: true,
        ...stringToObject(schema.id, accessProp(dataForm, schema.id)),
      };
      form.push(item);
    } else {
      accessProp(dataForm, schema.id).forEach((data, translationKey) => {
        widgets["block_form"][0].forEach(widget => {
          if (widget === "options.value") {
            const widgetKey = "options";
            if (Array.isArray(data[widgetKey]) && data[widgetKey].length) {
              data[widgetKey].forEach((option, k) => {
                const accessKey = `options.${k}.value`;
                const value = accessProp(option, "value");
                const item = {
                  id: dataForm.id,
                  name: `Option ${k + 1}`,
                  component: "block_form",
                  schemaId: `${schema.id}`,
                  schemaAccess: `${schema.id}.${translationKey}.${accessKey}`,
                  schemaLabel: schema.label,
                  accessKey: `options_${k}.value`,
                  translationKey: translationKey,
                  isChildren: true,
                  ...stringToObject(`${schema.id}.${translationKey}.${accessKey}`, value.length ? value : ""),
                };
                form.push(item);
              });
            }
          } else {
            const item = {
              id: dataForm.id,
              name: convertTitle(widget),
              component: "block_form",
              schemaId: `${schema.id}`,
              schemaAccess: `${schema.id}.${translationKey}.${widget}`,
              schemaLabel: schema.label,
              accessKey: widget,
              translationKey: translationKey,
              isChildren: true,
              ...stringToObject(`${schema.id}.${translationKey}.${widget}`, data[widget]),
            };
            form.push(item);
          }
        });
      });
    }
  });
  return form;
};

const getBlockWidget = dataWidget => {
  const blocks = [];
  dataSchemas(dataWidget.component).forEach(schema => {
    const widgetValue = accessProp(dataWidget, schema.id);
    if (Array.isArray(widgetValue) && widgetValue.length) {
      widgetValue.forEach((data, translationKey) => {
        widgets[dataWidget.component].forEach(widgets => {
          if (widgets.length) {
            widgets.forEach(widget => {
              const item = {
                id: dataWidget.id,
                name: widget,
                component: dataWidget.component,
                schemaId: `${schema.id}`,
                schemaAccess: `${schema.id}.${translationKey}.${widget}`,
                schemaLabel: schema.label,
                accessKey: widget,
                translationKey: translationKey,
                isChildren: true,
                ...stringToObject(`${schema.id}.${translationKey}.${widget}`, data[widget]),
              };
              blocks.push(item);
            });
          }
        });
      });
    } else {
      const item = {
        id: dataWidget.id,
        name: schema.label,
        component: dataWidget.component,
        schemaId: schema.id,
        schemaLabel: schema.label,
        schemaAccess: schema.id,
        isChildren: true,
        ...stringToObject(schema.id, accessProp(dataWidget, schema.id)),
      };
      blocks.push(item);
    }
  });
  return blocks;
};

const getBlockCollectionList = dataCollection => {
  const blocks = [];
  dataSchemas(dataCollection.component).forEach(schema => {
    const widgetValue = accessProp(dataCollection, schema.id);
    if (Array.isArray(widgetValue) && widgetValue.length) {
      widgets[dataCollection.component].forEach((widgets, translationKey) => {
        if (widgets.length) {
          widgets.forEach(widget => {
            const data = widgetValue[translationKey];
            if (data) {
              const transKey = data.id || translationKey;
              const item = {
                id: dataCollection.id,
                name: widget,
                component: dataCollection.component,
                schemaId: `${schema.id}`,
                schemaAccess: `${schema.id}.${transKey}.${widget}`,
                schemaLabel: schema.label,
                accessKey: widget,
                translationKey: transKey,
                isChildren: true,
                ...stringToObject(`${schema.id}.${transKey}.${widget}`, data[widget]),
              };
              blocks.push(item);
            }
          });
        }
      });
    } else {
      const item = {
        id: dataCollection.id,
        name: schema.label,
        component: dataCollection.component,
        schemaId: schema.id,
        schemaLabel: schema.label,
        schemaAccess: schema.id,
        isChildren: true,
        ...stringToObject(schema.id, accessProp(dataCollection, schema.id)),
      };
      blocks.push(item);
    }
  });
  return blocks;
};

const getMenu = dataMenu => {
  let menus = [];
  dataMenu.forEach(menu => {
    // Add menu with label and badge_label, regardless of whether it has items or not
    menus.push({
      id: menu.id,
      name: "Label",
      component: "menu",
      schema: "settings.label",
      schemaId: "settings.label",
      schemaAccess: "settings.items",
      schemaUpdate: `settings.items_${menu.id}.label`,
      isChildren: true,
      settings: {
        items: menu.label,
      },
    });

    // Recursion on items, if they exist
    if (menu.items && menu.items.length) {
      menus = menus.concat(getMenu(menu.items));
    }
  });

  return menus;
};

const dataSchemas = component => {
  if (component === "social") {
    return schemas[component].map(item => {
      return Object.assign({}, item, { id: item.id + ".social" });
    });
  }
  return schemas[component];
};

const convertTitle = str => {
  if (!isString(str)) {
    return str;
  }
  // join the words back into a string with a space between them
  return str
    .split("_") // split the string into an array of words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize the first letter of each word
    .join(" ");
};

/**
 * Value type of string
 * @param val
 * @returns {boolean}
 */
export const isString = val => {
  return typeof val === "string";
};

export const requestChargeTranslationAPI = async (shopDomain, req: APIRequestContext) => {
  const res = await req.post(`https://${shopDomain}/admin/translations/test-charge.json`);
  if (!res.ok()) {
    return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
  }
  return await res.json();
};
