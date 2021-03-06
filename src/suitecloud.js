#!/usr/bin/env node
/*
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

const CLI = require('./CLI');
const CommandsMetadataService = require('./core/CommandsMetadataService');
const CommandActionExecutor = require('./core/CommandActionExecutor');
const CommandInstanceFactory = require('./core/CommandInstanceFactory');
const CommandRegistrationService = require('./core/CommandRegistrationService');
const CommandOptionsValidator = require('./core/CommandOptionsValidator');
const CLIConfigurationService = require('./core/extensibility/CLIConfigurationService');
const AccountDetailsService = require('./core/accountsetup/AccountDetailsService');
const CommandOutputHandler = require('./core/CommandOutputHandler');

const commandsMetadataServiceSingleton = new CommandsMetadataService();

const cliInstance = new CLI({
	commandsMetadataService: commandsMetadataServiceSingleton,
	commandRegistrationService: new CommandRegistrationService(),
	commandActionExecutor: new CommandActionExecutor({
		commandOutputHandler: new CommandOutputHandler(),
		commandOptionsValidator: new CommandOptionsValidator(),
		cliConfigurationService: new CLIConfigurationService(),
		commandInstanceFactory: new CommandInstanceFactory(),
		accountDetailsService: new AccountDetailsService(),
		commandsMetadataService: commandsMetadataServiceSingleton,
	}),
});

cliInstance.start(process);
