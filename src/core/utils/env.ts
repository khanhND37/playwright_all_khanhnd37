export const getSnapshotNameWithEnv = (name: string) => {
  if (process.env.REAL_ENV) {
    return `${process.env.REAL_ENV}-${name}`;
  }
  return `${process.env.ENV}-${name}`;
};

export const getSnapshotNameWithEnvAndCaseCode = (name: string, caseCode: string) => {
  if (process.env.REAL_ENV) {
    return `${process.env.REAL_ENV}-${caseCode}-${name}`;
  }
  return `${process.env.ENV}-${caseCode}-${name}`;
};
