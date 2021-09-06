export type DendronConfigValueType = string | boolean | number;

export type DendronConfigEntry<DendronConfigValueType> = {
  value?: DendronConfigValueType;
  label: string;
  desc: string;
};
