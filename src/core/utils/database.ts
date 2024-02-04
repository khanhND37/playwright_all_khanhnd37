import { Sequelize } from "sequelize";

export class MysqlConnectionHelper {
  dbConn;

  constructor() {
    let dbConn;
    if (process.env.TOKEN_SQL_CONN.length > 0) {
      dbConn = new Sequelize(process.env.TOKEN_SQL_CONN);
      try {
        dbConn.authenticate();
      } catch (error) {
        throw new Error("Unable to connect to the database");
      }
    } else {
      throw new Error("Empty sql configuration");
    }
    this.dbConn = dbConn;
  }

  getConnection() {
    return this.dbConn;
  }
}
