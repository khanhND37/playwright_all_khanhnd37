/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Database, DatabaseType } from "@core/database";
import { DataTypes, Model, SyncOptions } from "sequelize";
import type {
  CronMode,
  THCaseData as TypeTHCaseData,
  THCaseJobs as TypeTHCaseJobs,
  THCaseType,
  THJob as TypeTHJob,
} from "@types";
import { addMinutes, getDate, getHours, getMinutes, getMonth } from "@utils/datetime";
import fetch from "node-fetch";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();
const helperDomain = process.env.HELPER_API_DOMAIN;
const helperBasicAuth = process.env.HELPER_API_BASIC_AUTH;

class THCase extends Model {}

export class THCaseData extends Model {
  id: number;
}

export class THCaseJobs extends Model {}

export class THJob extends Model {
  id: number;
}

export class TestHubManager extends Database {
  private readonly dbType: DatabaseType;

  constructor(type: DatabaseType) {
    super(type);
    this.dbType = type;
  }

  async init() {
    if (this.dbType !== "sqlite") {
      // Only support sqlite, MySQL move to call API
      return;
    }

    try {
      await this.authenticate();
    } catch (e) {
      throw new Error(e);
    }

    THCaseData.init(
      {
        id: { type: DataTypes.BIGINT(), primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.BIGINT() },
        case_code: { type: DataTypes.STRING(255), allowNull: false },
        data: { type: DataTypes.TEXT("long"), allowNull: false },
        env: { type: DataTypes.STRING(255), allowNull: false },
        branch: { type: DataTypes.STRING(255), allowNull: false },
      },
      {
        sequelize: this.dbConn,
        modelName: "th_casedata",
        freezeTableName: true,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
      },
    );

    THJob.init(
      {
        id: { type: DataTypes.BIGINT(), primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(300), allowNull: false },
        crontab: { type: DataTypes.STRING(100), allowNull: false },
        enabled: { type: DataTypes.BOOLEAN, allowNull: false },
        mode: { type: DataTypes.STRING(30), allowNull: false },
        env: { type: DataTypes.STRING(20), allowNull: false },
        branch: { type: DataTypes.STRING(255), allowNull: false },
        created_by_id: { type: DataTypes.BIGINT(), allowNull: true },
        created_by_slack_id: { type: DataTypes.STRING(50), allowNull: true },
        created_by_email: { type: DataTypes.STRING(100), allowNull: true },
      },
      {
        sequelize: this.dbConn,
        modelName: "th_job",
        freezeTableName: true,
        timestamps: true,
        createdAt: false,
        updatedAt: "updated_at",
        indexes: [
          {
            using: "BTREE",
            fields: ["created_by_id"],
          },
        ],
      },
    );

    // add FK to th_run_data table
    THCase.init(
      {
        id: { type: DataTypes.BIGINT(), primaryKey: true, autoIncrement: true },
        code: { type: DataTypes.STRING(255) },
        name: { type: DataTypes.STRING(255) },
        local_conf: { type: DataTypes.STRING(100000) },
        dev_conf: { type: DataTypes.STRING(100000) },
        stag_conf: { type: DataTypes.STRING(100000) },
        prodtest_conf: { type: DataTypes.STRING(100000) },
        prod_conf: { type: DataTypes.STRING(100000) },
        last_run_prod_id: { type: DataTypes.BIGINT() },
        last_run_prodtest_id: { type: DataTypes.BIGINT() },
        last_run_stag_id: { type: DataTypes.BIGINT() },
        last_run_dev_id: { type: DataTypes.BIGINT() },
        is_automated: { type: DataTypes.TINYINT },
        need_automation: { type: DataTypes.TINYINT },
      },
      {
        sequelize: this.dbConn,
        modelName: "th_case",
        freezeTableName: true,
        timestamps: false,
      },
    );

    THCaseJobs.init(
      {
        id: { type: DataTypes.BIGINT(), primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.BIGINT() },
        job_id: { type: DataTypes.BIGINT() },
      },
      {
        sequelize: this.dbConn,
        modelName: "th_case_jobs",
        freezeTableName: true,
        timestamps: false,
      },
    );

    if (this.dbType !== "sqlite") {
      // th_case_jobs fk
      THCaseJobs.belongsTo(THCase, {
        foreignKey: "case_id",
        targetKey: "id",
      });

      THCaseJobs.belongsTo(THJob, {
        foreignKey: "job_id",
        targetKey: "id",
      });

      // th_case_data fk
      THCaseData.belongsTo(THCase, {
        foreignKey: "case_id",
        targetKey: "id",
      });
    }

    /*
    https://stackoverflow.com/questions/21066755/how-does-sequelize-sync-work-specifically-the-force-option
    https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization
    */
    if (this.dbType === "sqlite") {
      const syncOptions: SyncOptions = {
        force: false,
      };
      // if (process.env.ENV !== "local") {
      //   syncOptions.alter = false;
      //   syncOptions.match = /^bgroup_docs$/;
      // }
      try {
        await this.dbConn.sync(syncOptions);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  }

  async findCaseIdByCode(code: string) {
    if (THCase.sequelize) {
      logger.info("Run into sequelize logic");
      try {
        const testCase = await THCase.findOne({ where: { code } });
        if (!testCase) {
          return null;
        }

        return testCase.getDataValue("id");
      } catch (e) {
        throw new Error(e);
      }
    } else {
      // Call API to get test case
      const res = await fetch(`https://${helperDomain}/api/case/find?code=${code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        logger.info(`[Scheduler] findCaseIdByCode result: ${JSON.stringify(result)}`);
        if (result.success) {
          return result.id;
        }
      }
    }
    return null;
  }

  // Only use this function when using sqlite, at local
  async insertCase(payload: THCaseType) {
    if (THCase.sequelize) {
      try {
        return await THCase.create(payload);
      } catch (e) {
        throw new Error(e);
      }
    }
    return null;
  }

  async findCaseData(caseId: string, branch: string, env: string): Promise<TypeTHCaseData> {
    if (THCaseData.sequelize) {
      try {
        const caseData = await THCaseData.findOne({ where: { case_id: caseId, branch: branch, env: env } });
        if (!caseData) {
          return null;
        }

        const returnModel = {
          id: caseData.getDataValue("id"),
          env: caseData.getDataValue("env"),
          case_code: caseData.getDataValue("case_code"),
          data: caseData.getDataValue("data"),
          branch: caseData.getDataValue("branch"),
        };

        return returnModel as TypeTHCaseData;
      } catch (e) {
        throw new Error(e);
      }
    } else {
      // Call API to get case data
      const res = await fetch(
        `https://${helperDomain}/api/casedata/find?case_id=${caseId}&branch=${branch}&env=${env}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${helperBasicAuth}`,
          },
        },
      );
      if (res.ok) {
        const result = (await res.json()) as any;
        logger.info(
          `[Scheduler] findCaseData (caseId: ${caseId}, branch: ${branch}, env: ${env}) - result: ${JSON.stringify(
            result,
          )}`,
        );
        if (result.success) {
          if (result.found) {
            return result.data;
          }

          return null;
        }
      }
    }

    return null;
  }

