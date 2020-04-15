/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import { ActionResult, ActionResultBuilder } from './ActionResult';
import assert from 'assert';
import { SDK_FALSE } from '../../ApplicationConstants';

type ValidateData = {
    appliedContentProtection: boolean;
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
};

export interface ValidateActionResult extends ActionResult<ValidateData> {
	isServerValidation: boolean;
	appliedContentProtection: boolean;
    projectType: string;
	warnings?: {
		filePath: string;
		lineNumber: string;
		message: string;
	}[];
	errors?: {
		filePath: string;
		lineNumber: string;
		message: string;
	}[];
}

export class ValidateActionResultBuilder extends ActionResultBuilder<ValidateData> {
	isServerValidation: boolean = false;
	appliedContentProtection: boolean = false;
	projectType!: string;

	constructor() {
		super();
	}

	withServerValidation(isServerValidation: boolean) {
		this.isServerValidation = isServerValidation;
		return this;
	}

	withAppliedContentProtection(appliedContentProtection: boolean) {
		this.appliedContentProtection = appliedContentProtection;
		return this;
	}

	withProjectType(projectType: string) {
		this.projectType = projectType;
		return this;
	}

	validate() {
		super.validate();
		assert(this.projectType, 'project type is required when creating a ValidateActionResult');
	}

	build(): ValidateActionResult {
		this.validate();
		return {
			status: this.status,
			data: this.data,
			resultMessage: this.resultMessage,
			errorMessages: this.errorMessages,
			isServerValidation: this.isServerValidation,
			appliedContentProtection: this.appliedContentProtection,
			projectType: this.projectType,
			projectFolder: this.projectFolder,
		};
	}
}