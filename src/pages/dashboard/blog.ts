import { Locator, Page } from "@playwright/test";
import type { BlogInfo, CommentInfo } from "@types";
import { Slider } from "@types";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { OcgLogger } from "@core/logger";
import { waitForImageLoaded } from "@core/utils/theme";
import { pressControl } from "@core/utils/keyboard";

export class BlogPage extends WebBuilder {
  xpathPageBlogDetail = "//div[@class='page-add blog-detail-page']";
  xpathPageBlogPostDetail = "//div[@class='page-add']";
  xpathInputSearchBlog =
    "//input[@placeholder='Search blogs' or @placeholder='Search blogs, blog posts' or @placeholder='Search comment']";
  xpathSearchPreview =
    "//div[@class='sb-popover__reference']//div[contains(@class,'sb-pointer w-builder__header__auto-complete__label')]//span";
  xpathSidebarSetting = "//aside[contains(@class,' w-builder__sidebar-wrapper--settings')]";
  xpathSectionPostList = "(//section[@component='post-list-only-blog' or @component='post-list'])[1]";
  xpathPostCart = "(//section[contains(@component,'post-list')]//div[contains(@class,'pointer post-card')])[1]";
  xpathPaging = "//section[contains(@component,'post-list')]//div[contains(@class,'pagination')]";
  xpathReferencePage = '//div[@class="sb-popover__reference"]//p';
  xpathSearchBlogPost = '//input[@placeholder="Search blog post"]';
  xpathPostNavigate = '//section[@component="post-navigation"]';
  xpathPostNaviagteSF = '//div[@class="flex post-navigation"]';
  xpathImgBlogPost =
    '//section[@component="block_image" and preceding-sibling::section[@component="bread_crumb"]]//img';
  xpathThumbnailBlogPost = '(//div[@class="navigation__thumbnail object-cover"]/img)';
  xpathContentTab = '//div[contains(@class,"sb-tab-navigation__item")]/div[text()="Content"]';
  xpathDesignTab = '//div[contains(@class,"sb-tab-navigation__item")]/div[text()="Design"]';
  xpathThubnailOn = '//div[@keyid="thumbnail"]//div[contains(@class, "sb-switch--active")]';
  xpathWidthButton = '//div[@data-widget-id="width"]//button';
  xpathWidthInput = '//div[@keyid="width"]//input';
  xpathMobileDevice = '//div[contains(@class,"w-builder__device-toggle-items")]/span[2]';
  xpathToast = '//div[contains(@class,"sb-toast__message")]';
  xpathRelatedArticles = '//h3[text()="Related articles"]';
  xpathCommentBlock = '//div[@class="comment overflow-hidden"]';
  xpathCommentSF = '//section[@component="comment"]';
  xpathReplyFormSF = '//div[contains(@class,"comment__content")]//form[@class="comment-form"]';
  xpathCodeBlock = '//section[@component="custom_code"]';
  xpathCodeArea = '//textarea[@placeholder="Enter your html code"]';
  xpathSectionHtmlCode = '//section[preceding-sibling::section[@id="gesETS"]]//section[@component="custom_code"]';
  xpathSeeTranslationBtn: `//span[normalize-space() = 'See translation']`;
  xpathUserReply = `(//div[contains(@class, 'user-reply')]//*[@class="icon"]//following-sibling::span)[1]`;
  xpathActionButton = `//button//span[contains(text(), 'Action')]`;
  xpathCancelButton = `//button//span[contains(text(), 'Cancel')]`;
  xpathDeleteButton = `//button//span[contains(text(), 'Delete')]`;

  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathBlog = {
    blog: {
      blogList: {
        pageHeading: '//h1[normalize-space()="Manage blogs"]',
        blogTitle: blogTitle => `//a[normalize-space()="${blogTitle}"]`,
        iconPreviewBlog: blocgTitle => `//a[normalize-space()="${blocgTitle}"]/ancestor::tr//i`,
        checkboxBlog: blogTitle => `//a[normalize-space()="${blogTitle}"]/ancestor::tr//span[@class='s-check']`,
        checkboxAll: '//span[normalize-space()="Title"]//ancestor::tr//span[@class="s-check"]',
        commentType: (blogTitle, comment) =>
          `//a[normalize-space()="${blogTitle}"]/ancestor::tr//span[normalize-space()="${comment}"]`,
        lastEdit: blogTitle => `(//a[normalize-space()="${blogTitle}"]/ancestor::tr//span)[last()]`,
        btnDeleteBlog: '//span[normalize-space()="Delete blogs"]',
      },
      popupDeleteBlog: {
        title: number =>
          `//h4[normalize-space()='Delete ${number} blog' or normalize-space()='Delete ${number} blogs']`,
        description:
          '//span[normalize-space()="Deleting blog will delete all blog posts inside the blog. This action cannot be undone. Do you want to continue?"]',
      },
      blogDetail: {
        fieldInput: fieldTitle =>
          `//div[@class='s-form-item' and descendant::label[normalize-space()= "${fieldTitle}"]]//input`,
        textarea: fieldTitle =>
          `//div[@class='s-form-item' and descendant::label[normalize-space()= "${fieldTitle}"]]//textarea`,
        btnBack: `//a[normalize-space()='Manage blogs']`,
      },
    },
    blogPost: {
      blogPostList: {
        pageHeading: '//h1[normalize-space()="Manage blog posts"]',
        blogPostTitle: blogPostTitle => `//a[normalize-space()="${blogPostTitle}"]`,
        blog: (blogPostTitle, blog) =>
          `(//a[normalize-space()="${blogPostTitle}"]/ancestor::tr//span[normalize-space()="${blog}"])[last()]`,
        visibility: (blogPostTitle, status) =>
          `//a[normalize-space()="${blogPostTitle}"]/ancestor::tr//span[normalize-space()="${status}"]`,
        author: (blogPostTitle, author) =>
          `//a[normalize-space()="${blogPostTitle}"]/ancestor::tr//span[normalize-space()="${author}"]`,
        iconPreviewBlogPost: blogPostTitle => `//a[normalize-space()="${blogPostTitle}"]/ancestor::tr//i`,
        checkboxAll: '//span[normalize-space()="Blog post"]//ancestor::tr//span[@class="s-check"]',
        commentType: (blogPostTitle, comment) =>
          `//a[normalize-space()="${blogPostTitle}"]/ancestor::tr//span[normalize-space()="${comment}"]`,
        lastEdit: blogPostTitle => `(//a[normalize-space()="${blogPostTitle}"]/ancestor::tr//span)[last()]`,
        moreAction: action => `//span[normalize-space()="${action}"]`,
        clearFilter: filterType =>
          `//p[normalize-space()='${filterType}']//ancestor::div[contains(@class,'s-collapse-item is-active')]//span[normalize-space()='Clear']`,
        filterActive: filterType =>
          `(//p[contains(text(),'${filterType}')])[last()]//ancestor::div[@class='s-collapse-item is-active']`,
        filterType: type => `(//p[contains(text(),'${type}')])[last()]`,
        tagInMoreAction: tag => `(//div[@class='tag-list-items']//span[normalize-space()="${tag}"])[last()]`,
        rowBlogPost: `//table[contains(@class,'table-condensed')]//tbody//tr`,
        noSearchResult: `//h2[normalize-space()='No Pages found']`,
        searchInput: `//input[@placeholder="Search the title"]`,
      },
      popupDeleteBlogPost: {
        title: number =>
          `//h4[normalize-space()='Delete ${number} blog post' or normalize-space()='Delete ${number} blog posts']`,
        description:
          '//span[normalize-space()="Deleted blog posts cannot be recovered. Do you still want to continue ?"]',
      },
      blogPostDetail: {
        btnBack: `//a[normalize-space()='BLOG POSTS']`,
        title_bar: '//h1[@class="title-bar__title"]',
        radioBtnVisibility: status => `//span[contains(normalize-space(),'${status}')]//parent::label//input`,
        tag: tag => `//div[contains(@class,'tag-list-items')]/span[normalize-space()="${tag}"]`,
        blockComment: `//div[normalize-space()='Comment']//ancestor::div[@class='blog-layout__item']`,
        textNumberComment: `//div[contains(@class,'display-inline-block')]//span`,
        emailWriteComment: email =>
          `${this.xpathBlog.blogPost.blogPostDetail.blockComment}//span[normalize-space()="${email}"]`,
        statusComment: email => `(//span[normalize-space()="${email}"]//ancestor::tr//td)[5]//span`,
      },
    },
    manageComment: {
      rowComment: (email, comment, blogPost) =>
        `//tr[.//span[contains(normalize-space(),'${email}')] and .//span[normalize-space()="${comment}"] and .//a[normalize-space()="${blogPost}"]]`,
      checkboxComment: (email, comment, blogPost) =>
        `(${this.xpathBlog.manageComment.rowComment(email, comment, blogPost)}//td)[1]//span[@class='s-check']`,
      textNoCommentFound: '//div[@class="empty-search-results"]//h2',
      statusComment: (email, comment, blogPost) =>
        `(${this.xpathBlog.manageComment.rowComment(email, comment, blogPost)}//td)[5]//span`,
      pageHeadingManageComment: `//h1[normalize-space()='Manage comments']`,
      xpathColumnName: `//tr[descendant::span[normalize-space()='Comment' or normalize-space()='Blog post']]`,
      noSearchResult: `//h2[normalize-space()='No Comment found']`,
    },
    storefront: {
      title: title => `//h1[normalize-space()="${title}"]`,
      blogInBreadcrumbBlogPost: `(//span[@class='breadcrumb_link subtle'])[2]//a`,
      tag: tag => `//span[normalize-space()='Tags']//parent::div//a[normalize-space()="${tag}"]`,
      imageBlogPost: "//img[contains(@class,'blog-post-page__image')]",
      pageNotFound: '//div[@class="notfound-page"]',
      blogPostInBlogPage: titleBlogPost =>
        `//h2[normalize-space()="${titleBlogPost}"]//ancestor::div[contains(@class,'blog-post-card')]`,
      blockComment: "//div[@class='comment-block']",
      numberCommentInBlogPage: titleBlogPost =>
        `(//h2[normalize-space()="${titleBlogPost}"]//ancestor::div[contains(@class,'blog-post-card')]//p)[last()]`,
      rowComment: "//div[contains(@class,'comment-block__comment')]",
      commentDetail: text =>
        `//p[normalize-space()="${text}"]//ancestor::div[contains(@class,'comment-block__comment')]`,
      fieldEmail: `//div[contains(@class,"comment-form__input")]//input[@placeholder="Your email"]`,
      fieldInput: text => `//textarea[@placeholder="${text}"]`,
      fieldTextarea: text => `//textarea[@placeholder="${text}"]`,
      notification: `//span[contains(@class,"notification__message")]`,
      btnSubmitComment: `(//button[@type="submit"])[1]`,
    },

    sfCommentV3: {
      fieldInput: text => `//input[@placeholder="${text}"]`,
      fieldTextarea: text => `//textarea[@placeholder="${text}"]`,
    },
  };

