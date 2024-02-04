export type THCaseData = {
  id?: number;
  case_id?: number;
  case_code?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  env?: string;
  branch?: string;
};

export type THCaseJobs = {
  case_id: number;
  job_id: number;
};

export type THJob = {
  id?: number;
  name: string;
  crontab: string;
  enabled: boolean;
  mode: string;
  env: string;
  branch: string;
  created_by_id?: number;
  created_by_email?: string;
  created_by_slack_id?: string;
};

export type THCaseType = {
  code: string;
  name: string;
  is_automated: boolean;
  need_automation: boolean;
};
