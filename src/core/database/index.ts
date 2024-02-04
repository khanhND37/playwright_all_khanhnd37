import { Sequelize } from "sequelize";

export type DatabaseType = "mysql" | "sqlite";

export class Database {
  private readonly databaseType: string;
  protected readonly dbConn: Sequelize;

  constructor(databaseType: DatabaseType) {
    if (this.constructor === Database) {
      throw new Error("Must extend Database class for usage");
    }

    let uri;

    switch (databaseType) {
      case "mysql": {
        if (!process.env.TESTHUB_SQL_CONN.length) {
          throw new Error("Empty MySQL configuration");
        }
        uri = process.env.TESTHUB_SQL_CONN;
        break;
      }
      case "sqlite": {
        if (!process.env.TESTHUB_SQLITE_CONN.length) {
          throw new Error("Empty SQLite configuration");
        }
        uri = process.env.TESTHUB_SQLITE_CONN;
        break;
      }
      default:
        throw new Error("Database type not yet supported");
    }
    this.databaseType = databaseType;

    this.dbConn = new Sequelize(uri, {
      logging: String(process.env.TESTHUB_CONN_DEBUG) === "true",
    });
  }

  protected async authenticate() {
    try {
      await this.dbConn.authenticate();
      // eslint-disable-next-line no-console
      console.log(`Connected to ${this.databaseType}`);
    } catch (e) {
      throw new Error(`Can't connect to ${this.databaseType}: ${e}`);
    }
  }

  protected async getConnection() {
    return this.dbConn;
  }

  protected async closeConnection() {
    await this.dbConn.close();
  }
}
