/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

class Translation {
	service: any;
	keys: any;
	start(service?: any, keys?: any) {
		this.service = service;
		this.keys = keys;
	}

	getMessage(key: any, params: any[] = []) {
		return (this.keys && this.service.getMessage(this.keys[key], ...params)) || '';
	}
}

export default new Translation();
