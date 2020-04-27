import Server from "./server";
import InMemoryStore from "../inMemoryStore";
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
export default new Server(store).listen();