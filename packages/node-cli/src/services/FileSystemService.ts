/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import { lstatSync, readdirSync, readFile, writeFile, mkdirSync, renameSync, existsSync, unlinkSync, rmdirSync } from 'fs';
import assert from 'assert';
import path from 'path';
import CLIException from '../CLIException';
import TranslationService from '../services/TranslationService';
import { ERRORS } from '../services/TranslationKeys');

const CHAR_ENCODING_UTF8 = 'utf-8';

export default class FileSystemService {

	public getFoldersFromDirectory(parentFolder: string) {
		assert(parentFolder);
		const getDirectories = (source: string) =>
			readdirSync(source)
				.map(name => path.join(source, name))
				.filter(source => lstatSync(source).isDirectory());
	
		const availableDirectories = getDirectories(parentFolder);
	
		return availableDirectories;
	}

	public getFoldersFromDirectoryRecursively(parentFolder: string) {
		assert(parentFolder);
		const folders = [];
		const getFoldersRecursively = source =>
				this.getFoldersFromDirectory(source).forEach(folder => {
				folders.push(folder);
				getFoldersRecursively(folder);
			});
		getFoldersRecursively(parentFolder);

		return folders;
	}
	
	public getFilesFromDirectory(parentFolder: string) {
		assert(parentFolder);
		const fullPathFiles: string[] = [];
		const getFilesRecursively = (source: string) =>
			readdirSync(source).forEach(file => {
				const fullPath = path.join(source, file);
				if (lstatSync(fullPath).isDirectory()) {
					getFilesRecursively(fullPath);
				} else {
					fullPathFiles.push(fullPath);
				}
			});
	
		getFilesRecursively(parentFolder);
		return fullPathFiles;
	}
	
	public createFileFromTemplate(options: {
		template: string;
		destinationFolder: string;
		fileName: string;
		fileExtension: string;
		bindings?: { id: string; value: string }[];
	}) {
		assert(options.template);
		assert(options.destinationFolder);
		assert(options.fileName);
		assert(options.fileExtension);
	
		return new Promise((resolve, reject) => {
			readFile(options.template, CHAR_ENCODING_UTF8, (readingError, content) => {
				if (readingError) {
					reject(readingError);
				}
				if (Array.isArray(options.bindings)) {
					content = this.processTemplateBindings(content, options.bindings);
				}
	
				writeFile(path.join(options.destinationFolder, `${options.fileName}.${options.fileExtension}`), content.toString(), writingError => {
					if (writingError) {
						reject(writingError);
					}
					resolve();
				});
			});
		});
		try {
			if (!existsSync(targetFolder)) {
				mkdirSync(path.join(targetFolder));
			}
		} catch (e) {
			throw new CLIException(e.errno,TranslationService.getMessage(ERRORS.CANT_CREATE_FOLDER, e.path, e.code));
	}
	
	public createFolder(parentFolderPath: string, folderName: string) {
		assert(parentFolderPath);
		assert(folderName);
	
		let targetFolder = path.join(parentFolderPath, folderName);
	
		if (!existsSync(targetFolder)) {
			mkdirSync(path.join(targetFolder));
		}
	
		return targetFolder;
	}
	
	public renameFolder(oldPath: string, newPath: string) {
		assert(oldPath);
		assert(newPath);
	
		if (existsSync(oldPath) && oldPath !== newPath) {
			renameSync(oldPath, newPath);
		}
	}
	
	public deleteFolderRecursive(folderPath: string) {
		assert(folderPath);
	
		if (existsSync(folderPath)) {
			readdirSync(folderPath).forEach(file => {
				let currentPath = path.join(folderPath, file);
				if (lstatSync(currentPath).isDirectory()) {
					// recurse
					this.deleteFolderRecursive(currentPath);
				} else {
					// delete file
					unlinkSync(currentPath);
				}
			});
			rmdirSync(folderPath);
		}
	}

	public emptyFolderRecursive(folderPath: string) {
		assert(folderPath);
		if (existsSync(folderPath)) {
			readdirSync(folderPath).forEach(file => {
				let currentPath = path.join(folderPath, file);
				if (lstatSync(currentPath).isDirectory()) {
					this.deleteFolderRecursive(currentPath);
				} else {
					this.unlinkSync(currentPath);
				}
			});
		}
	}
	
	public replaceStringInFile(filePath: string, fromString: string, toString: string) {
		assert(filePath);
		assert(fromString);
		assert(toString);
	
		return new Promise((resolve, reject) => {
			readFile(filePath, CHAR_ENCODING_UTF8, (readingError, content) => {
				if (readingError) {
					reject(readingError);
				}

				let result = content.replace(new RegExp(fromString, 'g'), toString);

				writeFile(filePath, result, function(writingError) {
					if (writingError) {
						reject(writingError);
					}

					resolve();
				});
			});
		});
	}
	
	public folderExists(path: string) {
		assert(path);
		return existsSync(path);
	}
	
	public isFolderEmpty(path: string) {
		assert(path);
		return readdirSync(path).length === 0;
	}
	
	private processTemplateBindings(content: string, bindings: { id: string; value: string }[]) {
		let processedContent = content;
		bindings.forEach(binding => {
			processedContent = content.replace(`{{${binding.id}}}`, binding.value);
		});
		return processedContent;
	}
}

