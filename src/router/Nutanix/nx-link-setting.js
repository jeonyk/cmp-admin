import store from '../../store'
const shortlyCloud = store?.getters?.['cloud/getShortlyCloud']
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const nxLinkSettingRoutes = {
  path: 'nx',
  name: 'nx-link-setting',
  meta: {
    breadcrumbs: ['Link Setting']
  },
  redirect: { name: 'config-nutanix' },
  component: () => import(
    /* webpackChunkName: 'aws-dashboard' */ '@/views/SetConfiguration/AWS/SetConfigurationResource/SetConfigurationResource.vue'
  ),
  children: [
    {
      path: 'nutanix', // 뉴타닉스 관리
      name: 'config-nutanix',
      meta: {
        breadcrumbs: ['Link Setting', 'Config Nutanix']
      },
      redirect: { name: 'nutanix-central' },
      component: () =>
        import(
          /* webpackChunkName: 'config-nutanix' */ '../../views/Admin/SetConfigure/ConfigNutanix/ConfigNutanix'
        ),
      children: [
        {
          path: 'central',
          name: 'nutanix-central',
          meta: {
            breadcrumbs: [
              'Link Setting',
              'Config Nutanix',
              'Nutanix Central'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'nutanix-central' */ '../../views/Admin/SetConfigure/ConfigNutanix/NutanixCentral'
            )
        },
        {
          path: 'element',
          name: 'nutanix-element',
          meta: {
            breadcrumbs: [
              'Link Setting',
              'Config Nutanix',
              'Nutanix Element'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'nutanix-element' */ '../../views/Admin/SetConfigure/ConfigNutanix/NutanixElement'
            )
        },
        {
          path: 'era',
          name: 'nutanix-era',
          meta: {
            breadcrumbs: [
              'Link Setting',
              'Config Nutanix',
              'Nutanix Era'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'nutanix-era' */ '../../views/Admin/SetConfigure/ConfigNutanix/NutanixEra'
            )
        }
      ]
    },
    {
      path: 'nutanix/element/file-server/detail/:fileServerUuid',
      name: 'file-server-detail',
      meta: {
        breadcrumbs: [
          'Link Setting',
          'Config Nutanix',
          'Nutanix Element',
          'File Server Detail'
        ]
      },
      component: () =>
        import(
          /* webpackChunkName: 'nutanix-file-server-detail' */ '../../views/Admin/SetConfigure/ConfigNutanix/NutanixFileServerDetail'
        )
    },
    {
      path: 'network-routing', // 경유지 관리
      name: 'network-routing',
      redirect: { name: 'network-routing-list' },
      meta: {
        breadcrumbs: ['Link Setting', 'Network Routing']
      },
      component: () =>
        import(
          /* webpackChunkName: 'network-routing' */ '../../views/Admin/SetConfigure/ConfigNetworkRouting/ConfigNetworkRouting'
        ),
      children: [
        {
          path: 'network-routing-list',
          name: 'network-routing-list',
          meta: {
            breadcrumbs: ['Link Setting', 'Network Routing']
          },
          component: () =>
            import(
              /* webpackChunkName: 'network-routing-list' */ '../../views/Admin/SetConfigure/ConfigNetworkRouting/ConfigNetworkRoutingList'
            )
        },
        {
          path: 'network-routing/:roadIdx', // 경유지 관리 상세
          name: 'network-routing-detail',
          meta: {
            breadcrumbs: ['Link Setting', 'Network Routing']
          },
          component: () =>
            import(
              /* webpackChunkName: 'network-routing-detail' */ '../../views/Admin/SetConfigure/ConfigNetworkRouting/ConfigNetworkRoutingDetail'
            )
        }
      ]
    },
    {
      path: 'switch-equip', // 스위치 장비
      name: 'switch-equip',
      meta: {
        breadcrumbs: ['Link Setting', 'Switch Equip']
      },
      component: () =>
        import(
          /* webpackChunkName: 'switch-equip' */ '../../views/Admin/SetConfigure/ConfigSwitchEquip/ConfigSwitchEquip'
        )
    },
    {
      path: 'firewall-equip', // 방화벽 장비 정보
      name: 'firewall-equip',
      meta: {
        breadcrumbs: ['Link Setting', 'FirewallEquip']
      },
      component: () =>
        import(
          /* webpackChunkName: 'firewallEquip' */ '../../views/Admin/SetConfigure/ConfigFirewallEquip/ConfigFirewallEquip'
        )
    },
    {
      path: 'firewall-equip-detail/:netIdx', // 방화벽 장비 정보 상세페이지
      name: 'firewall-equip-detail',
      meta: {
        breadcrumbs: ['Link Setting', 'firewall Equip']
      },
      component: () =>
        import(
          /* webpackChunkName: 'firewall-equip-detail' */ '../../views/Admin/SetConfigure/ConfigFirewallEquip/ConfigFirewallEquipDetail'
        )
    },
    {
      path: 'firewall-vdom', // 방화벽 VDOM
      name: 'firewall-vdom',
      meta: {
        breadcrumbs: ['Link Setting', 'Firewall VDOM']
      },
      component: () =>
        import(
          /* webpackChunkName: 'firewall-vdom' */ '../../views/Admin/SetConfigure/ConfigFirewallVDOM/ConfigFirewallVDOM'
        )
    },
    {
      path: 'alarm-server', // 알람 서버
      name: 'alarm-server',
      meta: {
        breadcrumbs: ['Link Setting', 'Alarm Server']
      },
      component: () =>
        import(
          /* webpackChunkName: 'alarm-server' */ '../../views/Admin/SetConfigure/ConfigAlarmServer/ConfigAlarmServer'
        )
    },
    {
      path: 'config-monitoring', // 모니터링 설정
      name: 'config-monitoring',
      redirect: {
        name: 'set-monitoring'
      },
      component: () =>
        import(
          /* webpackChunkName: 'monitoring-server' */ '../../views/Admin/SetConfigure/ConfigMonitoring/ConfigMonitoring'
        ),
      children: [
        {
          path: 'set-monitoring', // 모니터링 설정
          name: 'set-monitoring',
          meta: {
            breadcrumbs: ['Link Setting', 'Config Monitoring', 'Set Monitoring']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-user' */ '../../views/Admin/SetConfigure/ConfigMonitoring/SetMonitoring'
            )
        }, {
          path: 'set-monitoring-server', // 모니터링 서버 설정
          name: 'set-monitoring-server',
          meta: {
            breadcrumbs: ['Link Setting', 'Config Monitoring', 'Set Monitoring Server']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-user' */ '../../views/Admin/SetConfigure/ConfigMonitoring/SetMonitoringServer'
            )
        }
      ]
    },
    {
      path: 'logging-server', // 로깅 서버 설정
      name: 'logging-server',
      meta: {
        ...(shortlyCloud === 'nx' ? { breadcrumbs: ['Link Setting', 'Logging Server'] } : { breadcrumbs: ['Link Setting Vmw', 'Logging Server'] })
      },
      component: () =>
        import(
          /* webpackChunkName: 'logging-server' */ '../../views/Admin/SetConfigure/ConfigLoggingServer/ConfigLoggingServer'
        )
    },
    {
      path: 'cloud-init', // Cloud Init Script
      name: 'set-config-cloud-init',
      meta: {
        breadcrumbs: ['Link Setting', 'Cloud Init Script']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-config-cloud-init' */ '../../views/Admin/SetConfigure/ConfigCloudInit/ConfigCloudInit.vue'
        )
    }
    // {
    //   path: 'cloud-init/detail',
    //   name: 'set-config-cloud-init-detail',
    //   meta: {
    //     breadcrumbs: ['Link Setting']
    //   },
    //   component: () =>
    //     import(
    //       /* webpackChunkName: 'set-config-cloud-init-detail' */ '../../views/Admin/SetConfigure/ConfigCloudInit/ConfigCloudInitDetail.vue'
    //     )
    // }
  ]
}

export default nxLinkSettingRoutes
