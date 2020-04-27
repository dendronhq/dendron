import Engine from '../engine'
import InMemoryStore from '../inMemoryStore'
let store = new InMemoryStore<string>();
store.write({
  "category=languages": { id: "languages", logicalId: "category=languages", data: "Some languages" },
  "category=languages/language=python": { id: "python", logicalId: "category=languages/language=python", data: "Python is a snake" },
  "category=languages/language=java": { id: "java", logicalId: "category=languages/language=java", data: "Java will do" },
  "category=dishes": { id: "dishes", logicalId: "category=dishes", data: "Some common foods" },
  "category=dishes/dish=sushi": { id: "sushi", logicalId: "category=dishes/dish=sushi", data: "Sushi is a fish" },
  "category=dishes/dish=soup": { id: "soup", logicalId: "category=dishes/dish=soup", data: "Soup is nice" },
  "category=dishes/dish=java": { id: "java", logicalId: "category=dishes/dish=java", data: "Java is coffee" },
});
let engine = new Engine(store);

test.each([
  ["languages/python", [["category=languages/language=python", "python", "Python is a snake"]]],
  ["languages/language=java", [["category=languages/language=java", "java", "Java will do"]]],
  ["language=java", [["language=java", "java", "Java will do"]]],
  ["java", []],
  ["category=languages/language=java", [["category=languages/language=java", "java", "Java will do"]]],
  ["language=java/category=languages", [["language=java/category=languages", "java", "Java will do"]]],
  ["java/category=languages", []],
  ["java/languages", []],
  ["category=languages", [["category=languages", "languages", "Some languages"]]],
  ["languages/*", [["category=languages/language=python", "python", "Python is a snake"], ["category=languages/language=java", "java", "Java will do"]]],
  ["languages/**", [["category=languages/language=python", "python", "Python is a snake"], ["category=languages/language=java", "java", "Java will do"]]],
  ["*/python", [["category=languages/language=python", "python", "Python is a snake"]]],
  ["**/python", [["category=languages/language=python", "python", "Python is a snake"]]],
  ["*/java", [["category=languages/language=java", "java", "Java will do"], ["category=dishes/dish=java", "java", "Java is coffee"]]],
  ["category=/java", [["category=languages/language=java", "java", "Java will do"], ["category=dishes/dish=java", "java", "Java is coffee"]]],
])('simple queries, reordering, and wildcards', (query: string, expected: string[][]) => {
  let response = engine.query(query);
  for (let row of expected) {
    expect(response).toHaveProperty(row[0]);
    expect(response[row[0]].logicalId).toEqual(row[0]);
    expect(response[row[0]].id).toEqual(row[1]);
    expect(response[row[0]].data).toEqual(row[2]);
  }
});

test.each([
  ["languages->dialects/python", [["category=dialects/language=python", "python", "Python is a snake"]]],
  ["languages->dialects/language->dialect=java", [["category=dialects/dialect=java", "java", "Java will do"]]],
  ["language=java->coffee", [["language=coffee", "java", "Java will do"]]],
  ["java->category=languages", []],
  ["category=languages->collection=dialects/language->dialect=java", [["collection=dialects/dialect=java", "java", "Java will do"]]],
  ["category->languages=collection->dialects/language->dialect=java", []],
  ["category->collection=languages/python", [["collection=languages/language=python", "python", "Python is a snake"]]],
  ["category->collection=/python", [["collection=languages/language=python", "python", "Python is a snake"]]],
  ["category=languages->dialects", [["category=dialects", "languages", "Some languages"]]],
  ["category=languages->collection=dialects", [["collection=dialects", "languages", "Some languages"]]],
  ["languages->dialects/*", [["category=dialects/language=python", "python", "Python is a snake"], ["category=dialects/language=java", "java", "Java will do"]]],
  ["languages->dialects/**", [["category=dialects/language=python", "python", "Python is a snake"], ["category=dialects/language=java", "java", "Java will do"]]],
  ["*/python->rattlesnake", [["category=languages/language=rattlesnake", "python", "Python is a snake"]]],
  ["**/python->rattlesnake", [["category=languages/language=rattlesnake", "python", "Python is a snake"]]],
  ["*/java->coffee", [["category=languages/language=coffee", "java", "Java will do"], ["category=dishes/dish=coffee", "java", "Java is coffee"]]],
  ["languages/->good_ones/python", [["category=languages/good_ones/language=python", "python", "Python is a snake"]]],
  ["category->collection=languages/->good_ones/python", [["collection=languages/good_ones/language=python", "python", "Python is a snake"]]],
  ["category=languages->/python", [["language=python", "python", "Python is a snake"]]],
  ["languages->/python", [["language=python", "python", "Python is a snake"]]],
  ["*->/python", [["language=python", "python", "Python is a snake"]]],
  ["**->/python", [["language=python", "python", "Python is a snake"]]],
])('arrow replacement', (query: string, expected: string[][]) => {
  let response = engine.query(query);
  for (let row of expected) {
    expect(response).toHaveProperty(row[0]);
    expect(response[row[0]].logicalId).toEqual(row[0]);
    expect(response[row[0]].id).toEqual(row[1]);
    expect(response[row[0]].data).toEqual(row[2]);
  }
})