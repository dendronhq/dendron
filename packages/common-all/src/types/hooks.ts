export type DHookEntry = {
  id: string;
  pattern: string;
  type: string;
};

export type DHookDict = {
  onCreate: DHookEntry[];
};
