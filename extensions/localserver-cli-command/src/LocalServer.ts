/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import Log from './services/Log';
import whoService from './services/Who';

import express from 'express';
import cors from 'cors';

declare var define: any;

class LocalServer {
	port: number;
	runhttps: boolean;
	server: any;
	constructor() {
		this.port = 7777;
		this.runhttps = false;
		this.server = null;
	}

	config(options: any){
		if (options.port) {
			this.port = options.port;
		}
		if (options.runhttps) {
			this.runhttps = options.runhttps === "true" || options.runhttps === true;
		}
	}

	startServer(localPath: any) {

		const app:any = express();
		app.use(cors({ origin: true }));

		app.use('/', express.static(localPath));

		//Service used by the index-local.ssp files to know what files load
		app.use('/who/:app', whoService);
		//Serves the script patch to ignore tpl defines executed by core javascript file
		app.use('/define_patch.js', this.definePatchService);

		this.server = app.listen(this.port, () => {
			Log.info(Log.separator);
			Log.default('SERVER', [this.serverUrl()]);
			Log.info('WATCH', [localPath]);
			Log.info('SSP_LOCAL_FILES_INFO');
			Log.default('CANCEL_ACTION');
		});

		//server is listening so we return a new promise that will never be resolved
		return new Promise(() => {});
	}

	closeServer() {
		if (this.server) {
			this.server.close();
		}
	}

	serverUrl(){
		return `http${this.runhttps ? 's' : ''}://localhost:${this.port}`;
	}

	private definePatchService(req: any, res: any) {
		const response = function define_patch() {
			const src_define = define;
			define = function define(this: any, name: string, cb: any) {
				const is_tpl = name && /\.tpl$/.test(name);
				const cb_string = cb ? cb.toString().replace(/\s/g, '') : '';
				const is_empty_cb = cb_string === 'function(){}';

				if (is_tpl && is_empty_cb) {
					return;
				}
				return src_define.apply(this, arguments);
			};

			define.amd = {
				jQuery: true,
			};
		};

		res.setHeader('Content-Type', 'application/javascript');
		res.send(`${response}; define_patch();`);
	}
}

export default new LocalServer();