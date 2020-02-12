/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import Translation from './Translation';

class Log {
	separator: any;
	colors: any;
	constructor() {
		this.separator = '-'.repeat(45);
		this.colors = {};
	}

	start(colors: any) {
		this.colors = colors;
	}

	private time() {
		const date = new Date();
		const timestamp = [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');

		return `[${timestamp}.${date.getMilliseconds()}] `;
	}

	custom(message: any, params?: any, color = this.colors.DEFAULT) {
		message = Translation.getMessage(message, params) || message;
		if (typeof color !== 'function') {
			color = (msg: any) => msg;
		}
		console.log(color(this.time() + message));
	}

	info(message: string, params?: any) {
		this.custom(message, params, this.colors.INFO);
	}
	result(message: string, params?: any) {
		this.custom(message, params, this.colors.RESULT);
	}
	default(message: string, params?: any) {
		this.custom(message, params, this.colors.DEFAULT);
	}
	error(message: string, params?: any) {
		this.custom(message, params, this.colors.ERROR);
	}
}

export default new Log();
