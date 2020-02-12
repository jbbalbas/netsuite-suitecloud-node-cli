/*export interface SetupCommandContext {
    developmentMode?: boolean;
    createNewAuthentication?: true;
    newAuthId?: string;
    existingAuthId?: string;
    mode?: string;
    saveToken: {
        account?: string;
        tokenId?: string;
        tokenSecret?: string;
    },
    url?: string;
}*/

export type ActionContext = {
    commandName: string;
    arguments: { [x: string] : string };
    runInInteractiveMode: boolean;
    throwExceptionOnError?: boolean;
}

export type SDKExecutionContextOptions = {
	command: string;
	integrationMode?: boolean;
	includeProjectDefaultAuthId?: boolean;
	developmentMode?: boolean;
	params?: {[x: string]: any};
	flags?: string[];
}