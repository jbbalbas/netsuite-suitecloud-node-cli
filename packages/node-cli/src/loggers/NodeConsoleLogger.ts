/*
 ** Copyright (c) 2020 Oracle and/or its affiliates.  All rights reserved.
 ** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

import chalk, { Chalk } from 'chalk';
import ConsoleLogger from './ConsoleLogger';
import { COLORS } from './LoggerConstants';

class NodeConsoleLogger extends ConsoleLogger {
	public println(message: string, color: Chalk) {
		console.log(this.formatString(message, { color: color }));
	}

	public info(message: string) {
		this.println(message, COLORS.INFO);
	}

	public result(message: string) {
		this.println(message, COLORS.RESULT);
	}

	public warning(message: string) {
		this.println(message, COLORS.WARNING);
	}

	public error(message: string) {
		this.println(message, COLORS.ERROR);
	}

	private formatString(str: string, options: {color?: Chalk; bold?: (str: string) => string}): string {
		const color = options.color || COLORS.DEFAULT;
		const bold = options.bold ? chalk.bold : (str: string) => str;
		return bold(color(str));
	}
}

const instance = new NodeConsoleLogger();

export { instance as NodeConsoleLogger };
