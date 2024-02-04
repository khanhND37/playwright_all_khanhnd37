import fs from "fs";
import path from "path";
import { checkFolderWithFileExists, createDirectoryIfNotExists, getAllFiles, getType } from "@core/utils/file";
import S3Uploader from "@utils/s3";
import type { Screenshot, ToHaveScreenshotOptions } from "@types";
import { expect } from "@core/fixtures";
import { Locator, Page } from "@playwright/test";

export class SnapshotFixture {
  private s3Enabled: boolean;
  private s3Loader: S3Uploader;
  private s3Bucket: string;
  private s3Region: string;

  constructor(s3Enabled: boolean, env: string) {
    this.s3Enabled = s3Enabled;

    if (s3Enabled) {
      // get s3 config
      let s3Bucket = "";
      let s3Region = "";
      let s3Key = "";
      let s3Secret = "";

      switch (env) {
        case "dev":
        case "development":
          s3Bucket = process.env.SNAPSHOTS_S3_BUCKET_DEV;
          s3Region = process.env.SNAPSHOTS_S3_REGION_DEV;
          s3Key = process.env.SNAPSHOTS_S3_KEY_DEV;
          s3Secret = process.env.SNAPSHOTS_S3_SECRET_DEV;
          break;
        case "prodtest":
          s3Bucket = process.env.SNAPSHOTS_S3_BUCKET_PROD_TEST;
          s3Region = process.env.SNAPSHOTS_S3_REGION_PROD_TEST;
          s3Key = process.env.SNAPSHOTS_S3_KEY_PROD_TEST;
          s3Secret = process.env.SNAPSHOTS_S3_SECRET_PROD_TEST;
          break;
        case "prod":
        case "production":
          s3Bucket = process.env.SNAPSHOTS_S3_BUCKET_PROD;
          s3Region = process.env.SNAPSHOTS_S3_REGION_PROD;
          s3Key = process.env.SNAPSHOTS_S3_KEY_PROD;
          s3Secret = process.env.SNAPSHOTS_S3_SECRET_PROD;
          break;
        default:
          s3Bucket = process.env.SNAPSHOTS_S3_BUCKET_DEV;
          s3Region = process.env.SNAPSHOTS_S3_REGION_DEV;
          s3Key = process.env.SNAPSHOTS_S3_KEY_DEV;
          s3Secret = process.env.SNAPSHOTS_S3_SECRET_DEV;
          break;
      }

      // create S3 Loader
      this.s3Loader = new S3Uploader(s3Bucket, s3Region, s3Key, s3Secret);
      this.s3Bucket = s3Bucket;
      this.s3Region = s3Region;
    }
  }

  /**
   * Remove folder snapshot
   * @param testDir
   * @param testFileName
   */
  public removeFolderSnapshot(testDir: string, testFileName: string) {
    const snapshotDir = path.join(testDir, `${testFileName}-snapshots`);
    if (fs.existsSync(snapshotDir)) {
      fs.rmSync(snapshotDir, { recursive: true, force: true });
    }
  }

  /**
   * This function checks if a folder with at least one file exists, creates the folder if it doesn't
   * exist, and downloads all snapshots from an S3 bucket to the folder.
   * @param {string} testDir - The directory path of test file
   * @param {string} testFileName - The name of the test file
   * @returns The function may return nothing if `checkFolderWithFileExists(snapshotDir)` returns
   * `true` or if `success` is `false` after attempting to create the folder. Otherwise, the function
   * may throw an error if `BASE_S3_SNAPSHOT_FOLDER` environment variable is not found or if there is
   * an error when downloading snapshots from S3.
   */
  public async checkDownloadAllSnapshotsFromS3(testDir: string, testFileName: string) {
    if (!this.s3Enabled) {
      return;
    }
    const snapshotDir = path.join(testDir, `${testFileName}-snapshots`);

    // check folder exists with at least one file
    if (checkFolderWithFileExists(snapshotDir)) {
      // eslint-disable-next-line no-console
      console.log(
        `S3 Download snapshot ingored: The folder ${snapshotDir} already exists and has at least one file inside it`,
      );
      return;
    }

    // download all the snapshots
    try {
      // create folder
      createDirectoryIfNotExists(snapshotDir);

      const baseS3SnapshotFolder = process.env.BASE_S3_SNAPSHOT_FOLDER || "";
      if (baseS3SnapshotFolder == "") {
        throw new Error("ENV not found: BASE_S3_SNAPSHOT_FOLDER");
      }

      // get relative path
      const snapshotS3Key = path.relative(process.cwd(), snapshotDir);

      await this.s3Loader.downloadFilesFromS3(path.join(baseS3SnapshotFolder, snapshotS3Key, "/"), snapshotDir);
    } catch (err) {
      throw new Error(`Error when check and download snapshots from S3: ${err}`);
    }
  }

