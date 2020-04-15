/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';
import * as ActionResultUtils from '../../utils/ActionResultUtils';

import { COMMAND_IMPORTOBJECTS } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';

type ImportObjectsData = {
	successfulImports: {
		customObject: {
			id: string;
			type: string
		},
		referencedFileImportResult: ReferencedFileImportResult;
	}[],
	failedImports: {
		customObject: {
			type: string;
			id: string;
			result: {
				message: string
			}
		}
	}[];
}

type ReferencedFileImportResult = {
	successfulImports: {
		path: string;
		message: string
	}[],
	failedImports: {
		path: string;
		message: string
	}[]
}

export default class ImportObjectsOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ActionResult<ImportObjectsData>) {
		if (!actionResult.data) {
			ActionResultUtils.logResultMessage(actionResult, this.consoleLogger);
			return;
		}

		this.logImportedObjects(actionResult.data.successfulImports);
		this.logUnImportedObjects(actionResult.data.failedImports);
	}

	private logImportedObjects(importedObjects: ImportObjectsData["successfulImports"]) {
		if (Array.isArray(importedObjects) && importedObjects.length) {
			this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.OUTPUT.IMPORTED_OBJECTS));
			importedObjects.forEach(objectImport => {
				const importedObjectLogMessage = `${this.consoleLogger.getPadding(1)}- ${objectImport.customObject.type}:${
					objectImport.customObject.id
				}`;
				this.consoleLogger.result(importedObjectLogMessage);
				this.logReferencedFileImportResult(objectImport.referencedFileImportResult);
			});
		}
	}

	private logReferencedFileImportResult(referencedFileImportResult: ReferencedFileImportResult) {
		const importedFiles = referencedFileImportResult.successfulImports;
		const unImportedFiles = referencedFileImportResult.failedImports;

		const thereAreReferencedFiles =
			(Array.isArray(importedFiles) && importedFiles.length) || (Array.isArray(unImportedFiles) && unImportedFiles.length);
		if (thereAreReferencedFiles) {
			const referencedFilesLogMessage = `${this.consoleLogger.getPadding(2)}- ${NodeTranslationService.getMessage(
				COMMAND_IMPORTOBJECTS.OUTPUT.REFERENCED_SUITESCRIPT_FILES
			)}`;
			this.consoleLogger.result(referencedFilesLogMessage);
		}

		if (Array.isArray(importedFiles) && importedFiles.length) {
			importedFiles.forEach(importedFile => {
				const importedFileLogMessage = `${this.consoleLogger.getPadding(3)}- ${NodeTranslationService.getMessage(
					COMMAND_IMPORTOBJECTS.OUTPUT.REFERENCED_SUITESCRIPT_FILE_IMPORTED,
					importedFile.path
				)}`;
				this.consoleLogger.result(importedFileLogMessage);
			});
		}

		if (Array.isArray(unImportedFiles) && unImportedFiles.length) {
			unImportedFiles.forEach(unImportedFile => {
				const unimportedFileLogMessage = `${this.consoleLogger.getPadding(3)}- ${NodeTranslationService.getMessage(
					COMMAND_IMPORTOBJECTS.OUTPUT.REFERENCED_SUITESCRIPT_FILE_IMPORT_FAILED,
					unImportedFile.path,
					unImportedFile.message
				)}`;
				this.consoleLogger.warning(unimportedFileLogMessage);
			});
		}
	}

	private logUnImportedObjects(unImportedObjects: ImportObjectsData["failedImports"]) {
		if (Array.isArray(unImportedObjects) && unImportedObjects.length) {
			this.consoleLogger.warning(NodeTranslationService.getMessage(COMMAND_IMPORTOBJECTS.OUTPUT.UNIMPORTED_OBJECTS));
			unImportedObjects.forEach(objectImport => {
				const unimportedObjectLogMessage = `${this.consoleLogger.getPadding(1)}- ${NodeTranslationService.getMessage(
					COMMAND_IMPORTOBJECTS.OUTPUT.OBJECT_IMPORT_FAILED,
					objectImport.customObject.type,
					objectImport.customObject.id,
					objectImport.customObject.result.message
				)}`;
				this.consoleLogger.warning(unimportedObjectLogMessage);
			});
		}
	}
}
