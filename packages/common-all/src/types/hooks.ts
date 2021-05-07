export type DHookEntry = {
  id: string;
  pattern: string;
  type: "js";
};

export type DHookDict = {
  onCreate: DHookEntry[];
};
