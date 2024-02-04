import { Sequelize } from "sequelize";

/**
 * @deprecate use testhub instead
 */
class RemoteConfigHelper {
  dbConn;

  constructor() {
    let dbConn;
    if (process.env.PREFERRED_STORAGE === "sql") {
      dbConn = new Sequelize(process.env.CONF_SQL_CONN);
      try {
        dbConn.authenticate();
      } catch (error) {
        throw new Error("Unable to connect to the database");
      }
    }
    this.dbConn = dbConn;
  }

  getConnection() {
    return this.dbConn;
  }
}

module.exports = new RemoteConfigHelper();
