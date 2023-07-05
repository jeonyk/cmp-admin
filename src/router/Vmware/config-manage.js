/** 공통, 구성 관리 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
export default {
  path: 'config-manage',
  name: 'config-manage-vmw',
  meta: {
    breadcrumbs: ['ConfigManage Vmw']
  },
  redirect: { name: 'set-project-vmw' },
  component: () =>
    import(
      /* webpackChunkName: 'config-manage' */ '../../views/ConfigManage/Nutanix/ConfigManage.vue'
    ),
  children: [
    {
      path: 'itsm',
      name: 'set-itsm-vmw',
      meta: {
        breadcrumbs: ['ConfigManage', 'SetItsmVmw']
      },
      component: () =>
        import(
        /* webpackChunkName: 'unregister-resource-basket' */ '../../views/ConfigManage/Nutanix/SetProject/SetItsm/SetItsm.vue'
        )
    },
    {
      path: 'rack-lists', // 랙 실장도
      name: 'rack-lists-vmw',
      meta: {
        breadcrumbs: ['ConfigManage Vmw', 'RackLists Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'rack-lists' */ '../../views/ConfigManage/Vmware/RackLists/RackLists.vue'
        )
    },
    {
      path: 'datacenter', // 데이터센터
      name: 'set-datacenter-vmw',
      meta: {
        breadcrumbs: ['ConfigManage Vmw', 'Set Datacenter Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-datacenter' */ '../../views/ConfigManage/Vmware/SetDatacenter/SetDatacenter'
        )
    },
    {
      path: 'cluster', // 자원풀그룹(CLUSTER)
      name: 'set-cluster-vmw',
      meta: {
        breadcrumbs: ['ConfigManage Vmw', 'Set Cluster Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-cluster' */ '../../views/ConfigManage/Vmware/SetCluster/SetCluster'
        )
    },
    {
      path: 'host', // 물리서버(HOST)
      name: 'set-host-vmw',
      meta: {
        breadcrumbs: ['ConfigManage Vmw', 'Set Host Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-host' */ '../../views/ConfigManage/Vmware/SetHost/SetHost'
        )
    },

    {
      path: 'resource', // 자원관리
      name: 'set-resource-vmw',
      meta: {
        breadcrumbs: ['ConfigManage Vmw', 'Set Resource Vmw']
      },
      redirect: { name: 'set-resource-server-vmw' },
      component: () =>
        import(
          /* webpackChunkName: 'set-resource' */ '../../views/ConfigManage/Vmware/SetResource/SetResource'
        ),
      children: [
        {
          path: 'vm', // 가상 서버
          name: 'set-resource-server-vmw',
          redirect: { name: 'set-resource-server-list-vmw' },
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Set Resource Server Vmw'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-vmware-compute' */ '../../views/ConfigManage/Vmware/SetResourceVmwareServer/SetResourceVmwareServer'
            ),
          children: [
            {
              path: '',
              name: 'set-resource-server-list-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Server Vmw'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-vmware-server-list' */ '../../views/ConfigManage/Vmware/SetResourceVmwareServer/SetResourceVmwareServerList'
                )
            },
            {
              path: 'detail/:userVmIdx',
              name: 'set-resource-server-detail-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Server Vmw'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-server-detail' */ '../../views/ConfigManage/Vmware/SetResourceVmwareServer/SetResourceVmwareServerDetail'
                )
            }
          ]
        },
        {
          path: 'switch', // 스위치
          name: 'set-resource-switch-vmw',
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Set Resource Switch Vmw'
            ],
            accessible: ['BS', 'STD', 'ENT']
          },
          redirect: { name: 'set-resource-switch-list-vmw' },
          component: () =>
            import(
              /* webpackChunkName: 'set-resource-switch' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitch'
            ),
          children: [
            {
              path: '',
              name: 'set-resource-switch-list-vmw',
              redirect: { name: 'set-resource-switch-l4-list-vmw' },
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Switch Vmw'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchList.vue'
                ),
              children: [
                {
                  path: 'l4',
                  name: 'set-resource-switch-l4-list-vmw',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage Vmw',
                      'Set Resource Vmw',
                      'Set Resource Switch Vmw',
                      'l4 Vmw'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-l4-list' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchL4List/SetResourceSwitchL4List'
                    )
                },
                {
                  path: 'l7',
                  name: 'set-resource-switch-l7-list-vmw',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage Vmw',
                      'Set Resource Vmw',
                      'Set Resource Switch Vmw',
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
                  name: 'set-resource-switch-service-list-vmw',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage Vmw',
                      'Set Resource Vmw',
                      'Set Resource Switch',
                      'Service Vmw'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-server-list-vmw' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchServiceList/SetResourceSwitchServiceList'
                    )
                },
                {
                  path: 'certification',
                  name: 'set-resource-switch-certification-list-vmw',
                  meta: {
                    breadcrumbs: [
                      'ConfigManage Vmw',
                      'Set Resource Vmw',
                      'Set Resource Switch',
                      'Certification Vmw'
                    ]
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'set-resource-switch-certification-list-vmw' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchCertificationList/SetResourceSwitchCertificationList'
                    )
                }
              ]
            },
            {
              path: 'l4/:idx',
              name: 'set-resource-switch-detail-l4-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Switch Vmw',
                  'l4 Vmw'
                ],
                accessible: ['BS', 'STD', 'ENT']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-detail' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchDetail'
                )
            }, {
              path: 'l7/:idx',
              name: 'set-resource-switch-detail-l7-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Switch Vmw',
                  'l7 Vmw'
                ],
                accessible: ['BS', 'STD', 'ENT']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-switch-detail' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchDetail'
                )
            }, {
              path: 'certification/:idx',
              name: 'set-resource-switch-certification-detail-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Switch Vmw',
                  'Certification Vmw'
                ],
                accessible: ['BS', 'STD', 'ENT']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-certification-detail' */ '../../views/ConfigManage/Nutanix/SetResourceSwitch/SetResourceSwitchCertificationDetail'
                )
            }
          ]
        },

        {
          path: 'security', // 보안
          name: 'set-resource-security-vmw',
          redirect: { name: 'set-resource-security-list-vmw' },
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Set Resource Security Vmw'
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
              name: 'set-resource-security-list-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Security Vmw'
                ]
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-resource-security-list' */ '../../views/ConfigManage/Nutanix/SetResourceSecurity/SetResourceSecurityList'
                )
            },
            {
              path: 'detail/:idx',
              name: 'set-resource-security-detail-vmw',
              meta: {
                breadcrumbs: [
                  'ConfigManage Vmw',
                  'Set Resource Vmw',
                  'Set Resource Security Vmw'
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
          path: 'vsan',
          name: 'vmware-storage-vsan-iscsi-list',
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Vmware Vsan Iscsi'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'vmware-storage-vsan-iscsi-list' */ '../../views/ConfigManage/Vmware/SetResourceVmwareVsan/SetResourceVmwareVsanIscsiList'
            )
        },
        {
          path: 'vsan/detail/:idx',
          name: 'vmware-storage-vsan-iscsi-detail',
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Vmware Vsan Iscsi'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'vmware-storage-vsan-iscsi-list' */ '../../views/ConfigManage/Vmware/SetResourceVmwareVsan/SetResourceVmwareVsanIscsiDetail'
            )
        },

        // 미등록 자원 관리
        {
          path: 'unregister',
          name: 'vmware-unregister-resource',
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Manage Unregistered Resources Vmw'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'uvmware-nregister-resource' */ '../../views/ConfigManage/Nutanix/SetUnregisterResource/SetUnregisterResource.vue'
            )
        },
        {
          path: 'unregister/basket', // 미등록 자원 관리 > 등록 장바구니
          name: 'vmware-unregister-resource-basket',
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Resource Vmw',
              'Manage Unregistered Resources Vmw',
              'Unregistered Resources Basket Vmw'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'vmware-unregister-resource-basket' */ '../../views/ConfigManage/Nutanix/SetUnregisterResource/UnregisterResourceBasket.vue'
            )
        }
      ]
    },

    {
      path: 'project', // 프로젝트관리
      name: 'set-project-vmw',
      redirect: { name: 'set-project-manage-project-vmw' },
      meta: {
        breadcrumbs: ['ConfigManage Vmw', 'Set Project Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-project' */ '../../views/ConfigManage/Nutanix/SetProject/SetProject'
        ),
      children: [
        {
          path: 'manage-project', // 프로젝트
          name: 'set-project-manage-project-vmw',
          meta: {
            breadcrumbs: ['ConfigManage Vmw', 'Set Project Vmw', 'Manage Project Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-manage-project' */ '../../views/ConfigManage/Nutanix/SetProject/ManageProject'
            )
        },
        {
          path: 'list', // 프로젝트
          name: 'set-project-list-vmw',
          meta: {
            breadcrumbs: ['ConfigManage Vmw', 'Set Project Vmw', 'Approval Waiting Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-manage-project' */ '../../views/ConfigManage/Nutanix/SetProject/ProjectList.vue'
            )
        },
        {
          path: 'list/:projectIdx', // 사전협의 상세
          name: 'set-project-list-detail-vmw',
          meta: {
            breadcrumbs: ['ConfigManage Vmw', 'Set Project Vmw', 'Approval Waiting Vmw']
          },
          props: true,
          component: () =>
            import(
              /* webpackChunkName: 'conference-detail' */ '@/views/Task/Nutanix/TaskConference/ConferenceDetail/ConferenceProjectDetail'
            )
        },
        {
          path: 'resource-operation', // 자원운용
          name: 'set-project-resource-operation-vmw',
          meta: {
            breadcrumbs: [
              'ConfigManage Vmw',
              'Set Project Vmw',
              'Resource Operation Vmw'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-project-resource-operation' */ '../../views/ConfigManage/Vmware/SetProject/ResourceOperation/ResourceOperation'
            )
        }
      ]
    },
    {
      path: 'project/resource-operation/basket', // 자원운용 > 이관바구니
      name: 'resource-operation-basket-vmw',
      meta: {
        breadcrumbs: [
          'ConfigManage Vmw',
          'Set Project Vmw',
          'Resource Operation Vmw',
          'Resource Operation Basket Vmw'
        ]
      },
      component: () =>
        import(
          /* webpackChunkName: 'resource-operation-basket' */ '../../views/ConfigManage/Vmware/SetProject/ResourceOperation/ResourceOperationBasket'
        )
    },

    {
      path: 'ip', // IP 관리
      name: 'set-ip-vmw',
      meta: {
        breadcrumbs: ['ConfigManage', 'Set Ip Vmw']
      },
      redirect: { name: 'set-ip-list-vmw' },
      component: () =>
        import(
          /* webpackChunkName: 'set-ip-vmw' */ '../../views/ConfigManage/Nutanix/SetIp/SetIp'
        ),
      children: [
        {
          path: 'list',
          name: 'set-ip-list-vmw',
          props: true,
          meta: {
            breadcrumbs: ['ConfigManage', 'Set Ip Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-ip-list-vmw' */ '../../views/ConfigManage/Nutanix/SetIp/SetIpList'
            )
        },
        {
          path: 'detail/:ipCategoryIdx/:ipBandIdx', // IP 관리 상세
          name: 'set-ip-detail-vmw',
          meta: {
            breadcrumbs: ['ConfigManage Vmw', 'Set Ip Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-ip-detail-vmw' */ '../../views/ConfigManage/Nutanix/SetIp/SetIpDetail'
            )
        }
      ]
    }
  ]
}
