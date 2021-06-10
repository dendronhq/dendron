export type SeedConfig = {
  name: string;
  publisher: string;
  license: string;
  root: string;
  description: string;
  contact?: SeedContact;
};

export type SeedContact = {
  name: string;
  email?: string;
  url?: string;
};

export enum SeedCommands {
  INFO = "info",
}
