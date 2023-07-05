/** 공통, 미터링 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const meteringRoutes = {
  path: 'metering',
  name: 'metering-vmw',
  meta: {
    breadcrumbs: ['Metering Vmw']
  },
  redirect: { name: 'metering-status-vmw' },
  component: () =>
    import(
      /* webpackChunkName: 'metering' */ '../../views/Metering/Vmware/Metering'
    ),
  children: [
    {
      path: 'status',
      name: 'metering-status-vmw',
      meta: {
        breadcrumbs: ['Metering Vmw', 'Metering Status Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'metering-status' */ '../../views/Metering/Vmware/MeteringStatus/MeteringStatus'
        )
    },
    {
      path: 'sw-license',
      name: 'metering-license-vmw',
      meta: {
        breadcrumbs: ['Metering Vmw', 'Metering License Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'metering-license' */ '../../views/Metering/Nutanix/MeteringLicense/MeteringLicense'
        )
    }
  ]
}

export default meteringRoutes
