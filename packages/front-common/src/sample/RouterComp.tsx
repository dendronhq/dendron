import React from "react";
import { Route } from "react-router-dom";

interface RouterCompProps {
  to: string;
  RouterChildClass: any;
}

export class RouterComp extends React.PureComponent<RouterCompProps> {
  render() {
    const { to, RouterChildClass } = this.props;
    return (
      <Route
        path={to}
        children={(routerProps) => {
          return <RouterChildClass {...routerProps} />;
        }}
      />
    );
  }
}
