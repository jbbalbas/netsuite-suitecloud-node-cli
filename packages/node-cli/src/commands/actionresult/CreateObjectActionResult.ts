/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import { ActionResult, ActionResultBuilder, STATUS } from './ActionResult';
import assert from 'assert';

export interface CreateObjectActionResult extends ActionResult<null> { }

export class CreateObjectActionResultBuilder extends ActionResultBuilder<null> {

	constructor() {
		super();
	}

	success() {
        this.status = STATUS.SUCCESS;
		return this;
	}

	validate() {
		assert(this.status, 'status is required when creating an ActionResult object.');
	}

	build(): CreateObjectActionResult {
		this.validate();
		return {
			status: this.status,
			data: null,
			resultMessage: '',
			errorMessages: [],
			projectFolder: '',
		};
	}
}
