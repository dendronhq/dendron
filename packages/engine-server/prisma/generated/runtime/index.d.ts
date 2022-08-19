/// <reference types="node" />

import { inspect } from 'util';

declare type Action = keyof typeof DMMF.ModelAction | 'executeRaw' | 'queryRaw' | 'runCommandRaw';

declare class AnyNull extends NullTypesEnumValue {
}

declare class Arg {
    key: string;
    value: ArgValue;
    error?: InvalidArgError;
    hasError: boolean;
    isEnum: boolean;
    schemaArg?: DMMF.SchemaArg;
    isNullable: boolean;
    inputType?: DMMF.SchemaArgInputType;
    constructor({ key, value, isEnum, error, schemaArg, inputType }: ArgOptions);
    get [Symbol.toStringTag](): string;
    _toString(value: ArgValue, key: string): string | undefined;
    toString(): string | undefined;
    collectErrors(): ArgError[];
}

declare interface ArgError {
    path: string[];
    id?: string;
    error: InvalidArgError;
}

declare interface ArgOptions {
    key: string;
    value: ArgValue;
    isEnum?: boolean;
    error?: InvalidArgError;
    schemaArg?: DMMF.SchemaArg;
    inputType?: DMMF.SchemaArgInputType;
}

declare class Args {
    args: Arg[];
    readonly hasInvalidArg: boolean;
    constructor(args?: Arg[]);
    get [Symbol.toStringTag](): string;
    toString(): string;
    collectErrors(): ArgError[];
}

declare type ArgValue = string | boolean | number | undefined | Args | string[] | boolean[] | number[] | Args[] | null;

declare interface AtLeastOneError {
    type: 'atLeastOne';
    key: string;
    inputType: DMMF.InputType;
}

declare interface AtMostOneError {
    type: 'atMostOne';
    key: string;
    inputType: DMMF.InputType;
    providedKeys: string[];
}

export declare type BaseDMMF = Pick<DMMF.Document, 'datamodel' | 'mappings'>;

declare interface BaseDMMFHelper extends DMMFDatamodelHelper, DMMFMappingsHelper {
}

declare class BaseDMMFHelper {
    constructor(dmmf: BaseDMMF);
}

declare interface BinaryTargetsEnvValue {
    fromEnvVar: null | string;
    value: string;
}

declare interface Client {
    /** Only via tx proxy */
    [TX_ID]?: string;
    _baseDmmf: BaseDMMFHelper;
    _dmmf?: DMMFClass;
    _engine: Engine;
    _fetcher: RequestHandler;
    _connectionPromise?: Promise<any>;
    _disconnectionPromise?: Promise<any>;
    _engineConfig: EngineConfig;
    _clientVersion: string;
    _errorFormat: ErrorFormat;
    readonly $metrics: MetricsClient;
    $use<T>(arg0: Namespace | QueryMiddleware<T>, arg1?: QueryMiddleware | EngineMiddleware<T>): any;
    $on(eventType: EngineEventType, callback: (event: any) => void): any;
    $connect(): any;
    $disconnect(): any;
    _runDisconnect(): any;
    $executeRaw(query: TemplateStringsArray | sqlTemplateTag.Sql, ...values: any[]): any;
    $queryRaw(query: TemplateStringsArray | sqlTemplateTag.Sql, ...values: any[]): any;
    __internal_triggerPanic(fatal: boolean): any;
    $transaction(input: any, options?: any): any;
    _request(internalParams: InternalRequestParams): Promise<any>;
}

declare type ConnectorType = 'mysql' | 'mongodb' | 'sqlite' | 'postgresql' | 'sqlserver' | 'jdbc:sqlserver' | 'cockroachdb';

declare type ConnectorType_2 = 'mysql' | 'mongodb' | 'sqlite' | 'postgresql' | 'sqlserver' | 'jdbc:sqlserver' | 'cockroachdb';

declare class DataLoader<T = unknown> {
    private options;
    batches: {
        [key: string]: Job[];
    };
    private tickActive;
    constructor(options: DataLoaderOptions<T>);
    request(request: T): Promise<any>;
    private dispatchBatches;
    get [Symbol.toStringTag](): string;
}

declare type DataLoaderOptions<T> = {
    singleLoader: (request: T) => Promise<any>;
    batchLoader: (request: T[]) => Promise<any[]>;
    batchBy: (request: T) => string | undefined;
};

declare interface DataSource {
    name: string;
    activeProvider: ConnectorType;
    provider: ConnectorType;
    url: EnvValue;
    config: {
        [key: string]: string;
    };
}

declare type Datasource = {
    url?: string;
};

declare interface DatasourceOverwrite {
    name: string;
    url?: string;
    env?: string;
}

declare type Datasources = {
    [name in string]: Datasource;
};

declare class DbNull extends NullTypesEnumValue {
}

export declare namespace Decimal {
    export type Constructor = typeof Decimal;
    export type Instance = Decimal;
    export type Rounding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    export type Modulo = Rounding | 9;
    export type Value = string | number | Decimal;

    // http://mikemcl.github.io/decimal.js/#constructor-properties
    export interface Config {
        precision?: number;
        rounding?: Rounding;
        toExpNeg?: number;
        toExpPos?: number;
        minE?: number;
        maxE?: number;
        crypto?: boolean;
        modulo?: Modulo;
        defaults?: boolean;
    }
}

