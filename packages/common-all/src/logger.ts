export type DLogger = {
  name?: string;
  level: any;
  debug: (msg: any) => void;
  info: (msg: any) => void;
  error: (msg: any) => void;
};
