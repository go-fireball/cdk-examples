import { IEnvironmentConfig } from './i-environment-config';

const appName = 'testapp';

export const config: {[key: string]: IEnvironmentConfig} = {
    dev: {
        environment: 'dev',
        deleteProtection: false,
        appName: appName,
        region: 'us-east-1',
        account: 'YOUR-AWS-ACCOUNT-NUMBER',
        vpcId: 'YOUR-AWS-VPC-ID',
        alertSubscriptions: {
            lowAlertSubscriptions: ['user@example.com'],
            highAlertSubscriptions: ['user@example.com'],
            criticalAlertSubscriptions: ['user@example.com'],
        },
    },
};