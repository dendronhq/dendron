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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React from "react";
import { Route } from "react-router-dom";
var RouterComp = /** @class */ (function (_super) {
    __extends(RouterComp, _super);
    function RouterComp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RouterComp.prototype.render = function () {
        var _a = this.props, to = _a.to, RouterChildClass = _a.RouterChildClass;
        return (React.createElement(Route, { path: to, children: function (routerProps) {
                return React.createElement(RouterChildClass, __assign({}, routerProps));
            } }));
    };
    return RouterComp;
}(React.PureComponent));
export { RouterComp };
//# sourceMappingURL=RouterComp.js.map