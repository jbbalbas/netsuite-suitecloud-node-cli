export interface CreateObjectCommandAnswer extends BaseCommandAnswer {
	type: {
		name: string; 
		prefix: string; 
		hasRelatedFiles: boolean;
	};
	objectfilename: string; 
	relatedfilename: string; 
	relatedfiledestinationfolder: string;
	folder: string;
	createrelatedfiles: boolean;
}

export interface UpdateCommandAnswer extends BaseCommandAnswer {
	filterByScriptId?: boolean;
	scriptIdFilter?: string;
	overwriteObjects: boolean;
	scriptid: string;
}

export interface ValidateCommandAnswers extends BaseCommandAnswer {
	server: boolean;
}

export interface DeployCommandAnswer extends BaseCommandAnswer {
	
}

export interface ImportObjectsCommandAnswers extends BaseCommandAnswer {
	appid: string;
	scriptid: string;
	specifyscriptid: boolean;
	specifysuiteapp: boolean;
	type: string;
	specifyObjectType: boolean;
	typeChoicesArray: string[];
	destinationfolder: string;
	project: string;
	objects_selected: {scriptId: string; type: string}[];
	overwrite_objects: boolean;
	import_referenced_suitescripts: string;
	excludefiles: boolean;
}

export interface ListFilesCommandAnswer extends BaseCommandAnswer {
	folder: string;
}

export interface ListObjectsCommandAnswer extends BaseCommandAnswer {
	specifysuiteapp: boolean;
	specifyscriptid: boolean;
	typeall: string;
}

export interface ProxyCommandAnswer extends BaseCommandAnswer {
	isSettingProxy?: boolean;
	proxyUrl?: string;
	proxyOverrided?: boolean;
	set?: string;
	clear?: boolean;
}

export interface AddDependenciesCommandAnswer extends BaseCommandAnswer {
	project: string;
}

export interface ImportFilesCommandAnswer extends BaseCommandAnswer {
	project: string;
	overwrite?: boolean;
	folder?: string;
	paths?: string | string[];
	excludeproperties?: string;
}

export interface SetupCommandAnswer extends BaseCommandAnswer {
	AUTH_MODE?: string;
	NEW_AUTH_ID?: string;
	newAuthId?:string;
	saveToken?: {
		account?: string;
		tokenId?: string;
		tokenSecret?: string;
	};
	url?: string;
	accountId?: string;
	saveTokenId?: string;
	saveTokenSecret?: string;
	developmentMode?: boolean;
	developmentModeUrl?:string;
	selected_auth_id?: string;
	authentication?: {
		authId?: string;
		accountInfo?: string;
	};
	createNewAuthentication?: boolean,
	mode?: string,
}

export interface CreateProjectCommandAnswer extends BaseCommandAnswer {
	type: string;
	projectfoldername: string;
	projectabsolutepath: string;

	overwrite: string;
	parentdirectory: string;
	projectid: string;
	projectname: string;
	projectversion: string;
	publisherid: string;
	includeunittesting: string;
}

export interface SKDWrapperCommandAnswer extends BaseCommandAnswer {
	[x: string]: string;
}

export interface BaseCommandAnswer {

}