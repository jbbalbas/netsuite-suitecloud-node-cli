/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import { ActionResult, ActionResultBuilder, STATUS } from './ActionResult';

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

	withProxyOverridden(isProxyOverridden: boolean) {
		this.isProxyOverridden = isProxyOverridden;
		return this;
	}

	validate() {
		super.validate();
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
