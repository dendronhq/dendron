import { Time } from "@dendronhq/common-all";
import { Git, WorkspaceService } from "@dendronhq/engine-server";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ExportPod, ExportPodPlantOpts } from "../basev3";

const writeCSV = (opts: { dest: string; data: any[]; header: any[] }) => {
  const { dest, data, header } = opts;
  const csvWriter = createObjectCsvWriter({
    path: dest,
    header,
  });
  return csvWriter.writeRecords(data);
};

export class GitPunchCardExportPod extends ExportPod {
  static id: string = "dendron.gitpunchard";
  static description: string = "export notes as json";

  parseChunk(chunk: string[]) {
    const [p1, p2] = chunk;
    const [commit, time] = p1.split(",").map((ent) => _.trim(ent, ` '"`));
    const dt = Time.DateTime.fromSeconds(parseInt(time));
    const out = {
      commit,
      time: dt.toFormat("y-MM-dd"),
      files: 0,
      insert: 0,
      delete: 0,
    };
    p2.split(",").map((ent) => {
      ent = _.trim(ent);
      if (ent.indexOf("changed") > 0) {
        out["files"] = parseInt(ent.split(" ")[0]);
      } else if (ent.indexOf("insertion") > 0) {
        out["insert"] = parseInt(ent.split(" ")[0]);
      } else if (ent.indexOf("deletion") > 0) {
        out["delete"] = parseInt(ent.split(" ")[0]);
      } else {
        console.log("INVALID VALUE", p2);
        throw Error();
      }
    });
    return out;
  }

  async plant(opts: ExportPodPlantOpts) {
    const { dest, notes, wsRoot } = opts;

    // verify dest exist
    const podDstPath = dest.fsPath;
    fs.ensureDirSync(podDstPath);

    const repoPaths = await new WorkspaceService({ wsRoot }).getAllRepos();

    const getAllCommits = async (root: string) => {
      const git = new Git({ localUrl: root });
      const commits = await git.client([
        "log",
        "--pretty=commit%n%h, %at",
        "--shortstat",
      ]);
      const cleanCommits = commits
        .split("commit")
        .filter((ent) => !_.isEmpty(ent));
      const data = cleanCommits
        .map((chunk) => {
          const cleanChunk = chunk
            .split("\n")
            .filter((ent) => !_.isEmpty(ent))
            .map((ent) => _.trim(ent));
          if (_.size(cleanChunk) == 2) {
            const resp = this.parseChunk(cleanChunk);
            return resp;
          }
          return undefined;
        })
        .filter((ent) => !_.isUndefined(ent));
      return data;
    };

    const data = _.flatten(
      await Promise.all(repoPaths.flatMap((root) => getAllCommits(root)))
    );

    const csvDest = path.join(podDstPath, "commits.csv");
    const htmlDest = path.join(podDstPath, "index.html");
    debugger;
    await writeCSV({
      dest: csvDest,
      data,
      header: [
        { id: "commit", title: "commit" },
        { id: "delete", title: "delete" },
        { id: "files", title: "files" },
        { id: "insert", title: "insert" },
        { id: "time", title: "time" },
      ],
    });
    fs.writeFileSync(htmlDest, template);
    return { notes };
  }
}

const template = `<!DOCTYPE html>
<html>
  <head>
    <title>Vega-Lite Bar Chart</title>
    <meta charset="utf-8" />

    <script src="https://cdn.jsdelivr.net/npm/vega@5.19.1"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5.0.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6.15.1"></script>

    <style media="screen">
      /* Add space between Vega-Embed links  */
      .vega-actions a {
        margin-right: 5px;
      }
    </style>
  </head>
  <body>
    <h1>Dendron Punchard</h1>
    <!-- Container for the visualization -->
    <div id="vis" style="width:100%;min-height:800px"></div>

    <script>
      // Assign the specification to a local variable vlSpec.
      /*
      var vlSpec = {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "description": "Punchcard Visualization like on Github. The day on y-axis uses a custom order from Monday to Sunday.  The sort property supports both full day names (e.g., 'Monday') and their three letter initials (e.g., 'mon') -- both of which are case insensitive.",
          "data": { "url": "./out.csv"},
          "mark": "rect",
          "width": "container",
          "encoding": {
            "y": {"aggregate": "count", "field": "insert", "title": "commits" },
            "x": {
              "field": "time",
              "timeUnit": "yearmonthdate",
              "type": "ordinal",
              "title": "Time"
          },
          }
        
      };
      */
      var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Punchcard Visualization like on Github. The day on y-axis uses a custom order from Monday to Sunday.  The sort property supports both full day names (e.g., 'Monday') and their three letter initials (e.g., 'mon') -- both of which are case insensitive.",
        "data": { "url": "./out.csv"},
        "mark": "circle",
        "width": "container",
        "encoding": {
          "y": {
            "field": "time",
            "type": "ordinal", 
            "timeUnit": "day",
            "sort": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
          },
          "x": {
            "field": "time",
            "timeUnit": "yearmonthdate",
            "type": "ordinal",
            "title": "Month"
        },
          "size": {
            "field": "insert",
            "aggregate": "count",
            "type": "quantitative",
            "legend": {
                "title": null
            }
        }  
        }
      
    };

      // Embed the visualization in the container with id 
      vegaEmbed('#vis', vlSpec);
    </script>
  </body>
</html>`;
