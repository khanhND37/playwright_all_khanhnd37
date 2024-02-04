import fs from "fs";
import crypto from "crypto";
import * as csv from "csv-parse";
import { Options } from "csv-parse";
import S3Uploader from "@utils/s3";

const s3Instance = new S3Uploader(
  process.env.AWS_BUCKET,
  process.env.AWS_REGION,
  process.env.AWS_KEY_ID,
  process.env.AWS_SECRET,
);

/**
 * Get hash of file to compare with the hash in the file
 * @param filePath is the path of the file
 * @param algo is the algorithm to use
 */
export async function getHashOfFile(filePath: string, algo = "sha256"): Promise<string> {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const hashSum = crypto.createHash(algo);
  hashSum.update(fileContent);
  return hashSum.digest("hex");
}

/**
 * need delete file csv to avoid file garbage in project
 * @param filePath
 */
export async function deleteFile(filePath: string): Promise<void> {
  fs.unlinkSync(filePath);
}

/**
 * Read file CSV by file path
 * @param filePath is the path of the file
 * @param delimiter
 * @param line
 */
export async function readFileCSV(filePath: string, delimiter = ",", line = 2): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const data: string[][] = [];
    const options: Options = {
      delimiter: delimiter,
      skipEmptyLines: true,
      fromLine: line,
    };
    fs.createReadStream(filePath)
      .pipe(csv.parse(options))
      .on("data", function (row) {
        data.push(row);
      })
      .on("end", function () {
        resolve(data);
      })
      .on("error", function (error) {
        return reject(error);
      });
  });
}

/**
 * Convert CSV file to Base64
 * @param filePath is the path of the file
 * @returns base64 data
 */
export async function csvToBase64(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, "base64");
}

/**
 * Function convert CSV file to JSON for easily updating data
 * @param filePath: path link to file csv, for example: ./asset/<folder_name>/<file_name>.csv
 * @param delimiter: the letter between 2 field data
 */
export async function csvToJson(filePath: string, delimiter = ","): Promise<Array<object>> {
  //Read CSV content
  const arrCSV = await readFileCSV(filePath, delimiter, 1);

  const superArr: Array<object> = [];
  for (let i = 1; i < arrCSV.length; i++) {
    //Get key from header CSV
    const header = arrCSV[0];

    const bodey = arrCSV[i];
    const obj = Object.create({});
    //Loop CSV content to get value for each line
    header.forEach((val, idx) => {
      obj[val] = bodey[idx];
    });
    superArr.push(obj);
  }
  return superArr;
}

/**
 * Function convert JSON to CSV for importing file into product
 * @param jsonCSV: data JSON which need to convert to CSV
 * @param ts: timestamp
 * @param path: path to save file
 * @param override: is override file
 */
export async function jsonToCsv(jsonCSV: Array<object>, ts: string, path?: string, override?: boolean) {
  //Convert JSON to Array<string>
  const arrCSV = [];
  const keys = Object.keys(jsonCSV[0]);
  const header = keys.join(",");
  arrCSV.push(header);

  let values;
  for (let i = 0; i < jsonCSV.length; i++) {
    values = Object.values(jsonCSV[i]);
    let str = "";
    for (let j = 0; j < values.length; j++) {
      str = values.join(",");
    }
    arrCSV.push(str);
  }

  //Append Array<string> to CSV file
  const fileName = path || `./assets/export_feed/export_feed_update_file_${ts}.csv`;
  for (const [index, data] of arrCSV.entries()) {
    const line = index === arrCSV.length - 1 ? data : data + "\n";
    if (override && index === 0) {
      fs.writeFileSync(fileName, line, { flag: "w" });
      continue;
    }
    fs.writeFileSync(fileName, line, { flag: "a" });
  }
  await new Promise(t => setTimeout(t, 6000));
}

/**
 * Read file CSV by file path
 * @param filePath is the path of the file
 * @param delimiter
 * @param line is line which it is started read
 * @deprecated: use function readFileCSV in src/helper/file.ts instead
 * @returns
 */

export async function readDownloadFileCSV(filePath: string, delimiter = ",", line: number): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const data: string[][] = [];
    const options: Options = {
      relax_quotes: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      fromLine: line,
    };
    fs.createReadStream(filePath)
      .pipe(csv.parse(options))
      .on("data", function (row) {
        data.push(row);
      })
      .on("end", function () {
        resolve(data);
      })
      .on("error", function (error) {
        return reject(error);
      });
  });
}

/**
 * Prepare large file from s3 before run. Download file to localFilePath if file not exist
 * @param s3Path
 * @param localFilePath
 * */
export async function prepareFile(s3Path: string, localFilePath: string) {
  // eslint-disable-next-line no-console
  console.log(`Local file path: ${localFilePath}`);
  if (!localFilePath) {
    return;
  }
  if (fs.existsSync(localFilePath)) {
    // eslint-disable-next-line no-console
    console.log("Prepare file - Local file already exist");
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Prepare file - start download file from s3: ${s3Path}`);

  const fileData = await s3Instance.getFileRaw(s3Path);
  // eslint-disable-next-line no-console
  console.log(`Downloaded success: `, fileData);
  if (fileData.key) {
    fs.writeFileSync(localFilePath, fileData.content as string);
  }
}

/**
 * Get data of column from CSV file
 * @return data of column
 * */
export function getDataColumnFileCsv(csvFile: Array<Array<string>>, column: number): Array<string> {
  const dataColumn = csvFile
    .filter(data => data[column] !== "")
    .map(data => data[column].split(","))
    .flat();
  return dataColumn;
}
