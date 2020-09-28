import _ from "lodash";

type DendronSettings = {
  wsRoot: string;
};

// let settings: Map<string, Thenable<DendronSettings>> = new Map();
let settings: Partial<DendronSettings> = {};

export function getSettings() {
  return settings as DendronSettings;
}

export async function updateSettings(obj: any) {
  settings = { ...settings, ...obj };
}
