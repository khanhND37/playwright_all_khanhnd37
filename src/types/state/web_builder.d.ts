/* eslint-disable @typescript-eslint/no-explicit-any */
export type QuickBarOptions =
  | "Hide"
  | "Add row"
  | "Add column"
  | "Duplicate"
  | "Delete"
  | "Move up"
  | "Move down"
  | "Save as template"
  | "Replace library"
  | "Move left"
  | "Move right"
  | "Edit text"
  | "Edit code"
  | "Settings"
  | "Edit bullet"
  | "Change image"
  | "Change video"
  | "Change icon"
  | "Insert variable"
  | "Edit"
  | "Edit accordion"
  | "Edit tabs"
  | "Manage menu"
  | "Bring forward"
  | "Bring backward"
  | "Get text from";

export type NavigationButtons =
  | "pages"
  | "exit"
  | "layer"
  | "styling"
  | "website"
  | "insert"
  | "templates"
  | "undo"
  | "redo"
  | "preview"
  | "desktop"
  | "mobile"
  | "save"
  | "more";

export type WidthHeight = {
  value?: number;
  unit?: "%" | "Px" | "Auto" | "Fill";
};

export type Color = {
  preset?: number;
  palette?: { left: number; top: number };
  colorBar?: number;
  opacity?: number;
  hexText?: string;
  opacityText?: number;
};

export type BackGround = {
  color?: Color;
  image?: {
    url?: string;
    new?: ImageNew;
    gallery?: number;
    size?: "Cover" | "Contain";
    position?: number;
    overlay?: Color;
    repeat?: boolean;
    parallax?: boolean;
    timeout?: number;
  };
  video?: {
    url: string;
    image?: string;
    overlay?: Color;
    parallax?: boolean;
  };
};

export type ImageNew = {
  upload?: string;
  gallery?: number;
  source?: {
    cate?: string;
    value?: string;
  };
  remove?: boolean;
};

export type Border = {
  thickness?: "none" | "s" | "m" | "l" | "custom";
  size?: Slider; // Chọn custom thickness size
  style?: "Solid" | "Dash";
  side?: "All" | "Top" | "Left" | "Bottom" | "Right" | "Top & Bottom" | "Left & Right";
  color?: Color;
};

export type Shadow = {
  option: "none" | "soft" | "hard";
  size?: "S" | "M" | "L";
  direction?: "Top Right" | "Top Left" | "Bottom Right" | "Bottom Left" | "Bottom";
};

export type MarginPadding = {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  input?: boolean;
};

export type PointerResize =
  | "top"
  | "left"
  | "bottom"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type LayoutContainer = {
  direction?: "Vertical" | "Horizontal";
  align?: "Top" | "Center" | "Bottom" | "Left" | "Right" | "SpaceDistribute";
  spacing?: number;
};

export type Bullet = {
  add?: number;
  delete?: number;
  icon?: { item: number; iconName: string };
  move?: { from: number; to: number };
};

export type InsertTemplate = {
  parentPosition: ElementPosition;
  position?: "Top" | "Bottom" | number; // Type number dùng cho case add block ở column, add section, row dùng string
  template?: string;
  templateIndex?: number;
  category?: string;
  layout?: string;
  quickbar?: boolean;
};

export type DnDTemplateFromPanel = {
  category?: string;
  template: string;
  index?: number;
  to: {
    position: ElementPosition;
    top?: number;
    left?: number;
  };
  callBack?: ({ page: Page, x, y }) => Promise<void>;
};

export type TabsAccordionStructure = {
  name?: string;
  level: number;
  row: number;
  column?: number;
  block?: number;
};

export type RepeatedContentStructure = {
  item: number;
  block?: number;
};

export type NewDnDTemplateFromPanel = {
  from: {
    category?: string;
    template: string;
    indexTemplate?: number;
  };
  to: {
    position: ElementPosition;
    isBottom?: boolean;
    container?: boolean;
    tabs?: TabsAccordionStructure;
    repeated?: RepeatedContentStructure;
    layout?: "vertical" | "horizontal";
  };
  callBack?: ({ page: Page, x, y }) => Promise<void>;
};

export type DnDTemplateInPreview = {
  from: {
    position: ElementPosition;
    top?: number;
    left?: number;
  };
  to: {
    position: ElementPosition;
    top?: number;
    left?: number;
  };
  isHover?: boolean;
  callBack?: ({ page: Page, x, y }) => Promise<void>;
};

