import React, { ErrorInfo } from "react";

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.log({ error, info });
    // TODO: handle error code
    // Sentry.withScope(scope => {
    //   scope.setExtras({info});
    //   const eventId = Sentry.captureException(error);
    //   L.error({error, info, eventId})
    // })
    //   L.error({error, info })
  }

  render() {
    return this.props.children;
  }
}

export { ErrorBoundary };
