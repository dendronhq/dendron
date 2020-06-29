export abstract class BaseCommand<TOpts> {
    abstract async execute(opts: TOpts): Promise<any>;
}
