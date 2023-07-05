/** 공통, 미터링 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const meteringRoutes = {
  path: 'metering',
  name: 'metering',
  meta: {
    breadcrumbs: ['Metering']
  },
  redirect: { name: 'metering-status' },
  component: () =>
    import(
      /* webpackChunkName: 'metering' */ '../../views/Metering/Nutanix/Metering'
    ),
  children: [
    {
      path: 'status',
      name: 'metering-status',
      meta: {
        breadcrumbs: ['Metering', 'Metering Status']
      },
      component: () =>
        import(
          /* webpackChunkName: 'metering-status' */ '../../views/Metering/Nutanix/MeteringStatus/MeteringStatus'
        )
    },
    {
      path: 'sw-license',
      name: 'metering-license',
      meta: {
        breadcrumbs: ['Metering', 'Metering License']
      },
      component: () =>
        import(
          /* webpackChunkName: 'metering-license' */ '../../views/Metering/Nutanix/MeteringLicense/MeteringLicense'
        )
    }
  ]
}

export default meteringRoutes
