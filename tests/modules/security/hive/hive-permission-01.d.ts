export interface HivePermission01 {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_SEC_HIVE_01: SbSECHive0;
  SB_SEC_HIVE_02: SbSECHive0;
  SB_SEC_HIVE_03: SbSECHive03;
}

export interface SbSECHive0 {
  hive_username: string;
  hive_password: string;
}

export interface SbSECHive03 {
  hive_username: string;
  hive_password: string;
  hive_user_id: number;
  sonata_url: string;
  role_admin_string: string;
  role_staff_string: string;
  role_super_admin_string: string;
}

export interface Env {
  local: Dev;
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  hive_domain: string;
  hive_username: string;
  hive_password: string;
}

export interface HivePermission01 {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_SEC_HIVE_01: SbSECHive0;
  SB_SEC_HIVE_02: SbSECHive0;
  SB_SEC_HIVE_03: SbSECHive03;
}

export interface SbSECHive0 {
  hive_username: string;
  hive_password: string;
}

export interface SbSECHive03 {
  hive_username: string;
  hive_password: string;
  hive_user_id: number;
  role_admin_string: string;
  role_staff_string: string;
  role_super_admin_string: string;
}

export interface Env {
  local: Dev;
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  hive_domain: string;
  hive_username: string;
  hive_password: string;
}