  async findJob(caseCode: string, branch: string, env: string): Promise<TypeTHJob> {
    const jobName = this.getJobName(caseCode);

    if (THJob.sequelize) {
      try {
        const job = await THJob.findOne({ where: { name: jobName, branch: branch, env: env } });
        if (!job) {
          logger.info(`Not found job w name (${jobName}), branch (${branch}), env (${env})`);
          return null;
        }

        const returnModel = {
          id: job.getDataValue("id"),
          name: job.getDataValue("name"),
          crontab: job.getDataValue("crontab"),
          enabled: job.getDataValue("enabled"),
          mode: job.getDataValue("mode"),
          env: job.getDataValue("env"),
          branch: job.getDataValue("branch"),
          created_by_id: job.getDataValue("created_by_id"),
          created_by_email: job.getDataValue("created_by_email"),
          created_by_slack_id: job.getDataValue("created_by_slack_id"),
        };

        return returnModel as TypeTHJob;
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/job/find?name=${jobName}&branch=${branch}&env=${env}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        logger.info(
          `[Scheduler] findJob (caseCode: ${caseCode}, branch: ${branch}, env: ${env}) - result: ${JSON.stringify(
            result,
          )}`,
        );
        if (result.success) {
          if (result.found) {
            return result.data;
          }

          return null;
        }
      }
    }

    return null;
  }

