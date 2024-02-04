/**
 * Use: create param to call api search helpdoc
 */
export type ParamHelpDoc = {
  key: string;
  query_by: string;
  sort_by: string;
  filter_by?: string;
};

/**
 * Use: return search result when call api search hepdoc
 */
export type SearchResult = {
  title?: string;
  content?: string;
};
