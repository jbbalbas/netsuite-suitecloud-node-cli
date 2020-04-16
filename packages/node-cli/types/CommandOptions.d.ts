import ConsoleLogger from "../src/loggers/ConsoleLogger";
import OutputFormatter from "../src/commands/outputFormatters/OutputFormatter";
import { ActionResult } from "../src/commands/actionresult/ActionResult";

export interface CommandParameters extends BasicCommandOptions { 
    getCommandQuestionsFunc: Function; 
    preActionFunc: Function; 
    actionFunc: Function;
    outputFormatter: OutputFormatter;
    consoleLogger?: ConsoleLogger;
    options?: {[key: string]: any};
}

export interface BaseCommandParameters extends BasicCommandOptions {
    runInInteractiveMode?: boolean;
    executionPath: string;
    consoleLogger: ConsoleLogger;
    outputFormatter: OutputFormatter;
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