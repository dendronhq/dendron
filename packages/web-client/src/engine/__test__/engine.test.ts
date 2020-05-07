import { NodeDict, toStub } from "../../common/types";

import localAPI from "../localApi";

const api = new localAPI();
function makeNodes(specs: string[][]): NodeDict {
  const out: NodeDict = {};
  for (let i = 0; i < specs.length; i++) {
    out[i.toString()] = {
      id: i.toString(),
      data: {
        //schemaId: specs[i][0],
        title: specs[i][1],
        desc: specs[i][2],
        type: "note",
      },
      parent: null,
      children: [],
    };
  }
  for (let i = 0; i < specs.length; i++) {
    if (specs[i][3] != "") {
      out[i].parent = toStub(out[specs[i][3]]);
      out[specs[i][3]].children.push(toStub(out[i]));
    }
  }
  return out;
}
const notes = makeNodes([
  ["category", "languages", "Some languages", ""],
  ["language", "python", "Python is a snake", "0"],
  ["language", "java", "Java will do", "0"],
  ["category", "dishes", "Some common foods", ""],
  ["dish", "sushi", "Sushi is a fish", "3"],
  ["dish", "soup", "Soup is nice", "3"],
  ["dish", "java", "Java is coffee", "3"],
]);
api.engine.storage.writeBatch({ username: "test" }, notes);

test.each([
  ["basic", "languages/python", { "1": notes["1"] }],
  ["named", "languages/language=java", { "2": notes["2"] }],
  ["", "language=java", { "2": notes["2"] }],
  ["", "java", {}],
  ["", "category=languages/language=java", { "2": notes["2"] }],
  ["", "language=java/category=languages", { "2": notes["2"] }],
  //["language=java/category=languages", [["language=java/category=languages", "java", "Java will do"]]],
  //["java/category=languages", []],
  //["java/languages", []],
  //["category=languages", [["category=languages", "languages", "Some languages"]]],
  //["languages/*", [["category=languages/language=python", "python", "Python is a snake"], ["category=languages/language=java", "java", "Java will do"]]],
  //["languages/**", [["category=languages/language=python", "python", "Python is a snake"], ["category=languages/language=java", "java", "Java will do"]]],
  //["*/python", [["category=languages/language=python", "python", "Python is a snake"]]],
  //["**/python", [["category=languages/language=python", "python", "Python is a snake"]]],
  //["*/java", [["category=languages/language=java", "java", "Java will do"], ["category=dishes/dish=java", "java", "Java is coffee"]]],
  //["category=/java", [["category=languages/language=java", "java", "Java will do"], ["category=dishes/dish=java", "java", "Java is coffee"]]],
])(
  "simple queries: %s",
  async (desc: any, query: string, expected: NodeDict) => {
    const response = await api.query({ username: "test" }, query, "full");
    console.log(response.item);
    console.log(expected);
    expect(response.item).toEqual(expected);
    expect(response.item).toMatchSnapshot(desc);
  }
);

//test.each([
//  ["languages->dialects/python", [["category=dialects/language=python", "python", "Python is a snake"]]],
//  ["languages->dialects/language->dialect=java", [["category=dialects/dialect=java", "java", "Java will do"]]],
//  ["language=java->coffee", [["language=coffee", "java", "Java will do"]]],
//  ["java->category=languages", []],
//  ["category=languages->collection=dialects/language->dialect=java", [["collection=dialects/dialect=java", "java", "Java will do"]]],
//  ["category->languages=collection->dialects/language->dialect=java", []],
//  ["category->collection=languages/python", [["collection=languages/language=python", "python", "Python is a snake"]]],
//  ["category->collection=/python", [["collection=languages/language=python", "python", "Python is a snake"]]],
//  ["category=languages->dialects", [["category=dialects", "languages", "Some languages"]]],
//  ["category=languages->collection=dialects", [["collection=dialects", "languages", "Some languages"]]],
//  ["languages->dialects/*", [["category=dialects/language=python", "python", "Python is a snake"], ["category=dialects/language=java", "java", "Java will do"]]],
//  ["languages->dialects/**", [["category=dialects/language=python", "python", "Python is a snake"], ["category=dialects/language=java", "java", "Java will do"]]],
//  ["*/python->rattlesnake", [["category=languages/language=rattlesnake", "python", "Python is a snake"]]],
//  ["**/python->rattlesnake", [["category=languages/language=rattlesnake", "python", "Python is a snake"]]],
//  ["*/java->coffee", [["category=languages/language=coffee", "java", "Java will do"], ["category=dishes/dish=coffee", "java", "Java is coffee"]]],
//  ["languages/->good_ones/python", [["category=languages/good_ones/language=python", "python", "Python is a snake"]]],
//  ["category->collection=languages/->good_ones/python", [["collection=languages/good_ones/language=python", "python", "Python is a snake"]]],
//  ["category=languages->/python", [["language=python", "python", "Python is a snake"]]],
//  ["languages->/python", [["language=python", "python", "Python is a snake"]]],
//  ["*->/python", [["language=python", "python", "Python is a snake"]]],
//  ["**->/python", [["language=python", "python", "Python is a snake"]]],
//])('arrow replacement', (query: string, expected: string[][]) => {
//  let response = engine.query(query);
//  for (let row of expected) {
//    expect(response).toHaveProperty(row[0]);
//    expect(response[row[0]].id).toEqual(row[1]);
//    expect(response[row[0]].data).toEqual(row[2]);
//  }
//})
