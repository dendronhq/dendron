import {createLogger, engineSlice} from "@dendronhq/common-frontend"

export default function Sample({engine}: {engine: engineSlice.EngineState}) {
    const notes = engine.notes;
    const logger = createLogger("Sample");
    logger.info({ctx: "Sample", notes})
    return <> 
        Sample: 
    </>
}