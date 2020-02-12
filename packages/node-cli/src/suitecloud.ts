#!/usr/bin/env node
/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import CLI from './CLI';
import CommandsMetadataService from './core/CommandsMetadataService';
import CommandActionExecutor from './core/CommandActionExecutor';
import CommandInstanceFactory from './core/CommandInstanceFactory';
import CommandRegistrationService from './core/CommandRegistrationService';
import CommandOptionsValidator from './core/CommandOptionsValidator';
import CLIConfigurationService from './core/extensibility/CLIConfigurationService';
import AuthenticationService from './core/authentication/AuthenticationService';
import path from 'path';
import NodeConsoleLogger from './loggers/NodeConsoleLogger';

const executionPath = process.cwd();
const rootCLIPath = path.dirname(require.main ? require.main.filename : '.');
const commandsMetadataServiceSingleton = new CommandsMetadataService(rootCLIPath);

export const cliInstance = new CLI({
	commandsMetadataService: commandsMetadataServiceSingleton,
	commandRegistrationService: new CommandRegistrationService(),
	commandActionExecutor: new CommandActionExecutor({
		executionPath,
		commandOptionsValidator: new CommandOptionsValidator(),
		cliConfigurationService: new CLIConfigurationService(),
		commandInstanceFactory: new CommandInstanceFactory(),
		authenticationService: new AuthenticationService(executionPath),
		commandsMetadataService: commandsMetadataServiceSingleton,
		consoleLogger: NodeConsoleLogger,
	}),
});

cliInstance.start(process);