  /**
   * This function uploads all files in a specified directory to an S3 bucket.
   * @param {string} testDir - The directory path where the test files are located.
   * @param {string} testFileName - The name of the file being tested.
   */
  public async uploadFolderSnapshotsToS3(testDir: string, testFileName: string) {
    if (!this.s3Enabled) {
      return;
    }
    const baseS3SnapshotFolder = process.env.BASE_S3_SNAPSHOT_FOLDER || "";
    if (baseS3SnapshotFolder == "") {
      throw new Error("ENV not found: BASE_S3_SNAPSHOT_FOLDER");
    }

    const snapshotDir = path.join(testDir, `${testFileName}-snapshots`);
    const snapshotS3Key = path.relative(process.cwd(), snapshotDir);

    try {
      const files = getAllFiles(snapshotDir);
      for (const i in files) {
        const s3KeyFull = path.join(baseS3SnapshotFolder, snapshotS3Key, path.basename(files[i]));
        await this.s3Loader.uploadFile(files[i], s3KeyFull, getType(files[i]));
        // eslint-disable-next-line no-console
        console.log(
          `Upload snapshot success: ${files[i]} to S3: https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${s3KeyFull}`,
        );
      }
    } catch (err) {
      throw new Error(`Error when upload snapshots to S3: ${err}`);
    }
  }

  /**
   * Verify screenshot.
   * If not pass selector, this function will take a fullscreen shot
   * @param page
   * @param selector
   * @param snapshotName
   * @param screenshotOptions
   * @param snapshotOptions
   * @param needClosePage
   */
  public async verify({
    page,
    selector,
    snapshotName,
    screenshotOptions,
    snapshotOptions = { maxDiffPixelRatio: 0.005 },
    sizeCheck = false,
  }: Screenshot) {
    let sizeWindow: { width: number; height: number };
    const screenshotDir = process.env.ENV == "local" ? "local-snapshot" : "";
    if (selector) {
      const locator = typeof selector === "string" ? page.locator(selector) : selector;
      if (sizeCheck) {
        const sizeElement: { width: number; height: number } = await locator.evaluate(async ele => {
          const box = ele.getBoundingClientRect();
          return { width: box.width, height: box.height };
        });

        sizeWindow = await page.evaluate(async () => {
          return new Promise(resolve => {
            resolve({
              width: window.screen.width,
              height: window.screen.height,
            });
          });
        });
        //Check size element để set viewport chụp ảnh
        const finalWidth = sizeElement.width > sizeWindow.width ? sizeElement.width + 200 : sizeWindow.width;
        const finalHeight = sizeElement.height > sizeWindow.height ? sizeElement.height + 200 : sizeWindow.height;
        if (finalWidth !== sizeWindow.width || finalHeight !== sizeWindow.height) {
          await page.setViewportSize({ height: Math.floor(finalHeight), width: Math.floor(finalWidth) });
        }
      }
      expect
        .soft(await locator.screenshot(screenshotOptions))
        .toMatchSnapshot([screenshotDir, snapshotName.replace(/_/g, "-")], snapshotOptions);
      if (sizeCheck) {
        await page.setViewportSize({ height: sizeWindow.height, width: sizeWindow.width });
      }
    } else {
      expect
        .soft(await page.screenshot(screenshotOptions))
        .toMatchSnapshot([screenshotDir, snapshotName.replace(/_/g, "-")], snapshotOptions);
    }
  }

  /**
   * Verify screenshot in an iframe
   * @param page
   * @param selector
   * @param iframe
   * @param snapshotName
   * @param screenshotOptions
   * @param snapshotOptions
   */
  public async verifyWithIframe({
    page,
    selector,
    iframe,
    snapshotName,
    screenshotOptions,
    snapshotOptions = { maxDiffPixelRatio: 0.05 },
  }: Screenshot) {
    const frame = iframe ? page.frameLocator(iframe) : page;
    const locator = typeof selector === "string" ? frame.locator(selector) : selector;
    const sizeElement: { width: number; height: number } = await locator.evaluate(async ele => {
      const box = ele.getBoundingClientRect();
      return new Promise(resolve => {
        resolve({
          width: box.width,
          height: box.height,
        });
      });
    });

    const sizeWindow: { width: number; height: number } = await page.evaluate(async () => {
      return new Promise(resolve => {
        resolve({
          width: window.screen.width,
          height: window.screen.height,
        });
      });
    });
    const finalWidth = sizeElement.width > sizeWindow.width ? sizeElement.width + 100 : sizeWindow.width;
    const finalHeight = sizeElement.height > sizeWindow.height ? sizeElement.height + 100 : sizeWindow.height;
    if (finalWidth !== sizeWindow.width || finalHeight !== sizeWindow.height) {
      await page.setViewportSize({ height: Math.round(finalHeight), width: Math.round(finalWidth) });
    }
    const screenshotDir = process.env.ENV == "local" ? "local-snapshot" : "";
    expect
      .soft(await locator.screenshot(screenshotOptions))
      .toMatchSnapshot([screenshotDir, snapshotName.replace(/_/g, "-")], snapshotOptions);
  }