  /**
   * get xpath post list on home page
   */
  getXpathPostList(index = 1): string {
    return `(//section[@component='post-list'])[${index}]`;
  }

  /**
   * get xpath post cart item
   * @param index is index of post cart item
   */
  getXpathPostCartItem(index = 1): string {
    return `(//section[contains(@component,'post-list')]//div[contains(@class,'pointer post-card')])[${index}]`;
  }

  /**
   * get xpath paging by index
   */
  getXpathPagingByIndex(index = 1): string {
    return `//section[contains(@component,'post-list')]//div[contains(@class,'pagination')]//button[normalize-space()='${index}']`;
  }

  /**
   * Search blog on web builder
   * @param blogTitle is title of blog
   */
  async searchBlogOnWebBuilder(blogTitle: string) {
    await this.page.locator(this.xpathSearchPreview).click();
    await this.page.getByPlaceholder("Search blog").click();
    await this.page.getByPlaceholder("Search blog").fill(blogTitle);
    await this.page.waitForSelector(
      `//div[contains(@class,'sb-tooltip__reference') and normalize-space()='${blogTitle}']`,
    );
    await this.page
      .locator(`//div[contains(@class,'sb-tooltip__reference') and normalize-space()='${blogTitle}']`)
      .click();
  }

  /**
   * go to blog page
   *
   */
  async goToBlogPage() {
    await this.goto("admin/blogs");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("//h1[normalize-space()='Manage blogs']");
  }

