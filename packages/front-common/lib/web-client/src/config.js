import _ from "lodash";
// === Colors
export var DIVIDER_COLOR = "#EBEBEB";
// } Types End
// === Component Start {
var TopBar = {
    height: 64,
};
var Logo = {
    height: 50,
};
var Tree = {
    height: 1000,
    width: 1000,
};
var ALL_COMPONENTS = {
    TopBar: TopBar,
    Logo: Logo,
    Tree: Tree,
};
// } Component End
export function dims(comp, 
// @ts-ignore
viewport, opts) {
    opts = _.defaults(opts, { forStyledComp: false, addUnits: true });
    //   const out: Partial<typeof ALL_COMPONENTS> = {};
    var _comp = ALL_COMPONENTS[comp];
    var unit = "px";
    if (opts.forStyledComp) {
        return _.map(_comp, function (v, k) {
            return k + ": " + v + unit + ";";
        }).join("\n");
    }
    return _comp;
}
//# sourceMappingURL=config.js.map