import { ILookup } from "./Lookup";
import React from "react";
export default class DendronLayout extends React.PureComponent {
    lookup?: ILookup;
    storeLookup: (comp: import("./Lookup").LookupComp) => void;
    goToSearch(ev: Event): void;
    render(): JSX.Element;
}
