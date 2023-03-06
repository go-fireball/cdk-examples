import {
  aws_ec2,
  aws_ecs,
  aws_elasticloadbalancingv2,
  aws_logs,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {IEnvironmentConfig} from "../config/i-environment-config";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {LogDriver} from "aws-cdk-lib/aws-ecs";
import {
  ApplicationProtocol, ListenerAction,
  TargetGroupLoadBalancingAlgorithmType,
  TargetType
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class AlbPathBasedRoutingStack extends Stack {
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
      loadBalancerName: `${config.environment}-${config.appName}-pub`,
      deletionProtection: config.deleteProtection,
    });

    const apiFargateTaskDefinition = new aws_ecs.FargateTaskDefinition(this, `${config.environment}-${config.appName}-api-task`, {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    const uiFargateTaskDefinition = new aws_ecs.FargateTaskDefinition(this, `${config.environment}-${config.appName}-ui-task`, {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    const defFargateTaskDefinition = new aws_ecs.FargateTaskDefinition(this, `${config.environment}-${config.appName}-def-task`, {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    apiFargateTaskDefinition.addContainer(`${config.environment}-${config.appName}-api-container`, {
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

    uiFargateTaskDefinition.addContainer(`${config.environment}-${config.appName}-ui-container`, {
      containerName: `${config.environment}-${config.appName}-api-container`,
      image: aws_ecs.ContainerImage.fromRegistry('nginxdemos/hello'),
      portMappings: [{
        containerPort: 80,
      }],
      logging: LogDriver.awsLogs({
        streamPrefix: 'ui-logstream',
        logGroup: logGroup,
      }),
      environment: {
        /* Add your container environment variable here */
      },
    });

    defFargateTaskDefinition.addContainer(`${config.environment}-${config.appName}-ui-container`, {
      containerName: `${config.environment}-${config.appName}-api-container`,
      image: aws_ecs.ContainerImage.fromRegistry('nginxdemos/hello'),
      portMappings: [{
        containerPort: 80,
      }],
      logging: LogDriver.awsLogs({
        streamPrefix: 'def-logstream',
        logGroup: logGroup,
      }),
      environment: {
        /* Add your container environment variable here */
      },
    });

    const apiFargateService = new aws_ecs.FargateService(this, `${config.environment}-${config.appName}-api-service`, {
      cluster: ecsCluster,
      serviceName: `${config.environment}-${config.appName}-api-service`,
      taskDefinition: apiFargateTaskDefinition,
    });

    const uiFargateService = new aws_ecs.FargateService(this, `${config.environment}-${config.appName}-ui-service`, {
      cluster: ecsCluster,
      serviceName: `${config.environment}-${config.appName}-ui-service`,
      taskDefinition: uiFargateTaskDefinition,
    });

    const defFargateService = new aws_ecs.FargateService(this, `${config.environment}-${config.appName}-def-service`, {
      cluster: ecsCluster,
      serviceName: `${config.environment}-${config.appName}-def-service`,
      taskDefinition: defFargateTaskDefinition,
    });

    const apiApplicationTargetGroup = new aws_elasticloadbalancingv2.ApplicationTargetGroup(this, `${config.environment}-${config.appName}-api-target-group`, {
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

    const uiApplicationTargetGroup = new aws_elasticloadbalancingv2.ApplicationTargetGroup(this, `${config.environment}-${config.appName}-ui-target-group`, {
      targetGroupName: `${config.environment}-${config.appName}-ui`,
      protocol: ApplicationProtocol.HTTP, // Use HTTPS
      port: 80,
      vpc: vpc,
      targetType: TargetType.IP,
      deregistrationDelay: Duration.seconds(0),
      loadBalancingAlgorithmType: TargetGroupLoadBalancingAlgorithmType.LEAST_OUTSTANDING_REQUESTS,
      healthCheck: {
        enabled: true,
        path: '/ui/healthcheck', // Health Check Path is different
        interval: Duration.seconds(60), // 10
        timeout: Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
      },
    });

    const defApplicationTargetGroup = new aws_elasticloadbalancingv2.ApplicationTargetGroup(this, `${config.environment}-${config.appName}-def-target-group`, {
      targetGroupName: `${config.environment}-${config.appName}-def`,
      protocol: ApplicationProtocol.HTTP, // Use HTTPS
      port: 80,
      vpc: vpc,
      targetType: TargetType.IP,
      deregistrationDelay: Duration.seconds(0),
      loadBalancingAlgorithmType: TargetGroupLoadBalancingAlgorithmType.LEAST_OUTSTANDING_REQUESTS,
      healthCheck: {
        enabled: true,
        path: '/*', // Health Check Path is different
        interval: Duration.seconds(60), // 10
        timeout: Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
      },
    });

    /* By Default Forward to a target group that doesn't have any containers,
       This will help us keep the robo traffic out of the containers
     */
    const httpListener = publicAlb.addListener('httpListener', {
      port: 80,
      open: true,
      defaultAction: ListenerAction.forward([defApplicationTargetGroup]),
    });

    httpListener.addAction(`${config.environment}-${config.appName}-api-target`, {
      action: ListenerAction.forward([apiApplicationTargetGroup]),
      priority: 10,
      conditions: [
        aws_elasticloadbalancingv2.ListenerCondition.pathPatterns(['/api/*']),
      ],
    });

    httpListener.addAction(`${config.environment}-${config.appName}-ui-target`, {
      action: ListenerAction.forward([uiApplicationTargetGroup]),
      priority: 20,
      conditions: [
        aws_elasticloadbalancingv2.ListenerCondition.pathPatterns(['/ui/*']),
      ],
    });

    apiFargateService.attachToApplicationTargetGroup(apiApplicationTargetGroup);
    uiFargateService.attachToApplicationTargetGroup(uiApplicationTargetGroup);
    defFargateService.attachToApplicationTargetGroup(defApplicationTargetGroup);

    apiFargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    });
    uiFargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    });
    defFargateService.autoScaleTaskCount({
      minCapacity: 0,
      maxCapacity: 0,
    });
  }
}