  /**
   * Verify screenshot both within/without an iframe
   * @param page
   * @param selector: Nếu truyền locator trong iframe thì ko cần điền iframe nữa
   * @param iframe: Điền khi truyền selector dạng string
   * @param snapshotName: Tên ảnh (hàm ko support jpeg -> nên để đuôi .png)
   * @param combineOptions: Tổng hợp các options từ snapshot, screenshot ở hàm cũ
   * @param sizeCheck: Cover case chụp ảnh trong iframe (cả web builder) bị trắng ảnh mặc định = false
   */
  public async verifyWithAutoRetry({
    page,
    selector,
    iframe,
    snapshotName,
    combineOptions = {},
    sizeCheck = false,
  }: {
    page: Page;
    selector?: string | Locator;
    iframe?: string;
    snapshotName: string;
    combineOptions?: ToHaveScreenshotOptions;
    sizeCheck?: boolean;
  }) {
    const screenshotOptions = Object.assign({ maxDiffPixelRatio: 0.005 }, combineOptions);
    let timeout = 20_000;
    let intervals = [1_000, 2_000];

    if (combineOptions.expectToPass?.timeout) {
      timeout = combineOptions.expectToPass.timeout;
    }

    if (combineOptions.expectToPass?.intervals) {
      intervals = combineOptions.expectToPass.intervals;
    }

    if (combineOptions.hideElements) {
      await this.hideUnwantedElements(combineOptions.hideElements);
    }

    const screenshotDir = process.env.ENV == "local" ? "local-snapshot" : "";
    if (selector) {
      const frame = iframe ? page.frameLocator(iframe) : page;
      const locator = typeof selector === "string" ? frame.locator(selector) : selector;
      if (sizeCheck) {
        const sizeElement: { width: number; height: number } = await locator.evaluate(async ele => {
          const box = ele.getBoundingClientRect();
          return { width: box.width, height: box.height };
        });

        const browserViewport: { width: number; height: number } = await page.evaluate(async () => {
          return new Promise(resolve => {
            resolve({
              width: window.innerWidth || document.documentElement.clientWidth,
              height: window.innerHeight || document.documentElement.clientHeight,
            });
          });
        });
        //Check size element để set viewport chụp ảnh
        const finalWidth = sizeElement.width > browserViewport.width ? sizeElement.width + 100 : browserViewport.width;
        const finalHeight =
          sizeElement.height > browserViewport.height ? sizeElement.height + 100 : browserViewport.height;
        if (finalWidth !== browserViewport.width || finalHeight !== browserViewport.height) {
          await page.setViewportSize({ height: Math.floor(finalHeight), width: Math.floor(finalWidth) });
        }
        await expect
          .soft(async () => {
            await expect
              .soft(locator)
              .toHaveScreenshot([screenshotDir, snapshotName.replace(/_/g, "-")], screenshotOptions);
          })
          .toPass({ timeout: timeout, intervals: intervals });
        await page.setViewportSize({ height: browserViewport.height, width: browserViewport.width });
        if (combineOptions.hideElements) {
          this.showUnwantedElements(combineOptions.hideElements);
        }
        return;
      }
      await expect
        .soft(async () => {
          await expect
            .soft(locator)
            .toHaveScreenshot([screenshotDir, snapshotName.replace(/_/g, "-")], screenshotOptions);
        })
        .toPass({ timeout: timeout, intervals: intervals });
    } else {
      await expect
        .soft(async () => {
          await expect.soft(page).toHaveScreenshot([screenshotDir, snapshotName.replace(/_/g, "-")], screenshotOptions);
        })
        .toPass({ timeout: timeout, intervals: intervals });
    }
    //Revert lại style của elements sau khi chụp ảnh sau nếu hide
    if (combineOptions.hideElements) {
      this.showUnwantedElements(combineOptions.hideElements);
    }
  }

  /**
   * Hide unwanted, overlap elements before taking screenshots
   * @param elements
   */
  private async hideUnwantedElements(elements: Locator[]): Promise<void> {
    for (const element of elements) {
      await element.evaluate(ele => {
        ele.style.display = "none";
        return Promise.resolve();
      });
    }
  }

  private async showUnwantedElements(elements: Locator[]): Promise<void> {
    for (const element of elements) {
      await element.evaluate(ele => {
        ele.style.display = "block";
        return Promise.resolve();
      });
    }
  }
}
