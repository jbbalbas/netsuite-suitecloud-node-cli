export interface SDKCommandMetadata extends CommandMetadata<SDKCommandInfo> {}
export interface NodeCommandMetadata extends CommandMetadata<NodeCommandInfo> {}
export interface BaseParsedCommandMetadata extends CommandMetadata<BaseParsedCommandInfo> {}
export interface ParsedCommandMetadata extends CommandMetadata<InteractiveCommandInfo | NonInteractiveCommandInfo> {}

export interface CommandMetadata<T> {
    [x: string] : T;
}

export interface InteractiveCommandInfo extends NonInteractiveCommandInfo {
    interactiveGenerator: string;
}

export interface NonInteractiveCommandInfo extends BaseParsedCommandInfo {
    nonInteractiveGenerator: string;
    supportsInteractiveMode?: boolean;
}

export interface BaseParsedCommandInfo {
    name: string;
    sdkCommand: string;
    description: string;
    isSetupRequired: boolean;
    usage?: string;
    alias?: string;
    forceInteractiveMode?: boolean;
    nonInteractiveGenerator?: string;
    supportsInteractiveMode?: boolean;
    interactiveGenerator?: string;
    options: {
        [x: string] : (SKDCommandOption | NodeCommandOption)
    }
}

export interface SDKCommandInfo extends BaseCommandInfo<SKDCommandOption> {
    usage: string;
}

export interface NodeCommandInfo extends BaseCommandInfo<NodeCommandOption> {
    alias: string;
    forceInteractiveMode: boolean;
}

export interface BaseCommandInfo<T> {
    name: string;
    sdkCommand: string;
    description: string;
    isSetupRequired: boolean;
    options: T[];
    usage?: string;
    alias?: string;
    forceInteractiveMode?: boolean;
}


export interface SKDCommandOption extends BaseCommandOptions {
    option: string;
    usage: string;
    defaultOption: boolean;
    disableInIntegrationMode: boolean;
}

export interface NodeCommandOption extends BaseCommandOptions {
    alias: string;
}

export interface BaseCommandOptions {
    option?: string;
    usage?: string;
    defaultOption?: boolean;
    disableInIntegrationMode?: boolean;
    alias?: string;
    name: string;
    description: string;
    type: string;
    mandatory: boolean;
}

export interface CommandGeneratorMetadata {
    commandName: string;
    interactiveGenerator: string;
    nonInteractiveGenerator: string;
}