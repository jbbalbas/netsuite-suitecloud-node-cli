/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import handlebars from 'handlebars';
import * as Utils from '../Utils';
import fs from 'fs';
import url from 'url';
import path from 'path';
import Log from '../services/Log';
import FileSystem from '../services/FileSystem';
import LocalServer from '../LocalServer';

const hd: typeof Handlebars & {JavaScriptCompiler?: any} = handlebars;

export default class TemplatesCompiler {
	context: any;
	entrypoints: any;
	resourceType: string;
	templatesFolder: string;
	processedTemplatesFolder: string;
	templates?: any;
	processedTemplatesPath?: any;
	templatesPath?: any;
	JavaScriptCompiler?: any;

	constructor(options: any) {
		this.context = options.context;
		this.entrypoints = {};
		this.resourceType = 'Templates';
		this.templatesFolder = 'templates';
		this.processedTemplatesFolder = 'processed-templates';
	}

	compile(resources: any) {
		Log.result('COMPILATION_START', [this.resourceType]);

		this.templates = resources || this.context.getTemplates();

		this._createTemplateFolders();

		this._setCompilerNameLookupHelper();
		// new file with template helpers:
		this._writeJavascriptLibsFile();

		// first create templates files
		const templates = this._writeTemplates();
		return Utils.runParallel(templates).then(() => {
			// then create require.js config files
			const entrypoints = this._writeEntrypoints();
			return Utils.runParallel(entrypoints).then(() =>
				Log.result('COMPILATION_FINISH', [this.resourceType])
			);
		});
	}

	_writeTemplate(template: any) {
		return () =>
			//read original template file:
			template.sourceContent().then((content: any) => {
				template.setPrecompiled(hd.precompile(content));

				template.applications.forEach((app: any) => {
					const basename = template.getBasename();
					this.entrypoints[app] = this.entrypoints[app] || {};
					this.entrypoints[app][basename] = basename;
				});

				//write final template file:
				template.logOverrideMessage();
				return FileSystem.writeFile(
					path.join(this.processedTemplatesPath, template.dst),
					this._wrapTemplate(template)
				);
			});
	}

	_writeTemplates() {
		const promises = [];
		for (const templatePath in this.templates) {
			promises.push(this._writeTemplate(this.templates[templatePath]));
		}
		return promises;
	}

	_writeEntrypoints() {
		const promises = [];
		for (const app in this.entrypoints) {
			const dest = path.join(this.templatesPath, `${app}-templates.js`);
			const entryfileContent = {
				paths: this.entrypoints[app],
				baseUrl: url.resolve(
					LocalServer.serverUrl(),
					`${this.templatesFolder}/${this.processedTemplatesFolder}`
				),
			};

			promises.push(() => FileSystem.writeFile(dest, this._wrapEntrypoint(entryfileContent)));
		}
		return promises;
	}

	_wrapEntrypoint(entrypoint: any) {
		return `require.config(${JSON.stringify(entrypoint, null, 2)})`;
	}

	_wrapTemplate(template: any) {
		return `define('${template.getFilename()}', [${template
			.getDependencies()
			.join()}], function (Handlebars, compilerNameLookup){ var t = ${
			template.precompiled
		}; var main = t.main; t.main = function(){ arguments[1] = arguments[1] || {}; var ctx = arguments[1]; ctx._extension_path = '${
			template.extensionAssetUrl
		}/'; ctx._theme_path = '${this.context.theme.getAssetsUrl()}/'; return main.apply(this, arguments); }; var template = Handlebars.template(t); template.Name = '${
			template.name
		}'; return template;});`;
	}

	_writeJavascriptLibsFile() {
		// create javascript-libs.js
		let content = '';
		['LoadTemplateSafe', 'Handlebars.CompilerNameLookup'].map(filename => {
			content += fs
				.readFileSync(path.join(__dirname, '../../src/client-scripts', filename + '.js'))
				.toString();
		});
		fs.writeFileSync(path.join(this.templatesPath, 'javascript-libs.js'), content);
	}

	_setCompilerNameLookupHelper() {
		hd.JavaScriptCompiler.prototype.nameLookup = (parent: any, name: any) =>
			`compilerNameLookup(${parent},"${name}")`;
	}

	_createTemplateFolders() {
		this.templatesPath = FileSystem.createFolder(
			this.templatesFolder,
			this.context.localServerPath
		);
		this.processedTemplatesPath = FileSystem.createFolder(
			this.processedTemplatesFolder,
			this.templatesPath
		);
	}
};
