/** 공통, 기타 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const commonOtherRoutes = [
  // main을 기준으로 위에 있는 라우트
  {
    path: '/module/health',
    name: 'health-check',
    meta: {
      breadcrumbs: ['Health Check']
    },
    component: () =>
      import(
        /* webpackChunkName: 'health-check' */
        '../../views/Health/HealthCheck'
      )
  },
  {
    path: '/chg-pwd', // 90일 이후 패스워드 변경
    name: 'change-password',
    meta: {
      breadcrumbs: ['Change Password']
    },
    component: () =>
      import(
        /* webpackChunkName: "change-password" */ '../../views/User/ChangePassword/ChangePassword'
      )
  },
  {
    path: '/',
    name: 'user-login',
    meta: {
      breadcrumbs: ['Dashboard']
    },
    component: () =>
      import(
        /* webpackChunkName: "user-login" */ '../../views/User/UserLogin/UserLogin'
      )
  },
  {
    path: '/error',
    name: 'error-page',
    meta: {
      breadcrumbs: ['Error']
    },
    component: () =>
      import(
        /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
      )
  }
]

export default commonOtherRoutes
