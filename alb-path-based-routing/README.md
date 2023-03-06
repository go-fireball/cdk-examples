# Web Application utilizing Path based routing

The code creates an ALB, three Fargate ECS services (api, ui, default), and task definitions for each of the Fargate services. 
The Fargate tasks are defined with a container image, port mappings, and logging configurations. 
Each Fargate service is associated with Fargate cluster, an Application Target Group and a listener rule.

The Application Target Group and the listener rule are used to route the incoming traffic to the correct Fargate service based on the path specified in the URL.
- http://domain.com/api/* routed to API container
- http://domain.com/ui/* routed to UI container
- http://domain.com/* routed to default container (Note: This container is not running, so users will get 5xx error)

Overall, this code provisions an environment with a scalable, highly available infrastructure for deploying containerized services on AWS.
