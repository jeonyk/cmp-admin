/** 연동 설정 라우터 */
import nxLinkSettingRoutes from '../Nutanix/nx-link-setting'
import vmwLinkSettingRoutes from '../Vmware/vmw-link-setting'
import awsLinkSettingRoutes from '../AWS/aws-link-setting'
import store from '../../store'
const cloudType = store?.getters?.['cloud/getCloudType']

/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const linkSettingRoutes = {
  path: 'link-setting',
  name: 'link-setting',
  meta: {
    breadcrumbs: ['Link Setting']
  },
  component: () => import(
    /* webpackChunkName: 'aws-dashboard' */ '@/views/Admin/LinkSetting/LinkSetting.vue'
  ),
  children: [
    // Nutanix 연동설정 메뉴
    { ...nxLinkSettingRoutes },
    // Vmware 연동설정 메뉴
    { ...vmwLinkSettingRoutes },
    // AWS 연동설정 메뉴
    { ...awsLinkSettingRoutes },
    {
      path: 'jdbc', // 인사/조직 연동 설정
      name: 'jdbc',
      meta: {
        ...(cloudType === 'private' ? { breadcrumbs: ['Link Setting', 'jdbc'] } : { breadcrumbs: ['Link Setting Aws', 'jdbc'] })
      },
      component: () =>
        import(
          /* webpackChunkName: 'org-jdbc' */ '../../views/Admin/SetConfigure/ConfigConnectionJDBC/ConfigJdbc'
        )
    },
    {
      path: 'itsm', // itsm
      name: 'itsm',
      meta: {
        ...(cloudType === 'private' ? { breadcrumbs: ['Link Setting', 'itsm'] } : { breadcrumbs: ['Link Setting Aws', 'itsm'] })
      },
      component: () =>
        import(
          /* webpackChunkName: 'org-itsm' */ '../../views/Admin/SetConfigure/ConfigConnectionITSM/ConfigItsm'
        )
    },
    {
      path: 'it-automation', // IT Automation
      name: 'it-automation',
      meta: {
        ...(cloudType === 'private' ? { breadcrumbs: ['Link Setting', 'It Automation'] } : { breadcrumbs: ['Link Setting Aws', 'itsm'] })
      },
      component: () =>
        import(
          /* webpackChunkName: 'it-automation' */ '../../views/Admin/SetConfigure/ConfigITAutomation/ConfigITAutomation'
        )
    },
    // {
    //   path: 'approval', // 결재 설정
    //   name: 'config-approval',
    //   meta: {
    //     ...(cloudType === 'private' ? { breadcrumbs: ['Link Setting', 'Config Approval'] } : { breadcrumbs: ['Link Setting Aws', 'Config Approval'] })
    //   },
    //   component: () =>
    //     import(
    //       /* webpackChunkName: 'config-approval' */ '../../views/Admin/SetConfigure/ConfigApproval/ConfigApproval'
    //     )
    // }
    {
      path: 'approval', // 결재 설정
      name: 'external-config-approval',
      meta: {
        ...(cloudType === 'private' ? { breadcrumbs: ['Link Setting', 'External Config Approval'] } : { breadcrumbs: ['Link Setting Aws', 'External Config Approval'] })
      },
      component: () =>
        import(
          /* webpackChunkName: 'config-approval' */ '../../views/Admin/SetConfigure/ConfigApproval/ExternalConfigApproval'
        )
    }
  ]
}

export default linkSettingRoutes
