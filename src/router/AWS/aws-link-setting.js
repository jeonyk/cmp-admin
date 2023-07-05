/** 공통, 어드민 관리 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const awsLinkSettingRoutes = {
  path: 'aws',
  name: 'aws-link-setting',
  meta: {
    breadcrumbs: ['Link Setting']
  },
  redirect: { name: 'config-sync-account-vpc' },
  component: () => import(
    /* webpackChunkName: 'aws-dashboard' */ '@/views/SetConfiguration/AWS/SetConfigurationResource/SetConfigurationResource.vue'
  ),
  children: [
    {
      path: 'sync-account-vpc', // 동기화 계정 및 VPC 관리
      name: 'config-sync-account-vpc',
      meta: {
        breadcrumbs: ['Link Setting Aws', 'Sync Account VPC']
      },
      component: () => import(
        /* webpackChunkName: 'aws-dashboard' */ '@/views/SetConfiguration/AWS/SetSyncAccountVpc/SetSyncAccountVpc.vue'
      )
    },
    {
      path: 'region', // 리전 별 가용 영역 설정
      name: 'config-region',
      meta: {
        breadcrumbs: ['Link Setting Aws', 'Config Region']
      },
      component: () => import(
        /* webpackChunkName: 'aws-dashboard' */ '@/views/SetConfiguration/AWS/SetRegionAvailibilityZone/SetRegionAvailibilityZone.vue'
      )
    },
    {
      path: 'monitoring', // 모니터링 설정
      name: 'config-monitoring-aws',
      meta: {
        breadcrumbs: ['Link Setting Aws', 'Monitoring AWS']
      },
      component: () => import(
        /* webpackChunkName: 'aws-dashboard' */ '@/views/SetConfiguration/AWS/SetMonitoring/SetMonitoring.vue'
      )
    }
  ]
}

export default awsLinkSettingRoutes
