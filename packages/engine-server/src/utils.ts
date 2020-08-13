import _ from "lodash";
import path from "path";

// const testString = "<!--(([[class.mba.chapters.2]]))-->";

export type DendronRefLink = {
  label?: string;
  id?: string;
  name?: string;
  anchorStart?: string;
  anchorEnd?: string;
  type: "file" | "id";
};

type DendronRef = {
  direction: "from" | "to";
  link: DendronRefLink;
};

export function parseDendronRef(ref: string) {
  const [idOrRef, ...rest] = _.trim(ref).split(":");
  const cleanArgs = _.trim(rest.join(":"));
  let link: DendronRefLink | undefined;
  let direction: DendronRef["direction"];
  if (idOrRef === "ref") {
    direction = "to";
    // eslint-disable-next-line no-use-before-define
    link = parseLink(cleanArgs);
  } else {
    throw Error("not implemented");
  }
  return { direction, link };
}

export function parseFileLink(ref: string): DendronRefLink {
  const wikiFileName = /([^\]:]+)/.source;
  const reLink = new RegExp(
    "" +
      /\[\[/.source +
      `(?<name>${wikiFileName})` +
      /\]\]/.source +
      `(${
        new RegExp(
          // anchor start
          "" +
            /#?/.source +
            `(?<anchorStart>${wikiFileName})` +
            // anchor stop
            `(:#(?<anchorEnd>${wikiFileName}))?`
        ).source
      })?`,
    "i"
  );
  const groups = reLink.exec(ref)?.groups;
  const clean: DendronRefLink = {
    type: "file",
  };
  _.each<Partial<DendronRefLink>>(groups, (v, k: any) => {
    if (k === "name") {
      // @ts-ignore
      clean[k] = path.basename(v as string, ".md");
    } else {
      // @ts-ignore
      clean[k] = v;
    }
  });
  return clean;
}

// export function parseIdLink(ref: string): DendronRefLink {
//     const reLink = /(?<id>[^:]+)(:([^:]+))?/;
// };

function parseLink(ref: string): DendronRefLink | undefined {
  if (ref.indexOf("]") >= 0) {
    return parseFileLink(ref);
  } else {
    throw Error("not implemented");
  }
  // let wikiLinkRegex = /(?<name>[^\]:]+)/;
  // console.log(ref);
  // //const reLink = new RegExp(/(\[\[(?<name>[^\]]+)\]\])?#?((?<id>[\w\d-]+)?)/);
  // const reLink = new RegExp(/(\[\[(?<name>[^\]]+)\]\])?#?((?<id>[\w\d-]+)?)/);
  // console.log(reLink);
  // const groups = reLink.exec(ref)?.groups;
  // console.log(groups);
  // if (!groups) { return; }
  // const link = createDendronRefLink({...groups});
  // return link;
}

// function testLineRef() {
//     const ref = "ref: b9f5caaa-288e-41e9-a2a2-21f1d8e49625";
//     return assert(parseDendronRef(ref), {
//         type: 'ref',
//         start: {id: 'b9f5caaa-288e-41e9-a2a2-21f1d8e49625'},
//     });
// };

// function testFileWithLineRef() {
//     const ref = "ref: [[foo]]#b9f5caaa-288e-41e9-a2a2-21f1d8e49625";
//     return assert(parseDendronRef(ref), {
//         type: 'ref',
//         start: {id: 'b9f5caaa-288e-41e9-a2a2-21f1d8e49625', name: 'foo'},
//     });
// };

// function testBlockRef() {
//     const ref = "ref: {[[foo.md]]#b9f5caaa-288e-41e9-a2a2-21f1d8e49625:8cf13bab-a231-40a7-9860-f52b24083873}";
//     return assert(parseDendronRef(ref), {
//         type: 'ref',
//         start: {id: 'b9f5caaa-288e-41e9-a2a2-21f1d8e49625', name: 'foo'},
//         stop: {id: '8cf13bab-a231-40a7-9860-f52b24083873'}
//     });
// };

// function runTests() {
//     console.log(testFileRef());
//     // console.log(testLineRef());
//     // console.log(testFileWithLineRef());
//     // console.log(testBlockRef());
// }

// runTests();

export const matchEmbedMarker = (txt: string) => {
  return txt.match(/<!--\(\(([^)]+)\)\)-->/);
};
