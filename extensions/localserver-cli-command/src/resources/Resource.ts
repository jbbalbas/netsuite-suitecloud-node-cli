/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
import path from 'path';
import Log from '../services/Log';
import FileSystem from '../services/FileSystem';

let _basesrc = '';

export default class Resource {
	src: any;
	dst: any;
	name: any;
	content: any;
	applications: any;
	overrideFullsrc: any;
	override: any;
	format?: any;
	
	constructor(options: any) {
		this.src = options.src;
		this.dst = options.dst;
		this.name = options.name || '';
		this.content = '';
		this.applications = [options.app];
		this.overrideFullsrc;
		this.override;
	}

	async sourceContent() {
		return (this.content = await FileSystem.getFileContent(this.fullsrc()));
	}

	addApplication(app: any) {
		if (!this.applications.includes(app)) {
			this.applications.push(app);
		}
	}

	logOverrideMessage() {
		if (this.override) {
			Log.default('OVERRIDE', [FileSystem.forwardDashes(this.src), this.override]);
		}
	}

	fullsrc() {
		return this.overrideFullsrc || path.join(_basesrc, this.src);
	}

	fulldst() {
		return this.dst;
	}

	getBasename() {
		return path.basename(this.src);
	}

	getFilename() {
		return this.name + (this.format || '');
	}

	static setBaseSrc(value: any) {
		_basesrc = value;
	}
};
