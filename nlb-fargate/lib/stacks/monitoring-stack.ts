import {aws_sns, aws_sns_subscriptions, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {IEnvironmentConfig} from "../config/i-environment-config";

export class MonitoringStack extends Stack {
    constructor(scope: Construct, id: string, config: IEnvironmentConfig, props: StackProps = {}) {
        super(scope, id, props);

        const low = new aws_sns.Topic(this, `${config.environment}-${config.appName}-low`, {
            topicName: `${config.environment}-${config.appName}-low`,
            displayName: `${config.environment}-${config.appName}-low`,
        });

        const high = new aws_sns.Topic(this, `${config.environment}-${config.appName}-high`, {
            topicName: `${config.environment}-${config.appName}-high`,
            displayName: `${config.environment}-${config.appName}-high`,
        });

        const critical = new aws_sns.Topic(this, `${config.environment}-${config.appName}-critical`, {
            topicName: `${config.environment}-${config.appName}-critical`,
            displayName: `${config.environment}-${config.appName}-critical`,
        });

        for (let email of config.alertSubscriptions.lowAlertSubscriptions) {
            low.addSubscription(new aws_sns_subscriptions.EmailSubscription(email));
        }

        for (let email of config.alertSubscriptions.highAlertSubscriptions) {
            high.addSubscription(new aws_sns_subscriptions.EmailSubscription(email));
        }

        for (let email of config.alertSubscriptions.criticalAlertSubscriptions) {
            critical.addSubscription(new aws_sns_subscriptions.EmailSubscription(email));
        }
    }
}