  async insertJob(payload: TypeTHJob) {
    if (THJob.sequelize) {
      try {
        const job = await THJob.create(payload);
        return job.getDataValue("id");
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/job/insert`, {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          crontab: payload.crontab,
          enabled: payload.enabled,
          mode: payload.mode,
          env: payload.env,
          created_by_id: payload.created_by_id,
          created_by_slack_id: payload.created_by_slack_id,
          created_by_email: payload.created_by_email,
          branch: payload.branch,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        logger.info(`[Scheduler] insertJob (payload: ${JSON.stringify(payload)}) - result: ${JSON.stringify(result)}`);
        if (result.success) {
          return result.data;
        }
      }
    }
    return null;
  }

  async updateJobCronTab(crontab: string, id: number) {
    if (THJob.sequelize) {
      try {
        return await THJob.update(
          {
            crontab: crontab,
          },
          {
            where: {
              id: id,
            },
            returning: true, // this will return the updated instance
          },
        );
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/job/update`, {
        method: "POST",
        body: JSON.stringify({
          id: id,
          crontab: crontab,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Update job crontab successfully");
          return true;
        }
      }
    }
    return null;
  }

  async insertCaseJobs(payload: TypeTHCaseJobs) {
    if (THCaseJobs.sequelize) {
      try {
        return await THCaseJobs.upsert(payload);
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/casejob/insert`, {
        method: "POST",
        body: JSON.stringify({
          case_id: payload.case_id,
          job_id: payload.job_id,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Insert case job successfully");
          return true;
        }
      }
    }
    return null;
  }

  async insertCaseData(payload: TypeTHCaseData) {
    if (THCaseData.sequelize) {
      try {
        const caseData = await THCaseData.create(payload);
        return caseData.getDataValue("id");
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/casedata/insert`, {
        method: "POST",
        body: JSON.stringify({
          case_id: payload.case_id,
          case_code: payload.case_code,
          data: payload.data,
          env: payload.env,
          branch: payload.branch,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Insert case data successfully");
          return result.data;
        }
      }
    }
    return null;
  }

  async updateCaseData(payload: TypeTHCaseData) {
    if (THCaseData.sequelize) {
      try {
        return await THCaseData.update(
          {
            data: payload.data,
          },
          {
            where: {
              id: payload.id,
            },
            returning: true, // this will return the updated instance
          },
        );
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/casedata/update`, {
        method: "POST",
        body: JSON.stringify({
          id: payload.id,
          data: payload.data,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        logger.info(
          `[Scheduler] updateCaseData (payload: ${JSON.stringify(payload)}) - result: ${JSON.stringify(result)}`,
        );
        if (result.success) {
          return true;
        }
      }
    }
    return false;
  }

  async removeCaseData(caseId: string, branch: string, env: string): Promise<boolean> {
    if (THCaseData.sequelize) {
      try {
        const deleteCount = await THCaseData.destroy({ where: { case_id: caseId, branch: branch, env: env } });
        return !!deleteCount;
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/casedata/remove`, {
        method: "POST",
        body: JSON.stringify({
          case_id: caseId,
          branch: branch,
          env: env,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Remove case data successfully");
          return true;
        }
      }
    }
    return false;
  }

  async removeCaseJobs({ case_id, job_id }: { case_id: number; job_id: number }): Promise<boolean> {
    if (THCaseJobs.sequelize) {
      try {
        const deleteCount = await THCaseJobs.destroy({ where: { case_id, job_id } });
        return !!deleteCount;
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/casejob/remove`, {
        method: "POST",
        body: JSON.stringify({
          case_id: case_id,
          job_id: job_id,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Remove case job successfully");
          return true;
        }
      }
    }
    return false;
  }

  async removeJob(id: number): Promise<boolean> {
    if (THJob.sequelize) {
      try {
        const deleteCount = await THJob.destroy({ where: { id } });
        return !!deleteCount;
      } catch (e) {
        throw new Error(e);
      }
    } else {
      const res = await fetch(`https://${helperDomain}/api/job/remove`, {
        method: "POST",
        body: JSON.stringify({
          id: id,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Remove job successfully");
          return true;
        }
      }
    }
    return false;
  }

  getJobName(caseCode: string): string {
    return `scheduled_job_${caseCode}`;
  }

  getDatabaseType(): string {
    return this.dbType;
  }

  async updateCaseAutomated(env: string) {
    if (THJob.sequelize) {
      // Not run in local
      return;
    } else {
      const res = await fetch(`https://${helperDomain}/api/case/update-automated`, {
        method: "POST",
        body: JSON.stringify({
          env: env,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${helperBasicAuth}`,
        },
      });
      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.success) {
          logger.info("Update case automated successfully");
          return true;
        }
      }
    }
    return null;
  }
}

export function generateCrontab({ minutes, mode = "every" }: { minutes: number; mode: CronMode }): string {
  if (mode === "later") {
    const time = addMinutes(minutes);
    return `${getMinutes(time)} ${getHours(time)} ${getDate(time)} ${getMonth(time) + 1} *`;
  }

  return `*/${minutes} * * * *`;
}
