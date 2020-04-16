/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import * as FileUtils from '../../utils/FileUtils';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import { ERRORS } from '../../services/TranslationKeys';
import { FILES } from '../../ApplicationConstants';
import assert from 'assert';
import path from 'path';

const DEFAULT_AUTH_ID_PROPERTY = 'defaultAuthId';

export default class AuthenticationService {
	private excutionPath: string;
	private CACHED_DEFAULT_AUTH_ID: any;
	constructor(executionPath: string) {
		assert(executionPath);
		this.CACHED_DEFAULT_AUTH_ID = null;
		this.excutionPath = executionPath;
	}

	public setDefaultAuthentication(authId?: string) {
		try {
			// nest the values into a DEFAULT_AUTH_ID_PROPERTY property
			const projectConfiguration = {
				[DEFAULT_AUTH_ID_PROPERTY]: authId,
			};
			FileUtils.create(path.join(this.excutionPath, FILES.PROJECT_JSON), projectConfiguration);
		} catch (error) {
			const errorMessage = error != null && error.message ? NodeTranslationService.getMessage(ERRORS.ADD_ERROR_LINE, error.message) : '';
			throw NodeTranslationService.getMessage(ERRORS.WRITING_PROJECT_JSON, errorMessage);
		}
	}

	public getProjectDefaultAuthId() {
		if (this.CACHED_DEFAULT_AUTH_ID) {
			return this.CACHED_DEFAULT_AUTH_ID;
		}

		const projectFilePath = path.join(this.excutionPath, FILES.PROJECT_JSON);

		if (FileUtils.exists(projectFilePath)) {
			try {
				const fileContentJson = FileUtils.readAsJson(projectFilePath);
				if (!fileContentJson.hasOwnProperty(DEFAULT_AUTH_ID_PROPERTY)) {
					throw NodeTranslationService.getMessage(ERRORS.MISSING_DEFAULT_AUTH_ID, DEFAULT_AUTH_ID_PROPERTY);
				}
				this.CACHED_DEFAULT_AUTH_ID = fileContentJson[DEFAULT_AUTH_ID_PROPERTY];
				return this.CACHED_DEFAULT_AUTH_ID;
			} catch (error) {
				throw NodeTranslationService.getMessage(ERRORS.WRONG_JSON_FILE, projectFilePath, error);
			}
		}
	}
};
