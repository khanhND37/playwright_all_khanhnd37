export type LibraryTab = "Web templates" | "Page templates" | "Section templates" | "Block templates" | "Styles";

export type SaveAsTemplateInput = {
  name: string;
  libraryName: string;
  storeType?: "E-commerce" | "Creator";
  desktopImagePath?: string;
  mobileImagePath?: string;
  thumbnailImagePath?: string;
};
