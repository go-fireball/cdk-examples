# Simple WebApp or API through AWS ALB-Fargate

This example contains two CDK Stacks 
- MonitoringStack
- AlbFargateStack

## MonitoringStack
The stack creates three Amazon Simple Notification Service (SNS) topics: "low," "high," and "critical" based on the input configuration. These topics are used for alerting purposes with different levels of severity. The stack then subscribes email addresses to these topics using the list of email addresses specified in the input configuration.

After creating the SNS topics, the code loops through the email addresses specified in the input configuration and subscribes them to the appropriate SNS topic. This is done using the addSubscription method of each SNS topic, which takes an aws_sns_subscriptions.EmailSubscription object representing the email address to be subscribed. 

## AlbFargateStack

This stack provisions an  infrastructure to deploy a containerized API service in Fargate. Summary of the code's functionality:

- A VPC, ECS cluster, Fargate task definition, and service are created.
- An Application Load Balancer (ALB) and a target group are created to route traffic to the Fargate service.
- Cloud Watch alarms are created to monitor the health of the target group.
- An SNS topic is defined with an ARN to notify stakeholders in case of a critical issue.

