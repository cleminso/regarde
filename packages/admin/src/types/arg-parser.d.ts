declare module "@alcyone-labs/arg-parser" {
  export interface IFlag {
    name: string;
    description?: string;
    type: "string" | "number" | "boolean" | "array";
    required?: boolean;
    default?: any;
    alias?: string;
    choices?: any[];
  }

  export interface ISubCommand {
    name: string;
    description?: string;
    inheritParentFlags?: boolean;
  }

  export interface ArgParserOptions {
    name?: string;
    description?: string;
    version?: string;
    inheritParentFlags?: boolean;
  }

  export class ArgParserBase {
    constructor(options?: ArgParserOptions, initialFlags?: IFlag[]);
    addFlag(flag: IFlag): this;
    addFlags(flags: IFlag[]): this;
    addSubCommand(subCommand: ISubCommand): ArgParserBase;
    setHandler(handler: (args: any, context?: any) => void | Promise<void>): this;
    getSubCommand(name: string): ArgParserBase | undefined;
    hasFlag(name: string): boolean;
    helpText(): string;
    printAll(filePath?: string): void;
    parse(args: string[], options?: any): any;
  }

  export class ArgParser extends ArgParserBase {
    constructor(options?: ArgParserOptions, initialFlags?: IFlag[]);
  }

  export interface HandlerContext {
    subCommand?: string;
    parentArgs?: any;
    globalArgs?: any;
  }
}