export declare class Decimal {
    readonly d: number[];
    readonly e: number;
    readonly s: number;
    private readonly toStringTag: string;

    constructor(n: Decimal.Value);

    absoluteValue(): Decimal;
    abs(): Decimal;

    ceil(): Decimal;

    clampedTo(min: Decimal.Value, max: Decimal.Value): Decimal;
    clamp(min: Decimal.Value, max: Decimal.Value): Decimal;

    comparedTo(n: Decimal.Value): number;
    cmp(n: Decimal.Value): number;

    cosine(): Decimal;
    cos(): Decimal;

    cubeRoot(): Decimal;
    cbrt(): Decimal;

    decimalPlaces(): number;
    dp(): number;

    dividedBy(n: Decimal.Value): Decimal;
    div(n: Decimal.Value): Decimal;

    dividedToIntegerBy(n: Decimal.Value): Decimal;
    divToInt(n: Decimal.Value): Decimal;

    equals(n: Decimal.Value): boolean;
    eq(n: Decimal.Value): boolean;

    floor(): Decimal;

    greaterThan(n: Decimal.Value): boolean;
    gt(n: Decimal.Value): boolean;

    greaterThanOrEqualTo(n: Decimal.Value): boolean;
    gte(n: Decimal.Value): boolean;

    hyperbolicCosine(): Decimal;
    cosh(): Decimal;

    hyperbolicSine(): Decimal;
    sinh(): Decimal;

    hyperbolicTangent(): Decimal;
    tanh(): Decimal;

    inverseCosine(): Decimal;
    acos(): Decimal;

    inverseHyperbolicCosine(): Decimal;
    acosh(): Decimal;

    inverseHyperbolicSine(): Decimal;
    asinh(): Decimal;

    inverseHyperbolicTangent(): Decimal;
    atanh(): Decimal;

    inverseSine(): Decimal;
    asin(): Decimal;

    inverseTangent(): Decimal;
    atan(): Decimal;

    isFinite(): boolean;

    isInteger(): boolean;
    isInt(): boolean;

    isNaN(): boolean;

    isNegative(): boolean;
    isNeg(): boolean;

    isPositive(): boolean;
    isPos(): boolean;

    isZero(): boolean;

    lessThan(n: Decimal.Value): boolean;
    lt(n: Decimal.Value): boolean;

    lessThanOrEqualTo(n: Decimal.Value): boolean;
    lte(n: Decimal.Value): boolean;

    logarithm(n?: Decimal.Value): Decimal;
    log(n?: Decimal.Value): Decimal;

    minus(n: Decimal.Value): Decimal;
    sub(n: Decimal.Value): Decimal;

    modulo(n: Decimal.Value): Decimal;
    mod(n: Decimal.Value): Decimal;

    naturalExponential(): Decimal;
    exp(): Decimal;

    naturalLogarithm(): Decimal;
    ln(): Decimal;

    negated(): Decimal;
    neg(): Decimal;

    plus(n: Decimal.Value): Decimal;
    add(n: Decimal.Value): Decimal;

    precision(includeZeros?: boolean): number;
    sd(includeZeros?: boolean): number;

    round(): Decimal;

    sine() : Decimal;
    sin() : Decimal;

    squareRoot(): Decimal;
    sqrt(): Decimal;

    tangent() : Decimal;
    tan() : Decimal;

    times(n: Decimal.Value): Decimal;
    mul(n: Decimal.Value) : Decimal;

    toBinary(significantDigits?: number): string;
    toBinary(significantDigits: number, rounding: Decimal.Rounding): string;

    toDecimalPlaces(decimalPlaces?: number): Decimal;
    toDecimalPlaces(decimalPlaces: number, rounding: Decimal.Rounding): Decimal;
    toDP(decimalPlaces?: number): Decimal;
    toDP(decimalPlaces: number, rounding: Decimal.Rounding): Decimal;

    toExponential(decimalPlaces?: number): string;
    toExponential(decimalPlaces: number, rounding: Decimal.Rounding): string;

    toFixed(decimalPlaces?: number): string;
    toFixed(decimalPlaces: number, rounding: Decimal.Rounding): string;

    toFraction(max_denominator?: Decimal.Value): Decimal[];

    toHexadecimal(significantDigits?: number): string;
    toHexadecimal(significantDigits: number, rounding: Decimal.Rounding): string;
    toHex(significantDigits?: number): string;
    toHex(significantDigits: number, rounding?: Decimal.Rounding): string;

    toJSON(): string;

    toNearest(n: Decimal.Value, rounding?: Decimal.Rounding): Decimal;

    toNumber(): number;

    toOctal(significantDigits?: number): string;
    toOctal(significantDigits: number, rounding: Decimal.Rounding): string;

    toPower(n: Decimal.Value): Decimal;
    pow(n: Decimal.Value): Decimal;

    toPrecision(significantDigits?: number): string;
    toPrecision(significantDigits: number, rounding: Decimal.Rounding): string;

    toSignificantDigits(significantDigits?: number): Decimal;
    toSignificantDigits(significantDigits: number, rounding: Decimal.Rounding): Decimal;
    toSD(significantDigits?: number): Decimal;
    toSD(significantDigits: number, rounding: Decimal.Rounding): Decimal;

    toString(): string;

    truncated(): Decimal;
    trunc(): Decimal;

    valueOf(): string;

