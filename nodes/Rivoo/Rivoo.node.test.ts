import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

import { Rivoo } from './Rivoo.node';

/** The declarative postReceive slot is a union; only the function form is used here. */
type PostReceiveFn = (
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
) => Promise<INodeExecutionData[]>;

const description = new Rivoo().description;

const properties = description.properties;

const operationProperties = properties.filter(
	(property) => property.name === 'operation',
) as INodeProperties[];

const operationOptions = operationProperties.flatMap(
	(property) => (property.options ?? []) as INodePropertyOptions[],
);

describe('Rivoo node description', () => {
	it('declares the three resources', () => {
		const resource = properties.find((property) => property.name === 'resource');

		expect((resource?.options as INodePropertyOptions[]).map((option) => option.value)).toEqual([
			'charge',
			'client',
			'refund',
		]);
	});

	it('routes every operation to a method and URL', () => {
		expect(operationOptions.length).toBe(13);

		for (const option of operationOptions) {
			const request = option.routing?.request;

			expect(request?.method).toBeDefined();
			expect(typeof request?.url).toBe('string');
		}
	});

	it('resolves the base URL from the credential', () => {
		expect(description.requestDefaults?.baseURL).toBe('={{$credentials?.baseUrl}}');
	});

	it('requires the API credential', () => {
		expect(description.credentials).toEqual([{ name: 'rivooApi', required: true }]);
	});
});

describe('Rivoo simplify', () => {
	const simplify = properties.find((property) => property.name === 'simplify');
	const postReceive = simplify?.routing?.output?.postReceive?.[0] as unknown as PostReceiveFn;

	const run = async (enabled: boolean, json: IDataObject) => {
		const context = {
			getNodeParameter: () => enabled,
		} as unknown as IExecuteSingleFunctions;

		return (await postReceive.call(
			context,
			[{ json }],
			{} as IN8nHttpFullResponse,
		)) as INodeExecutionData[];
	};

	it('unwraps a single-object envelope', async () => {
		const items = await run(true, {
			status: 200,
			message: 'ok',
			data: { id: 'charge_1' },
		});

		expect(items).toEqual([{ json: { id: 'charge_1' }, pairedItem: undefined }]);
	});

	it('splits an array envelope into one item per entry', async () => {
		const items = await run(true, {
			status: 200,
			message: 'ok',
			data: [{ id: 'clnt_1' }, { id: 'clnt_2' }],
		});

		expect(items.map((item) => item.json)).toEqual([{ id: 'clnt_1' }, { id: 'clnt_2' }]);
	});

	it('leaves responses that are not enveloped untouched', async () => {
		const raw = { id: 'charge_1', status: 'PROCESSING' };

		expect(await run(true, raw)).toEqual([{ json: raw }]);
	});

	it('keeps the envelope when the toggle is off', async () => {
		const enveloped = { status: 200, message: 'ok', data: { id: 'charge_1' } };

		expect(await run(false, enveloped)).toEqual([{ json: enveloped }]);
	});
});
