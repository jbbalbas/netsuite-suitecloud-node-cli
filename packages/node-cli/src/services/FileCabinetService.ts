/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import FileSystemService from './FileSystemService';
import path from 'path';

const SUITESCRIPTS_PATH = '/SuiteScripts';
const TEMPLATES_PATH = '/Templates';
const TEMPLATES_EMAIL_TEMPLATES_PATH = '/Templates/E-mail Templates';
const TEMPLATES_MARKETING_TEMPLATES_PATH = '/Templates/Marketing Templates';
const WEB_SITE_HOSTING_FILES_PATH = '/Web Site Hosting Files';
const SUITEAPPS = '/SuiteApps';

const UNRESTRICTED_PATHS = [
	SUITESCRIPTS_PATH,
	TEMPLATES_EMAIL_TEMPLATES_PATH,
	TEMPLATES_MARKETING_TEMPLATES_PATH,
	WEB_SITE_HOSTING_FILES_PATH,
	SUITEAPPS,
];

export default class FileCabinetService {

	private fileSystemService: FileSystemService
	private fileCabinetAbsolutePath: string;

	constructor(fileCabinetAbsolutePath: string) {
		this.fileSystemService = new FileSystemService();
		this.fileCabinetAbsolutePath = fileCabinetAbsolutePath;
	}

	public getFileCabinetRelativePath(file: string) {
		return file.replace(this.fileCabinetAbsolutePath, '').replace(/\\/g, '/');
	}

	public getFileCabinetFolders(parentFolder: string = this.fileCabinetAbsolutePath) {
		const folders: string[] = [];
		const getFoldersRecursively = (source: string) =>
			this.fileSystemService.getFoldersFromDirectory(source).forEach(folder => {
				folders.push(folder);
				if (this.shouldEnterFolder(folder)) {
					getFoldersRecursively(folder);
				}
			});
		getFoldersRecursively(parentFolder);

		return folders;
	}

	public isUnrestrictedPath(path: string) {
		return UNRESTRICTED_PATHS.some(unrestrictedPath => path.startsWith(unrestrictedPath));
	}

	private shouldEnterFolder(folder: string) {
		//Templates itself is restricted, but it has both restricted and unrestricted child folders, so we still need to get inside it.
		return this.isTemplatesFolder(folder) || (this.isUnrestrictedPath(folder) && this.fileSystemService.getFilesFromDirectory(folder).length);
	}

	private isTemplatesFolder(folder: string) {
		return folder === path.join(this.fileCabinetAbsolutePath, TEMPLATES_PATH);
	}
};
