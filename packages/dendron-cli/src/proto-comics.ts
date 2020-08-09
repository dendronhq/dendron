import _ from "lodash";
import { DendronEngine } from "@dendronhq/engine-server";
import { readYAML } from "@dendronhq/common-server";
import path from "path";
import { Note } from "@dendronhq/common-all";

type Entry = {
  id: number;
  title: string;
  tags: string;
};

function createComic(entry: Entry) {
  const { id, title, tags } = entry;
  const fname = `blog.comics.${id}-${title}`;
  const note = new Note({ fname, title });
  note.body = `![](/assets/images/comics/Paper.Comics.${id}.png)`;
  return note;
}

async function main() {
  console.log("start");
  const root = "/Users/kevinlin/projects/dendronv2/dendron-kevinslin/vault";
  const engine = DendronEngine.getOrCreateEngine({ root });
  await engine.init();
  const dendronRoot = "/Users/kevinlin/projects/dendronv2/dendron-kevinslin";
  const comics: Entry[] = readYAML(
    path.join(dendronRoot, "migration", "comics.yml")
  );
  await Promise.all(
    comics.map((c) => {
      const note = createComic(c);
      return engine.write(note, { newNode: true });
    })
  );
  console.log(comics);
}

main();
