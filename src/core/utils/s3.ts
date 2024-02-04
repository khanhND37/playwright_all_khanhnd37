import AWS from "aws-sdk";
import fs from "fs";
import { Body } from "aws-sdk/clients/s3";
import path from "path";

export default class S3Uploader {
  private bucket: string;
  private region: string;
  private key: string;
  private secret: string;
  private s3: AWS.S3;

  constructor(bucket: string, region: string, key: string, secret: string) {
    this.bucket = bucket;
    this.key = key;
    this.secret = secret;
    this.region = region;
    AWS.config.update({
      accessKeyId: this.key,
      secretAccessKey: this.secret,
      region: this.region,
    });
    this.s3 = new AWS.S3();
  }

  async uploadFile(filePath: string, s3FileKey: string, contentType?: string) {
    const s3 = this.s3;
    const bucket = this.bucket;
    await s3
      .putObject({
        Bucket: bucket,
        Body: fs.readFileSync(filePath),
        Key: s3FileKey,
        ACL: "public-read",
        ContentType: contentType ? contentType : "application/zip",
        StorageClass: "ONEZONE_IA",
      })
      .promise();
    return `https://${this.bucket}.s3.us-west-2.amazonaws.com/${s3FileKey}`;
  }

  /**
   * Upload file with immediate buffer to S3.
   * @param buffer
   * @param s3FileKey
   * @returns
   */
  async uploadWithBuffer(buffer: Buffer, s3FileKey: string) {
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Body: buffer,
        Key: s3FileKey,
        ACL: "public-read",
        ContentType: "application/zip",
        StorageClass: "ONEZONE_IA",
      })
      .promise();
    return `https://${this.bucket}.s3.us-west-2.amazonaws.com/${s3FileKey}`;
  }

  /**
   * Get a file from S3
   * @param key
   */
  getFile(key: string): Promise<{ key: string; content?: string }> {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };
      this.s3.getObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const content = data?.Body?.toString("utf-8");
          resolve({ key, content });
        }
      });
    });
  }

  getFileRaw(key: string): Promise<{ key: string; content?: Body }> {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };
      this.s3.getObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const content = data?.Body;
          resolve({ key, content });
        }
      });
    });
  }

  /**
   * This function downloads files from an S3 bucket and saves them to a specified destination path on
   * the local machine.
   * @param {string} sourceS3Folder - The name of the folder on S3 from which the files need to be
   * downloaded.
   * @param {string} destinationPath - The `destinationPath` parameter is a string that represents the
   * path where the downloaded files from S3 will be saved on the local machine.
   * An "No files found on S3 key" error will be thrown if no file exists in the directory "sourceS3Folder" on S3.
   */
  async downloadFilesFromS3(sourceS3Folder: string, destinationPath: string) {
    try {
      // get list objects
      const listObjectsParams = {
        Bucket: this.bucket,
        Prefix: sourceS3Folder,
      };
      const s3 = this.s3;
      const objects = await s3.listObjectsV2(listObjectsParams).promise();

      if (objects.Contents.length == 0) {
        throw new Error(`No files found on S3 key: ${sourceS3Folder}`);
      }

      await Promise.all(
        objects.Contents.map(async s3Object => {
          const fileName = s3Object.Key;
          const localFilePath = path.join(destinationPath, path.basename(fileName));

          const getObjectResponse = await s3
            .getObject({
              Bucket: this.bucket,
              Key: s3Object.Key,
            })
            .promise();

          // eslint-disable-next-line no-console
          console.log(
            `Download file success: ${localFilePath} from S3: https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileName}`,
          );

          return fs.writeFileSync(localFilePath, getObjectResponse.Body as Buffer);
        }),
      );
    } catch (error) {
      throw Error(`Error when download files from S3: ${error}`);
    }
  }
}
