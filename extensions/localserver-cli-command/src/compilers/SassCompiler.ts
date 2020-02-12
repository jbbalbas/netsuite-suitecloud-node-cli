/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import * as Utils from '../Utils';
import FileSystem from '../services/FileSystem';
import Log from '../services/Log';
import sassCompiler from 'node-sass';
import fs from 'fs';
import path from 'path';
import {sync as glob} from 'glob';

export default class SassCompiler {

	context: any;
	resourceType: any;
	overrides: any;
	cssPath?: any;

	constructor(options: any) {
		this.context = options.context;
		this.resourceType = 'Sass';
	}

	compile(resources?: any) {
		Log.result('COMPILATION_START', [this.resourceType]);
		this._createCssFolder();
		this.overrides = this.context.getSassOverrides();
		resources = this.context.getSass();

		const metaEntrypoints = this._buildMetaEntrypoints(resources.entrypoints);

		return Utils.runParallel(metaEntrypoints).then(() => {
			Log.result('COMPILATION_FINISH', [this.resourceType]);
		});
	}

	_createCssFolder() {
		this.cssPath = FileSystem.createFolder('css', this.context.localServerPath);
	}

	_buildMetaEntrypoints(entrypoints: any) {
		const promises = [];
		for (const app in entrypoints) {
			const entrypoint = entrypoints[app]
				.map((file: any) => {
					const localFunctions = this._localFunctions({
						assetsFolder: FileSystem.forwardDashes(file.assetsPath),
					});
					file.entry = FileSystem.forwardDashes(file.entry);
					return localFunctions + `@import "${file.entry}";`;
				})
				.join('');
			promises.push(() => this._compile(entrypoint, app));
		}
		return promises;
	}

	_compile(entrypoint: any, app: any) {
		return new Promise((resolve, reject) => {
			Log.result('COMPILATION_START_FOR', [this.resourceType, app]);
			sassCompiler.render(
				{
					data: entrypoint,
					includePaths: [this.context.filesPath],
					importer: this._importer.bind(this),
				},
				(error, result) => {
					if (error) {
						return reject(error);
					}

					const localPath = path.join(this.cssPath, app + '.css');
					fs.writeFileSync(localPath, result.css);

					Log.result('COMPILATION_FINISH_FOR', [this.resourceType, app]);
					resolve(localPath);
				}
			);
		});
	}

	_localFunctions(options: any = {}) {
		return [
			`@function getThemeAssetsPath($asset) { @return '../${
				options.assetsFolder
			}/' + $asset; }`,
			`@function getExtensionAssetsPath($asset) { @return '../${
				options.assetsFolder
			}/' + $asset; }`,
		].join('\n');
	}

	_importer(url: string, prev: any, done: any) {
		prev = prev === 'stdin' ? this.context.filesPath : path.dirname(prev);

		let currentPath = path.normalize(path.resolve(prev, url));
		currentPath = path.extname(currentPath) ? currentPath : currentPath + '.scss';
		currentPath = currentPath.replace(this.context.filesPath, '').substr(1);

		const override = this.overrides[currentPath];
		let result;
		if (override) {
			Log.default('OVERRIDE', [currentPath, override.src]);
			const fullPath = glob(path.join(this.context.projectFolder, '**', override.src));
			if (fullPath.length) {
				result = { file: fullPath[0] };
			}
		}
		done(result);
	}
};
