import { URI } from 'vscode-uri'
import { DEngine } from '@dendronhq/common-all';

interface Pod {
    import: (uri: URI) => Promise<any>
}

export abstract class BasePod implements Pod {
    protected engine: DEngine;

    constructor(engine: DEngine) {
        this.engine = engine;
    }

    abstract async import (uri: URI): Promise<any>
}