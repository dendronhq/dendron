import {
  ILookupProviderOptsV3,
  ILookupProviderV3,
  INoteLookupProviderFactory,
  ISchemaLookupProviderFactory,
} from "./LookupProviderV3Interface";
import { NoteLookupProvider, SchemaLookupProvider } from "./LookupProviderV3";
import { IDendronExtension } from "../../dendronExtensionInterface";

export class NoteLookupProviderFactory implements INoteLookupProviderFactory {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  create(id: string, opts: ILookupProviderOptsV3) {
    return new NoteLookupProvider(id, opts, this.extension);
  }
}

export class SchemaLookupProviderFactory
  implements ISchemaLookupProviderFactory
{
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  create(id: string, opts: ILookupProviderOptsV3): ILookupProviderV3 {
    return new SchemaLookupProvider(id, opts, this.extension);
  }
}
