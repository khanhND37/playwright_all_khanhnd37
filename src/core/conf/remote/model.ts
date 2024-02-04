/* eslint-disable camelcase */
import { DataTypes, Model } from "sequelize";

export class CaseConfig extends Model {}

export class SuiteConfig extends Model {}

/**
 * @deprecate use testhub instead
 */
if (process.env.PREFERRED_STORAGE === "sql") {
  CaseConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      suite_id: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE },
      data: { type: DataTypes.JSON },
      name: { type: DataTypes.STRING(1000) },
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      sequelize: require("./conn").getConnection(),
      modelName: "test_case_conf",
      freezeTableName: true,
      timestamps: false,
    },
  );
  SuiteConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE },
      data: { type: DataTypes.JSON },
      name: { type: DataTypes.STRING(1000) },
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      sequelize: require("./conn").getConnection(),
      modelName: "test_suite_conf",
      freezeTableName: true,
      timestamps: false,
    },
  );

  // TODO use later
  // CaseConfig.belongsTo(SuiteConfig, {
  //   as: "suite_id",
  //   foreignKey: "id",
  //   foreignKeyConstraint: true,
  // });
}
