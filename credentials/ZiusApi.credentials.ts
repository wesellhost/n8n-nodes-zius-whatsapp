import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZiusApi implements ICredentialType {
	name = 'ziusApi';
	displayName = 'Zius API';
	documentationUrl = 'https://zius.uk/dashboard/docs';
	
	properties: INodeProperties[] = [
		{
			displayName: 'API Secret',
			name: 'secret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'WhatsApp Account Unique ID',
			name: 'account',
			type: 'string',
			default: '',
			required: true,
		},
	];
}