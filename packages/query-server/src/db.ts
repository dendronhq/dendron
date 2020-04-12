// Mocks a key-value store supporting regex lookup
export default class DB {
  private data: Map<string, string> = new Map();
  constructor() {
    this.data.set("category=languages", "Some languages");
    this.data.set("category=languages/language=python", "Python is a snake");
    this.data.set("category=languages/language=java", "Java will do");
    this.data.set("category=dishes", "Some common foods");
    this.data.set("category=dishes/dish=sushi", "Sushi is a fish");
    this.data.set("category=dishes/dish=soup", "Soup is nice");
    this.data.set("category=dishes/dish=java", "Java is coffee");
  }
  public query(regex: RegExp): string[][] {
    return Array.from(this.data.keys())
      .filter(key => regex.test(key))
      .map(key => [key, this.data.get(key) || ""]);
  }
}