import store from '../../store'
const shortlyCloud = store?.getters?.['cloud/getShortlyCloud']
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const vmwLinkSettingRoutes = {
  path: 'vmw',
  name: 'link-setting-vmw',
  meta: {
    breadcrumbs: ['Link Setting Vmw']
  },
  redirect: { name: 'config-vmw' },
  component: () => import(
    /* webpackChunkName: 'vmw-link-setting' */ '@/views/SetConfiguration/AWS/SetConfigurationResource/SetConfigurationResource.vue'
  ),
  children: [
    {
      path: 'vmw', // Vmware 설정
      name: 'config-vmw',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Config Vmware']
      },
      redirect: { name: 'vmw-vcenter' },
      component: () =>
        import(
          /* webpackChunkName: 'config-vmw' */ '../../views/Admin/SetConfigure/ConfigVmw/ConfigVmw.vue'
        ),
      children: [
        {
          path: 'vCenter',
          name: 'vmw-vcenter',
          meta: {
            breadcrumbs: [
              'Link Setting',
              'Config Vmware',
              'Config Vmware Center'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'vmw-vcenter' */ '../../views/Admin/SetConfigure/ConfigVmw/VmwCenter.vue'
            )
        },
        {
          path: 'ESXi',
          name: 'vmw-esxi',
          meta: {
            breadcrumbs: [
              'Link Setting',
              'Config Vmware',
              'Config Vmware Esxi'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'vmw-esxi' */ '../../views/Admin/SetConfigure/ConfigVmw/VmwEsxi.vue'
            )
        }
      ]
    },
    {
      path: 'network-category', // 네트워크 카테고리
      name: 'network-category-vmw',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Network Category']
      },
      component: () =>
        import(
          /* webpackChunkName: 'network-category' */ '../../views/Admin/SetConfigure/ConfigNetworkCategoryVmw/ConfigNetworkCategory'
        )
    },
    {
      path: 'network-routing', // 경유지 관리
      name: 'network-routing-vmw',
      redirect: { name: 'network-routing-list-vmw' },
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Network Routing']
      },
      component: () =>
        import(
          /* webpackChunkName: 'network-routing' */ '../../views/Admin/SetConfigure/ConfigNetworkRoutingVmw/ConfigNetworkRouting'
        ),
      children: [
        {
          path: 'network-routing-list',
          name: 'network-routing-list-vmw',
          meta: {
            breadcrumbs: ['Link Setting Vmw', 'Network Routing']
          },
          component: () =>
            import(
              /* webpackChunkName: 'network-routing-list' */ '../../views/Admin/SetConfigure/ConfigNetworkRoutingVmw/ConfigNetworkRoutingList'
            )
        },
        {
          path: 'network-routing/:roadIdx', // 경유지 관리 상세
          name: 'network-routing-detail-vmw',
          meta: {
            breadcrumbs: ['Link Setting Vmw', 'Network Routing']
          },
          component: () =>
            import(
              /* webpackChunkName: 'network-routing-detail' */ '../../views/Admin/SetConfigure/ConfigNetworkRoutingVmw/ConfigNetworkRoutingDetail'
            )
        }
      ]
    },
    {
      path: 'switch-equip', // 스위치 장비 정보
      name: 'switch-equip-vmw',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Switch Equip']
      },
      component: () =>
        import(
          /* webpackChunkName: 'switch-equip-vmw' */ '../../views/Admin/SetConfigure/ConfigSwitchEquip/ConfigSwitchEquip'
        )
    },
    {
      path: 'firewall-equip', // 방화벽 장비 정보
      name: 'firewall-equip-vmw',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Firewall Equip']
      },
      component: () =>
        import(
          /* webpackChunkName: 'firewall-equip-vmw' */ '../../views/Admin/SetConfigure/ConfigFirewallEquip/ConfigFirewallEquip'
        )
    },
    {
      path: 'firewall-vdom', // 방화벽 VDOM
      name: 'firewall-vdom-vmw',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Firewall VDOM']
      },
      component: () =>
        import(
          /* webpackChunkName: 'firewall-vdom' */ '../../views/Admin/SetConfigure/ConfigFirewallVDOM/ConfigFirewallVDOM.vue'
        )
    },
    {
      path: 'alarm-server', // 알람 서버
      name: 'alarm-server-vmw',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Alarm Server']
      },
      component: () =>
        import(
          /* webpackChunkName: 'alarm-server' */ '../../views/Admin/SetConfigure/ConfigAlarmServerVmw/ConfigAlarmServer'
        )
    },
    {
      path: 'config-monitoring', // 모니터링 설정
      name: 'config-monitoring-vmw',
      redirect: {
        name: 'set-monitoring-vmw'
      },
      component: () =>
        import(
          /* webpackChunkName: 'monitoring-server-vmw' */ '../../views/Admin/SetConfigure/ConfigMonitoringVmw/ConfigMonitoring'
        ),
      children: [
        {
          path: 'set-monitoring', // 모니터링 설정
          name: 'set-monitoring-vmw',
          meta: {
            breadcrumbs: ['Link Setting Vmw', 'Config Monitoring Vmw', 'Set Monitoring Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-user-vmw' */ '../../views/Admin/SetConfigure/ConfigMonitoringVmw/SetMonitoring.vue'
            )
        }, {
          path: 'set-monitoring-server', // 모니터링 서버 설정
          name: 'set-monitoring-server-vmw',
          meta: {
            breadcrumbs: ['Link Setting Vmw', 'Config Monitoring Vmw', 'Set Monitoring Server Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-user' */ '../../views/Admin/SetConfigure/ConfigMonitoringVmw/SetMonitoringServer'
            )
        }
      ]
    },
    {
      path: 'logging-server', // 로깅 서버 설정
      name: 'logging-server',
      meta: {
        ...(shortlyCloud === 'vmw' ? { breadcrumbs: ['Link Setting Vmw', 'Logging Server'] } : { breadcrumbs: ['Link Setting', 'Logging Server'] })
      },
      component: () =>
        import(
          /* webpackChunkName: 'logging-server' */ '../../views/Admin/SetConfigure/ConfigLoggingServer/ConfigLoggingServer'
        )
    },
    {
      path: 'custom-spec',
      name: 'config-custom-specification',
      meta: {
        breadcrumbs: ['Link Setting Vmw', 'Custom Spec']
      },
      component: () => import(
        '../../views/Admin/SetConfigure/ConfigCustomSpec/ConfigCustomSpec.vue'
      )
    }
  ]
}

export default vmwLinkSettingRoutes
