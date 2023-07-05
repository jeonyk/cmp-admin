import configManage from './config-manage'
import serviceCatalogue from './service-catalogue'
// import billing from './billing'
import meteringRoutes from './metering'

/** 공통, 업무 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const nutanixRoutes = {
  path: 'nx',
  name: 'cloud-main-nx',
  component: {
    render: c => c('router-view')
  },
  children: [
    {
      path: 'dashboard',
      name: 'dashboard',
      meta: {
        breadcrumbs: ['Dashboard']
      },
      component: () =>
        import(
          /* webpackChunkName: 'dashboard' */ '../../views/Dashboard/Nutanix/Dashboard'
        )
    },

    // 서비스 카탈로그
    { ...serviceCatalogue },
    // 구성 관리
    { ...configManage },
    // 미터링
    { ...meteringRoutes }
    // 빌링
    // { ...billing }
  ]
}

export default nutanixRoutes
