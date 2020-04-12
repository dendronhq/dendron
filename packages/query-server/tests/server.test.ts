import Server from '../src/server'

let server = new Server();
test.each([
  ["languages/python", { "languages": { "python": { "": "Python is a snake" } } }],
  ["languages/language=java", { "languages": { "java": { "": "Java will do" } } }],
  ["language=java", { "java": { "": "Java will do" } }],
  ["java", {}],
  ["category=languages/language=java", { "languages": { "java": { "": "Java will do" } } }],
  ["language=java/category=languages", { "java": { "languages": { "": "Java will do" } } }],
  ["java/category=languages", {}],
  ["java/languages", {}],
  ["category=languages", { "languages": { "": "Some languages" } }],
  ["languages/*", { "languages": { "python": { "": "Python is a snake" }, "java": { "": "Java will do" } } }],
  ["languages/**", { "languages": { "python": { "": "Python is a snake" }, "java": { "": "Java will do" } } }],
  ["*/python", { "languages": { "python": { "": "Python is a snake" } } }],
  ["**/python", { "languages": { "python": { "": "Python is a snake" } } }],
  ["*/java", { "languages": { "java": { "": "Java will do" } }, "dishes": { "java": { "": "Java is coffee" } } }],
])('query', (query: string, response: any) => expect(server.query(query)).toStrictEqual(response));