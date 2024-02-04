import { test } from "@core/fixtures";
import { prepareFile } from "@helper/file";

test.describe("Demo web builder", () => {
  test("demo @TC_SB_DB_DOWNLOAD_FILE_S3", async ({ conf }) => {
    const s3Path = conf.caseConf.artwork_file.s3_path;
    const localPath = conf.caseConf.artwork_file.local_path;
    await prepareFile(s3Path, localPath);
  });
});
