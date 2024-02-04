import { SBPage } from "@pages/page";
import { expect } from "@playwright/test";
import type { ParamHelpDoc, SearchResult } from "@types";

export class HelpDocAPI extends SBPage {
  /**
   * Get title and content of search result
   * @param keyValue is the value of typesense key
   * @param param is the inputed param
   * @returns <SearchResult> {title,content}
   */
  async getSearchData(keyValue: string, param: ParamHelpDoc): Promise<SearchResult> {
    let url =
      `https://sn79ejbtgrfo3w5kp-1.a1.typesense.net/collections/crisp_articles_1/documents/search?` +
      `x-typesense-api-key=${keyValue}` +
      `&sort_by=_text_match:desc,visits:desc,updated_at:desc&q=${param.key}&query_by=${param.query_by}`;
    if (param.filter_by) {
      url += `&filter_by=${param.filter_by}`;
    }
    const response = await this.page.request.get(url);
    expect(response.status()).toBe(200);
    const jsonData = await response.json();
    const data = {
      title: jsonData.hits[0] ? jsonData.hits[0].document.title : "",
      content: jsonData.hits[0] ? jsonData.hits[0].document.content : "",
    };
    return data;
  }
}
