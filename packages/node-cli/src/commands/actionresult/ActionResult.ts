/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import assert from 'assert';

export const STATUS = {
	ERROR: 'ERROR',
	SUCCESS: 'SUCCESS',
};

export interface ActionResult<T> {
	status: string;
	data: T;
	resultMessage: string;
	errorMessages: string[];
	projectFolder: string;
}

export class ActionResultBuilder<T> {

	public status!: string;
	public data!: T;
	public resultMessage!: string;
	public errorMessages!: string[];
	public projectFolder!: string;

	constructor() {}

	// Used to add message on success only, error messages must never be passed
	withResultMessage(resultMessage: string) {
		this.resultMessage = resultMessage;
		return this;
	}

	withData(data: any) {
		this.status = STATUS.SUCCESS;
		this.data = data;
		return this;
	}

	withErrors(errorMessages: string[]) {
		this.status = STATUS.ERROR;
		this.errorMessages = errorMessages;
		return this;
	}

	withProjectFolder(projectFolder: string) {
		this.projectFolder = projectFolder;
		return this;
	}

	validate() {
		assert(this.status, 'status is required when creating an ActionResult object.');
		if (this.status === STATUS.SUCCESS) {
			assert(this.data, 'data is required when ActionResult is a success.');
		}
		if (this.status === STATUS.ERROR) {
			assert(this.errorMessages, 'errorMessages is required when ActionResult is an error.');
			assert(Array.isArray(this.errorMessages), 'errorMessages argument must be an array');
		}
	}

	build() : ActionResult<T> {
		this.validate();
		return {
			status: this.status,
			data: this.data,
			resultMessage: this.resultMessage,
			errorMessages: this.errorMessages,
			projectFolder: this.projectFolder,
		};
	}
}
