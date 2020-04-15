/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import assert from 'assert';
import { ActionResult, ActionResultBuilder, STATUS } from './ActionResult';

export interface SetupActionResult extends ActionResult<null> {

	mode: string;
	authId: string;
	accountInfo: {
		companyName: string;
		roleName: string;
	};
}

export class SetupActionResultBuilder extends ActionResultBuilder<null> {

	mode!: string;
	authId!: string;
	accountInfo!: {
		companyName: string;
		roleName: string;
	};

	constructor() {
		super();
	}

	success() {
		this.status = STATUS.SUCCESS;
		return this;
	}

	withMode(mode: string) {
		this.mode = mode;
		return this;
	}

	withAuthId(authId: string) {
		this.authId = authId;
		return this;
	}

	withAccountInfo(accountInfo: {companyName: string; roleName: string;}) {
		this.accountInfo = accountInfo;
		return this;
	}

	validate() {
		super.validate();
		if (this.status === STATUS.SUCCESS) {
			assert(this.mode, 'mode is required when ActionResult is a success.');
			assert(this.authId, 'authId is required when ActionResult is a success.');
			assert(this.accountInfo, 'accountInfo is required when ActionResult is a success.');
		}
		if (this.status === STATUS.ERROR) {
			assert(this.errorMessages, 'errorMessages is required when ActionResult is an error.');
			assert(Array.isArray(this.errorMessages), 'errorMessages argument must be an array');
		}
	}

	build(): SetupActionResult {
		return {
			status: this.status,
			data: null,
			resultMessage: '',
			errorMessages: this.errorMessages,
			mode: this.mode,
			authId: this.authId,
			accountInfo: this.accountInfo,
			projectFolder: this.projectFolder,
		};
	}
}
