import {DendronConfig} from "@dendronhq/common-all";

const getConfigData = (): {data: DendronConfig} => {
    return {
        data: {
            version: 0,
            vaults: [{
                fsPath: "vault"
            }],
            site: {
                siteHierarchies: ["dendron"],
                siteRootDir: "docs"
            }
        }
    }
}

const saveConfigData = (data: DendronConfig) => {
    console.log("data saved")
}

export default function ConfigSamplePage() {
    const {data} = getConfigData() 
    return <div>
        <h1>Config Data</h1>
        <pre>
            {JSON.stringify(data)}
        </pre>
        <button onClick={()=>(saveConfigData(data))}>Save Config</button>
    </div>
}