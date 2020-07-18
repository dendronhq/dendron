import { URI } from 'vscode-uri'
import { DEngine } from '@dendronhq/common-all';

interface Pod {
    import: (uri: URI) => Promise<any>
}

export abstract class BasePod implements Pod {
    protected engine: DEngine;
    protected root: URI;

    constructor(opts: {engine: DEngine, root: URI}) {
        this.engine = opts.engine;
        this.root = opts.root;
    }

    abstract async import (): Promise<any>
}