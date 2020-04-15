/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import assert from 'assert';
import { ActionResult, ActionResultBuilder, STATUS } from './ActionResult';

type CreateProjectData = {
	projectType: string;
	projectDirectory: string;
	includeUnitTesting: boolean;
	npmInstallSuccess: boolean;
}

export interface CreateProjectActionResult extends ActionResult<CreateProjectData> {

	projectType: string;
	projectName: string;
	projectDirectory: string;
	includeUnitTesting: boolean;
	npmInstallSuccess: boolean;
}

export class CreateProjectActionResultBuilder extends ActionResultBuilder<CreateProjectData> {

	projectType!: string;
	projectName!: string;
	projectDirectory!: string;
	includeUnitTesting!: boolean;
	npmPackageInitialized!: boolean;

	constructor() {
		super();
	}

	withProjectType(projectType: string) {
		this.projectType = projectType;
		return this;
	}

	withProjectName(projectName: string) {
		this.projectName = projectName;
		return this;
	}

	withProjectDirectory(projectDirectory: string) {
		this.projectDirectory = projectDirectory;
		return this;
	}

	withUnitTesting(includeUnitTesting: boolean) {
		this.includeUnitTesting = includeUnitTesting;
		return this;
	}

	withNpmPackageInitialized(npmPackageInitialized: boolean) {
		this.npmPackageInitialized = npmPackageInitialized;
		return this;
	}

	validate() {
		super.validate();
		if (this.status === STATUS.SUCCESS) {
			assert(this.projectDirectory, 'projectDirectory is required when ActionResult is a success.');
			assert(this.projectType, 'projectType is required when ActionResult is a success.');
		}
	}

	build(): CreateProjectActionResult {
		this.validate();
		return {
			status: this.status,
			data: this.data,
			resultMessage: this.resultMessage,
			errorMessages: this.errorMessages,
			projectType: this.projectType,
			projectName: this.projectName,
			projectDirectory: this.projectDirectory,
			includeUnitTesting: this.includeUnitTesting,
			npmInstallSuccess: this.npmPackageInitialized,
			projectFolder: this.projectFolder,
		};
	}
}