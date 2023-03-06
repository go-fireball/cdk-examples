# Simple WebApp or API through AWS NLB-Fargate

This example contains two CDK Stacks
- MonitoringStack
- NlbFargateStack

## MonitoringStack
The stack creates three Amazon Simple Notification Service (SNS) topics: "low," "high," and "critical" based on the input configuration. These topics are used for alerting purposes with different levels of severity. The stack then subscribes email addresses to these topics using the list of email addresses specified in the input configuration.

After creating the SNS topics, the code loops through the email addresses specified in the input configuration and subscribes them to the appropriate SNS topic. This is done using the addSubscription method of each SNS topic, which takes an aws_sns_subscriptions.EmailSubscription object representing the email address to be subscribed.

## NlbFargateStack

This stack provisions an  infrastructure to deploy a containerized API service in Fargate. Summary of the code's functionality:

- A VPC, ECS cluster, Fargate task definition, and service are created.
- A Network Load Balancer (NLB) and a target group are created to route traffic to the Fargate service.
- Cloud Watch alarms are created to monitor the health of the target group.
- An SNS topic is defined with an ARN to notify stakeholders in case of a critical issue.

## When to use Network Load Balancer (NLB) over an Application Load Balancer (ALB):

- High Performance: NLBs are designed to handle high traffic volumes with low latency and high throughput. They are optimized for TCP, UDP, and TLS traffic and can take millions of requests per second. They are a good choice for applications that require high performance, such as gaming, media streaming, or financial services.
- Network Protocols: NLBs is capable of load-balancing any network protocol, including HTTP, HTTPS, TCP, UDP, and TLS. This allows them to be used for various applications, including legacy applications that do not use HTTP.
- Connection Persistence: NLBs can be configured to maintain a persistent connection between the client and the backend server. This is useful for applications requiring long-lived connections, such as IoT or real-time communication apps.
- IP-Based Routing: NLBs use IP-based routing to forward traffic to backend servers. This means that the client's IP address is preserved, which is helpful for applications that rely on client IP addresses, such as geolocation.
- Cost-Effective: NLBs are often more cost-effective than ALBs for high-traffic applications, as they require less processing power and can handle more traffic with fewer instances.


Overall, Network Load Balancers are an excellent choice for high-performance, high-traffic applications requiring support for various network protocols and connection persistence. However, Application Load Balancers are better suited for applications that require advanced routing based on HTTP/HTTPS traffic, advanced load balancing algorithms, or integration with other AWS services.
