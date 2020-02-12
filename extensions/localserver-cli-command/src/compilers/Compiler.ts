/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import SassCompiler from './SassCompiler';
import TemplatesCompiler from './TemplatesCompiler';
import JavascriptCompiler from './JavascriptCompiler';
import AssetsCompiler from './AssetsCompiler';

import fs from 'fs';
import path from 'path';
import * as Utils from '../Utils';
import FileSystem from '../services/FileSystem';

declare var process: {mainModule: any};

export default class Compiler {
	context: any;
	compilers: any;
	
	constructor(options: any) {
		this.context = options.context;
		this.compilers = {
			sass: new SassCompiler({ context: this.context }),
			templates: new TemplatesCompiler({ context: this.context }),
			javascript: new JavascriptCompiler({ context: this.context }),
			assets: new AssetsCompiler({ context: this.context }),
		};
	}

	compile() {
		this._createLocalServerFolder(this.context);

		const bindedCompilers = [];
		for (const name in this.compilers) {
			const compiler = this.compilers[name];
			bindedCompilers.push(compiler.compile.bind(compiler));
		}
		return Utils.runParallel(bindedCompilers);
	}

	_createLocalServerFolder(context: any) {
		const serverFolder = 'LocalServer';
		// create/override local server:
		const localFolder = FileSystem.createFolder(serverFolder, context.projectFolder, true);
		context.setLocalServerPath(localFolder);
		this._createRequireJSFile(localFolder);
	}

	_createRequireJSFile(localFolder: any) {
		const src = require.resolve('requirejs');
		const dst = path.join(localFolder, 'require.js');

		let content = fs.readFileSync(src).toString();
		content = content.replace('#!/usr/bin/env node', '');
		fs.writeFileSync(dst, content);
	}
};
