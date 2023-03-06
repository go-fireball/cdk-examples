#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AlbFargateStack } from '../lib/stacks/alb-fargate-stack';
import {config} from "../lib/config/config";
import {MonitoringStack} from "../lib/stacks/monitoring-stack";

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

new MonitoringStack(app, `${appConfig.environment}-${appConfig.appName}-MonitoringStack`, appConfig,{
    env: env,
    tags,
});

new AlbFargateStack(app, `${appConfig.environment}-${appConfig.appName}-AlbFargateStack`, appConfig,{
    env: env,
    tags,
});
