export interface Prompt<T> {
    (x: PromptParameters<T>[]): Promise<T>
}

export interface PromptParameters<T> {
	type: string; 
	name: string; 
	message: string | ((answers:T) => string);
	default?: string | number | boolean;
	mask?: string;
	choices?: any[];
	pageSize?: number;
	when?: boolean | ((response: T) => boolean);
	filter?: (answer: string) => string; 
	validate?: (fieldValue: string) => any 
	transformer?: (input: string, answers: T, flags: string[]) => string;
}