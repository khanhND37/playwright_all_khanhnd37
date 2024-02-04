/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */
import { DataTypes, Model, Sequelize } from "sequelize";
import type { EnvConfig, RunGroupResult, RunResult } from "@types";
import { OcgLogger } from "@core/logger";

export class THRunGroup extends Model {}
export class THRun extends Model {}
export class THCase extends Model {}
export class AuthUser extends Model {}
export class ThTeam extends Model {}

if (process.env.REPORTING_TYPE === "testhub") {
  // initDBConn();
}

export function initDBConn() {
  const dbConn = new Sequelize(process.env.TESTHUB_SQL_CONN);
  try {
    dbConn.authenticate();
  } catch (error) {
    throw new Error("Unable to connect to the database");
  }
  THCase.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(255) },
      name: { type: DataTypes.STRING(255) },
      local_conf: { type: DataTypes.STRING(100000) },
      dev_conf: { type: DataTypes.STRING(100000) },
      stag_conf: { type: DataTypes.STRING(100000) },
      prodtest_conf: { type: DataTypes.STRING(100000) },
      prod_conf: { type: DataTypes.STRING(100000) },
      last_run_prod_id: { type: DataTypes.BIGINT },
      last_run_success_prod_id: { type: DataTypes.BIGINT },
      last_run_prodtest_id: { type: DataTypes.BIGINT },
      last_run_success_prodtest_id: { type: DataTypes.BIGINT },
      last_run_stag_id: { type: DataTypes.BIGINT },
      last_run_dev_id: { type: DataTypes.BIGINT },
      last_run_success_dev_id: { type: DataTypes.BIGINT },
      is_automated: { type: DataTypes.TINYINT },
      is_automated_dev: { type: DataTypes.TINYINT },
      is_automated_prodtest: { type: DataTypes.TINYINT },
      is_automated_prod: { type: DataTypes.TINYINT },
      need_automation: { type: DataTypes.TINYINT },
    },
    /*`id`,`type`,`env`,`report_url`,`case_id`,`started_at`*/
    {
      sequelize: dbConn,
      modelName: "th_case",
      freezeTableName: true,
      timestamps: false,
    },
  );
  THRun.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING(255) },
      env: { type: DataTypes.STRING(255) },
      report_url: { type: DataTypes.STRING(255) },
      case_id: { type: DataTypes.INTEGER },
      run_group_id: { type: DataTypes.INTEGER },
      started_at: { type: DataTypes.DATE },
      finished_at: { type: DataTypes.DATE },
      result: { type: DataTypes.STRING(20) },
      test_result: { type: DataTypes.STRING(1000000) },
      run_url: { type: DataTypes.STRING(2000) },
    },
    /*`id`,`type`,`env`,`report_url`,`case_id`,`started_at`*/
    {
      sequelize: dbConn,
      modelName: "th_run",
      freezeTableName: true,
      timestamps: false,
    },
  );
  THRunGroup.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      env: { type: DataTypes.STRING(255) },
      name: { type: DataTypes.STRING(255) },
      result: { type: DataTypes.STRING(255) },
      started_at: { type: DataTypes.DATE },
      finished_at: { type: DataTypes.DATE },
    },
    {
      sequelize: dbConn,
      modelName: "th_rungroup",
      freezeTableName: true,
      timestamps: false,
    },
  );
  AuthUser.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      team_id: { type: DataTypes.INTEGER },
      email: { type: DataTypes.STRING },
    },
    {
      sequelize: dbConn,
      modelName: "auth_user",
      freezeTableName: true,
      timestamps: false,
    },
  );
  ThTeam.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      slack_hook: { type: DataTypes.STRING },
    },
    {
      sequelize: dbConn,
      modelName: "th_team",
      freezeTableName: true,
      timestamps: false,
    },
  );
}

export const addConf = async ({ codeName, env, data }: EnvConfig): Promise<void> => {
  if (THCase.sequelize) {
    // query code name to get case
    const caseInfo = await THCase.findOne({
      where: { code: codeName },
    });

    if (caseInfo === null || caseInfo === undefined) {
      throw new Error(`Cannot find config for the test case ${codeName}`);
    }

    await THCase.update(
      {
        [`${env}_conf`]: data,
      },
      {
        where: {
          id: caseInfo["id"],
        },
      },
    );
  }
};

export const addRunGroup = async ({
  name,
  env,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reportUrl,
  startAt,
  finishedAt,
  result,
}: RunGroupResult): Promise<number> => {
  if (THRunGroup.sequelize) {
    const thg = await THRunGroup.create({
      name: name,
      env: env,
      started_at: startAt.getTime(),
      finished_at: finishedAt.getTime(),
      result: result,
    });
    //TODO update run group report url
    return thg["id"];
  }

  return -1;
};

export const addRunResult = async ({
  codeName,
  type,
  env,
  reportUrl,
  startAt,
  finishedAt,
  result,
  runGroupId,
  testResult,
  buildUrl,
}: RunResult): Promise<{ success: boolean; thId: number }> => {
  let id = 0;
  if (THRun.sequelize && THCase.sequelize) {
    // query code name to get case
    const caseInfo = await THCase.findOne({
      where: { code: codeName },
    });

    if (caseInfo === null || caseInfo === undefined) {
      throw new Error("Cannot find config for the test case");
    }

    const runInfo = await THRun.create({
      run_group_id: runGroupId,
      type: type,
      env: env,
      report_url: reportUrl,
      case_id: caseInfo["id"],
      started_at: startAt.getTime(),
      finished_at: finishedAt.getTime(),
      result: result,
      test_result: testResult,
      run_url: buildUrl,
    });

    await THRun.update(
      {
        report_url: `${reportUrl}/show?run_id=${runInfo["id"]}`,
      },
      { where: { id: runInfo["id"] } },
    );

    if (runInfo === null || runInfo === undefined) {
      throw new Error("Cannot find config for the test run");
    }
    id = caseInfo["id"];
    const objUpdate = {
      [`last_run_${env}_id`]: runInfo["id"],
    };

    if (result === "pass") {
      objUpdate["is_automated"] = true;
      objUpdate["need_automation"] = true;
      objUpdate[`last_run_success_${env}_id`] = runInfo["id"];
      objUpdate[`is_automated_${env}`] = true;
    } else if (result === "fail") {
      objUpdate[`is_automated_${env}`] = false;
    }

    await THCase.update(objUpdate, {
      where: {
        id: caseInfo["id"],
      },
    });
  }

  return {
    success: true,
    thId: id,
  };
};

export const getSlackHookUrl = async (email: string): Promise<string> => {
  const logger = OcgLogger.get();

  if (ThTeam.sequelize && AuthUser.sequelize) {
    // query to get user team
    const userInfo = await AuthUser.findOne({
      where: {
        email: email,
      },
    });

    if (!userInfo) {
      logger.info(`Can't get info of user with email ${email}`);
      return "";
    }

    const teamInfo = await ThTeam.findOne({
      where: {
        id: userInfo["team_id"],
      },
    });

    if (!teamInfo) {
      logger.info(`Can't get info of team with id ${userInfo["team_id"]}`);
      return "";
    }

    return teamInfo["slack_hook"];
  }

  return "";
};