    static abs(n: Decimal.Value): Decimal;
    static acos(n: Decimal.Value): Decimal;
    static acosh(n: Decimal.Value): Decimal;
    static add(x: Decimal.Value, y: Decimal.Value): Decimal;
    static asin(n: Decimal.Value): Decimal;
    static asinh(n: Decimal.Value): Decimal;
    static atan(n: Decimal.Value): Decimal;
    static atanh(n: Decimal.Value): Decimal;
    static atan2(y: Decimal.Value, x: Decimal.Value): Decimal;
    static cbrt(n: Decimal.Value): Decimal;
    static ceil(n: Decimal.Value): Decimal;
    static clamp(n: Decimal.Value, min: Decimal.Value, max: Decimal.Value): Decimal;
    static clone(object?: Decimal.Config): Decimal.Constructor;
    static config(object: Decimal.Config): Decimal.Constructor;
    static cos(n: Decimal.Value): Decimal;
    static cosh(n: Decimal.Value): Decimal;
    static div(x: Decimal.Value, y: Decimal.Value): Decimal;
    static exp(n: Decimal.Value): Decimal;
    static floor(n: Decimal.Value): Decimal;
    static hypot(...n: Decimal.Value[]): Decimal;
    static isDecimal(object: any): boolean
    static ln(n: Decimal.Value): Decimal;
    static log(n: Decimal.Value, base?: Decimal.Value): Decimal;
    static log2(n: Decimal.Value): Decimal;
    static log10(n: Decimal.Value): Decimal;
    static max(...n: Decimal.Value[]): Decimal;
    static min(...n: Decimal.Value[]): Decimal;
    static mod(x: Decimal.Value, y: Decimal.Value): Decimal;
    static mul(x: Decimal.Value, y: Decimal.Value): Decimal;
    static noConflict(): Decimal.Constructor;   // Browser only
    static pow(base: Decimal.Value, exponent: Decimal.Value): Decimal;
    static random(significantDigits?: number): Decimal;
    static round(n: Decimal.Value): Decimal;
    static set(object: Decimal.Config): Decimal.Constructor;
    static sign(n: Decimal.Value): Decimal;
    static sin(n: Decimal.Value): Decimal;
    static sinh(n: Decimal.Value): Decimal;
    static sqrt(n: Decimal.Value): Decimal;
    static sub(x: Decimal.Value, y: Decimal.Value): Decimal;
    static sum(...n: Decimal.Value[]): Decimal;
    static tan(n: Decimal.Value): Decimal;
    static tanh(n: Decimal.Value): Decimal;
    static trunc(n: Decimal.Value): Decimal;

    static readonly default?: Decimal.Constructor;
    static readonly Decimal?: Decimal.Constructor;

    static readonly precision: number;
    static readonly rounding: Decimal.Rounding;
    static readonly toExpNeg: number;
    static readonly toExpPos: number;
    static readonly minE: number;
    static readonly maxE: number;
    static readonly crypto: boolean;
    static readonly modulo: Decimal.Modulo;

    static readonly ROUND_UP: 0;
    static readonly ROUND_DOWN: 1;
    static readonly ROUND_CEIL: 2;
    static readonly ROUND_FLOOR: 3;
    static readonly ROUND_HALF_UP: 4;
    static readonly ROUND_HALF_DOWN: 5;
    static readonly ROUND_HALF_EVEN: 6;
    static readonly ROUND_HALF_CEIL: 7;
    static readonly ROUND_HALF_FLOOR: 8;
    static readonly EUCLID: 9;
}

/**
 * Interface for any Decimal.js-like library
 * Allows us to accept Decimal.js from different
 * versions and some compatible alternatives
 */
export declare interface DecimalJsLike {
    d: number[];
    e: number;
    s: number;
}

export declare const decompressFromBase64: any;

declare type Dictionary<T> = {
    [key: string]: T;
};

declare interface Dictionary_2<T> {
    [key: string]: T;
}

