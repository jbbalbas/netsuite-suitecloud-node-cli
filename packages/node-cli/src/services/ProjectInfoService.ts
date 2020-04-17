/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { ERRORS } from './TranslationKeys';
import { PROJECT_SUITEAPP, PROJECT_ACP, FILES, FOLDERS } from '../ApplicationConstants';
import CLIException from '../CLIException';
import * as FileUtils from '../utils/FileUtils';
import path from 'path';
import { NodeTranslationService } from './NodeTranslationService';
import xml2js from 'xml2js';
import assert from 'assert';

const MANIFEST_TAG_XML_PATH = '/manifest';
const PROJECT_TYPE_ATTRIBUTE = 'projecttype';
const MANIFEST_TAG_REGEX = '[\\s\\n]*<manifest.*>[^]*</manifest>[\\s\\n]*$';

export default class ProjectInfoService {
	private projectFolder: string;
	private CACHED_PROJECT_TYPE?: string;

	constructor(projectFolder: string) {
		assert(projectFolder, 'projectFolder is mandatory');
		this.CACHED_PROJECT_TYPE = undefined;
		this.projectFolder = projectFolder;
	}

	/**
	 * This validation function has to be defined in xml2js.Parser in the "validator" option
	 * When calling parserString this function will be executed for every tag of the xml we are
	 * parsing.
	 * @param {string} xmlPath Path of the tag that it's being evaluated at the current moment.
	 * @param {any} previousValue Existing value at this path if there is already one (e.g. this
	 * 								  is the second or later item in an array).
	 * @param {any} newValue Value of the tag that it's being evaluated at the current moment.
	 * @throws ValidationError if the validation fails
	 */
	private validateXml(xmlPath: string, previousValue: any, newValue: any) {
		//TODO Add more cases
		if (xmlPath === MANIFEST_TAG_XML_PATH) {
			let manifestTagAttributes = newValue['$'];
			if (!manifestTagAttributes || !manifestTagAttributes[PROJECT_TYPE_ATTRIBUTE]) {
				throw new xml2js.ValidationError(
					NodeTranslationService.getMessage(ERRORS.XML_PROJECTTYPE_ATTRIBUTE_MISSING)
				);
			} else if (
				manifestTagAttributes[PROJECT_TYPE_ATTRIBUTE] !== PROJECT_SUITEAPP &&
				manifestTagAttributes[PROJECT_TYPE_ATTRIBUTE] !== PROJECT_ACP
			) {
				throw new xml2js.ValidationError(
					NodeTranslationService.getMessage(ERRORS.XML_PROJECTTYPE_INCORRECT)
				);
			}
		}
		return newValue;
	}

	public getProjectType() {
		if (this.CACHED_PROJECT_TYPE) {
			return this.CACHED_PROJECT_TYPE;
		}

		const manifestPath = path.join(this.projectFolder, FILES.MANIFEST_XML);

		if (!FileUtils.exists(manifestPath)) {
			const errorMessage =
				NodeTranslationService.getMessage(ERRORS.PROCESS_FAILED) +
				' ' +
				NodeTranslationService.getMessage(ERRORS.FILE_NOT_EXIST, manifestPath);
			throw new CLIException(-10, errorMessage);
		}

		const manifestString = FileUtils.readAsString(manifestPath);

		if (!manifestString.match(MANIFEST_TAG_REGEX)) {
			const errorMessage =
				NodeTranslationService.getMessage(ERRORS.PROCESS_FAILED) +
				' ' +
				NodeTranslationService.getMessage(ERRORS.XML_MANIFEST_TAG_MISSING);
			throw new CLIException(-10, errorMessage);
		}
		let projectType = '';
		let validationError;

		let parser = new xml2js.Parser({ validator: this.validateXml });

		parser.parseString(manifestString, function(err: string, result: {manifest: {$: {projecttype: string}}}) {
			if (err) {
				const errorMessage =
					NodeTranslationService.getMessage(ERRORS.PROCESS_FAILED) +
					' ' +
					NodeTranslationService.getMessage(ERRORS.FILE, manifestPath);
				validationError = errorMessage + ' ' + err;
			}

			if (result) {
				projectType = result.manifest.$.projecttype;
			}
		});

		//TODO CHECK XML IS VALID

		if (validationError) {
			throw new CLIException(-10, validationError);
		}

		this.CACHED_PROJECT_TYPE = projectType;
		return this.CACHED_PROJECT_TYPE;
	}

	public hasLockAndHideFiles() {
		const pathToInstallationPreferences = path.join(
			this.projectFolder,
			FOLDERS.INSTALLATION_PREFERENCES
		);
		return (
			FileUtils.exists(
				path.join(pathToInstallationPreferences, FILES.HIDING_PREFERENCE)
			) &&
			FileUtils.exists(
				path.join(pathToInstallationPreferences, FILES.LOCKING_PREFERENCE)
			)
		);
	}
};
