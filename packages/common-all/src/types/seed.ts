export type SeedConfig = {
  name: string;
  publisher: string;
  license: string;
  root: string;
  description: string;
  repository: SeedRepository;
  contact?: SeedContact;
};

export type SeedRepository = {
  type: "git";
  url: string;
  contact?: SeedContact;
};

export type SeedContact = {
  name: string;
  email?: string;
  url?: string;
};

export enum SeedCommands {
  ADD = "add",
  INIT = "init",
  INFO = "info",
}