export declare namespace DMMF {
    export interface Document {
        datamodel: Datamodel;
        schema: Schema;
        mappings: Mappings;
    }
    export interface Mappings {
        modelOperations: ModelMapping[];
        otherOperations: {
            read: string[];
            write: string[];
        };
    }
    export interface OtherOperationMappings {
        read: string[];
        write: string[];
    }
    export interface DatamodelEnum {
        name: string;
        values: EnumValue[];
        dbName?: string | null;
        documentation?: string;
    }
    export interface SchemaEnum {
        name: string;
        values: string[];
    }
    export interface EnumValue {
        name: string;
        dbName: string | null;
    }
    export interface Datamodel {
        models: Model[];
        enums: DatamodelEnum[];
        types: Model[];
    }
    export interface uniqueIndex {
        name: string;
        fields: string[];
    }
    export interface PrimaryKey {
        name: string | null;
        fields: string[];
    }
    export interface Model {
        name: string;
        dbName: string | null;
        fields: Field[];
        fieldMap?: Record<string, Field>;
        uniqueFields: string[][];
        uniqueIndexes: uniqueIndex[];
        documentation?: string;
        primaryKey: PrimaryKey | null;
        [key: string]: any;
    }
    export type FieldKind = 'scalar' | 'object' | 'enum' | 'unsupported';
    export type FieldNamespace = 'model' | 'prisma';
    export type FieldLocation = 'scalar' | 'inputObjectTypes' | 'outputObjectTypes' | 'enumTypes';
    export interface Field {
        kind: FieldKind;
        name: string;
        isRequired: boolean;
        isList: boolean;
        isUnique: boolean;
        isId: boolean;
        isReadOnly: boolean;
        isGenerated?: boolean;
        isUpdatedAt?: boolean;
        /**
         * Describes the data type in the same the way is is defined in the Prisma schema:
         * BigInt, Boolean, Bytes, DateTime, Decimal, Float, Int, JSON, String, $ModelName
         */
        type: string;
        dbNames?: string[] | null;
        hasDefaultValue: boolean;
        default?: FieldDefault | FieldDefaultScalar | FieldDefaultScalar[];
        relationFromFields?: string[];
        relationToFields?: any[];
        relationOnDelete?: string;
        relationName?: string;
        documentation?: string;
        [key: string]: any;
    }
    export interface FieldDefault {
        name: string;
        args: any[];
    }
    export type FieldDefaultScalar = string | boolean | number;
    export interface Schema {
        rootQueryType?: string;
        rootMutationType?: string;
        inputObjectTypes: {
            model?: InputType[];
            prisma: InputType[];
        };
        outputObjectTypes: {
            model: OutputType[];
            prisma: OutputType[];
        };
        enumTypes: {
            model?: SchemaEnum[];
            prisma: SchemaEnum[];
        };
    }
    export interface Query {
        name: string;
        args: SchemaArg[];
        output: QueryOutput;
    }
    export interface QueryOutput {
        name: string;
        isRequired: boolean;
        isList: boolean;
    }
    export type ArgType = string | InputType | SchemaEnum;
    export interface SchemaArgInputType {
        isList: boolean;
        type: ArgType;
        location: FieldLocation;
        namespace?: FieldNamespace;
    }
    export interface SchemaArg {
        name: string;
        comment?: string;
        isNullable: boolean;
        isRequired: boolean;
        inputTypes: SchemaArgInputType[];
        deprecation?: Deprecation;
    }
    export interface OutputType {
        name: string;
        fields: SchemaField[];
        fieldMap?: Record<string, SchemaField>;
    }
    export interface SchemaField {
        name: string;
        isNullable?: boolean;
        outputType: {
            type: string | OutputType | SchemaEnum;
            isList: boolean;
            location: FieldLocation;
            namespace?: FieldNamespace;
        };
        args: SchemaArg[];
        deprecation?: Deprecation;
        documentation?: string;
    }
    export interface Deprecation {
        sinceVersion: string;
        reason: string;
        plannedRemovalVersion?: string;
    }
    export interface InputType {
        name: string;
        constraints: {
            maxNumFields: number | null;
            minNumFields: number | null;
        };
        fields: SchemaArg[];
        fieldMap?: Record<string, SchemaArg>;
    }
    export interface ModelMapping {
        model: string;
        plural: string;
        findUnique?: string | null;
        findFirst?: string | null;
        findMany?: string | null;
        create?: string | null;
        createMany?: string | null;
        update?: string | null;
        updateMany?: string | null;
        upsert?: string | null;
        delete?: string | null;
        deleteMany?: string | null;
        aggregate?: string | null;
        groupBy?: string | null;
        count?: string | null;
        findRaw?: string | null;
        aggregateRaw?: string | null;
    }
    export enum ModelAction {
        findUnique = "findUnique",
        findFirst = "findFirst",
        findMany = "findMany",
        create = "create",
        createMany = "createMany",
        update = "update",
        updateMany = "updateMany",
        upsert = "upsert",
        delete = "delete",
        deleteMany = "deleteMany",
        groupBy = "groupBy",
        count = "count",
        aggregate = "aggregate",
        findRaw = "findRaw",
        aggregateRaw = "aggregateRaw"
    }
}

export declare interface DMMFClass extends BaseDMMFHelper, DMMFSchemaHelper {
}

export declare class DMMFClass {
    constructor(dmmf: DMMF.Document);
}

declare class DMMFDatamodelHelper implements Pick<DMMF.Document, 'datamodel'> {
    datamodel: DMMF.Datamodel;
    datamodelEnumMap: Dictionary_2<DMMF.DatamodelEnum>;
    modelMap: Dictionary_2<DMMF.Model>;
    typeMap: Dictionary_2<DMMF.Model>;
    typeAndModelMap: Dictionary_2<DMMF.Model>;
    constructor({ datamodel }: Pick<DMMF.Document, 'datamodel'>);
    getDatamodelEnumMap(): Dictionary_2<DMMF.DatamodelEnum>;
    getModelMap(): Dictionary_2<DMMF.Model>;
    getTypeMap(): Dictionary_2<DMMF.Model>;
    getTypeModelMap(): Dictionary_2<DMMF.Model>;
}

declare class DMMFMappingsHelper implements Pick<DMMF.Document, 'mappings'> {
    mappings: DMMF.Mappings;
    mappingsMap: Dictionary_2<DMMF.ModelMapping>;
    constructor({ mappings }: Pick<DMMF.Document, 'mappings'>);
    getMappingsMap(): Dictionary_2<DMMF.ModelMapping>;
}

