/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import AbstractExtension  from './AbstractExtension';
import { parseFileName } from './Utils';
import path  from 'path';

export default class Theme extends AbstractExtension {
	PREFIX: any;
	rawExtension: any;
	basePath: any;
	vendor: any;
	name: any;
	version: any;
	overrides: any;
	constructor(options: any) {
		super(options);

		this.PREFIX = 'commercetheme';
		this.rawExtension = this.rawExtension[this.PREFIX];

		this.basePath = this.rawExtension.basepath;
		this.vendor = this.rawExtension.vendor;
		this.name = this.rawExtension.name;
		this.version = this.rawExtension.version;

		this.overrides = {};
	}

	getTplOverrides() {
		return this.getOverrides('tpl');
	}

	getSassOverrides() {
		return this.getOverrides('scss');
	}

	private getOverrides(fileExt = 'all') {
		if (this.overrides[fileExt]) {
			return this.overrides[fileExt];
		}

		let overrides = this.rawExtension.overrides || {};

		overrides = overrides.override || overrides;

		if (!Object.keys(overrides).length) {
			return overrides;
		}

		overrides = Array.isArray(overrides) ? overrides : [overrides];

		overrides = overrides.map((override: any) => {
			let dst = path.normalize(override.dst).split(path.sep);
			dst.shift();
			dst[dst.length - 1] = dst[dst.length - 1].replace(/^\_(.*)(\.scss)$/, '$1$2');

			return {
				src: parseFileName(override.src),
				dst: dst.join(path.sep),
			};
		});

		overrides = overrides.filter((override: any) => {
			const regex = new RegExp(`\.${fileExt}$`);
			return fileExt === 'all' || regex.test(override.src);
		});
		const indexed: any = {};
		overrides.forEach((override: any) => {
			indexed[override.dst] = override;
		});

		this.overrides[fileExt] = indexed;
		return this.overrides[fileExt];
	}
};