export type DnDLayerInSidebar = {
  from: LayerInfo;
  to: LayerInfo;
  pixel?: number;
};

export type ElementPosition = {
  section?: number;
  row?: number;
  column?: number;
  block?: number;
  type?: "default" | "exclude-popup" | "exclude-nested";
  tabs?: TabsAccordionStructure;
  repeated?: RepeatedContentStructure;
};

export type AddBlockSection = {
  section: number;
  column?: number;
  position?: "before" | "after";
};

export type LayerInfo = {
  sectionName: string;
  sectionIndex?: number;
  subLayerName?: string;
  subLayerIndex?: number;
  isExpand?: boolean;
  isHide?: boolean;
};

export type TextAccordion = {
  position: ElementPosition;
  title?: Array<{ text: string; index: number }>;
  paragraph?: Array<{ text: string; index: number }>;
};

export type ColorStyles = {
  preset: number;
  hexText?: string;
  colorBar?: number;
  palette?: { left: number; top: number };
};

export type Library = {
  index: number;
  title?: string;
  status?: string;
  type?: string;
  link?: string;
  actions?: Array<string>;
};

export type FiltersInfo = {
  library?: string;
  tags?: string[];
  isSelect?: boolean;
  fill?: boolean;
};

export type PreviewTemplateActions = "Back" | "Desktop" | "Mobile" | "Apply";

export type Slider = {
  fill: boolean;
  number: number;
};

export type OpenWebBuilder = {
  type: "sale page" | "offer" | "page" | "ecom product custom" | "site";
  id: number;
  productId?: number;
  offer?: "upsell" | "downsell";
  offerIndex?: number;
  themeId?: number;
  page?: string;
  layout?: "default" | "custom";
};

export type LayerSettings = {
  data_source?: {
    type?: "usell" | "section";
    config?: DataSource;
  };
  heading?: {
    is_on?: boolean;
  };
  button_action?: "Go to checkout page" | "Go to cart page" | "Continue shopping";
  content?: string;
  icon?: string;
  image?: string;
  all_text?: string;
  action?: string;
  target_url?: string;
  new_tab?: {
    is_on?: boolean;
  };
  rating?: {
    fill?: boolean;
    value?: number;
  };
  type?: "Custom" | "Exact time";
  hours?: number;
  form?: FormStyleSettings;
  expand_first?: boolean;
};

export type LayerStyles = {
  style?: "Primary" | "Secondary";
  content_align?: "Left" | "Center" | "Right";
  color?: {
    label?: string;
    value?: Color;
    is_on?: boolean;
  };
  content_position?: {
    label?: string;
    position?: number;
  };
  position?: {
    label?: string;
    type?: "Auto" | "Manual";
  };
  ratio?: {
    label?: string;
    type?: string;
  };
  align?: {
    label?: string;
    type: "Left" | "Center" | "Right";
  };
  width?: {
    label?: string;
    value?: WidthHeight;
    is_on?: boolean;
  };
  height?: {
    label?: string;
    value?: WidthHeight;
  };
  background?: {
    label?: string;
    value?: BackGround;
  };
  border?: {
    label?: string;
    value?: Border;
  };
  opacity?: {
    label?: string;
    config?: Slider;
  };
  radius?: {
    label?: string;
    config?: Slider;
  };
  spacing?: {
    label?: string;
    value?: number;
    is_fill?: boolean;
  };
  shadow?: {
    label?: string;
    config?: Shadow;
  };
  padding?: {
    label?: string;
    value?: MarginPadding;
  };
  margin?: {
    label?: string;
    value?: MarginPadding;
  };
  shape?: {
    label?: string;
    type?: number | string;
  };
  overflow?: "show" | "hide" | "scroll";
  heading_align?: "Left" | "Center" | "Right" | "Space distribute";
  expand_icon?: "none" | "chevron-down" | "chevron-right" | "unfold_more" | "plus-line" | "menu-right" | "menu-down";
  icon_position?: "Left" | "Right";
  accordion_spacing?: "S" | "M" | "L";
  accordion_divider?: boolean;
  display_as?: "Tab" | "Accordion";
};

export type InsertPanelTemplateLoc = {
  category: string;
  template: string;
  index?: number;
};

export type TextBlock = {
  block?: string;
  text?: string;
  index?: number;
};