declare class DMMFSchemaHelper implements Pick<DMMF.Document, 'schema'> {
    schema: DMMF.Schema;
    queryType: DMMF.OutputType;
    mutationType: DMMF.OutputType;
    outputTypes: {
        model: DMMF.OutputType[];
        prisma: DMMF.OutputType[];
    };
    outputTypeMap: Dictionary_2<DMMF.OutputType>;
    inputObjectTypes: {
        model?: DMMF.InputType[];
        prisma: DMMF.InputType[];
    };
    inputTypeMap: Dictionary_2<DMMF.InputType>;
    enumMap: Dictionary_2<DMMF.SchemaEnum>;
    rootFieldMap: Dictionary_2<DMMF.SchemaField>;
    constructor({ schema }: Pick<DMMF.Document, 'schema'>);
    get [Symbol.toStringTag](): string;
    outputTypeToMergedOutputType: (outputType: DMMF.OutputType) => DMMF.OutputType;
    resolveOutputTypes(): void;
    resolveInputTypes(): void;
    resolveFieldArgumentTypes(): void;
    getQueryType(): DMMF.OutputType;
    getMutationType(): DMMF.OutputType;
    getOutputTypes(): {
        model: DMMF.OutputType[];
        prisma: DMMF.OutputType[];
    };
    getEnumMap(): Dictionary_2<DMMF.SchemaEnum>;
    getMergedOutputTypeMap(): Dictionary_2<DMMF.OutputType>;
    getInputTypeMap(): Dictionary_2<DMMF.InputType>;
    getRootFieldMap(): Dictionary_2<DMMF.SchemaField>;
}

declare class Document_2 {
    readonly type: 'query' | 'mutation';
    readonly children: Field[];
    constructor(type: 'query' | 'mutation', children: Field[]);
    get [Symbol.toStringTag](): string;
    toString(): string;
    validate(select?: any, isTopLevelQuery?: boolean, originalMethod?: string, errorFormat?: 'pretty' | 'minimal' | 'colorless', validationCallsite?: any): void;
    protected printFieldError: ({ error }: FieldError, missingItems: MissingItem[], minimal: boolean) => string | undefined;
    protected printArgError: ({ error, path, id }: ArgError, hasMissingItems: boolean, minimal: boolean) => string | undefined;
    /**
     * As we're allowing both single objects and array of objects for list inputs, we need to remove incorrect
     * zero indexes from the path
     * @param inputPath e.g. ['where', 'AND', 0, 'id']
     * @param select select object
     */
    private normalizePath;
}

declare interface DocumentInput {
    dmmf: DMMFClass;
    rootTypeName: 'query' | 'mutation';
    rootField: string;
    select?: any;
}

/**
 * Placeholder value for "no text".
 */
export declare const empty: Sql;

declare interface EmptyIncludeError {
    type: 'emptyInclude';
    field: DMMF.SchemaField;
}

declare interface EmptySelectError {
    type: 'emptySelect';
    field: DMMF.SchemaField;
}

export declare abstract class Engine {
    abstract on(event: EngineEventType, listener: (args?: any) => any): void;
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract getConfig(): Promise<GetConfigResult>;
    abstract getDmmf(): Promise<DMMF.Document>;
    abstract version(forceRun?: boolean): Promise<string> | string;
    abstract request<T>(query: string, headers?: QueryEngineRequestHeaders, numTry?: number): Promise<QueryEngineResult<T>>;
    abstract requestBatch<T>(queries: string[], headers?: QueryEngineRequestHeaders, transaction?: boolean, numTry?: number): Promise<QueryEngineResult<T>[]>;
    abstract transaction(action: 'start', headers: Transaction.TransactionHeaders, options: Transaction.Options): Promise<Transaction.Info>;
    abstract transaction(action: 'commit', headers: Transaction.TransactionHeaders, info: Transaction.Info): Promise<void>;
    abstract transaction(action: 'rollback', headers: Transaction.TransactionHeaders, info: Transaction.Info): Promise<void>;
    abstract metrics(options: MetricsOptionsJson): Promise<Metrics>;
    abstract metrics(options: MetricsOptionsPrometheus): Promise<string>;
    abstract _hasPreviewFlag(feature: string): Boolean;
}

declare interface EngineConfig {
    cwd?: string;
    dirname?: string;
    datamodelPath: string;
    enableDebugLogs?: boolean;
    allowTriggerPanic?: boolean;
    prismaPath?: string;
    fetcher?: (query: string) => Promise<{
        data?: any;
        error?: any;
    }>;
    generator?: GeneratorConfig;
    datasources?: DatasourceOverwrite[];
    showColors?: boolean;
    logQueries?: boolean;
    logLevel?: 'info' | 'warn';
    env: Record<string, string>;
    flags?: string[];
    clientVersion?: string;
    previewFeatures?: string[];
    engineEndpoint?: string;
    activeProvider?: string;
    /**
     * The contents of the schema encoded into a string
     * @remarks only used for the purpose of data proxy
     */
    inlineSchema?: string;
    /**
     * The contents of the datasource url saved in a string
     * @remarks only used for the purpose of data proxy
     */
    inlineDatasources?: any;
    /**
     * The string hash that was produced for a given schema
     * @remarks only used for the purpose of data proxy
     */
    inlineSchemaHash?: string;
}

declare type EngineEventType = 'query' | 'info' | 'warn' | 'error' | 'beforeExit';

declare type EngineMiddleware<T = unknown> = (params: EngineMiddlewareParams, next: (params: EngineMiddlewareParams) => Promise<{
    data: T;
    elapsed: number;
}>) => Promise<{
    data: T;
    elapsed: number;
}>;

declare type EngineMiddlewareParams = {
    document: Document_2;
    runInTransaction?: boolean;
};

