/** @typedef {import('vue-router').RouteConfig} CRoute */

import billingRoutes from './billing'

/** @type {CRoute} */
const awsRoutes = {
  path: 'aws',
  name: 'cloud-main-aws',
  component: () => import('@/views/AppMain/AWSMain.vue'),
  children: [
    {
      path: 'dashboard',
      name: 'dashboard-aws',
      // redirect: { name: 'resource-ebs-aws' },
      component: () =>
        import(
          /* webpackChunkName: 'dashboard-aws' */ '../../views/Dashboard/AWS/Dashboard.vue'
        ),
      meta: {
        breadcrumbs: ['Dashboard AWS']
      }
    },
    // 서비스 카탈로그 AWS
    {
      path: 'catalogue',
      name: 'service-catalogue-aws',
      meta: {
        breadcrumbs: ['Service Catalogue AWS']
      },
      redirect: { name: 'ami' },
      component: () => import(
        /* webpackChunkName: 'service-catalogue-aws' */ '../../views/ServiceCatalogue/AWS/ServiceCatalogue'
      ),
      children: [
        {
          path: 'ami',
          name: 'ami-image',
          meta: {
            breadcrumbs: ['Service Catalogue AWS', 'AMI Image']
          },
          component: () => import(
            /* webpackChunkName: 'service-catalogue-aws' */ '../../views/ServiceCatalogue/AWS/AMIImageManagement/AMIImageManagement'
          )
        },
        {
          path: 'instance',
          name: 'instance-type-aws',
          meta: {
            breadcrumbs: ['Service Catalogue AWS', 'Instance Type']
          },
          component: () => import(
            /* webpackChunkName: 'instance-type-aws' */ '../../views/ServiceCatalogue/AWS/InstanceTypeManagement/InstanceTypeManagement'
          )
        },
        {
          path: 'ebs',
          name: 'ebs-type',
          meta: {
            breadcrumbs: ['Service Catalogue AWS', 'EBS Type']
          },
          component: () => import(
            /* webpackChunkName: 'ebs-type' */ '../../views/ServiceCatalogue/AWS/EBSTypeManagement/EBSTypeManagement'
          )
        }
      ]
    },
    // {
    //   path: 'billing',
    //   name: 'billing',
    //   meta: {
    //     breadcrumbs: ['Billing']
    //   },
    //   redirect: { name: 'billing-model' },
    //   component: () => import(
    //     /* webpackChunkName: 'billing' */ '../../views/Billing/AWS/Billing'
    //   ),
    //   children: [{
    //     path: 'model',
    //     name: 'billing-model',
    //     meta: {
    //       breadcrumbs: ['Billing', 'Billing Model']
    //     },
    //     redirect: { name: 'billingModelAWS' },
    //     component: () => import(
    //       /* webpackChunkName: 'billing' */ '../../views/Billing/AWS/BillingModel/BillingModel'
    //     ),
    //     children: [
    //       {
    //         path: 'billing-model-aws',
    //         name: 'billing-model-aws',
    //         component: () => import(
    //           /* webpackChunkName: 'billing-model-aws' */ '../../views/Billing/AWS/BillingModel/BillingModelStandard/BillingModelStandardList'
    //         ),
    //         meta: {
    //           breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Standard']
    //         }
    //       }
    //     ]
    //   }]
    // },
    // 구성 관리 AWS
    {
      path: 'config-manage',
      name: 'config-manage-aws',
      meta: {
        breadcrumbs: ['Config Manage AWS']
      },
      redirect: { name: 'set-project-public' },
      // component: {
      //   render: c => c('router-view')
      // },
      component: () =>
        import(
          /* webpackChunkName: 'config-manage' */ '../../views/ConfigManage/Nutanix/ConfigManage.vue'
        ),
      children: [
        // 프로젝트 관리 AWS
        {
          path: 'project',
          name: 'set-project-public',
          meta: {
            breadcrumbs: ['Config Manage AWS']
          },
          redirect: { name: 'set-project-public-management' },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-public' */ '../../views/ConfigManage/Nutanix/SetProject/SetProject'
            ),
          children: [
            {
              path: 'manage-project', // 프로젝트 관리
              name: 'set-project-public-management',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'Set Project Management']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-project-public-management' */ '../../views/ConfigManage/Nutanix/SetProject/ManageProject'
                )
            },
            {
              path: 'aws-list', // 프로젝트
              name: 'set-aws-project-list',
              meta: {
                breadcrumbs: ['ConfigManage', 'Set Project', 'Approval Waiting']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-project-manage-project' */ '../../views/ConfigManage/Nutanix/SetProject/AwsProjectList.vue'
                )
            }
          ]
        },
        // 네트워크 AWS
        {
          path: 'network',
          name: 'network-aws',
          meta: {
            breadcrumbs: ['Config Manage AWS']
          },
          component: () => import(
            /* webpackChunkName: 'set-resource' */ '@/views/ConfigManage/AWS/NetworkResources/NetworkResources'
          ),
          redirect: { name: 'vpc-aws' },
          children: [
            {
              path: 'vpc',
              name: 'vpc-aws',
              redirect: { name: 'vpc-aws-list' },
              component: () => import(
                /* webpackChunkName: 'vpc-aws' */ '@/views/ConfigManage/AWS/NetworkVpc'
              ),
              children: [
                {
                  path: 'vpc-list',
                  name: 'vpc-aws-list',
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsVpc']
                  },
                  component: () => import(
                    /* webpackChunkName: 'vpc-aws-list' */ '@/views/ConfigManage/AWS/NetworkVpc/NetworkVpc.vue'
                  )
                },
                {
                  path: 'vpc-detail/:id',
                  name: 'network-vpc-detail',
                  props: true,
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsVpc']
                  },
                  component: () => import(
                    /* webpackChunkName: 'vpc-aws-detail' */ '@/views/ConfigManage/AWS/NetworkVpc/NetworkVpcDetail.vue'
                  )
                }
              ]
            },
            {
              path: 'subnet-aws',
              name: 'subnet-aws',
              redirect: {
                name: 'subnet-aws-list'
              },
              component: () => import(
                /* webpackChunkName: 'subnet-aws' */ '@/views/ConfigManage/AWS/NetworkSubnet'
              ),
              children: [
                {
                  path: 'subnet-aws-list',
                  name: 'subnet-aws-list',
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsSubnet']
                  },
                  component: () => import(
                    /* webpackChunkName: 'subnet-aws' */ '@/views/ConfigManage/AWS/NetworkSubnet/NetworkSubnet'
                  )
                },
                {
                  path: 'subnet/:id', // 가상 서버
                  name: 'network-subnet-detail',
                  props: true,
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsSubnet']
                  },
                  component: () => import(
                    /* webpackChunkName: 'network-subnet-detail' */ '@/views/ConfigManage/AWS/NetworkSubnet/NetworkSubnetDetail'
                  )
                }
              ]
            },
            {
              path: 'routing-table-aws',
              name: 'routing-table-aws',
              redirect: {
                name: 'routing-table-aws-list'
              },
              component: () => import(
                /* webpackChunkName: 'routing-table-aws' */ '@/views/ConfigManage/AWS/NetworkRoutingTable'
              ),
              children: [
                {
                  path: 'routing-table-list',
                  name: 'routing-table-aws-list',
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsRoutingTable']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource' */ '@/views/ConfigManage/AWS/NetworkRoutingTable/NetworkRoutingTable'
                  )
                },
                {
                  path: 'routing-table-detail/:id', // 가상 서버
                  name: 'routing-table-aws-detail',
                  // redirect: { name: 'set-resource-server-list' },
                  props: true,
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsRoutingTable']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource' */ '@/views/ConfigManage/AWS/NetworkRoutingTable/NetworkRoutingTableDetail'
                  )
                }
              ]
            },

            {
              path: 'internet-gateway',
              name: 'internet-gateway-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsInternetGateWay']
              },
              component: () => import(
                /* webpackChunkName: 'internet-gateway-aws' */ '@/views/ConfigManage/AWS/NetworkInternetGateway/NetworkInternetGateway'
              )
            },
            {
              path: 'nat-gateway',
              name: 'nat-gateway-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'awsNetwork', 'awsNatGateWay']
              },
              component: () => import(
                /* webpackChunkName: 'nat-gateway-aws' */ '@/views/ConfigManage/AWS/NetworkNatGateway/NetworkNatGateway'
              )
            }
          ]
        },
        // 보안 AWS
        {
          path: 'security',
          name: 'security-aws',
          meta: {
            breadcrumbs: ['Config Manage AWS']
          },
          component: () => import(
            /* webpackChunkName: 'network-acl-aws' */ '@/views/ConfigManage/AWS/SecurityNetworkAcl'
          ),
          redirect: { name: 'network-acl-aws-list' },
          children: [
            {
              path: 'network-acl',
              name: 'network-acl-aws',
              breadcrumbs: ['Config Manage AWS', 'awsSecurity'],
              redirect: {
                name: 'network-acl-aws-list'
              },
              component: () => import(
                /* webpackChunkName: 'network-acl-aws' */ '@/views/ConfigManage/AWS/SecurityNetworkAcl'
              ),
              children: [
                {
                  path: 'network-acl-list',
                  name: 'network-acl-aws-list',
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsSecurity', 'awsNetworkAcl']
                  },
                  component: () => import(
                    /* webpackChunkName: 'network-acl-aws' */ '@/views/ConfigManage/AWS/SecurityNetworkAcl/SecurityNetworkAcl'
                  )
                },
                {
                  path: 'network-acl-detail/:id',
                  name: 'security-network-acl-detail',
                  props: true,
                  meta: {
                    breadcrumbs: ['ConfigManage', 'awsSecurity', 'awsNetworkAcl']
                  },
                  component: () => import(
                    /* webpackChunkName: 'security-network-acl-detail' */ '@/views/ConfigManage/AWS/SecurityNetworkAcl/SecurityNetworkAclDetail'
                  )
                }
              ]
            },
            {
              path: 'group',
              name: 'security-group-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'awsSecurity']
              },
              component: () => import(
                /* webpackChunkName: 'set-resource' */ '@/views/ConfigManage/AWS/SecurityGroup'
              ),
              redirect: { name: 'security-group-aws-list' },
              children: [
                {
                  path: 'group-list',
                  name: 'security-group-aws-list',
                  meta: {
                    breadcrumbs: ['Config Manage AWS', 'awsSecurity', 'awsSecurityGroup']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource' */ '@/views/ConfigManage/AWS/SecurityGroup/SecurityGroup'
                  )
                },
                {
                  path: 'group-detail/:id',
                  name: 'security-group-detail',
                  props: true,
                  meta: {
                    breadcrumbs: ['ConfigManage', 'awsSecurity', 'awsSecurityGroup']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource' */ '@/views/ConfigManage/AWS/SecurityGroup/SecurityGroupDetail'
                  )
                }
              ]
            }
          ]
        },
        // 자원 관리
        {
          path: 'resource',
          name: 'resource-aws',
          meta: {
            breadcrumbs: ['Config Manage AWS']
          },
          redirect: { name: 'resource-ec2-aws' },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource' */ '../../views/ConfigManage/Nutanix/SetResource/SetResource'
            ),
          children: [
            {
              path: 'ec2',
              name: 'resource-ec2-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'Set Resource AWS', 'Set Resource Ec2']
              },
              redirect: { name: 'set-resource-ec2-list' },
              component: () =>
                import(
                  /* webpackChunkName: 'resource-ec2-aws' */ '../../views/ConfigManage/AWS/SetResourceEC2/SetResourceEC2'
                ),
              children: [
                {
                  path: '',
                  name: 'set-resource-ec2-list',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Ec2']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-ec2-list' */ '../../views/ConfigManage/AWS/SetResourceEC2/SetResourceEC2List'
                  )
                },
                {
                  path: 'detail/:instanceId',
                  name: 'set-resource-ec2-detail',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Ec2']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-ec2-detail' */ '../../views/ConfigManage/AWS/SetResourceEC2/SetResourceEC2Detail'
                  )
                }
              ]
            },
            {
              path: 'ebs',
              name: 'resource-ebs-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'Set Resource AWS', 'Set Resource Ebs']
              },
              redirect: { name: 'set-resource-ebs-list' },
              component: () =>
                import(
                  /* webpackChunkName: 'resource-ebs-aws' */ '../../views/ConfigManage/AWS/SetResourceEBS/SetResourceEBS'
                ),
              children: [
                {
                  path: '',
                  name: 'set-resource-ebs-list',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Ebs']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-ebs-list' */ '../../views/ConfigManage/AWS/SetResourceEBS/SetResourceEBSList'
                  )
                },
                {
                  path: 'detail/:volumeId',
                  name: 'set-resource-ebs-detail',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Ebs']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-ebs-detail' */ '../../views/ConfigManage/AWS/SetResourceEBS/SetResourceEBSDetail'
                  )
                }
              ]
            },
            {
              path: 'efs',
              name: 'resource-efs-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'Set Resource AWS', 'Set Resource Efs']
              },
              redirect: { name: 'set-resource-efs-list' },
              component: () =>
                import(
                  /* webpackChunkName: 'resource-efs-aws' */ '../../views/ConfigManage/AWS/SetResourceEFS/SetResourceEFS'
                ),
              children: [
                {
                  path: '',
                  name: 'set-resource-efs-list',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Efs']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-efs-list' */ '../../views/ConfigManage/AWS/SetResourceEFS/SetResourceEFSList'
                  )
                },
                {
                  path: 'detail/:fileSystemId',
                  name: 'set-resource-efs-detail',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Efs']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-efs-detail' */ '../../views/ConfigManage/AWS/SetResourceEFS/SetResourceEFSDetail'
                  )
                }
              ]
            },
            {
              path: 'elb',
              name: 'resource-elb-aws',
              meta: {
                breadcrumbs: ['Config Manage AWS', 'Set Resource AWS', 'Set Resource Elb']
              },
              redirect: { name: 'set-resource-elb' },
              component: () =>
                import(
                  /* webpackChunkName: 'resource-elb-aws' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELB'
                ),
              children: [
                {
                  path: '',
                  name: 'set-resource-elb',
                  redirect: { name: 'set-resource-nlb-list' },
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-elb-tabs' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceELBTabs'
                  ),
                  children: [
                    {
                      path: 'nlb',
                      name: 'set-resource-nlb-list',
                      meta: {
                        breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb', 'Set Resource Nlb']
                      },
                      component: () => import(
                        /* webpackChunkName: 'set-resource-nlb-list' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceNLBList'
                      )
                    },
                    {
                      path: 'alb',
                      name: 'set-resource-alb-list',
                      meta: {
                        breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb', 'Set Resource Alb']
                      },
                      component: () => import(
                        /* webpackChunkName: 'set-resource-alb-list' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceALBList'
                      )
                    },
                    // 대상그룹
                    {
                      path: 'target-group',
                      name: 'set-resource-target-group-list',
                      meta: {
                        breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb', 'Set Resource Target Group']
                      },
                      component: () => import(
                        /* webpackChunkName: 'set-resource-target-group-list' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceELBTargetGroupList'
                      )
                    },
                    // ALB 규칙
                    {
                      path: 'alb-rules',
                      name: 'set-resource-alb-rules-list',
                      meta: {
                        breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb', 'Set Resource Alb Rules']
                      },
                      component: () => import(
                        /* webpackChunkName: 'set-resource-alb-rules-list' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBList/SetResourceALBRulesList'
                      )
                    }
                  ]
                },
                {
                  path: 'nlb/detail/:elbArn', // NLB 상세
                  name: 'set-resource-nlb-detail',
                  props: (route) => ({
                    ...route.params
                  }),
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb', 'Set Resource Nlb']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-nlb-detail' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBDetail/SetResourceNLBDetail'
                  )
                },
                {
                  path: 'alb/detail', // ALB 상세
                  name: 'set-resource-alb-detail',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-alb-detail' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBDetail/SetResourceALBDetail'
                  )
                },
                {
                  path: 'target-group/detail/:targetGroupArn', // 대상그룹 상세
                  props: true,
                  name: 'set-resource-target-group-detail',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Set Resource Elb', 'Set Resource Target Group']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-target-group-detail' */ '../../views/ConfigManage/AWS/SetResourceELB/SetResourceELBDetail/SetResourceTargetGroupDetail'
                  )
                }
              ]
            },
            {
              path: 'tgw',
              name: 'resource-tgw-main',
              meta: {
                breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Transit Gateway']
              },
              component: {
                render: (c) => c('router-view')
              },
              redirect: {
                name: 'resource-tgw-list'
              },
              children: [
                {
                  path: '',
                  name: 'resource-tgw-list',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Transit Gateway']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-tgw-list' */ '../../views/ConfigManage/AWS/TransitGateway/TransitGatewayList.vue'
                  )
                },
                {
                  path: ':tgwId',
                  name: 'resource-tgw-detail',
                  meta: {
                    breadcrumbs: ['ConfigManage AWS', 'Set Resource AWS', 'Transit Gateway']
                  },
                  component: () => import(
                    /* webpackChunkName: 'set-resource-tgw-list' */ '../../views/ConfigManage/AWS/TransitGateway/TransitGatewayDetail.vue'
                  )
                }
              ]
            }
          ]
        }
      ]
    },
    { ...billingRoutes }
  ]
}

export default awsRoutes
