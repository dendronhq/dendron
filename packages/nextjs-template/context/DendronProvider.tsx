import React from "react";

export interface DendronState {
  isResponsive: boolean;
  isSidebarCollapsed: boolean;
}

const defaultDendronState: DendronState = {
  isResponsive: false,
  isSidebarCollapsed: false,
};

export interface DendronContext extends DendronState {
  setResponsive: (isResponsive: boolean) => void;
  setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
}

export const dendronContext = React.createContext<DendronContext>(null as any); // null because it gets set in the jsx

export const DendronProvider: React.FC = (props: any) => {
  const [state, setState] = React.useState<DendronState>({
    ...defaultDendronState,
  });

  function setResponsive(isResponsive: boolean) {
    setState((state) => {
      return { ...state, isResponsive };
    });
  }

  function setIsSidebarCollapsed(isSidebarCollapsed: boolean) {
    setState((state) => {
      return { ...state, isSidebarCollapsed };
    });
  }

  return (
    <dendronContext.Provider
      value={{ setResponsive, setIsSidebarCollapsed, ...state }}
    >
      {props.children}
    </dendronContext.Provider>
  );
};

export default DendronProvider;