export type QuickSettingsText = {
  color: {
    preset?: number;
    custom?: {
      r: number;
      g: number;
      b: number;
    };
  };
  font_style?: "Heading 1" | "Heading 2" | "Heading 3" | "Heading 4" | "Paragraph 1" | "Paragraph 2" | "Paragraph 3";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: "left" | "center" | "right";
  hyperlink: {
    full_text: string;
    text?: string;
    index?: number;
    url: string;
    remove?: boolean;
  };
  bullet_list?: boolean;
  order_list?: boolean;
  tag?: "<h1>" | "<h2>" | "<h3>" | "<h4>" | "<h5>" | "<h6>" | "<p>";
  variable: {
    shop?: "Shop name" | "Shop domain";
    product?:
      | "Product's Title"
      | "Product type"
      | "Product's vendor"
      | "Product's SKU"
      | "Product's Inventory Quantity"
      | "Page title"
      | "Page description";
    profile?: "Profile Bio" | "Profile Name";
    page?: "Page title" | "Page description";
  };
  tabs?: boolean;
};

export type EditTabsAccordionHeading = {
  edit_quickbar: QuickSettingsText;
  title: string;
};

export type BlackedText = {
  selector: string;
  index: number;
  triple?: boolean;
};

export type SaveTemplateInfo = {
  template_name: string;
  library: {
    new?: boolean;
    title: string;
  };
  category?: {
    new?: boolean;
    title: string;
  };
  icon?: string;
  tags?: string[];
  store_type?: string[];
};

export type SlideshowStyles =
  | "layout"
  | "filled_color"
  | "content_position"
  | "position"
  | "align"
  | "width_value"
  | "width_unit"
  | "height_value"
  | "height_unit"
  | "background"
  | "border"
  | "opacity"
  | "radius"
  | "shadow"
  | "padding"
  | "margin";

export type EditSlideShowContent = {
  sub_heading: string;
  heading: string;
  description: string;
};

export type ButtonSettings = {
  button: 1 | 2;
  is_on?: boolean;
  label?: string;
  action?:
    | "Open a link"
    | "Go to page"
    | "Go to section"
    | "Make a call"
    | "Send email to"
    | "Copy to clipboard"
    | "Open a pop-up"
    | "Go to checkout";
  input_text?: string;
  select?: {
    label?: string;
    option?: string;
    index?: number;
  };
  new_tab?: boolean;
};

export type DnDSlideshow = {
  from: {
    slide: number;
  };
  to: {
    slide: number;
  };
  pixel?: number;
};

export type DnDTabAccordionItem = {
  from: {
    item: number;
  };
  to: {
    item: number;
  };
  pixel?: number;
};

export type EditLayoutSlideshow = {
  layout?: "Full" | "Split";
  navigation?: {
    is_on: boolean;
  };
  arrows?: {
    is_on: boolean;
  };
  show_partially?: {
    is_on: boolean;
  };
  flip_content?: {
    is_on: boolean;
  };
};

export type EditSlideshowMedia = {
  image?: {
    file: string;
    size?: "Cover" | "Contain";
    position?: number;
    overlay?: Color;
    repeat?: boolean;
  };
  video?: {
    url: string;
    overlay?: Color;
    image?: string;
  };
};

export type FilterStoreType = {
  ecom: boolean;
  creator: boolean;
};

export type DateTime = "days" | "hours" | "minutes" | "seconds";
export type TimePicker = "Hour" | "Minute" | "Second";

export type MenuItem = {
  menu: number;
  subMenu?: number;
  megaMenu?: number;
};

export type DnDMenuItem = {
  from: MenuItem;
  to: MenuItem;
  pixel?: number;
};

export type ResizeBlock = {
  at_position: PointerResize;
  to_specific_point?: {
    x?: number;
    y?: number;
  };
};

export type SettingProductSearch = {
  type?: "Icon only" | "Search bar";
  size?: "S" | "M" | "L";
  icon?: string;
  placeholder?: string;
  button?: boolean;
  button_label?: string;
};

export type SettingGeneral = {
  logo?: string;
  favicon?: string;
  description?: string;
  title?: string;
  password?: string;
  enable_password?: boolean;
  additional_scripts_body?: string;
  additional_scripts_head?: string;
};

export type changeFontColor = {
  font?: string;
  color?: string;
};

export type FormFieldSetting = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<string>;
};

export type FormStyleSettings = {
  form_title?: string;
  save_as?: "Save as a lead" | "Save lead and send email";
  save_email?: string;
  after_submit?: "Show success message" | "Redirect to a URL" | "Show coupon code";
  submit_message: string;
  button_label?: string;
  submit_url?: string;
  send_contact: Array<"Mailchimp" | "Klaviyo">;
  opt_in_option?: boolean;
  fields?: Array<FormFieldSetting>;
  coupon?: string;
};