declare interface EnvValue {
    fromEnvVar: null | string;
    value: string;
}

declare interface EnvValue_2 {
    fromEnvVar: string | null;
    value: string | null;
}

declare type ErrorFormat = 'pretty' | 'colorless' | 'minimal';

declare class Field {
    readonly name: string;
    readonly args?: Args;
    readonly children?: Field[];
    readonly error?: InvalidFieldError;
    readonly hasInvalidChild: boolean;
    readonly hasInvalidArg: boolean;
    readonly schemaField?: DMMF.SchemaField;
    constructor({ name, args, children, error, schemaField }: FieldArgs);
    get [Symbol.toStringTag](): string;
    toString(): string;
    collectErrors(prefix?: string): {
        fieldErrors: FieldError[];
        argErrors: ArgError[];
    };
}

declare interface FieldArgs {
    name: string;
    schemaField?: DMMF.SchemaField;
    args?: Args;
    children?: Field[];
    error?: InvalidFieldError;
}

declare interface FieldError {
    path: string[];
    error: InvalidFieldError;
}

/**
 * Find paths that match a set of regexes
 * @param root to start from
 * @param match to match against
 * @param types to select files, folders, links
 * @param deep to recurse in the directory tree
 * @param limit to limit the results
 * @param handler to further filter results
 * @param found to add to already found
 * @param seen to add to already seen
 * @returns found paths (symlinks preserved)
 */
export declare function findSync(root: string, match: (RegExp | string)[], types?: ('f' | 'd' | 'l')[], deep?: ('d' | 'l')[], limit?: number, handler?: Handler, found?: string[], seen?: Record<string, true>): string[];

declare interface GeneratorConfig {
    name: string;
    output: EnvValue | null;
    isCustomOutput?: boolean;
    provider: EnvValue;
    config: Dictionary<string>;
    binaryTargets: BinaryTargetsEnvValue[];
    previewFeatures: string[];
}

declare type GetConfigResult = {
    datasources: DataSource[];
    generators: GeneratorConfig[];
};

export declare function getPrismaClient(config: GetPrismaClientConfig): new (optionsArg?: PrismaClientOptions) => Client;

/**
 * Config that is stored into the generated client. When the generated client is
 * loaded, this same config is passed to {@link getPrismaClient} which creates a
 * closure with that config around a non-instantiated [[PrismaClient]].
 */
declare interface GetPrismaClientConfig {
    document: Omit<DMMF.Document, 'schema'>;
    generator?: GeneratorConfig;
    sqliteDatasourceOverrides?: DatasourceOverwrite[];
    relativeEnvPaths: {
        rootEnvPath?: string | null;
        schemaEnvPath?: string | null;
    };
    relativePath: string;
    dirname: string;
    filename?: string;
    clientVersion?: string;
    engineVersion?: string;
    datasourceNames: string[];
    activeProvider: string;
    /**
     * True when `--data-proxy` is passed to `prisma generate`
     * If enabled, we disregard the generator config engineType.
     * It means that `--data-proxy` binds you to the Data Proxy.
     */
    dataProxy: boolean;
    /**
     * The contents of the schema encoded into a string
     * @remarks only used for the purpose of data proxy
     */
    inlineSchema?: string;
    /**
     * A special env object just for the data proxy edge runtime.
     * Allows bundlers to inject their own env variables (Vercel).
     * Allows platforms to declare global variables as env (Workers).
     * @remarks only used for the purpose of data proxy
     */
    injectableEdgeEnv?: LoadedEnv;
    /**
     * The contents of the datasource url saved in a string.
     * This can either be an env var name or connection string.
     * It is needed by the client to connect to the Data Proxy.
     * @remarks only used for the purpose of data proxy
     */
    inlineDatasources?: InlineDatasources;
    /**
     * The string hash that was produced for a given schema
     * @remarks only used for the purpose of data proxy
     */
    inlineSchemaHash?: string;
}

declare type HandleErrorParams = {
    error: any;
    clientMethod: string;
    callsite?: string;
};

declare type Handler = (base: string, item: string, type: ItemType) => boolean | string;

declare type HookParams = {
    query: string;
    path: string[];
    rootField?: string;
    typeName?: string;
    document: any;
    clientMethod: string;
    args: any;
};

declare type Hooks = {
    beforeRequest?: (options: HookParams) => any;
};

declare interface IncludeAndSelectError {
    type: 'includeAndSelect';
    field: DMMF.SchemaField;
}

declare type Info = {
    id: string;
};

declare type InlineDatasources = {
    [name in InternalDatasource['name']]: {
        url: InternalDatasource['url'];
    };
};

declare type InstanceRejectOnNotFound = RejectOnNotFound | Record<string, RejectOnNotFound> | Record<string, Record<string, RejectOnNotFound>>;

declare interface InternalDatasource {
    name: string;
    activeProvider: ConnectorType_2;
    provider: ConnectorType_2;
    url: EnvValue_2;
    config: any;
}

declare type InternalRequestParams = {
    /**
     * The original client method being called.
     * Even though the rootField / operation can be changed,
     * this method stays as it is, as it's what the user's
     * code looks like
     */
    clientMethod: string;
    /**
     * Name of js model that triggered the request. Might be used
     * for warnings or error messages
     */
    jsModelName?: string;
    callsite?: string;
    /** Headers metadata that will be passed to the Engine */
    headers?: Record<string, string>;
    transactionId?: string | number;
    unpacker?: Unpacker;
    lock?: PromiseLike<void>;
} & QueryMiddlewareParams;

