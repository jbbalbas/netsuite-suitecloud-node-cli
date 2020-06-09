/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import { ActionResult, ActionResultBuilder, STATUS } from './ActionResult';
import assert from 'assert';

export interface ProxyActionResult extends ActionResult<null> {
	isSettingProxy: boolean;
	proxyUrl: string;
	isProxyOverridden: boolean;
}

export class ProxyActionResultBuilder extends ActionResultBuilder<null> {

	isSettingProxy!: boolean;
	proxyUrl!: string;
	isProxyOverridden!: boolean;

	constructor() {
		super();
	}

	success() {
		this.status = STATUS.SUCCESS;
		return this;
	}

	withProxySetOption(isSettingProxy: boolean) {
		this.isSettingProxy = isSettingProxy;
		return this;
	}

	withProxyUrl(proxyUrl: string) {
		this.proxyUrl = proxyUrl;
		return this;
	}

	withProxyOverridden(isProxyOverridden: boolean = false) {
		this.isProxyOverridden = isProxyOverridden;
		return this;
	}

	validate() {
		assert(this.status, 'status is required when creating an ActionResult object.');
		if (this.status === STATUS.SUCCESS) {
			assert(typeof this.isSettingProxy === 'boolean', 'isSettingProxy is required when ActionResult is a success.');
			assert(typeof this.isProxyOverridden === 'boolean', 'isProxyOverridden is required when ActionResult is a success.');
		}
		if (this.status === STATUS.ERROR) {
			assert(this.errorMessages, 'errorMessages is required when ActionResult is an error.');
			assert(Array.isArray(this.errorMessages), 'errorMessages argument must be an array');
		}
	}

	build(): ProxyActionResult {
		this.validate();
		return {
			status: this.status,
			data: null,
			resultMessage: '',
			isSettingProxy: this.isSettingProxy,
			isProxyOverridden: this.isProxyOverridden,
			errorMessages: this.errorMessages,
			proxyUrl: this.proxyUrl,
			projectFolder: this.projectFolder,
		};
	}
}
