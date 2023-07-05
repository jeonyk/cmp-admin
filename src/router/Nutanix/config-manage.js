/** 공통, 구성 관리 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
export default {
  path: 'config-manage',
  name: 'config-manage',
  meta: {
    breadcrumbs: ['ConfigManage']
  },
  redirect: { name: 'set-project' },
  component: () =>
    import(
      /* webpackChunkName: 'config-manage' */ '../../views/ConfigManage/Nutanix/ConfigManage.vue'
    ),
  children: [
    {
      path: 'rack-lists', // 랙 실장도
      name: 'rack-lists',
      meta: {
        breadcrumbs: ['ConfigManage', 'RackLists']
      },
      component: () =>
        import(
          /* webpackChunkName: 'rack-lists' */ '../../views/ConfigManage/Nutanix/RackLists/RackLists.vue'
        )
    },
    {
      path: 'cluster', // 자원풀그룹(CLUSTER)
      name: 'set-cluster',
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Cluster']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-cluster' */ '../../views/ConfigManage/Nutanix/SetCluster/SetCluster.vue'
        )
    },
    {
      path: 'cluster-simulation', // 자원풀그룹(CLUSTER)
      name: 'set-cluster-simulation',
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Cluster', 'Set Cluster Simulation']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-cluster' */ '../../views/ConfigManage/Nutanix/SetCluster/SetClusterSimulation.vue'
        )
    },
    {
      path: 'host', // 물리서버(HOST)
      name: 'set-host',
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Host']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-host' */ '../../views/ConfigManage/Nutanix/SetHost/SetHost'
        )
    },

    {
      path: 'resource', // 자원관리
      name: 'set-resource',
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Resource']
      },
      redirect: { name: 'set-resource-server' },
      component: () =>
        import(
          /* webpackChunkName: 'set-resource' */ '../../views/ConfigManage/Nutanix/SetResource/SetResource'
        ),
      children: [
        {
          path: 'server', // 가상 서버
          name: 'set-resource-server',
          redirect: { name: 'set-resource-server-list' },
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Server'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-server' */ '../../views/ConfigManage/Nutanix/SetResourceServer/SetResourceServer'
            ),
          children: [
            {
              path: '',
              name: 'set-resource-server-list',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Server'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-server-list' */ '../../views/ConfigManage/Nutanix/SetResourceServer/SetResourceServerList'
                )
            },
            {
              path: 'detail/:userVmIdx',
              name: 'set-resource-server-detail',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Server'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-server-detail' */ '../../views/ConfigManage/Nutanix/SetResourceServer/SetResourceServerDetail'
                )
            }
          ]
        },
        {
          path: 'switch', // 스위치
          name: 'set-resource-switch',
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Switch'
            ],
            accessible: ['BS', 'STD', 'ENT']
          },
          redirect: { name: 'set-resource-switch-list' },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-switch' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitch'
            ),
          children: [
            {
              path: '',
              name: 'set-resource-switch-list',
              redirect: { name: 'set-resource-switch-l4-list' },
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Switch'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchList.vue'
                ),
              children: [
                {
                  path: 'l4',
                  name: 'set-resource-switch-l4-list',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage',
                      'Set Resource',
                      'Set Resource Switch',
                      'l4'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-l4-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchL4List/SetResourceSwitchL4List'
                    )
                },
                {
                  path: 'l7',
                  name: 'set-resource-switch-l7-list',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage',
                      'Set Resource',
                      'Set Resource Switch',
                      'l7'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-l7-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchL7List/SetResourceSwitchL7List'
                    )
                },
                {
                  path: 'service',
                  name: 'set-resource-switch-service-list',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage',
                      'Set Resource',
                      'Set Resource Switch',
                      'Service'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-server-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchServiceList/SetResourceSwitchServiceList'
                    )
                },
                {
                  path: 'certification',
                  name: 'set-resource-switch-certification-list',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage',
                      'Set Resource',
                      'Set Resource Switch',
                      'Certification'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-certification-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchCertificationList/SetResourceSwitchCertificationList'
                    )
                }
              ]
            },
            {
              path: 'l4/:idx',
              name: 'set-resource-switch-detail-l4',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Switch',
                  'l4'
                ],
                accessible: ['BS', 'STD', 'ENT']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-detail-l4' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchDetail'
                )
            }, {
              path: 'l7/:idx',
              name: 'set-resource-switch-detail-l7',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Switch',
                  'l7'
                ],
                accessible: ['BS', 'STD', 'ENT']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-detail-l7' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchDetail'
                )
            },
            {
              path: 'certification/:netIdx-:certName',
              name: 'set-resource-switch-certification-detail',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Switch',
                  'Certification'
                ],
                accessible: ['BS', 'STD', 'ENT']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-certification-detail' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchCertificationDetail'
                )
            }
          ]
        },

        {
          path: 'security', // 보안
          name: 'set-resource-security',
          redirect: { name: 'set-resource-security-list' },
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Security'
            ],
            accessible: ['BS', 'STD', 'ENT']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-security' */ '../../views/ConfigManage/Nutanix/SetResourceSecurity/SetResourceSecurity'
            ),
          children: [
            {
              path: '',
              name: 'set-resource-security-list',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Security'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-security-list' */ '../../views/ConfigManage/Nutanix/SetResourceSecurity/SetResourceSecurityList'
                )
            },
            {
              path: 'detail/:idx',
              name: 'set-resource-security-detail',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Security'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-security-detail' */ '../../views/ConfigManage/Nutanix/SetResourceSecurity/SetResourceSecurityDetail'
                )
            }
          ]
        },

        {
          path: 'storage', // 스토리지
          name: 'set-resource-storage',
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Storage'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-storage' */ '../../views/ConfigManage/Nutanix/SetResourceStorage/SetResourceStorage'
            )
        },
        {
          path: 'storage/detail/:userVgIdx', // 스토리지 상세
          name: 'set-resource-storage-detail',
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Storage'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-storage-detail' */ '../../views/ConfigManage/Nutanix/SetResourceStorage/SetResourceStorageDetail/SetResourceStorageDetail'
            )
        },

        {
          path: 'database', // 데이터베이스
          name: 'set-resource-database',
          redirect: { name: 'set-resource-database-list' },
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Database'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-database' */ '../../views/ConfigManage/Nutanix/SetResourceDatabase/SetResourceDatabase'
            ),
          children: [
            {
              path: '',
              name: 'set-resource-database-list',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Database'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-database-list' */ '../../views/ConfigManage/Nutanix/SetResourceDatabase/SetResourceDatabaseList'
                )
            },
            {
              path: 'detail/:databaseIdx',
              name: 'set-resource-database-detail',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Database'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-database-detail' */ '../../views/ConfigManage/Nutanix/SetResourceDatabase/SetResourceDatabaseDetail'
                )
            }
          ]
        },
        {
          path: 'files', // Share
          name: 'set-resource-share',
          redirect: { name: 'set-resource-share-list' },
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Share'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-share' */ '../../views/ConfigManage/Nutanix/SetResourceShare/SetResourceShare'
            ),
          children: [
            {
              path: '', // Share 리스트
              name: 'set-resource-share-list',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Share'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-share-list' */ '../../views/ConfigManage/Nutanix/SetResourceShare/SetResourceShareList'
                )
            },
            {
              path: 'detail/:shareIdx', // Share 상세
              name: 'set-resource-share-detail',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Share'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-share-detail' */ '../../views/ConfigManage/Nutanix/SetResourceShare/SetResourceShareDetail'
                )
            }
          ]
        },
        {
          path: 'autoscale-group', // AutoScale
          name: 'set-resource-autoscale-group',
          redirect: { name: 'set-resource-autoscale-group-list' },
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Set Resource Auto Scale Group'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-autoscale-group' */ '../../views/ConfigManage/Nutanix/SetResourceAutoScaleGroup/SetResourceAutoScaleGroup'
            ),
          children: [
            {
              path: 'list',
              name: 'set-resource-autoscale-group-list',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Auto Scale Group'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-autoscale-group-list' */ '../../views/ConfigManage/Nutanix/SetResourceAutoScaleGroup/SetResourceAutoScaleGroupList'
                )
            },
            {
              path: 'detail/:autoScaleGroupIdx',
              name: 'set-resource-autoscale-group-detail',
              meta: {
                breadcrumbs: [
                  'ConfigManage',
                  'Set Resource',
                  'Set Resource Auto Scale Group'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-autoscale-group-detail' */ '../../views/ConfigManage/Nutanix/SetResourceAutoScaleGroup/SetResourceAutoScaleGroupDetail'
                )
            }
          ]
        },

        // 미등록 자원 관리
        {
          path: 'unregister',
          name: 'unregister-resource',
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Resource', 'Manage Unregistered Resources']
          },
          component: () =>
            import(
              /* webpackChunkName: 'unregister-resource' */ '../../views/ConfigManage/Nutanix/SetUnregisterResource/SetUnregisterResource.vue'
            )
        },
        {
          path: 'unregister/basket', // 미등록 자원 관리 > 등록 장바구니
          name: 'unregister-resource-basket',
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Resource',
              'Manage Unregistered Resources',
              'Unregistered Resources Basket'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'unregister-resource-basket' */ '../../views/ConfigManage/Nutanix/SetUnregisterResource/UnregisterResourceBasket.vue'
            )
        }
      ]
    },
    {
      path: 'itsm',
      name: 'set-itsm',
      meta: {
        breadcrumbs: ['ConfigManage', 'SetItsm']
      },
      component: () =>
        import(
        /* webpackChunkName: 'unregister-resource-basket' */ '../../views/ConfigManage/Nutanix/SetProject/SetItsm/SetItsm.vue'
        )
    },

    {
      path: 'project', // 프로젝트관리
      name: 'set-project',
      redirect: { name: 'set-project-manage-project' },
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Project']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-project' */ '../../views/ConfigManage/Nutanix/SetProject/SetProject'
        ),
      children: [
        {
          path: 'manage-project', // 프로젝트
          name: 'set-project-manage-project',
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Project', 'Manage Project']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-manage-project' */ '../../views/ConfigManage/Nutanix/SetProject/ManageProject'
            )
        },
        {
          path: 'list', // 승인대기
          name: 'set-project-list',
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Project', 'Approval Waiting']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-manage-project' */ '../../views/ConfigManage/Nutanix/SetProject/ProjectList.vue'
            )
        },
        {
          path: 'list/:projectIdx', // 사전협의 상세
          name: 'set-project-list-detail',
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Project', 'Approval Waiting']
          },
          props: true,
          component: () =>
            import(
              /* webpackChunkName: 'conference-detail' */ '@/views/Task/Nutanix/TaskConference/ConferenceDetail/ConferenceProjectDetail'
            )
        },
        {
          path: 'resource-operation', // 자원운용
          name: 'set-project-resource-operation',
          meta: {
            breadcrumbs: [
              'ConfigManage',
              'Set Project',
              'Resource Operation'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-resource-operation' */ '../../views/ConfigManage/Nutanix/SetProject/ResourceOperation/ResourceOperation'
            )
        }

      ]
    },
    {
      path: 'project/resource-operation/basket', // 자원운용 > 이관바구니
      name: 'resource-operation-basket',
      meta: {
        breadcrumbs: [
          'ConfigManage',
          'Set Project',
          'Resource Operation',
          'Resource Operation Basket'
        ]
      },
      component: () =>
        import(
          /* webpackChunkName: 'resource-operation-basket' */ '../../views/ConfigManage/Nutanix/SetProject/ResourceOperation/ResourceOperationBasket'
        )
    },

    {
      path: 'ip', // IP 관리
      name: 'set-ip',
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Ip']
      },
      redirect: { name: 'set-ip-list' },
      component: () =>
        import(
          /* webpackChunkName: 'set-ip' */ '../../views/ConfigManage/Nutanix/SetIp/SetIp'
        ),
      children: [
        {
          path: 'list',
          name: 'set-ip-list',
          props: true,
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Ip']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-ip-list' */ '../../views/ConfigManage/Nutanix/SetIp/SetIpList'
            )
        },
        {
          path: 'detail/:ipCategoryIdx/:ipBandIdx', // IP 관리 상세
          name: 'set-ip-detail',
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Ip']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-ip-detail' */ '../../views/ConfigManage/Nutanix/SetIp/SetIpDetail'
            )
        }
      ]
    }
  ]
}