declare type InvalidArgError = InvalidArgNameError | MissingArgError | InvalidArgTypeError | AtLeastOneError | AtMostOneError | InvalidNullArgError;

/**
 * This error occurs if the user provides an arg name that doens't exist
 */
declare interface InvalidArgNameError {
    type: 'invalidName';
    providedName: string;
    providedValue: any;
    didYouMeanArg?: string;
    didYouMeanField?: string;
    originalType: DMMF.ArgType;
    possibilities?: DMMF.SchemaArgInputType[];
    outputType?: DMMF.OutputType;
}

/**
 * If the scalar type of an arg is not matching what is required
 */
declare interface InvalidArgTypeError {
    type: 'invalidType';
    argName: string;
    requiredType: {
        bestFittingType: DMMF.SchemaArgInputType;
        inputType: DMMF.SchemaArgInputType[];
    };
    providedValue: any;
}

declare type InvalidFieldError = InvalidFieldNameError | InvalidFieldTypeError | EmptySelectError | NoTrueSelectError | IncludeAndSelectError | EmptyIncludeError;

declare interface InvalidFieldNameError {
    type: 'invalidFieldName';
    modelName: string;
    didYouMean?: string | null;
    providedName: string;
    isInclude?: boolean;
    isIncludeScalar?: boolean;
    outputType: DMMF.OutputType;
}

declare interface InvalidFieldTypeError {
    type: 'invalidFieldType';
    modelName: string;
    fieldName: string;
    providedValue: any;
}

/**
 * If a user incorrectly provided null where she shouldn't have
 */
declare interface InvalidNullArgError {
    type: 'invalidNullArg';
    name: string;
    invalidType: DMMF.SchemaArgInputType[];
    atLeastOne: boolean;
    atMostOne: boolean;
}

declare type ItemType = 'd' | 'f' | 'l';

declare interface Job {
    resolve: (data: any) => void;
    reject: (data: any) => void;
    request: any;
}

/**
 * Create a SQL query for a list of values.
 */
export declare function join(values: RawValue[], separator?: string): Sql;

declare class JsonNull extends NullTypesEnumValue {
}

declare type LoadedEnv = {
    message?: string;
    parsed: {
        [x: string]: string;
    };
} | undefined;

declare type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};

declare type LogLevel = 'info' | 'query' | 'warn' | 'error';

export declare function makeDocument({ dmmf, rootTypeName, rootField, select }: DocumentInput): Document_2;

export declare type Metric<T> = {
    key: string;
    value: T;
    labels: Record<string, string>;
    description: string;
};

export declare type MetricHistogram = {
    buckets: MetricHistogramBucket[];
    sum: number;
    count: number;
};

export declare type MetricHistogramBucket = [maxValue: number, count: number];

export declare type Metrics = {
    counters: Metric<number>[];
    gauges: Metric<number>[];
    histograms: Metric<MetricHistogram>[];
};

export declare class MetricsClient {
    private _engine;
    constructor(engine: Engine);
    /**
     * Returns all metrics gathered up to this point in prometheus format.
     * Result of this call can be exposed directly to prometheus scraping endpoint
     *
     * @param options
     * @returns
     */
    prometheus(options?: MetricsOptions): Promise<string>;
    /**
     * Returns all metrics gathered up to this point in prometheus format.
     *
     * @param options
     * @returns
     */
    json(options?: MetricsOptions): Promise<Metrics>;
}

declare type MetricsOptions = {
    /**
     * Labels to add to every metrics in key-value format
     */
    globalLabels?: Record<string, string>;
};

declare type MetricsOptionsCommon = {
    globalLabels?: Record<string, string>;
};

declare type MetricsOptionsJson = {
    format: 'json';
} & MetricsOptionsCommon;

declare type MetricsOptionsPrometheus = {
    format: 'prometheus';
} & MetricsOptionsCommon;

/**
 * Opposite of InvalidArgNameError - if the user *doesn't* provide an arg that should be provided
 * This error both happens with an implicit and explicit `undefined`
 */
declare interface MissingArgError {
    type: 'missingArg';
    missingName: string;
    missingArg: DMMF.SchemaArg;
    atLeastOne: boolean;
    atMostOne: boolean;
}

declare interface MissingItem {
    path: string;
    isRequired: boolean;
    type: string | object;
}

declare type Namespace = 'all' | 'engine';

export declare class NotFoundError extends Error {
    constructor(message: string);
}

declare interface NoTrueSelectError {
    type: 'noTrueSelect';
    field: DMMF.SchemaField;
}

declare class NullTypesEnumValue extends ObjectEnumValue {
    _getNamespace(): string;
}

/**
 * Base class for unique values of object-valued enums.
 */
declare abstract class ObjectEnumValue {
    constructor(arg?: symbol);
    abstract _getNamespace(): string;
    _getName(): string;
    toString(): string;
}

export declare const objectEnumValues: {
    classes: {
        DbNull: typeof DbNull;
        JsonNull: typeof JsonNull;
        AnyNull: typeof AnyNull;
    };
    instances: {
        DbNull: DbNull;
        JsonNull: JsonNull;
        AnyNull: AnyNull;
    };
};

/**
 * maxWait ?= 2000
 * timeout ?= 5000
 */
