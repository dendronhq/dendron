import React, { ErrorInfo } from "react";
declare class ErrorBoundary extends React.Component {
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): React.ReactNode;
}
export { ErrorBoundary };
