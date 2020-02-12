export interface OperationResult {
	resultMessage: string;
	errorMessages: string;
	errorCode: string;
	status: string;
}

export interface ProxyOperationResult extends OperationResult {
	isSettingProxy: boolean;
	proxyOverrided: boolean;
	proxyUrl: string;
}

export interface CreateProjectOperationResult extends OperationResult {
	operationResult: OperationResult;
	projectType: string;
	projectDirectory: string;
	includeUnitTesting: boolean;
	npmInstallSuccess: boolean;
}

export interface AddDependenciesOperationResult extends OperationResult {
	data: string[];
}

export interface ValidateOperationResult extends OperationResult {
	operationResult: {
		data: string[];
	} & OperationResult;
	isServerValidation: boolean;
	SDKParams: ValidateOperationSdkParams;
}

export interface ValidateOperationSdkParams {
	applycontentprotection: string;
	warnings: {
		filePath: string;
		lineNumber: string;
		message: string;
	}[];
	errors: {
		filePath: string;
		lineNumber: string;
		message: string;
	}[];
}

export interface ListFilesOperationResult extends OperationResult {
	data: string[];
}

export interface ListObjectsOperationResult extends OperationResult {
	data: {
		type: string;
		scriptId: string;
	}[];
}

export interface ImportObjectsOperationResult extends OperationResult {
	data: {
		successfulImports: {
			customObject: {
				id: string;
				type: string
			},
			referencedFileImportResult: {
				successfulImports: {
					path: string;
					message: string
				}[],
				failedImports: {
					path: string;
					message: string
				}[]
			}
		}[],
		failedImports: {
			customObject: {
				type: string;
				id: string;
				result: {
					message: string
				}
			}
		}[];
	}
}

export interface ImportFilesOperationResult extends OperationResult {
	data: {
		results: {
			loaded?: boolean;
			path: string;
			message?: string
		}[];
	}
}

export interface DeployOperationResult extends OperationResult {
	operationResult: OperationResult & {
		data: string[];
	};
	SDKParams: {
		[x: string]: string
	};
	flags: string[];
}

export interface UpdateOperationResult extends OperationResult {
	data: {
		type: string;
		key: string;
		message: string;
	}[];
}

export interface SetupCommandOperationResult extends OperationResult {
	mode: string;
	accountInfo: {
		companyName: string;
		roleName: string;
	};
	authId: string;
}