import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';
import FormData from 'form-data';

export class Zius implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zius WhatsApp',
		name: 'zius',
		icon: 'file:zius.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Advanced Zius WhatsApp API operations',
		defaults: {
			name: 'Zius WhatsApp',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'ziusApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Single Chat',
						value: 'sendSingle',
						description: 'Send a message to a single WhatsApp number',
						action: 'Send a single chat',
					},
					{
						name: 'Send Bulk Chats',
						value: 'sendBulk',
						description: 'Send a bulk campaign message',
						action: 'Send bulk chats',
					},
					{
						name: 'Get Received Chats',
						value: 'getReceived',
						description: 'Retrieve received WhatsApp messages',
						action: 'Get received chats',
					},
					{
						name: 'Validate Number',
						value: 'validateNumber',
						description: 'Validate a WhatsApp phone number',
						action: 'Validate a number',
					},
				],
				default: 'sendSingle',
			},
			{
				displayName: 'Recipient Phone Number',
				name: 'recipient',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendSingle'],
					},
				},
				default: '',
				placeholder: 'e.g., 201012345678',
				required: true,
				description: 'The phone number of the recipient',
			},
			{
				displayName: 'Campaign Name',
				name: 'campaign',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendBulk'],
					},
				},
				default: '',
				required: true,
				description: 'The name of your campaign',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				displayOptions: {
					show: {
						operation: ['sendSingle', 'sendBulk'],
					},
				},
				default: '',
				required: true,
				description: 'The text message to send',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getReceived'],
					},
				},
				default: 10,
				description: 'Number of results to return',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getReceived'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['validateNumber'],
					},
				},
				default: '',
				required: true,
				description: 'The phone number to validate',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('ziusApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let options: any;

				if (operation === 'sendSingle') {
					const recipient = this.getNodeParameter('recipient', i) as string;
					const message = this.getNodeParameter('message', i) as string;

					const form = new FormData();
					form.append('secret', credentials.secret as string);
					form.append('account', credentials.account as string);
					form.append('recipient', recipient);
					form.append('type', 'text');
					form.append('message', message);

					options = {
						method: 'POST' as const,
						url: 'https://zius.uk/api/send/whatsapp',
						body: form,
						headers: form.getHeaders(),
					};

				} else if (operation === 'sendBulk') {
					const campaign = this.getNodeParameter('campaign', i) as string;
					const message = this.getNodeParameter('message', i) as string;

					options = {
						method: 'POST' as const,
						url: 'https://zius.uk/api/send/whatsapp.bulk',
						body: {
							secret: credentials.secret,
							account: credentials.account,
							campaign: campaign,
							type: 'text',
							message: message,
						},
						json: true,
					};

				} else if (operation === 'getReceived') {
					const limit = this.getNodeParameter('limit', i) as number;
					const page = this.getNodeParameter('page', i) as number;

					options = {
						method: 'GET' as const,
						url: 'https://zius.uk/api/get/wa.received',
						qs: {
							secret: credentials.secret,
							limit: limit,
							page: page,
						},
						json: true,
					};

				} else if (operation === 'validateNumber') {
					const phone = this.getNodeParameter('phone', i) as string;

					options = {
						method: 'GET' as const,
						url: 'https://zius.uk/api/validate/whatsapp',
						qs: {
							secret: credentials.secret,
							unique: credentials.account, 
							phone: phone,
						},
						json: true,
					};
				}

				const responseData = await this.helpers.httpRequest(options);
				returnData.push({ json: responseData });

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as any).message } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as any);
			}
		}

		return [returnData];
	}
}