/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import { Parser } from 'xml2js';
import fs from 'fs';
import path from 'path';
import {sync as glob} from 'glob';
import async from 'async';
import { promisify } from 'util';

import Translation from './services/Translation';

export function parseXml(projectFolder: string, xmlFile: string) {
		let filePath: string | string[] | null = path.join(projectFolder, '**', xmlFile);
		filePath = glob(filePath);
		filePath = filePath.length ? filePath[0] : null;

		if (!filePath) {
			throw Translation.getMessage('RESOURCE_NOT_FOUND', [xmlFile, projectFolder]);
		}

		const xmlData = fs.readFileSync(filePath).toString();

		let parsedXml = {};

		new Parser({ explicitArray: false, trim: true, emptyTag: null }).parseString(
			xmlData,
			function(error: any, result: any) {
				if (error) {
					throw error;
				}
				parsedXml = result;
			}
		);

		return parsedXml;
	}

	export function arrayUnion(arr1: any[], arr2: any[] = []) {
		return [...new Set([...arr1, ...arr2])];
	}

	export function parseFiles(filesXml: any, replacer?: any) {
		const parsedFiles = [];
		let files = filesXml.files || {};
		files = files.file || {};
		for (const key in files) {
			const file = parseFileName(files[key]);
			parsedFiles.push(replacer ? replacer(file) : file);
		}
		return parsedFiles;
	}

	export function parseFileName(file: any) {
		const fileName = file.filename || file;
		return fileName.replace(/^\[(.*)\]$/, '$1');
	}

	export function runParallel(tasks: any) {
		const parallel: ((x: any) => Promise<any>) = promisify(async.parallel);

		const wrappedTasks = tasks.map((task: any) => {
			return (callback: (error: any, success?: any) => any) => {
				try {
					const promise = task();
					if (promise && promise.then) {
						return promise.then((result: any) => callback(null, result)).catch(callback);
					}
					callback(null, promise);
				} catch (error) {
					callback(error);
				}
			};
		});

		return parallel(wrappedTasks);
	}
