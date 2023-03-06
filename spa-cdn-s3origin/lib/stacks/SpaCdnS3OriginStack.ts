import {Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {IEnvironmentConfig} from "../config/IEnvironmentConfig";
import {Bucket, BucketEncryption} from "aws-cdk-lib/aws-s3";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {
    CloudFrontWebDistribution,
    OriginAccessIdentity,
    PriceClass, ViewerCertificate,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {BucketDeployment, CacheControl, Source} from "aws-cdk-lib/aws-s3-deployment";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";

export class SpaCdnS3OriginStack extends Stack {
    constructor(scope: Construct, id: string, config: IEnvironmentConfig, props: StackProps) {
        super(scope, id, props);

        const websiteBucket = new Bucket(this, 'CodeBucket', {
            bucketName: `${config.domains.ui.replace('.', '-')}-code-${config.environment}`,
            publicReadAccess: false,
            removalPolicy: RemovalPolicy.DESTROY,
            encryption: BucketEncryption.S3_MANAGED,
            autoDeleteObjects: true,
        });

        const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
            domainName: config.domains.root,
            privateZone: false,
        });

        const cert = new Certificate(this, 'Certificate', {
            domainName: config.domains.ui,
            validation: CertificateValidation.fromDns(hostedZone),
        });

        const oai = new OriginAccessIdentity(this, 'OriginAccessIdentity', {
            comment: 'Origin Access Identity for ' + config.appName,
        });

        const dist = new CloudFrontWebDistribution(this, 'Distribution', {
            comment: `${config.domains.ui} Distribution`,
            priceClass: PriceClass.PRICE_CLASS_ALL,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: websiteBucket,
                        originAccessIdentity: oai,
                    },
                    behaviors: [{ isDefaultBehavior: true }],
                },
            ],
            errorConfigurations: [
                {
                    errorCode: 403,
                    responseCode: 200,
                    responsePagePath: '/index.html', /* Redirect Required for SPA (Single Page Applications) */
                },
            ],
            viewerCertificate: ViewerCertificate.fromAcmCertificate(cert, {
                aliases: [config.domains.ui],
            }),
        });

        new BucketDeployment(this, 'DeployCode', {
            sources: [
                Source.asset(process.env.UI_CODE_PATH || './ui-app/', /* Place your UI Content */
                    {
                        exclude: [
                            /* Any Files that you need to exclude, example environment config files */
                        ]
                    }),
            ],
            destinationBucket: websiteBucket,
            distribution: dist,
            memoryLimit: 1024,
            cacheControl: [
                CacheControl.maxAge(Duration.hours(1)),
            ],
        });

        new ARecord(this, 'AliasRecord', {
            zone: hostedZone,
            recordName: config.domains.ui,
            target: RecordTarget.fromAlias(new CloudFrontTarget(dist)),
        });

    }
}
