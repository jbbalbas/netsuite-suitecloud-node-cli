/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import assert from 'assert';
import { SDKExecutionContextOptions } from '../types/CommandContext';

export default class SDKExecutionContext {
	public command: string;
	public integrationMode: boolean;
	public includeProjectDefaultAuthId: boolean;
	public developmentMode: boolean;
	public params: {[x: string]: any};
	public flags: string[];

	constructor(options: SDKExecutionContextOptions) {
		assert(options.command, 'Command is mandatory option');
		this.command = options.command;
		this.integrationMode =
			typeof options.integrationMode === 'undefined' ? true : options.integrationMode;
		this.includeProjectDefaultAuthId =
			typeof options.includeProjectDefaultAuthId === 'undefined'
				? false
				: options.includeProjectDefaultAuthId;
		this.developmentMode = typeof options.developmentMode === 'undefined' ? false : options.developmentMode;
		this.params = {};
		this.flags = [];

		if (options.params) {
			this.addParams(options.params);
		}

		if (options.flags) {
			this.addFlags(options.flags);
		}
	}

	private addParams(params: {[x: string]: string}) {
		Object.keys(params).forEach(key => {
			this.addParam(key, params[key]);
		});
	}

	private addFlags(flags: string[]) {
		flags.forEach(flag => {
			this.addFlag(flag);
		});
	}

	getCommand() {
		return this.command;
	}

	addParam(name: string, value: any) {
		this.params[`-${name}`] = value;
	}

	getParams() {
		return this.params;
	}

	addFlag(flag: string) {
		this.flags.push(`-${flag}`);
	}

	getFlags() {
		return this.flags;
	}

	isIntegrationMode() {
		return this.integrationMode;
	}

	isDevelopmentMode() {
		return this.developmentMode;
	}
};
