/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

export default class CLISettings {
	public useProxy: boolean;
	public proxyUrl: string;
	public isJavaVersionValid: boolean;
	constructor(options: { useProxy: boolean; proxyUrl: string; isJavaVersionValid: boolean }) {
		this.useProxy = options.useProxy;
		this.proxyUrl = options.proxyUrl;
		this.isJavaVersionValid = options.isJavaVersionValid;
	}

	public toJSON() {
		return {
			proxyUrl: this.proxyUrl,
			useProxy: this.useProxy,
			isJavaVersionValid: this.isJavaVersionValid,
		};
	}

	static fromJson(json: any) {
		return new CLISettings({
			useProxy: json.useProxy,
			proxyUrl: json.proxyUrl,
			isJavaVersionValid: json.isJavaVersionValid,
		});
	}
};
