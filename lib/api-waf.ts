import * as wafv2 from '@aws-cdk/aws-wafv2';
import * as cdk from '@aws-cdk/core';

export class apiwaf extends cdk.Stack{
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const wafRules:Array<wafv2.CfnWebACL.RuleProperty>  = [];
    // const myip= new wafv2.CfnIPSet(this,"myip",{
    //   addresses:["117.98.161.54/32"],
    //   ipAddressVersion: "IPV4",
    //   scope: "CLOUDFRONT",
    //   name: "myip"
    // })
    // const ipmatch:wafv2.CfnWebACL.RuleProperty={
    //   name: 'IPWhitelistRule',
    //   priority: 1,
    //   overrideAction: { none: {} },
    //   statement: { 
    // },

    //   visibilityConfig: {
    //     cloudWatchMetricsEnabled: true,
    //     metricName : 'ipmatchrule',
    //     sampledRequestsEnabled: true
    //   }
    // }
    // wafRules.push(ipmatch);
    // const wafAclCloudFront = new wafv2.CfnWebACL(this, "WafCloudFront", {
    //   defaultAction: { allow: {} },
    //   /**
    //    * The scope of this Web ACL.
    //    * Valid options: CLOUDFRONT, REGIONAL.
    //    * For CLOUDFRONT, you must create your WAFv2 resources
    //    * in the US East (N. Virginia) Region, us-east-1
    //    */
    //   scope: "CLOUDFRONT",
    //   // Defines and enables Amazon CloudWatch metrics and web request sample collection.
    //   visibilityConfig: {
    //     cloudWatchMetricsEnabled: true,
    //     metricName: "waf-cloudfront",
    //     sampledRequestsEnabled: true
    //   },
    //   description: "WAFv2 ACL for CloudFront",
    //   name: "waf-cloudfront",
    // });  
    // wafAclCloudFront.addPropertyOverride("rules", wafRules);


    const ipSet = new wafv2.CfnIPSet(this, 'IPSet', {
        addresses: ['117.98.161.54/32'],
        scope: 'CLOUDFRONT',
        ipAddressVersion: 'IPV4'
      });
  
      //Create WAFv2 Rule IP Whitelisting
      const rules: wafv2.CfnWebACL.RuleProperty[] = [];
      rules.push(
        {
          name: 'IPWhitelistRule', // Note the PascalCase for all the properties
          priority: 1,
          action: {
            allow: {}
          },
          statement: {
            ipSetReferenceStatement: {
              arn: ipSet.attrArn
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'ipWhitelist',
            sampledRequestsEnabled: false,
          }
        }
      );
  
      const webACL = new wafv2.CfnWebACL(this, 'WebACL', {
        defaultAction: {
          allow: {},
        },
        scope: 'CLOUDFRONT',
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: 'waf',
          sampledRequestsEnabled: false,
        },
      });
      webACL.addPropertyOverride("rules", rules);
  }
}