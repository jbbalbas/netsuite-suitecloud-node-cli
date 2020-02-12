/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import NodeTranslationService from '../services/NodeTranslationService';
import { COMMAND_OPTION_IS_MANDATORY } from '../services/TranslationKeys';
import assert from 'assert';
import { SKDCommandOption, NodeCommandOption } from '../../types/Metadata';

export default class CommandOptionsValidator {
	validate(options: { commandOptions: {
		[x: string]: SKDCommandOption | NodeCommandOption;
	}, arguments: { [x: string]: string }; }) {
		assert(options);
		assert(options.commandOptions);
		assert(options.arguments);

		const validationErrors = [];
		const isMandatoryOptionPresent = (optionId: string, aliasId: string, args: { [x: string]: string }) => {
			return args[optionId] || args[aliasId];
		};

		for (const optionId in options.commandOptions) {
			const option = options.commandOptions[optionId];
			const aliasId = option.alias? option.alias : '';
			if (options.commandOptions.hasOwnProperty(optionId)) {
				if (option.mandatory && !isMandatoryOptionPresent(optionId, aliasId, options.arguments)) {
					validationErrors.push(NodeTranslationService.getMessage(COMMAND_OPTION_IS_MANDATORY, option.name));
				}
			}
		}
		return validationErrors;
	}
};
