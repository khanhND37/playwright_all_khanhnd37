/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/ban-types */
import { THCase } from "@core/utils/report";
import { Op } from "sequelize";

import path from "path";
import fs from "fs";
import type { Config } from "@types";
import merge from "lodash.merge";

export class ConfigImpl {
  fileName: string;
  caseName: string;
  directory: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiteConf: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caseConf: Record<string, any>;
  loaded: boolean;
  constructor(directory: string, caseName: string) {
    let dirName = directory;
    if (path.extname(directory) === ".ts") {
      dirName = path.dirname(directory);
      this.fileName = path.basename(directory, ".spec.ts") || "";
    }

    this.directory = dirName;
    this.caseName = caseName;
    this.loaded = false;
  }

  /**
   * Load config from file or sql
   * @returns
   */
  loadConfig() {
    if (process.env.PREFERRED_STORAGE === "file") {
      return this.loadConfigFromFile();
    } else if (process.env.PREFERRED_STORAGE === "remote") {
      return this.loadTHConfigFromRemote();
    } else {
      throw new Error(
        "Cannot load config due to wrong environment variable PREFERRED_STORAGE. Please check the .env file",
      );
    }
  }

  private setConfig(file) {
    const originalConf = require(path.join(this.directory, file));
    const config = { ...originalConf };
    const newCases = config["cases"];
    delete config["cases"];
    this.suiteConf = merge(this.suiteConf, config);
    if (newCases !== undefined) {
      this.suiteConf["cases"] = merge(this.suiteConf["cases"], newCases);
    }
  }

  loadConfigFromFile() {
    // 1. list all .json files
    // 2. load all to config object
    const files = fs.readdirSync(this.directory);
    let isSetConfig = false;

    if (this.fileName) {
      const file = files.find(file => {
        const extension = path.extname(file);
        const isJsonFile = extension === ".json";
        const fileName = path.basename(file, extension);
        return fileName === this.fileName && isJsonFile;
      });

      if (file) {
        this.setConfig(file);
        isSetConfig = true;
      }
    }

    if (!isSetConfig) {
      files
        .filter(file => path.extname(file) === ".json")
        .forEach(file => {
          this.setConfig(file);
        });
    }

    if (
      this.caseName !== undefined &&
      this.caseName !== "" &&
      this.suiteConf &&
      this.suiteConf["cases"] !== undefined
    ) {
      this.caseConf = this.suiteConf["cases"][this.caseName] || {};
    } else {
      throw new Error("Cannot find config for the test case " + this.caseName);
    }
    this.caseConf = this.caseConf || {};

    const envs = this.suiteConf["env"];
    delete this.suiteConf["env"];

    const env = process.env.ENV;

    const tmpEnv = envs && envs[env] ? JSON.parse(JSON.stringify(envs[env])) : undefined;
    const envCases = tmpEnv ? tmpEnv["cases"] : undefined;

    if (tmpEnv) {
      if (!tmpEnv.is_merge_case_data) {
        delete tmpEnv["cases"];
      }
      //overwrite
      this.suiteConf = merge(this.suiteConf, tmpEnv);
      if (envCases && envCases[this.caseName]) {
        this.caseConf = merge(this.caseConf, envCases[this.caseName]);
      }
    }

    this.loaded = true;
  }

  private loadTHConfigFromRemote() {
    if (!this.caseName || this.caseName === "") {
      throw new Error("empty case name");
    }
    const caseInfo = THCase.findOne({
      where: {
        [Op.or]: [
          {
            code: this.caseName,
          },
          {
            code: this.caseName.replace("TC_", ""),
          },
        ],
      },
    });

    if (!caseInfo || !caseInfo[`${process.env.ENV}_conf`]) {
      throw new Error(`Cannot find config for the test case ${this.caseName} - ${process.env.ENV}_conf`);
    }
    const conf = JSON.parse(caseInfo[`${process.env.ENV}_conf`]);
    this.caseConf = {};
    if (conf["cases"]) {
      this.caseConf = conf["cases"][this.caseName] || {};
    }
    this.suiteConf = conf;
    this.loaded = true;
  }
}

/**
 *
 */
export class DataLoader {
  static instance: DataLoader;
  constructor() {
    if (DataLoader.instance === null) {
      DataLoader.instance = new DataLoader();
    }
  }
  public static get() {
    if (DataLoader.instance === null) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }
}

/**
 * We must convert loadData function to synchronous function.
 * Because in test.describe, we can't do async (https://github.com/microsoft/playwright/issues/9636)
 * @param directory
 * @param caseName
 * @returns { Config }
 */
export function loadData(directory: string, caseName: string): Config {
  const conf = new ConfigImpl(directory, caseName);
  conf.loadConfigFromFile();
  const expired = new Date(new Date().getTime() + 60 * 1000).getTime();
  while (!conf.loaded) {
    require("deasync").sleep(100);
    const now = new Date();
    if (now.getTime() >= expired) {
      throw new Error("Cannot get config due to timeout");
    }
  }

  // TODO: hotfix to run scheduler
  if (!conf.caseConf) {
    conf.caseConf = { data: [] };
  }

  if (!conf.caseConf.data) {
    conf.caseConf.data = [];
  }

  return conf;
}
