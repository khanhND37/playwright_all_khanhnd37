export const XpathNavigationButtons = {
  pages: "//button[@name = 'Pages']",
  exit: "//button[contains(@class,'header-exit-btn')]",
  templates: "//button[contains(@class,'header-template-btn')]",
  save: "//button[normalize-space()='Save']",
  layer: "//button[@name='Layer']",
  styling: "//button[@name = 'Styling settings']",
  website: "//button[@name = 'Website Settings']",
  insert: "//div[contains(@class,'header-left')]//button[@name='Insert']",
  undo: "//button[@name='Undo']",
  redo: "//button[@name='Redo']",
  preview: "//button[contains(@class,'sb-mr-small')]//*[local-name()='g' and @id='Icons/Eye']",
  desktop: "//button//*[local-name()='g' and @id='Icons/Devices/Desktop']",
  mobile: "//button//*[local-name()='g' and @id='Icons/Devices/Mobile']",
  more: `//button//*[local-name()='g' and @id='Icons/More']`,
};

export const WebsitePageStyle = {
  overrideStyle: "//*[contains(text(),'Override Site Styles')]//following-sibling::div",
  listStyleActive: "//*[contains(@class,'w-builder__styles-list') and not(@style='display: none;')]",
};

export const XpathBlock = {
  frameLocator: "#preview",
  progressBar: "#v-progressbar",
  overlay: "//div[contains(@class,'w-builder__preview-overlay')]",
  sidebar: "#website-builder .w-builder__sidebar-wrapper",
  //=======Preview
  icon: "//*[contains(@class, 'material-icons')]",
  textButton: "//*[contains(@class, 'break-words')]",
  popover: "//div[contains(@class, 'sb-popover')]",
  cookieBar: ".cookie-bar",
  cookieBarAccept: "button.cookie-bar__btn-accept-all",
};

export const XpathLayer = {
  section: "//section/div[contains(@class, 'wb-preview__section--container')]",
  block: "//section[@data-block-id]",
};

export const XPathWidget = {
  upsellLayout: "//div[contains(@class, 'widget--layout')]",
};
