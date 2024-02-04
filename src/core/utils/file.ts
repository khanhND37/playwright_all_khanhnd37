/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const types = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  jpe: "image/jpeg",
};

/**
 * Returns directory (not file) that contains the files with extension.
 * @param base base dir
 * @param ext extension
 * @param files file list
 * @param result result list
 * @returns directory list
 */
export function recFindByExt(base, ext, files = undefined, result = undefined) {
  files = files || fs.readdirSync(base);
  result = result || {};

  files.forEach(function (file) {
    const newbase = path.join(base, file);
    if (fs.statSync(newbase).isDirectory()) {
      result = recFindByExt(newbase, ext, fs.readdirSync(newbase), result);
    } else {
      if (file.substr(-1 * (ext.length + 1)) == "." + ext) {
        result[base] = true;
      }
    }
  });
  return result;
}

export function uploadFile(awsID, awsSecret, bucketName, filePath, fileName) {
  const fs = require("fs");
  const AWS = require("aws-sdk");

  // Read content from the file
  const fileContent = fs.readFileSync(filePath);

  const s3 = new AWS.S3({
    accessKeyId: awsID,
    secretAccessKey: awsSecret,
  });

  // Setting up S3 upload parameters
  const params = {
    Bucket: bucketName,
    Key: fileName, // File name you want to save as in S3
    Body: fileContent,
  };
  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    // eslint-disable-next-line no-console
    console.log(`File uploaded successfully. ${data.Location}`);
  });
}

/**
 * This function checks if a folder exists and contains at least one file.
 * @param {string} path - a string representing the path of the folder to be checked for the existence
 * of files.
 * @returns a boolean value indicating whether the specified path exists, is a directory, and contains
 * at least one file. If any of these conditions are not met, the function returns false.
 */
export function checkFolderWithFileExists(path: string): boolean {
  try {
    // check folder exist
    if (!fs.existsSync(path)) {
      return false;
    }

    // check dir is a folder
    if (!fs.lstatSync(path).isDirectory()) {
      return false;
    }

    // check folder has at least 1 file
    return fs.readdirSync(path, { withFileTypes: true }).filter(f => f.isFile()).length > 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error when check folder with file exists, PATH: ${path}, ERROR: ${error}`);
    return false;
  }
}

/**
 * This function takes a directory path as input and returns an array of file paths within that
 * directory.
 * @param {string} directoryPath - A string representing the path of the directory for which we want to
 * get all the files.
 * @returns The function `getAllFiles` returns an array of strings, which are the file paths of all the
 * files in the directory specified by the `directoryPath` parameter.
 */
export function getAllFiles(directoryPath: string): string[] {
  // check folder exist
  if (!fs.existsSync(directoryPath)) {
    throw new Error("Folder is not exist");
  }

  // check dir is a folder
  if (!fs.lstatSync(directoryPath).isDirectory()) {
    throw new Error("Not a folder");
  }

  // get all files
  const files = fs.readdirSync(directoryPath);

  const filePaths: string[] = [];

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);

    if (fs.lstatSync(filePath).isFile()) {
      filePaths.push(filePath);
    }
  });

  return filePaths;
}

/**
 * This function creates a directory if it does not already exist.
 * @param {string} directoryPath - The directoryPath parameter is a string that represents the path of
 * the directory that needs to be created if it does not already exist.
 */
export function createDirectoryIfNotExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
    } catch (err) {
      throw new Error(`Error when create folder, folder_path: ${directoryPath}, error: ${err}`);
    }
  }
}

/**
 * Lookup a mime type based on extension
 * @param path
 * @returns
 */
export function getType(path: string): string {
  path = String(path);
  const last = path.replace(/^.*[/\\]/, "").toLowerCase();
  const ext = last.replace(/^.*\./, "").toLowerCase();

  const hasPath = last.length < path.length;
  const hasDot = ext.length < last.length - 1;

  return ((hasDot || !hasPath) && types[ext]) || null;
}
