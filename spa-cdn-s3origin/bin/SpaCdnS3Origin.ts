#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {SpaCdnS3OriginStack} from "../lib/stacks/SpaCdnS3OriginStack";
import {Config} from "../lib/config/Config";

const environment = process.env.APP_ENVIRONMENT || 'dev';
const appConfig = Config[environment];
const env = {
    account: appConfig.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: appConfig.region || process.env.CDK_DEFAULT_REGION,
};
const tags = {
    Environment: environment,
    Application: `${appConfig.appName}`,
    Team: 'go-fireball',
    Owner: 'user@example.com',
};


const app = new cdk.App();
new SpaCdnS3OriginStack(app, `${appConfig.environment}-${appConfig.appName}-SpaCdnS3OriginStack`, appConfig,{
    env: env,
    tags,
});