declare type Options = {
    maxWait?: number;
    timeout?: number;
};

export declare class PrismaClientInitializationError extends Error {
    clientVersion: string;
    errorCode?: string;
    constructor(message: string, clientVersion: string, errorCode?: string);
    get [Symbol.toStringTag](): string;
}

export declare class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, unknown>;
    clientVersion: string;
    constructor(message: string, code: string, clientVersion: string, meta?: any);
    get [Symbol.toStringTag](): string;
}

export declare interface PrismaClientOptions {
    /**
     * Will throw an Error if findUnique returns null
     */
    rejectOnNotFound?: InstanceRejectOnNotFound;
    /**
     * Overwrites the datasource url from your prisma.schema file
     */
    datasources?: Datasources;
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * \`\`\`
     * // Defaults to stdout
     * log: ['query', 'info', 'warn']
     *
     * // Emit as events
     * log: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     * ]
     * \`\`\`
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: Array<LogLevel | LogDefinition>;
    /**
     * @internal
     * You probably don't want to use this. \`__internal\` is used by internal tooling.
     */
    __internal?: {
        debug?: boolean;
        hooks?: Hooks;
        engine?: {
            cwd?: string;
            binaryPath?: string;
            endpoint?: string;
            allowTriggerPanic?: boolean;
        };
    };
}

export declare class PrismaClientRustPanicError extends Error {
    clientVersion: string;
    constructor(message: string, clientVersion: string);
    get [Symbol.toStringTag](): string;
}

export declare class PrismaClientUnknownRequestError extends Error {
    clientVersion: string;
    constructor(message: string, clientVersion: string);
    get [Symbol.toStringTag](): string;
}

export declare class PrismaClientValidationError extends Error {
    get [Symbol.toStringTag](): string;
}

declare type QueryEngineRequestHeaders = {
    traceparent?: string;
    transactionId?: string;
    fatal?: string;
};

declare type QueryEngineResult<T> = {
    data: T;
    elapsed: number;
};

declare type QueryMiddleware<T = unknown> = (params: QueryMiddlewareParams, next: (params: QueryMiddlewareParams) => Promise<T>) => Promise<T>;

declare type QueryMiddlewareParams = {
    /** The model this is executed on */
    model?: string;
    /** The action that is being handled */
    action: Action;
    /** TODO what is this */
    dataPath: string[];
    /** TODO what is this */
    runInTransaction: boolean;
    /** TODO what is this */
    args: any;
};

/**
 * Create raw SQL statement.
 */
export declare function raw(value: string): Sql;

export declare type RawValue = Value | Sql;

declare type RejectOnNotFound = boolean | ((error: Error) => Error) | undefined;

declare type Request_2 = {
    document: Document_2;
    runInTransaction?: boolean;
    transactionId?: string | number;
    headers?: Record<string, string>;
};

declare class RequestHandler {
    client: Client;
    hooks: any;
    dataloader: DataLoader<Request_2>;
    constructor(client: Client, hooks?: any);
    request({ document, dataPath, rootField, typeName, isList, callsite, rejectOnNotFound, clientMethod, runInTransaction, engineHook, args, headers, transactionId, unpacker, }: RequestParams): Promise<any>;
    handleRequestError({ error, clientMethod, callsite }: HandleErrorParams): never;
    sanitizeMessage(message: any): any;
    unpack(document: any, data: any, path: any, rootField: any, unpacker?: Unpacker): any;
    get [Symbol.toStringTag](): string;
}

declare type RequestParams = {
    document: Document_2;
    dataPath: string[];
    rootField: string;
    typeName: string;
    isList: boolean;
    clientMethod: string;
    callsite?: string;
    rejectOnNotFound?: RejectOnNotFound;
    runInTransaction?: boolean;
    engineHook?: EngineMiddleware;
    args: any;
    headers?: Record<string, string>;
    transactionId?: string | number;
    unpacker?: Unpacker;
};

/**
 * A SQL instance can be nested within each other to build SQL strings.
 */
export declare class Sql {
    values: Value[];
    strings: string[];
    constructor(rawStrings: ReadonlyArray<string>, rawValues: ReadonlyArray<RawValue>);
    get text(): string;
    get sql(): string;
    [inspect.custom](): {
        text: string;
        sql: string;
        values: Value[];
    };
}

/**
 * Create a SQL object from a template string.
 */
export declare function sqltag(strings: ReadonlyArray<string>, ...values: RawValue[]): Sql;

declare namespace sqlTemplateTag {
    export {
        join,
        raw,
        sqltag,
        Value,
        RawValue,
        Sql,
        empty,
        sqltag as default
    }
}

declare namespace Transaction {
    export {
        Options,
        Info,
        TransactionHeaders
    }
}

declare type TransactionHeaders = {
    traceparent?: string;
};

export declare function transformDocument(document: Document_2): Document_2;

declare const TX_ID: unique symbol;

/**
 * Unpacks the result of a data object and maps DateTime fields to instances of `Date` inplace
 * @param options: UnpackOptions
 */
export declare function unpack({ document, path, data }: UnpackOptions): any;

declare type Unpacker = (data: any) => any;

declare interface UnpackOptions {
    document: Document_2;
    path: string[];
    data: any;
}

export declare type Value = string | number | boolean | object | null | undefined;

export declare function warnEnvConflicts(envPaths: any): void;

export { }
