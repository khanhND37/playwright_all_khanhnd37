export type RunResult = {
  codeName: string;
  type: string;
  env: string;
  reportUrl: string;
  startAt: Date;
  finishedAt: Date;
  result: string;
  runGroupId: number;
  testResult: string;
  realResult: string;
  buildUrl: string;
  testId: string;
  failReason?: string;
};

export type RunGroupResult = {
  name: string;
  env: string;
  reportUrl: string;
  startAt: Date;
  finishedAt: Date;
  result: string;
};

export type EnvConfig = {
  codeName: string;
  env: string;
  data: string;
};
