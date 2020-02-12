/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

export default class CLIException {
	private code: number;
	private defaultMessage: string;
	private infoMessage: string | undefined;
	private translationKey: string | undefined;

	constructor(code: number, defaultMessage: string, infoMessage?: string, translationKey?: string) {
		this.code = code;
		this.defaultMessage = defaultMessage;
		this.infoMessage = infoMessage;
		this.translationKey = translationKey;
	}

	getInfoMessage() {
		return this.infoMessage;
	}

	getErrorMessage() {
		let err = new Error();
		return this.defaultMessage;
	}
};
