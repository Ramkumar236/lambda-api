import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from "@aws-cdk/aws-iam";
import path =  require('path');
import * as apigw from '@aws-cdk/aws-apigateway';
import * as cf from "@aws-cdk/aws-cloudfront"
// import * as route53 from "@aws-cdk/aws-route53";
import * as s3 from '@aws-cdk/aws-s3';
import { LogGroup } from "@aws-cdk/aws-logs"


export class LambdaApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pyLamdaRole = new iam.Role(this, 'pyLambdaRole',{
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    })

    pyLamdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')
    )
    
    const pyTestLambda = new lambda.Function(this, 'pyTestLambda', {
      functionName: "default",
      runtime: lambda.Runtime.PYTHON_3_6,
      role: pyLamdaRole,
      handler: 'pyLambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname,'../lambda/')),
      timeout: cdk.Duration.seconds(300)
    })

    const helloLambda = new lambda.Function(this, 'helloLambda', {
      functionName: "hello",
      runtime: lambda.Runtime.PYTHON_3_6,
      role: pyLamdaRole,
      handler: 'hello.handler',
      code: lambda.Code.fromAsset(path.join(__dirname,'../lambda/')),
      timeout: cdk.Duration.seconds(300)
    })

    const worldLambda = new lambda.Function(this, 'worldLambda', {
      functionName: "world",
      runtime: lambda.Runtime.PYTHON_3_6,
      role: pyLamdaRole,
      handler: 'world.handler',
      code: lambda.Code.fromAsset(path.join(__dirname,'../lambda/')),
      timeout: cdk.Duration.seconds(300)
    })
    
    const RamApiLog = new LogGroup(this, "RamApiLog");

    const apiLambda = new apigw.LambdaRestApi(this, 'RamLambdaEndpoint', {
      handler: pyTestLambda,
      endpointConfiguration: {
        types: [apigw.EndpointType.REGIONAL]
      },
      defaultMethodOptions: {
        authorizationType: apigw.AuthorizationType.NONE
      },
      proxy: false,
      deployOptions: {
        accessLogDestination: new apigw.LogGroupLogDestination(RamApiLog),
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
    })

    apiLambda.root.addMethod('ANY');
    const hello = apiLambda.root.addResource("hello")
    hello.addMethod(
      "GET",
      new apigw.LambdaIntegration(helloLambda),   
    )
    hello.addMethod(
      "POST",
    )
    const world = apiLambda.root.addResource("world")
    world.addMethod(
      "GET",
      new apigw.LambdaIntegration(worldLambda)
    );
    world.addMethod(
      "POST"
    )

    // const distribution = new cf.Distribution(this, 'myCloudFront',{
    //   defaultBehavior: {
    //     origin: new origins.HttpOrigin(`${apiLambda.restApiId}.execute-api.${this.region}.${this.urlSuffix}`),
    //   },
    //   comment: "RAM lambda Api" 
    // })

    const distribution = new cf.CloudFrontWebDistribution(this, "webDistribution", {
      loggingConfig: {
        bucket: new s3.Bucket(this, 'LogBucket', {
          bucketName: "ramlambdalogbucket",
          lifecycleRules: [
              {
                enabled: true,
                expiration: cdk.Duration.days(30),
              },
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
          }),
          includeCookies: true,
        },
      originConfigs: [
        {
          customOriginSource: {
            domainName: `${apiLambda.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            originPath: `/${apiLambda.deploymentStage.stageName}`,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              allowedMethods: cf.CloudFrontAllowedMethods.ALL
            },
          ],
        },
        {
          behaviors: [
            {
              allowedMethods: cf.CloudFrontAllowedMethods.ALL,
              pathPattern: "/hello",
            }
          ],
           customOriginSource: {
            domainName: `${apiLambda.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            originPath: `/${apiLambda.deploymentStage.stageName}`
          },
        },
        {
          behaviors: [
            {
              allowedMethods: cf.CloudFrontAllowedMethods.ALL,
              pathPattern: "/world",
            }
          ],
           customOriginSource: {
            domainName: `${apiLambda.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            originPath: `/${apiLambda.deploymentStage.stageName}`
          },
        },
      ],
      defaultRootObject: "",
      comment: "RAM lambda Api" 
    });
    new cdk.CfnOutput(this, "distributionDomainName", { value: distribution.distributionDomainName });
    // new route53.ARecord(this, 'CloudfrontAlias', {
    //   zone: externalHostedZone,
    //   target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    //   recordName: 'ramtypescriptdevops.com'
    // });


  }
}
