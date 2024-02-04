/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * 1. find all .json file
 * 2. parse json from each folder (not files)
 * 3. push to config on testhub
 */
import { OcgLogger } from "@core/logger";
import { initDBConn, addConf } from "@utils/report";
import { recFindByExt } from "@utils/file";
import S3Uploader from "@utils/s3";
import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";
import merge from "lodash.merge";

require("dotenv").config();
const { Command } = require("commander");
const program = new Command();

const logger = OcgLogger.get();

/**
 * Sync test configuration to server (testhub)
 * @param directory directory contains .json file(s) to sync
 * @param caseSyncs case code names to sync
 */
async function syncToRemote(directory: string, caseSyncs: string) {
  await initDBConn();
  try {
    let suiteConf = {};
    const files = fs.readdirSync(directory);
    files
      .filter(file => path.extname(file) === ".json")
      .forEach(file => {
        const originalConf = require(path.join(directory, file));
        const config = { ...originalConf };
        const newCases = config["cases"];
        delete config["cases"];
        if (newCases) {
          suiteConf["cases"] = merge(suiteConf["cases"], newCases);
        }

        const newEnvs = config["env"];
        delete config["env"];
        if (newEnvs) {
          suiteConf["env"] = merge(suiteConf["env"], newEnvs);
        }
        suiteConf = merge(suiteConf, config);
      });
    const caseConfs = suiteConf["cases"];
    delete suiteConf["cases"];

    const envs = suiteConf["env"];
    delete suiteConf["env"];

    let count = 0;

    if (caseSyncs) {
      const caseList = caseSyncs.split(",").map(item => item.trim());
      for (const caseSync of caseList) {
        let caseConfName;
        let insertingConf;

        caseConfName = Object.keys(caseConfs).find(key => key === caseSync);
        let isDataDriven = false;
        let parentCase = "";
        if (!caseConfName) {
          for (const caseName in caseConfs) {
            const caseConf = caseConfs[caseName].data;
            if (caseConf && Array.isArray(caseConf)) {
              const index = caseConf.findIndex(item => item.case_id === caseSync);
              if (index !== -1) {
                caseConfName = caseName;
                isDataDriven = true;
                parentCase = caseName;
                break;
              }
            }
          }
        }

        if (caseConfName) {
          for (const env of SUPPORTED_ENVS) {
            insertingConf = JSON.parse(JSON.stringify(suiteConf));
            insertingConf["cases"] = {};
            let case2Get = caseConfName;
            if (isDataDriven) {
              case2Get = parentCase;
            }
            insertingConf["cases"][case2Get] = JSON.parse(JSON.stringify(caseConfs[caseConfName]));
            const tmpEnv = envs && envs[env] ? JSON.parse(JSON.stringify(envs[env])) : undefined;
            const envCases = tmpEnv ? tmpEnv["cases"] : undefined;

            if (tmpEnv) {
              delete tmpEnv["cases"];
              insertingConf = merge(insertingConf, tmpEnv);
              if (envCases && envCases[case2Get]) {
                insertingConf["cases"][case2Get] = merge(insertingConf["cases"][case2Get], envCases[case2Get]);
              }
            }

            // insert
            try {
              await addConf({
                codeName: caseSync,
                env: env,
                data: JSON.stringify(insertingConf),
              });
              count++;
              logger.info(`data - ${env} - ${JSON.stringify(insertingConf)}`);
            } catch (err) {
              logger.error(`cannot find case name ${caseSync}`);
            }
          }
        } else {
          logger.info(`Cannot get conf case name ${caseSync}`);
        }
      }
    }
    if (count > 0) {
      logger.info(`There are ${count} updates for ${directory}`);
    }
  } catch (e) {
    logger.error(`Cannot get config or sync to remote ${e}`);
  }
}

const isWindows = os.platform() === "win32";
const slash = (p: string): string => {
  return p.replace(/\\/g, "/");
};
const normalizePath = (id: string): string => {
  return path.posix.normalize(isWindows ? slash(id) : id);
};
const uploadToS3 = async (options: { path: string }) => {
  if (options.path) {
    const resolvePath = normalizePath(options.path);
    if (!fs.existsSync(resolvePath)) {
      throw new Error("Path not exists");
    }

    const ext = path.extname(resolvePath);
    if (!ext) {
      throw new Error("File not exists");
    }

    const name = path.basename(resolvePath, ext);
    const s3Uploader = new S3Uploader(
      process.env.AWS_BUCKET,
      process.env.AWS_REGION,
      process.env.AWS_KEY_ID,
      process.env.AWS_SECRET,
    );
    const s3FilePath = `files/${name}${ext}`;
    await s3Uploader.uploadFile(resolvePath, s3FilePath);
    logger.info(
      chalk.green("Upload file success. Link: ", `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${s3FilePath}`),
    );
    return;
  }

  throw new Error("Missing param --path");
};

const SUPPORTED_ENVS = ["local", "dev", "stag", "prodtest", "prod"];

program.name("autopilot").description("CLI to some JavaScript string utilities").version("0.8.0");

program
  .command("sync-conf")
  .description("Sync config to database")
  .option("-c --caseName <string>", "Case name needed to be synced. Empty means to sync all")
  .option("-d --testDir <string>", "Test directory. Eg: ./examples or ./tests", "examples")
  .option("-e --confExt <string>", "Config extension. Eg: json", "json")
  .action(options => {
    logger.info(`Running with the following options: ${JSON.stringify(options)}`);
    const caseName = options.caseName ? options.caseName : undefined;
    const folders = recFindByExt(`${process.cwd()}/${options.testDir || "examples"}`, options.confExt || "json");

    for (const folder in folders) {
      (async () => {
        await syncToRemote(folder, caseName);
      })();
    }
  });

program
  .command("upload-to-s3")
  .description("Upload file local to S3")
  .option("-p --path <string>", "File path. Eg: /home/jambon/Downloads/file.csv")
  .action(async options => {
    try {
      await uploadToS3(options);
    } catch (e) {
      logger.error("Error: ", e);
      process.exit(1);
    }
  });

program.parse();
