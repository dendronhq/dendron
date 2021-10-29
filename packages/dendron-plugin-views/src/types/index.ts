

export type WorkspaceProps = {
  port: number;
  ws: string;
  theme?: string;
  /**
   * workspace loaded through browser
   */
  browser?: boolean;
};


export interface DendronComponentProps {
}

export type DendronComponent = React.FunctionComponent<DendronComponentProps>;