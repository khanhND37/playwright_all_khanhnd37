/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type LectureData = {
  urlImage?: string;
  urlVideo?: object;
  lectureTitle: string;
  lectureContent?: string;
  lectureFile?: Array<FileDownload>;
  isCompletedLecture?: boolean;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type FileDownload = {
  fileTitle: string;
  fileSize?: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type FileDownloads = Array<FileDownload>;

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type Section = {
  sectionTitle: string;
  lecture: Array<LectureData>;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type Sections = Array<Section>;
