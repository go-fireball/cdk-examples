# SPA / Static Web App using S3-Cloudfront distribution

The SpaCdnS3OriginStack class is responsible for setting up a single-page application (SPA) infrastructure using AWS S3 and CloudFront services.

The main functionality of the code includes:

- Creating an S3 bucket for storing the static website content of the SPA.
- Creating a hosted zone for the domain name of the SPA.
- Creating an SSL/TLS certificate for the domain name of the SPA using AWS Certificate Manager.
- Creating an origin access identity for the S3 bucket to restrict access to the bucket's contents.
- Creating a CloudFront distribution that uses the S3 bucket as the origin for the SPA content and enforces HTTPS protocol with SSL/TLS certificate.
- Deploying the SPA content to the S3 bucket using AWS S3 deployment.
- Creating a Route53 alias record that points to the CloudFront distribution for the SPA.
- Overall, this code sets up an AWS infrastructure for hosting a SPA with high availability, security, and scalability using AWS services.

