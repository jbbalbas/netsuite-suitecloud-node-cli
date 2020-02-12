/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import path from 'path';
import fs from 'fs';

import { promisify } from 'util';
class FileSystem {
	service: any;

	start(Service: any) {
		this.service = new Service;
	}

	forwardDashes(dir: string) {
		return dir.replace(/\\/g, '/');
	}

	createFolder(folderName: string, parentPath: string, override?: any) {
		parentPath = this.forwardDashes(parentPath);
		const folderPath = path.join(parentPath, folderName);
		if (override) {
			this.service.deleteFolderRecursive(folderPath);
		}
		this.service.createFolder(parentPath, folderName);
		return folderPath;
	}

	getFileContent(dir: string) {
		return promisify(fs.readFile)(dir, 'utf8');
	}

	writeFile(dest: any, content: any) {
		return new Promise((resolve, reject) => {
			try {
				fs.writeFileSync(dest, content);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	copyFile(src: any, dest: any) {
		(src = path.normalize(src)), (dest = path.normalize(dest));
		const folder = path.dirname(dest);
		if (!fs.existsSync(folder)) {
			fs.mkdirSync(folder, { recursive: true });
		}
		return promisify(fs.copyFile)(src, dest);
	}
}

export default new FileSystem();
