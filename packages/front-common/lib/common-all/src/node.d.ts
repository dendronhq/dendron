import { DNodeProps, DNodeType, IDNode, INoteProps } from "./types";
export declare abstract class DNode implements IDNode {
    id: string;
    title: string;
    desc: string;
    type: DNodeType;
    updated: string;
    created: string;
    parent: IDNode | null;
    children: IDNode[];
    body?: string;
    constructor(props: DNodeProps);
    get path(): string;
    get url(): string;
    addChild(node: IDNode): void;
    renderBody(): string;
    toDocument(): {
        document: {
            nodes: {
                object: string;
                type: string;
                nodes: {
                    object: string;
                    text: string;
                }[];
            }[];
        };
    };
}
export declare class Note extends DNode {
    schemaId: string;
    constructor(props: INoteProps);
}
