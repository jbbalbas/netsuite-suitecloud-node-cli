import { OperationResult } from "./OperationResult";

export interface CommandParameters extends BasicCommandOptions { 
    getCommandQuestionsFunc: Function; 
    preActionFunc: Function; 
    action: Function;
    formatOutputFunc?: (x: OperationResult) => void;
    options?: {[key: string]: any};
}

export interface BaseCommandParameters extends BasicCommandOptions {
    runInInteractiveMode?: boolean;
    executionPath: string;
}

export interface LocalCommandOptions extends BaseCommandParameters {
    colors: any;
    translation: any;
    filesystem: any;
}

interface BasicCommandOptions {
    commandMetadata: any; 
    projectFolder: string; 
}