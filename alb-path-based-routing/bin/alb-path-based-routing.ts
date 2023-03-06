#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {AlbPathBasedRoutingStack} from "../lib/stacks/alb-path-based-routing-stack";
import {config} from "../lib/config/config";

const environment = process.env.APP_ENVIRONMENT || 'dev';
const appConfig = config[environment];
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

new AlbPathBasedRoutingStack(app, `${appConfig.environment}-${appConfig.appName}-AlbPathBasedRoutingStack`, appConfig,{
    env: env,
    tags,
});
