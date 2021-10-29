

export type WorkspaceProps = {
  port: number;
  ws: string;
  theme?: string;
  /**
   * workspace loaded through browser
   */
  browser?: boolean;
};
