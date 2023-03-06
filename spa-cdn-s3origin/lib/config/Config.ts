import {IEnvironmentConfig} from "./IEnvironmentConfig";


const appName = 'testapp';
const root = 'RootDomain.com';
/* Your applications will be deployed to {appName}.{root} .i.e. testapp.RootDomain.com */

export const Config: {[key: string]: IEnvironmentConfig} = {
    dev: {
        environment: 'dev',
        deleteProtection: false,
        appName: appName,
        region: 'us-east-1',
        account: 'YOUR ACCOUNT NUMBER',
        vpcId: 'YOUR VPC Id',
        domains: {
            root: `${root}`,
            ui: `${appName}.${root}`,
        },
    },
};