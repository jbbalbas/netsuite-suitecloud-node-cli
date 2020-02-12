/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import watch from 'node-watch';
import path from 'path';

export default class Watch {
	context: any;
	compilers: any;
	constructor(options: any) {
		this.context = options.context;
		this.compilers = options.compilers;
	}

	start() {
		watch(this.context.filesPath, { recursive: true }, (evtname, filename) => {
			const extname = path.extname(filename).slice(1);

			const filemap: {[x:string]:any} = {
				tpl: this.compilers.templates,
				js: this.compilers.javascript,
				scss: this.compilers.sass,
			};

			const compiler = filemap[extname] || this.compilers.assets;

			const resourceType = compiler.resourceType.toLowerCase();

			if (resourceType === 'sass' || resourceType === 'javascript') {
				compiler.compile();
			} else {
				this.context.allExtensions.forEach((extension: any) => {
					for (const resourcePath in extension[resourceType]) {
						const resource = extension[resourceType][resourcePath];
						const filenameNoBase = this.context.excludeBaseFilesPath(filename);
						if (path.normalize(resourcePath).includes(filenameNoBase)) {
							// compile one file
							compiler.compile([resource]);
						}
					}
				});
			}
		});
	}
};
