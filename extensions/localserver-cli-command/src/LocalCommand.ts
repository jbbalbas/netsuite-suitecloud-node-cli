/*
** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
'use strict';

import DeployXml from './DeployXml';
import Compiler from './compilers/Compiler';
import CompilationContext from './CompilationContext';
import LocalServer from './LocalServer';

import Translation from './services/Translation';
import Log from './services/Log';
import FileSystem from './services/FileSystem';
import Watch from './Watch';

export default class LocalCommand {
	private projectFolder: any;
	init?: boolean;
	objectsPath: any;
	filesPath: any;
	themes: any;
	extensions: any;
	constructor(options: any) {
		this.projectFolder = options.projectFolder;
		Translation.start(...options.translation);
		Log.start(options.colors);
		FileSystem.start(options.filesystem);
	}

	initialize() {
		if (this.init) {
			return;
		}
		this.init = true;

		const deployXml = new DeployXml({ projectFolder: this.projectFolder });
		const objects = deployXml.getObjects();

		this.objectsPath = deployXml.objectsPath;
		this.filesPath = deployXml.filesPath;
		this.themes = objects.themes;
		this.extensions = objects.extensions;
	}

	getCommandQuestions(prompt: any) {
		let extensions = Object.keys(this.extensions),
			themes = Object.keys(this.themes);
		let options = [
			{
				type: 'list',
				name: 'theme',
				message: Translation.getMessage('CHOOSE_THEME'),
				choices: this.validateTheme(themes),
			},
		];

		if (extensions.length) {
			options.push({
				type: 'checkbox',
				name: 'extensions',
				message: Translation.getMessage('CHOOSE_EXTENSION'),
				choices: extensions,
			});
		}

		return prompt(options);
	}

	async executeAction(answers: any) {
		if (!answers.extensions || answers.extensions === true) {
			answers.extensions = [];
		}
		const theme = answers.theme;
		let extensionsList = Array.isArray(answers.extensions)
			? answers.extensions
			: answers.extensions.split(',');
		const extensions = extensionsList.map((extension: any) => extension.trim());

		//Validate answers
		this.validateTheme(theme);
		this.validateExtensions(extensions);

		LocalServer.config({ port: answers.port, runhttps: answers.runhttps });

		const context = this.createCompilationContext(theme, extensions);
		const compiler = new Compiler({ context: context });
		const watch = new Watch({ context: context, compilers: compiler.compilers });

		await compiler.compile();

		watch.start();

		return LocalServer.startServer(context.localServerPath);
	}

	private createCompilationContext(theme: any, extensions: any) {
		return new CompilationContext({
			theme: theme,
			extensions: extensions,
			objectsPath: this.objectsPath,
			filesPath: this.filesPath,
			projectFolder: this.projectFolder,
		});
	}

	private validateTheme(theme: any) {
		if (Array.isArray(theme)) {
			// interactive mode
			if (!theme.length) {
				throw new Error(Translation.getMessage('NO_THEMES', [this.objectsPath]));
			}
		} else {
			if (!this.themes[theme]) {
				throw new Error(
					Translation.getMessage('RESOURCE_NOT_FOUND', [theme, this.objectsPath])
				);
			}
		}

		return theme;
	}

	private validateExtensions(extensions: any[]) {
		extensions.forEach(extension => {
			if (!this.extensions[extension]) {
				throw Translation.getMessage('RESOURCE_NOT_FOUND', [extension, this.objectsPath]);
			}
		});

		return extensions;
	}
};
