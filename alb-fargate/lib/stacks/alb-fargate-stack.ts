import {
  aws_cloudwatch, aws_cloudwatch_actions,
  aws_ec2,
  aws_ecs,
  aws_elasticloadbalancingv2,
  aws_logs,
  aws_sns, Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {IEnvironmentConfig} from "../config/i-environment-config";
import {LogDriver} from "aws-cdk-lib/aws-ecs";
import {
  ApplicationProtocol, HttpCodeTarget, ListenerAction,
  TargetGroupLoadBalancingAlgorithmType,
  TargetType
} from "aws-cdk-lib/aws-elasticloadbalancingv2";


export class AlbFargateStack extends Stack {
  constructor(scope: Construct, id: string, config: IEnvironmentConfig, props?: StackProps) {
    super(scope, id, props);

    const vpc = aws_ec2.Vpc.fromLookup(this, 'VpcRef', { vpcId: config.vpcId });

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

    const publicAlb = new aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, `${config.environment}-${config.appName}-alb`, {
      vpc,
      internetFacing: true,
      loadBalancerName: `${config.environment}-${config.appName}-pri`,
      deletionProtection: config.deleteProtection,
    });

    const fargateTaskDefinition = new aws_ecs.FargateTaskDefinition(this, `${config.environment}-${config.appName}-api-task`, {
      memoryLimitMiB: 1024,
      cpu: 512,
    });
    fargateTaskDefinition.addContainer(`${config.environment}-${config.appName}-api-container`, {
      containerName: `${config.environment}-${config.appName}-api-container`,
      image: aws_ecs.ContainerImage.fromRegistry('nginxdemos/hello'),
      portMappings: [{
        containerPort: 80,
      }],
      logging: LogDriver.awsLogs({
        streamPrefix: 'api-logstream',
        logGroup: logGroup,
      }),
      environment: {
        /* Add your container environment variable here */
      },
    });

    const fargateService = new aws_ecs.FargateService(this, `${config.environment}-${config.appName}-api-service`, {
      cluster: ecsCluster,
      serviceName: `${config.environment}-${config.appName}-api-service`,
      taskDefinition: fargateTaskDefinition,
    });

    const applicationTargetGroup = new aws_elasticloadbalancingv2.ApplicationTargetGroup(this, `${config.environment}-${config.appName}-api-target-group`, {
      targetGroupName: `${config.environment}-${config.appName}-api`,
      protocol: ApplicationProtocol.HTTP, // Use HTTPS
      port: 80,
      vpc: vpc,
      targetType: TargetType.IP,
      deregistrationDelay: Duration.seconds(0),
      loadBalancingAlgorithmType: TargetGroupLoadBalancingAlgorithmType.LEAST_OUTSTANDING_REQUESTS,
      healthCheck: {
        enabled: true,
        path: '/api/healthcheck',
        interval: Duration.seconds(60), // 10
        timeout: Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
      },
    });

    publicAlb.addListener('httpsListener', {
      port: 80,
      open: true,
      defaultAction: ListenerAction.forward([applicationTargetGroup]),
    });

    fargateService.attachToApplicationTargetGroup(applicationTargetGroup);

    const applicationScalingTarget = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    });

    applicationScalingTarget.scaleOnRequestCount(`${config.environment}-${config.appName}-api-scaling`, {
      targetGroup: applicationTargetGroup,
      requestsPerTarget: 500,
    });

    const apiAlarm4XX = new aws_cloudwatch.Alarm(this, `${config.environment}-${config.appName}-api-4xx`, {
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      metric: applicationTargetGroup.metrics.httpCodeTarget(HttpCodeTarget.TARGET_4XX_COUNT),
      threshold: 1,
    });
    const apiAlarm5XX = new aws_cloudwatch.Alarm(this, `${config.environment}-${config.appName}-api-5xx`, {
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      metric: applicationTargetGroup.metrics.httpCodeTarget(HttpCodeTarget.TARGET_5XX_COUNT),
      threshold: 1,
    });
    const apiAlarmHealthCount = new aws_cloudwatch.Alarm(this, `${config.environment}-${config.appName}-api-health-count`, {
      comparisonOperator: aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 1,
      metric: applicationTargetGroup.metrics.healthyHostCount(),
      threshold: 2,
    });

    const criticalTopic = aws_sns.Topic.fromTopicArn(this, 'CriticalSNSTopic', `arn:aws:sns:${config.region}:${config.account}:${config.environment}-${config.appName}-critical`);
    const highTopic = aws_sns.Topic.fromTopicArn(this, 'HighSNSTopic', `arn:aws:sns:${config.region}:${config.account}:${config.environment}-${config.appName}-high`);

    apiAlarm4XX.addAlarmAction(new aws_cloudwatch_actions.SnsAction(highTopic));
    apiAlarm5XX.addAlarmAction(new aws_cloudwatch_actions.SnsAction(criticalTopic));
    apiAlarmHealthCount.addAlarmAction(new aws_cloudwatch_actions.SnsAction(criticalTopic));
  }
}

