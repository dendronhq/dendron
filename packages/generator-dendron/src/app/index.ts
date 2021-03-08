import path from "path";
import Generator, { GeneratorOptions } from "yeoman-generator";

type Options = {} & GeneratorOptions;
module.exports = class extends Generator<Options> {
  public name?: string;

  constructor(args: any[], opts: Options) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);
    this.sourceRoot(path.join(__dirname, "..", "..", "templates"));

    //this.option('babel')
    // Next, add your custom code
    // this.option('babel'); // This method adds support for a `--babel` flag
  }

  async prompting() {
    this.name = (
      await this.prompt([
        {
          type: "input",
          name: "name",
          message: "Your project name",
        },
      ])
    ).name;
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath("package.json"),
      this.destinationPath("package.json"),
      { name: this.name }
    );
    this.fs.copy(
      [
        this.templatePath("tsconfig.json"),
        this.templatePath("tsconfig.build.json"),
      ],
      this.destinationRoot()
    );
  }
};
