/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

export default class TranslationService {

	protected MESSAGES!: {[x: string]: string};

	private injectParameters(message: string, params: string[]) {
		return message.replace(/{(\d+)}/g, function (match, number) {
			return typeof params[number] !== 'undefined' ? params[number] : match;
		});
	}

	public getMessage(key: string, ...params: string[]) {
		let message = this.MESSAGES[key];
		if (params && params.length > 0) {
			return this.injectParameters(message, params);
		}

		return message;
	}
}
