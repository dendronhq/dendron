var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import React from "react";
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ErrorBoundary.prototype.componentDidCatch = function (error, info) {
        console.log({ error: error, info: info });
        // TODO: handle error code
        // Sentry.withScope(scope => {
        //   scope.setExtras({info});
        //   const eventId = Sentry.captureException(error);
        //   L.error({error, info, eventId})
        // })
        //   L.error({error, info })
    };
    ErrorBoundary.prototype.render = function () {
        return this.props.children;
    };
    return ErrorBoundary;
}(React.Component));
export { ErrorBoundary };
//# sourceMappingURL=ErrorBoundary.js.map