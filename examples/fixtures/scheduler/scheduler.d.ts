export interface Scheduler {
  email_scheduler: string;
  cases: Cases;
}

export interface Cases {
  TC_SCHEDULED_01: TcScheduled01Config;
}

export interface TcScheduled01Config {
  step1_data: string;
  step2_data: boolean;
  step2_need_wait: boolean;
  step3_data: number;
  all_step_data: string;
}

export type TcScheduled01 = {
  isStep1Done: boolean;
  isStep2Done: boolean;
  isStep3Done: boolean;

  // Step data
  step1Data: string;
  step2Data: boolean;
  step3Data: number;
};
