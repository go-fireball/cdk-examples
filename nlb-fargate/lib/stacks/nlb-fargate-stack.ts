import * as cdk from 'aws-cdk-lib';
import {
    aws_cloudwatch, aws_cloudwatch_actions,
    aws_ec2,
    aws_ecs,
    aws_elasticloadbalancingv2,
    aws_logs, aws_sns,
    Duration,
    RemovalPolicy,
    Stack,
    StackProps
} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {IEnvironmentConfig} from "../config/i-environment-config";
import {LogDriver} from "aws-cdk-lib/aws-ecs";
import {Protocol, TargetType} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {SecurityGroup} from "aws-cdk-lib/aws-ec2";


export class NlbFargateStack extends Stack {
    constructor(scope: Construct, id: string, config: IEnvironmentConfig, props?: StackProps) {
        super(scope, id, props);

        const vpc = aws_ec2.Vpc.fromLookup(this, 'VpcRef', {vpcId: config.vpcId});

        const ecsCluster = new aws_ecs.Cluster(this, `${config.environment}-${config.appName}-cluster`, {
            clusterName: `${config.environment}-${config.appName}-fargate-cluster`,
            vpc: vpc,
            enableFargateCapacityProviders: true,
            containerInsights: true,
        });

        const logGroup = new aws_logs.LogGroup(this, `${config.environment}-${config.appName}-log-group`, {
            logGroupName: `${config.environment}-${config.appName}-log-group`,
            retention: RetentionDays.TWO_WEEKS,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const publicNlb = new cdk.aws_elasticloadbalancingv2.NetworkLoadBalancer(this, `${config.environment}-${config.appName}-alb`, {
            vpc,
            internetFacing: true,
            loadBalancerName: `${config.environment}-${config.appName}-nlb`,
            deletionProtection: config.deleteProtection,
        });

        const fargateTaskDefinition = new aws_ecs.FargateTaskDefinition(this, `${config.environment}-${config.appName}-api-task`, {
            memoryLimitMiB: 2048,
            cpu: 1024,
        });

        fargateTaskDefinition.addContainer(`${config.environment}-${config.appName}-api-container`, {
            containerName: `${config.environment}-${config.appName}-api-container`,
            image: aws_ecs.ContainerImage.fromRegistry('nginxdemos/hello'),
            portMappings: [{
                containerPort: 80,
                protocol: aws_ecs.Protocol.TCP
            }],
            logging: LogDriver.awsLogs({
                streamPrefix: 'api-logstream',
                logGroup: logGroup,
            }),
            environment: {
                /* Add your container environment variable here */
            },
        });

        const secGroup = new SecurityGroup(this, `${config.environment}-${config.appName}-fargate-sg`, {
            securityGroupName: `${config.environment}-${config.appName}-fargate-sg`,
            vpc:vpc,
            allowAllOutbound:true,
            allowAllIpv6Outbound: true,
        });

        // This is required, for the clients to reach the container
        secGroup.addIngressRule(aws_ec2.Peer.ipv4('0.0.0.0/0'), aws_ec2.Port.tcp(80), 'traffic from anywhere');

        const fargateService = new aws_ecs.FargateService(this, `${config.environment}-${config.appName}-api-service`, {
            cluster: ecsCluster,
            serviceName: `${config.environment}-${config.appName}-api-service`,
            taskDefinition: fargateTaskDefinition,
            securityGroups: [secGroup]
        });
        //
        const networkTargetGroup = new cdk.aws_elasticloadbalancingv2.NetworkTargetGroup(this, `${config.environment}-${config.appName}-net-target-group`, {
            targetGroupName: `${config.environment}-${config.appName}-api`,
            port: 80,
            vpc: vpc,
            deregistrationDelay: Duration.seconds(0),
            connectionTermination: true,
            protocol: Protocol.TCP_UDP,
            targetType: TargetType.IP,
            healthCheck:{
                protocol: Protocol.HTTP,
                path: '/api/health',
            }
        })
        //
        const listener = publicNlb.addListener('tcpListener', {
            port: 80,
        });

        listener.addAction('listener-action', {
            action: aws_elasticloadbalancingv2.NetworkListenerAction.forward([networkTargetGroup])
        })

        fargateService.attachToNetworkTargetGroup(networkTargetGroup);

        const applicationScalingTarget = fargateService.autoScaleTaskCount({
            minCapacity: 2,
            maxCapacity: 5,
        });

        applicationScalingTarget.scaleOnCpuUtilization(`${config.environment}-${config.appName}-api-scaling`,{
            targetUtilizationPercent: 50,
        })

        const apiAlarmHealthCount = new aws_cloudwatch.Alarm(this, `${config.environment}-${config.appName}-api-health-count`, {
          comparisonOperator: aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
          evaluationPeriods: 1,
          metric: networkTargetGroup.metrics.healthyHostCount(),
          threshold: 2,
        });
        //
        const criticalTopic = aws_sns.Topic.fromTopicArn(this, 'CriticalSNSTopic', `arn:aws:sns:${config.region}:${config.account}:${config.environment}-${config.appName}-critical`);

        apiAlarmHealthCount.addAlarmAction(new aws_cloudwatch_actions.SnsAction(criticalTopic));
    }
}

