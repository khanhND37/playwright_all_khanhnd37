export type DMCAReport = {
  name: string;
  email: string;
  company?: string;
  address: string;
  phone: number;
  copyright_owner: number;
  infringing_links: string;
  material_description: string;
  work_links: string;
  work_description: string;
  evidence: string;
  statement: Array<number>;
  electronic_signature: string;
};
