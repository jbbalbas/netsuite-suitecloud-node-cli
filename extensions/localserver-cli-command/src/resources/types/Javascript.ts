/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
import Resource from '../Resource';

export default class Javascript extends Resource {
	isEntrypoint: any;
	extensionFullname: any;
	constructor(options: any) {
		super(options);

		this.isEntrypoint = !!options.isEntrypoint;
		this.format = '.js';
		this.extensionFullname = options.extensionFullname;
	}
};
