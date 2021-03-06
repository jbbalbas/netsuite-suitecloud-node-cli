/*
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

const assert = require('assert');

module.exports = class SDKExecutionContext {
	constructor(options) {
		assert(options.command, 'Command is mandatory option');
		this._command = options.command;
		this._integrationMode =
			typeof options.integrationMode === 'undefined' ? true : options.integrationMode;
		this._includeAccountDetailsParams =
			typeof options.includeAccountDetailsParams === 'undefined'
				? false
				: options.includeAccountDetailsParams;
		this._params = {};
		this._flags = [];

		if (options.params) {
			this._addParams(options.params);
		}

		if (options.flags) {
			this._addFlags(options.flags);
		}
	}

	_addParams(params) {
		Object.keys(params).forEach(key => {
			this.addParam(key, params[key]);
		});
	}

	_addFlags(flags) {
		flags.forEach(flag => {
			this.addFlag(flag);
		});
	}

	getCommand() {
		return this._command;
	}

	addParam(name, value) {
		this._params[`-${name}`] = value;
	}

	getParams() {
		return this._params;
	}

	addFlag(flag) {
		this._flags.push(`-${flag}`);
	}

	getFlags() {
		return this._flags;
	}

	isIntegrationMode() {
		return this._integrationMode;
	}

	get includeAccountDetailsParams() {
		return this._includeAccountDetailsParams;
	}
};