export type EtaStyleSettings = {
  icon?: string;
  color?: Color;
};

export type QuantityStyles =
  | "text_color"
  | "size"
  | "content_position"
  | "position"
  | "align"
  | "width_value"
  | "width_unit"
  | "height_value"
  | "height_unit"
  | "background"
  | "border"
  | "opacity"
  | "radius"
  | "shadow"
  | "padding"
  | "margin";

export type CoursePlayerStyleSettings = {
  sidebar?: string;
};

export type CoursePlayerContentSettings = {
  progress_type?: "line" | "circle";
  progress_icon?: string;
};

export type Link = {
  url: string;
  target: string;
};

export type settingShape = {
  brand_color: string;
  shape: string;
};

export type DataSource = {
  category: "None" | "Product" | "Collection" | "Blog" | "Blog post" | "Current page product";
  source?: string;
  index?: number;
};

type ElementDndTemplate = {
  position_section: NewDnDTemplateFromPanel;
};

type RowDndTemplateInfo = {
  design: {
    column: number;
    spacing: number;
  };
};

export type SectionDndTemplate = ElementDndTemplate & {
  variable: DataSource;
  rows?: RowDndTemplateInfo[];
  blocks: BlockDndTemplate[];
};

export type BlockDndTemplate = ElementDndTemplate & {
  create_action?: string;
  removed?: boolean;
};

export type TabsLayout = {
  layout_type?: "Text only" | "Block" | "Folder";
  active_color?: Color;
  active_text?: Color;
  shape?: string;
  underline?: boolean;
};

export type LayoutMenu = {
  layout?: "text" | "hamburger";
  direction?: string;
  spacing?: number;
  full_width?: boolean;
};

export type Slides = {
  description?: string;
  media_url?: string;
};

export type OnboardingSteps = {
  content: string;
  step: number;
  title: string;
  video?: string;
};

export type CardLearningWB = {
  id: number;
  title: string;
  thumbnail: string;
  reference?: string;
  trigger_code: string;
  category?: string;
  tags?: string[];
  slides: Slides[];
};

export type OnboardingWB = {
  onboarding_steps: OnboardingSteps[];
  show_onboarding: boolean;
};

export type LearningWB = {
  data: CardLearningWB[];
  show_onboarding?: boolean;
  triggered?: boolean;
};

export type OnboardingWBResponse = {
  success: boolean;
  result: OnboardingWB;
};

export type LearningWBResponse = {
  success: boolean;
  result: LearningWB;
};

export type LanguageEditor = {
  key_search?: string;
  select_page?: string;
  select_type?: string;
  select_language?: string;
  change_frase?: string;
};

export type StockCountDown = {
  stock_number: "Actual" | "Random";
  range?: {
    from?: string;
    to?: string;
  };
};

export type TimerCountDown = {
  layout: "Basic" | "Double highlight" | "Single highlight";
};

export type ProductReviews = {
  layout:
    | "Masonry"
    | "Carousel single image - Using this layout can improve your webfront pagespeed"
    | "List - Using this layout can improve your webfront pagespeed"
    | "Carousel multiple images";
};

export type RenameProductTemplateResponse = {
  success: boolean;
  message?: string;
};

export type CreateProductTemplateResponse = {
  success: boolean;
  result: {
    id: number;
    title: string;
    page: string;
    type: string;
    image: string;
    settings_data: string;
    status: number;
    shop_id: number;
    created_at: number;
    variant: string;
    base_template_id: number;
  };
};

export type CreateProductTemplateParams = {
  title: string;
  page: string;
  type: string;
  template_id: number;
  multiple: boolean;
};

export type ListTemplateResponse = {
  success: boolean;
  result: {
    pages: Template[];
    total: number;
  };
};

export type ListTemplateParams = {
  page: number;
  type: string;
  entity_ids: number;
  page_handle: string;
  is_included_custom_page: boolean;
};

export type Template = {
  allow_update: boolean;
  default: boolean;
  entity_id: number;
  groups?: any;
  id: number;
  image: string;
  page: string;
  page_id: number;
  preview_url: string;
  search: string;
  store_types?: any;
  title: string;
  type: string;
  variant: string;
};

export type RenameProductTemplatePayload = {
  title: string;
};
