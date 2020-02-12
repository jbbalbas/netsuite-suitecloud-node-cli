/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import * as Utils from '../Utils';
import Log from '../services/Log';
import path from 'path';
import FileSystem from '../services/FileSystem';

export default class AssetsCompiler {
	context: any;
	resourceType: any;
	constructor(options: any) {
		this.context = options.context;
		this.resourceType = 'Assets';
	}

	compile(resources: any) {
		Log.result('COMPILATION_START', [this.resourceType]);
		resources = resources || this.context.getAssets();
		return Utils.runParallel(this._copyResources(resources)).then(() => {
			Log.result('COMPILATION_FINISH', [this.resourceType]);
		});
	}

	_copyResources(resources: any) {
		const promises = [];

		for (const resourcePath in resources) {
			const resource = resources[resourcePath];
			promises.push(() =>
				FileSystem.copyFile(
					resource.fullsrc(),
					path.join(this.context.localServerPath, resource.dst)
				)
			);
		}

		return promises;
	}
};