  /**
   * get xpath item blog post by section
   * @param selectorSection is selector of section
   */
  getXpathItemBlogPostBySection(selectorSection: string): string {
    return `${selectorSection}//section[contains(@component,'post-list')]//div[contains(@class,'pointer post-card')]`;
  }

  /**
   * Go to blog post page
   */
  async goToBlogPostPage() {
    await this.goto("/admin/blog-posts");
    await this.page.waitForSelector("//h1[normalize-space()='Manage blog posts']", { timeout: 150000 });
  }

  /**
   * Create a new blog
   * @param blogInfo is information of blog
   */
  async createBlog(blogInfo: BlogInfo) {
    await this.page.waitForSelector("//h1[normalize-space()='Add new blog']");
    if (blogInfo.title) {
      await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Title"), blogInfo.title);
    }
    if (blogInfo.comment_type) {
      await this.clickRadioButtonWithLabel(blogInfo.comment_type);
    }
    if (blogInfo.seo) {
      await this.genLoc("//button[normalize-space()='Edit website SEO']").click();
      if (blogInfo.page_title) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Page title"), blogInfo.page_title);
      }
      if (blogInfo.meta_description) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.textarea("Meta description")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.textarea("Meta description"), blogInfo.meta_description);
      }
      if (blogInfo.handle) {
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("URL and handle"), blogInfo.handle);
      }
    }
    await this.clickOnBtnWithLabel("Save");
    await this.waitForElementVisibleThenInvisible(this.xpathProductDetailLoading);
    await this.waitForElementVisibleThenInvisible(this.xpathLoadingButton);
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }

  /**
   * Create a new blog post
   * @param blogInfo is information of blog post
   */
  async createBlogPost(blogInfo: BlogInfo) {
    if (await this.checkButtonVisible("Create blog post")) {
      await this.clickOnBtnWithLabel("Create blog post");
    } else {
      await this.clickOnBtnWithLabel("Add blog post");
    }
    if (blogInfo.title) {
      await this.page.fill(
        "//div[@class='type-container' and descendant::label[normalize-space()='Title']]//input",
        blogInfo.title,
      );
    }
    if (blogInfo.content) {
      await this.page.waitForSelector(
        "//div[contains(@class,'tox-editor-container')]//div[@class='tox-editor-header']",
      );
      await this.page.waitForSelector("//iframe[contains(@id,'tiny-vue')]");
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(blogInfo.content);
    }
    if (blogInfo.excerpt) {
      await this.clickOnBtnWithLabel("Add Excerpt");
      await this.page
        .locator("//textarea[contains(@class,'s-textarea__inner blog-post__excerpt')]")
        .fill(blogInfo.excerpt);
    }
    if (blogInfo.visibility) {
      await this.clickRadioButtonWithLabel(blogInfo.visibility);
    }
    if (blogInfo.author) {
      await this.genLoc(
        "//div[@class='type-container' and descendant::label[normalize-space()='Author']]//select",
      ).selectOption(blogInfo.author);
    }
    if (blogInfo.blog) {
      await this.genLoc(
        "//div[@class='type-container' and descendant::label[normalize-space()='Blog']]//select",
      ).selectOption(blogInfo.blog);
    }
    if (blogInfo.featured_image) {
      await this.page.setInputFiles("//input[@type='file']", blogInfo.featured_image);
      await this.waitForResponseIfExist("files/multi.json");
      await this.waitAbit(5000);
      await this.page.waitForSelector("//a[normalize-space()='Edit Alt text']");
      await this.page.waitForSelector("//div[@class='card__section']//img");
      await waitForImageLoaded(this.page, "//div[@class='card__section']//img");
    }
    if (blogInfo.tags) {
      for (const tag of blogInfo.tags) {
        await this.genLoc("//div[@class='type-container' and descendant::label[normalize-space()='Tags']]//input").fill(
          tag,
        );
        const btnAddTagVisible = await this.genLoc("//strong[normalize-space()='Add']").isVisible();
        if (btnAddTagVisible) {
          await this.genLoc("//strong[normalize-space()='Add']").click();
        } else {
          await this.genLoc(`//span[contains(text(),'${tag}')]`).click();
        }
      }
    }
    if (blogInfo.seo) {
      await this.genLoc("//button[normalize-space()='Edit website SEO']").click();
      if (blogInfo.page_title) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Page title"), blogInfo.page_title);
      }
      if (blogInfo.meta_description) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.textarea("Meta description")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.textarea("Meta description"), blogInfo.meta_description);
      }
      if (blogInfo.handle) {
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("URL and handle"), blogInfo.handle);
      }
    }

    await this.clickOnBtnWithLabel("Save");
    await this.waitForElementVisibleThenInvisible(this.xpathProductDetailLoading);
    await this.waitForElementVisibleThenInvisible(this.xpathLoadingButton);
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }

  /**
   * Search blog or blog post by title
   * @param title is title of blog or blog post
   */
  async searchBlogOrBlogPost(title: string) {
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
    await this.waitForElementVisibleThenInvisible(this.xpathProductDetailLoading);
    if (!(await this.page.isVisible("//h1[normalize-space()='Write a blog post']"))) {
      await this.page.waitForSelector(this.xpathInputSearchBlog);
      await this.genLoc(this.xpathInputSearchBlog).fill(title);
      await this.page.keyboard.press("Enter");
      await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
      await this.page.waitForSelector(
        "//tr[descendant::span[normalize-space()='Title' or normalize-space()='Blog post']]",
      );
      await this.page.waitForSelector(
        `(${this.xpathBlog.blogPost.blogPostList.rowBlogPost})[1] | ${this.xpathBlog.blogPost.blogPostList.noSearchResult}`,
      );
    }
  }

  /**
   * Delete all blog or blog post search on list
   * @param title is title of blog or blog post
   */
  async deleteBlogOrBlogPost(title: string) {
    await this.searchBlogOrBlogPost(title);
    const checkBlogSearch = await this.page.isVisible(
      `//h1[normalize-space()='Write a blog post'] |${this.xpathBlog.blogPost.blogPostList.noSearchResult}`,
    );
    if (!checkBlogSearch) {
      await this.page.click(
        "//thead//tr[descendant::span[normalize-space()='Title' or normalize-space()='Blog post']]//span[@class='s-check']",
      );
      await this.page.waitForSelector(
        "//table[contains(@class,'table-condensed')]//button[normalize-space()='Action']",
      );
      await this.clickOnBtnWithLabel("Action");
      await this.genLoc(
        "//span[normalize-space()='Delete blogs' or normalize-space()='Delete selected blog posts']",
      ).click();
      await this.page.waitForSelector("//div[contains(@class,'s-animation-content')]");
      await this.clickOnBtnWithLabel("Delete");
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    }
  }

  /**
   * Create list blog
   * @param listBlog is list blog
   */
  async createListBlog(listBlog: BlogInfo[]) {
    for (const blogInfo of listBlog) {
      await this.goToBlogPage();
      await this.clickOnBtnWithLabel("Add blog");
      await this.createBlog(blogInfo);
    }
  }

  /**
   * Create list blog post
   * @param listBlogPost is list blog post
   */
  async createListBlogPost(listBlogPost: BlogInfo[]) {
    for (const blogInfo of listBlogPost) {
      await this.goToBlogPostPage();
      await this.createBlogPost(blogInfo);
    }
  }

  /**
   * delete list blog or blog post
   * @param listBlogOrBlogPost is list blog or blog post
   */
  async deleteListBlogOrBlogPost(listBlogOrBlogPost: BlogInfo[], page: string) {
    if (await this.page.isVisible("//h1[normalize-space()='Write a blog post']")) {
      return;
    } else {
      for (const blogInfo of listBlogOrBlogPost) {
        if (page === "blog") {
          await this.goToBlogPage();
        } else {
          await this.goToBlogPostPage();
        }
        await this.deleteBlogOrBlogPost(blogInfo.title);
      }
    }
  }

  /**
   * On/off toggle
   * @param label
   * @param status
   */
  async turnONOFToggleByLabel(dasboard: Page, label: string, status: boolean) {
    const xpathInputByLabel = `//div[@label ='${label}']//input`;
    const xpathSpanByLabel = `//div[@label ='${label}']//span[contains(@class, 'is-default')]`;
    await dasboard.locator(xpathInputByLabel).isVisible({ timeout: 10000 });
    const isCheck = await dasboard.locator(xpathInputByLabel).isChecked();
    if (status == !isCheck) {
      await dasboard.locator(xpathSpanByLabel).click();
    }
  }

  /**
   * Change content post list
   */
  async changePostListContent(content: {
    featured_image?: boolean;
    published?: boolean;
    excerpt?: boolean;
    author?: boolean;
  }) {
    await this.page.getByText("Content", { exact: true }).click();
    await this.turnONOFToggleByLabel(this.page, "Featured image", content.featured_image);
    await this.turnONOFToggleByLabel(this.page, "Published date", content.published);
    await this.turnONOFToggleByLabel(this.page, "Excerpt", content.excerpt);
    await this.turnONOFToggleByLabel(this.page, "Author name", content.author);
    await this.clickSaveButton();
  }

  /**
   * Change post list layout
   * @param layout
   */
  async changePostListLayout(layout: {
    type?: "Grid" | "Carousel";
    spacing?: number;
    slideNav?: boolean;
    arrows?: boolean;
    content_position?: "Vertical" | "Horizontal";
    text_align?: "Left" | "Center" | "Right";
    radius?: {
      config?: Slider;
    };
    post_show?: {
      config?: Slider;
    };
    page_load?: "Infinite load" | "Paging";
    post_per_load?: number;
    post_to_show?: number;
    post_per_page?: number;
  }) {
    await this.page.getByText("Design", { exact: true }).click();
    const popupLayoutSelect = "//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]";
    // open dropdown selection
    if (layout.type) {
      await this.page
        .locator("//div[@data-widget-id='layout']//button//span[@class='sb-button--label']")
        .last()
        .click();
      const layoutIndex = layout.type === "Grid" ? 0 : 1;
      const layoutSelector = "//div[contains(@class, 'list-icon-2')]//span";
      await this.page.locator(layoutSelector).nth(layoutIndex).click();

      if (layout.spacing) {
        if (layout.spacing >= 0) {
          const selector = this.getWidgetSelectorByLabel("Spacing");
          await this.page
            .locator(`(${popupLayoutSelect}${selector}//input[@type="number"])[2]`)
            .fill(layout.spacing.toString());
        }
      }

      if (layout.type === "Carousel") {
        if (typeof layout.slideNav !== "undefined") {
          await this.switchToggle("Slide Nav", layout.slideNav, this.getWidgetSelectorByLabel);
        }

        if (typeof layout.arrows !== "undefined") {
          await this.switchToggle("Arrows", layout.arrows, this.getWidgetSelectorByLabel);
        }
      }

      if (layout.content_position) {
        await this.page.click(
          "//div[contains(@class,'sb-flex-align-center') and descendant::label[normalize-space()='Content position']]//button",
        );
        await this.page.click(`//li[child::label[normalize-space()='${layout.content_position}']]`);
      }

      await this.page
        .locator("//div[@data-widget-id='layout']//button//span[@class='sb-button--label']")
        .last()
        .click();
    }

    if (layout.text_align) {
      await this.selectAlign("card_align", layout.text_align);
    }

    if (layout.radius) {
      await this.editSliderBar("card_border_radius", layout.radius.config);
    }

    if (layout.post_to_show) {
      await this.selectPostToShow("posts_to_show_slide", layout.post_to_show);
    }

    if (layout.page_load) {
      await this.selectDropDown("page_load", layout.page_load);
    }

    if (layout.post_show) {
      await this.editSliderBar("post_to_show_out_page", layout.post_show.config);
    }

    await this.clickSaveButton();
  }

  /**
   * Get locator of alert create blog post success
   * @param blogTitle title of blog post
   * @returns locator of alert
   */
  async getAlertCreateBlogPostSuccess(blogTitle: string): Promise<Locator> {
    return this.page.locator(`//span[contains(@class, "alert__title") and contains(text(),"${blogTitle}")]`);
  }

  getXpathBlogPostInSearch(blogTitle: string, index = "last()") {
    return `(//div[@data-select-label]//div[normalize-space()="${blogTitle}"])[${index}]`;
  }

  async resizeNagative(width: string) {
    await this.page.click(this.xpathWidthInput, { clickCount: 3 });
    await this.page.press(this.xpathWidthInput, "Backspace");
    await this.page.type(this.xpathWidthInput, width, { delay: 100 });
    await this.page.press(this.xpathWidthInput, "Enter", { delay: 1500 });
  }

  /**
   * count post in list
   */
  async countPostInList(section: number, block = 1): Promise<number> {
    await this.frameLocator.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
    const xpathSection = this.getSelectorByIndex({ section: section, block: block });
    const xpathPostItem = `${xpathSection}//section[contains(@component,'post-list')]//div[contains(@class,'pointer post-card')]`;
    return await this.frameLocator.locator(xpathPostItem).count();
  }

  async editBlog(blogInfo: BlogInfo) {
    if (blogInfo.title) {
      await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Title"), blogInfo.title);
    }
    if (blogInfo.comment_type) {
      await this.clickRadioButtonWithLabel(blogInfo.comment_type);
    }
    if (blogInfo.seo) {
      await this.genLoc("//button[normalize-space()='Edit website SEO']").click();
      if (blogInfo.page_title) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Page title"), blogInfo.page_title);
      }
      if (blogInfo.meta_description) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.textarea("Meta description")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.textarea("Meta description"), blogInfo.meta_description);
      }
      if (blogInfo.handle) {
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("URL and handle"), blogInfo.handle);
      }
    }
  }

  async getInfoBlog(comment: string): Promise<BlogInfo> {
    const xpathPageTitleVisible = await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).isHidden();
    if (xpathPageTitleVisible) {
      await this.genLoc("//button[normalize-space()='Edit website SEO']").click();
    }
    return {
      title: await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Title")).inputValue(),
      comment_type_radio: await this.genLoc(`//span[normalize-space()="${comment}"]//parent::label//input`).isChecked(),
      page_title: await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).inputValue(),
      meta_description: await this.genLoc(this.xpathBlog.blog.blogDetail.textarea("Meta description")).inputValue(),
      handle: await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("URL and handle")).inputValue(),
    };
  }

  /**
   * Get time visible blog postin blog post detail dashboard, sau đó convert time,
   * ví dụ: Oct 7, 2023 12:00 AM convert thành Oct 07, 2023
   * @returns
   */
  async getTimeVisibleInBlogPostDetail(): Promise<string> {
    const dateTimeString = await this.genLoc(
      "(//div[@class='type-container']//span[contains(normalize-space(),'Visible')]//span)[last()]",
    ).innerText();
    const date = dateTimeString.split(" ", 3);
    const day = date[1].replace(",", "").trim();
    const formattedDay = day.padStart(2, "0");
    return `${date[0].trim()} ${formattedDay}, ${date[2].trim()}`;
  }

  /**
   * Hàm lấy thông tin hiển thị tác giả và thời gian hiện blog post trên sf khi shop dùng theme Inside
   * @returns
   */
  async getAuthorAndTimeBlogPostThemeInside(): Promise<string> {
    return await this.genLoc(
      "//p[contains(@class,'blog-post-page__body--inside__credit') or contains(@class,'blog-post-page__body--outside__credit')]",
    ).innerText();
  }

  /**
   * Get content hiển thị ở trang blog post trên sf khi shop dùng theme insite
   * @returns
   */
  async getContentBlogPostThemeInsite(): Promise<string> {
    return await this.genLoc("//div[contains(@class,'blog-post-page__body--inside__content')]//p").innerText();
  }

  /**
   * Che 1 phần thông tin của blog post bị dính với ảnh của blog post
   */
  async hideElementPathBlogPostSFInside(): Promise<void> {
    await this.page.evaluate(() => {
      const xpath = "//div[contains(@class,'blog-post-page__container--inside')]";
      const elements = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
      const firstElement = elements.iterateNext() as HTMLElement;
      if (firstElement) {
        firstElement.style.visibility = "hidden";
      }
      return Promise.resolve();
    });
  }

  async editBlogPost(blogInfo: BlogInfo) {
    if (blogInfo.title) {
      await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Title"), blogInfo.title);
    }
    if (blogInfo.content) {
      await this.page.waitForSelector(
        "//div[contains(@class,'tox-editor-container')]//div[@class='tox-editor-header']",
      );
      await this.page.waitForSelector("//iframe[contains(@id,'tiny-vue')]");
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(blogInfo.content);
    }
    if (blogInfo.excerpt) {
      const btnAddExceptVisible = await this.genLoc(this.xpathBtnWithLabel("Add Excerpt")).isVisible();
      if (btnAddExceptVisible) {
        await this.clickOnBtnWithLabel("Add Excerpt");
      }
      await this.page
        .locator("//textarea[contains(@class,'s-textarea__inner blog-post__excerpt')]")
        .fill(blogInfo.excerpt);
    }
    if (blogInfo.visibility) {
      await this.clickRadioButtonWithLabel(blogInfo.visibility);
    }
    if (blogInfo.featured_image) {
      await this.page.setInputFiles("//input[@type='file']", blogInfo.featured_image);
      await this.page.waitForSelector("//div[@class='card__section']//img");
      await waitForImageLoaded(this.page, "//div[@class='card__section']//img");
      await this.page.waitForSelector("//a[normalize-space()='Edit Alt text']");
    }
    if (blogInfo.author) {
      await this.genLoc(
        "//div[@class='type-container' and descendant::label[normalize-space()='Author']]//select",
      ).selectOption(blogInfo.author);
    }
    if (blogInfo.blog) {
      await this.genLoc(
        "//div[@class='type-container' and descendant::label[normalize-space()='Blog']]//select",
      ).selectOption(blogInfo.blog);
    }
    if (blogInfo.tags) {
      const tagVisible = await this.genLoc("//div[contains(@class,'tag-list-items')]").isVisible();
      if (tagVisible) {
        const countTag = await this.genLoc("//div[contains(@class,'tag-list-items')]/span").count();
        for (let i = 1; i <= countTag; i++) {
          await this.genLoc("(//div[contains(@class,'tag-list-items')]//a[@class='s-delete is-small'])[1]").click();
        }
      }

      for (const tag of blogInfo.tags) {
        await this.genLoc("//div[@class='type-container' and descendant::label[normalize-space()='Tags']]//input").fill(
          tag,
        );
        const btnAddTagVisible = await this.genLoc("//strong[normalize-space()='Add']").isVisible();
        if (btnAddTagVisible) {
          await this.genLoc("//strong[normalize-space()='Add']").click();
        } else {
          await this.genLoc(`//span[contains(text(),'${tag}')]`).click();
        }
      }
    }
    if (blogInfo.seo) {
      await this.genLoc("//button[normalize-space()='Edit website SEO']").click();
      if (blogInfo.page_title) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Page title"), blogInfo.page_title);
      }
      if (blogInfo.meta_description) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.textarea("Meta description")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.textarea("Meta description"), blogInfo.meta_description);
      }
      if (blogInfo.handle) {
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("URL and handle"), blogInfo.handle);
      }
    }
    await this.clickOnBtnWithLabel("Save");
    await this.waitForElementVisibleThenInvisible(this.xpathProductDetailLoading);
    await this.waitForElementVisibleThenInvisible(this.xpathLoadingButton);
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }

  async filterBlogPost(filterType: string, typeInput: string, value: string, textInput?: string) {
    if (typeInput === "radio") {
      await this.genLoc(
        `${this.xpathBlog.blogPost.blogPostList.filterActive(filterType)}//span[normalize-space()="${value}"]`,
      ).click();
      if (textInput) {
        await this.genLoc(
          `(${this.xpathBlog.blogPost.blogPostList.filterActive(filterType)}${
            this.xpathBlog.blogPost.blogPostList.searchInput
          })[last()]`,
        ).fill(textInput);
      }
    }
    if (typeInput === "textbox") {
      await this.genLoc(`${this.xpathBlog.blogPost.blogPostList.filterActive(filterType)}//input`).fill(value);
    }
    if (typeInput === "select") {
      await this.genLoc(`${this.xpathBlog.blogPost.blogPostList.filterActive(filterType)}//select`).selectOption(value);
    }
    await this.clickOnBtnLinkWithLabel("Done");
    await this.page.waitForSelector(
      `(${this.xpathBlog.blogPost.blogPostList.rowBlogPost})[1] | ${this.xpathBlog.blogPost.blogPostList.noSearchResult}`,
    );
  }

  async getListBlogPost(): Promise<string[]> {
    const blogPosts = [];
    const countRow = await this.genLoc(this.xpathBlog.blogPost.blogPostList.rowBlogPost).count();
    for (let i = 1; i <= countRow; i++) {
      const blogPostTitle = await this.genLoc(
        `(((${this.xpathBlog.blogPost.blogPostList.rowBlogPost})[${i}]//td)[2]//span)[2]`,
      ).innerText();
      blogPosts.push(blogPostTitle);
    }
    return blogPosts;
  }

  /**
   * Get list blog in DB
   */
  async getListBlog(): Promise<string[]> {
    const blogs = [];
    await this.genLoc(this.xpathBlog.blogPost.blogPostList.rowBlogPost).first().waitFor();
    const countRow = await this.genLoc(this.xpathBlog.blogPost.blogPostList.rowBlogPost).count();
    for (let i = 1; i <= countRow; i++) {
      const blogTitle = await this.genLoc(
        `((//table[contains(@class,'table-condensed')]//tbody//tr)[${i}])//a`,
      ).innerText();
      blogs.push(blogTitle);
    }
    return blogs;
  }

  async writeCommentBlogPost(comment: CommentInfo) {
    let email = "";
    await this.genLoc(this.xpathBlog.storefront.fieldInput("Comment")).scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(3 * 1000);
    if (comment.your_name) {
      await this.genLoc(this.xpathBlog.storefront.fieldInput("Your name")).fill(comment.your_name);
    }
    if (comment.your_email) {
      const timeStamp = Date.now();
      await this.genLoc(this.xpathBlog.storefront.fieldEmail).fill(`${comment.your_email}${timeStamp}@beeketing.net`);
      email = await this.genLoc(this.xpathBlog.storefront.fieldEmail).inputValue();
    }
    if (comment.website) {
      await this.genLoc(this.xpathBlog.storefront.fieldInput("Website")).fill(comment.website);
    }
    if (comment.comment) {
      await this.genLoc(this.xpathBlog.storefront.fieldTextarea("Comment")).fill(comment.comment);
    }

    await this.genLoc(this.xpathBlog.storefront.btnSubmitComment).click();
    await this.waitUntilElementVisible(this.xpathBlog.storefront.notification);
    return email;
  }

  /**
   * Go to manage comment page
   */
  async goToManageComments() {
    await this.goto("/admin/comments");
    await this.page.waitForSelector(this.xpathBlog.manageComment.pageHeadingManageComment, { timeout: 150000 });
  }

  async getListCommentInSF(): Promise<string[]> {
    const numberComment = await this.genLoc(this.xpathBlog.storefront.rowComment).count();
    const listComment = [];
    for (let i = 1; i <= numberComment; i++) {
      const commentInfo = {
        username: await this.genLoc(`((${this.xpathBlog.storefront.rowComment})[${i}]//span)[1]`).innerText(),
        comment: await this.genLoc(`(${this.xpathBlog.storefront.rowComment})[${i}]//p`).innerText(),
      };
      listComment.push(commentInfo);
    }
    return listComment;
  }

  async searchComment(title: string) {
    await this.page.waitForSelector(this.xpathInputSearchBlog);
    await this.genLoc(this.xpathInputSearchBlog).fill(title);
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
    await this.page.waitForSelector(this.xpathBlog.manageComment.xpathColumnName);
    await this.page.waitForSelector(
      `(${this.xpathBlog.blogPost.blogPostList.rowBlogPost})[1] | ${this.xpathBlog.manageComment.noSearchResult}`,
    );
  }

  async getListCommentInDB(): Promise<string[]> {
    const numberComment = await this.genLoc(this.xpathBlog.blogPost.blogPostList.rowBlogPost).count();
    const listComment = [];
    for (let i = 1; i <= numberComment; i++) {
      const comment = await this.getTextContent(
        `((${this.xpathBlog.blogPost.blogPostList.rowBlogPost})[${i}]//td)[2]//span`,
      );
      listComment.push(comment);
    }
    return listComment;
  }

  /**
   * Write comment theme v3
   */
  async writeCommentBlogPostV3(comment: CommentInfo) {
    await this.genLoc(this.xpathCommentSF).scrollIntoViewIfNeeded();
    if (comment.your_name) {
      await this.genLoc(this.xpathBlog.sfCommentV3.fieldInput("Enter your name")).fill(comment.your_name);
    }
    if (comment.your_email) {
      await this.genLoc(this.xpathBlog.sfCommentV3.fieldInput("Enter your email")).fill(comment.your_email);
    }
    if (comment.comment) {
      await this.genLoc(this.xpathBlog.sfCommentV3.fieldTextarea("Enter your message")).fill(comment.comment);
    }

    await this.genLoc(this.xpathBlog.storefront.btnSubmitComment).click();
    await this.waitUntilElementVisible(this.xpathBlog.storefront.notification);
  }

  /**
   * Remove comment in dashboard
   * @param email
   * @param comment
   * @param blogPost
   */
  async removeCommentInDB(email: string, comment: string, blogPost: string) {
    const isCommentVisible = await this.genLoc(
      this.xpathBlog.manageComment.checkboxComment(email, comment, blogPost),
    ).isVisible();
    if (isCommentVisible) {
      await this.genLoc(this.xpathBlog.manageComment.checkboxComment(email, comment, blogPost)).click();
      await this.page.getByRole("cell", { name: "1 comment selected Action" }).locator("button").click();
      await this.page.getByText("Delete comments").click();
      await this.page.getByRole("button", { name: "Delete" }).click();
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    }
  }

  /**
   * get blog data on SF
   * @param blogHandle
   * @param locale exp: "vi-vn"; "vi-us"....
   * @returns
   */
  async getBlogDataOnSF(blogHandle: string, locale: string) {
    let options = {};
    options = {
      headers: {
        "X-Lang": locale,
      },
    };
    const res = await this.page.request.get(
      `https://${this.domain}/api/blogs/posts.json?handle=${blogHandle}`,
      options,
    );
    if (res.ok()) {
      return res.json();
    }
    return Promise.reject("Get collection data failed");
  }
}

/**
 * Remove selector in the page
 * @param selector css of selector
 */
export const removeSelector = async (page: Page, selector: string) => {
  const logger = OcgLogger.get();
  try {
    await page.evaluate(selector => {
      const elems = document.querySelectorAll(selector);
      elems.forEach(elem => {
        elem.remove();
      });
    }, selector);
  } catch (e) {
    logger.error("Error: ", e);
  }
};
