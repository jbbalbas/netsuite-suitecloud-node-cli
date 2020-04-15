/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';
import OutputFormatter from './OutputFormatter';
import { NodeTranslationService } from '../../services/NodeTranslationService';

import { COMMAND_UPDATE } from '../../services/TranslationKeys';
import ConsoleLogger from '../../loggers/ConsoleLogger';
import { ActionResult } from '../actionresult/ActionResult';

const UPDATED_OBJECT_TYPE = {
	SUCCESS: 'SUCCESS',
};

type UpdateData = {
	type: string;
	key: string;
	message: string;
}[];

export default class UpdateOutputFormatter extends OutputFormatter {
	constructor(consoleLogger: ConsoleLogger) {
		super(consoleLogger);
	}

	public formatActionResult(actionResult: ActionResult<UpdateData>) {
		const updatedObjects = actionResult.data.filter(element => element.type === UPDATED_OBJECT_TYPE.SUCCESS);
		const noUpdatedObjects = actionResult.data.filter(element => element.type !== UPDATED_OBJECT_TYPE.SUCCESS);
		const sortByKey = (a: {key: string}, b: {key: string}) => (a.key > b.key ? 1 : -1);

		if (updatedObjects.length > 0) {
			this.consoleLogger.result(NodeTranslationService.getMessage(COMMAND_UPDATE.OUTPUT.UPDATED_OBJECTS));
			updatedObjects.sort(sortByKey).forEach(updatedObject => this.consoleLogger.result(updatedObject.key));
		}
		if (noUpdatedObjects.length > 0) {
			this.consoleLogger.warning(NodeTranslationService.getMessage(COMMAND_UPDATE.OUTPUT.NO_UPDATED_OBJECTS));
			noUpdatedObjects.sort(sortByKey).forEach(noUpdatedObject => this.consoleLogger.warning(noUpdatedObject.message));
		}
	}
}
