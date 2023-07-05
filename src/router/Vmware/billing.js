/** 공통, 빌링 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const billingRoutes = {
  path: 'billing',
  name: 'vmw-billing',
  meta: {
    breadcrumbs: ['Billing Vmw']
  },
  redirect: { name: 'vmw-billing-dh' },
  component: () =>
    import(
      /* webpackChunkName: 'billing' */ '../../views/Billing/Vmware/Billing'
    ),
  children: [
    {
      path: 'dh', // 대시보드
      name: 'vmw-billing-dh',
      meta: {
        breadcrumbs: ['Billing Vmw', 'Billing Dashboard Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'billing-dashboard' */ '../../views/Billing/Vmware/BillingDashboard/BillingDashboard'
        )
    },
    {
      path: 'status', // 과금 현황
      name: 'vmw-billing-status',
      meta: {
        breadcrumbs: ['Billing Vmw', 'Billing Status Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'billing-status' */ '../../views/Billing/Vmware/BillingStatus/BillingStatus'
        )
    },
    {
      path: 'allocate', // 과금 배치
      name: 'vmw-billing-allocation',
      meta: {
        breadcrumbs: ['Billing Vmw', 'Billing Allocation Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'billing-allocation' */ '../../views/Billing/Vmware/BillingAllocation/BillingAllocation'
        )
    },

    {
      path: 'model', // 과금 모델
      name: 'vmw-billing-model',
      meta: {
        breadcrumbs: ['Billing Vmw', 'Billing Model Vmw']
      },
      redirect: { name: 'vmw-billing-model-standard' },
      component: () =>
        import(
          /* webpackChunkName: 'billing-model' */ '../../views/Billing/Vmware/BillingModel/BillingModel'
        ),
      children: [
        {
          name: 'vmw-billing-correction',
          path: 'correction',
          component: {
            render: (c) => c('router-view')
          },
          children: [
            {
              path: 'server/:field',
              name: 'vmw-calibration-server',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Vmw Calibration Server'],
                relationRouteName: 'vmw-billing-model-calibration-server'
              },
              component: () => import(/* webpackChunkName: 'billing-model-calib-grid' */ '../../views/Billing/Integrated/Correction/BillingModelCalibGrid.vue')
            },
            {
              path: 'server/create', // 서버별 보정 모델 등록
              name: 'vmw-billing-model-calibration-server-create',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Vmw Calibration Server', 'Vmw Calibration Server Create'],
                relationRouteName: 'vmw-billing-model-calibration-server'
              },
              component: () => import(
                /* webpackChunkName: 'calibrationWrap' */ '../../views/Billing/Integrated/Correction/Server/BillingModelCalibServerCreate.vue'
              )
            },
            {
              path: 'server', // 서버별 보정 모델
              name: 'vmw-billing-model-calibration-server',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Vmw Calibration Server']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-calibration-server' */ '../../views/Billing/Integrated/Correction/Server/BillingModelCalibServer.vue'
              )
            },
            {
              path: 'company/create', // 관계사별 보정 모델 등록
              name: 'vmw-billing-model-calibration-company-create',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Vmw Calibration Company', 'Vmw Calibration Company Create'],
                relationRouteName: 'vmw-billing-model-calibration-company'
              },
              component: () => import(
                /* webpackChunkName: 'calibrationWrap' */ '../../views/Billing/Integrated/Correction/Group/BillingModelCalibCompanyCreate.vue'
              )
            },
            {
              path: 'company/:field',
              name: 'vmw-calibration-company',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Vmw Calibration Company'],
                relationRouteName: 'vmw-billing-model-calibration-company'
              },
              component: () => import(/* webpackChunkName: 'billing-model-calib-grid' */ '../../views/Billing/Integrated/Correction/BillingModelCalibGrid.vue')
            },
            {
              path: 'company', // 관계사별 보정 모델
              name: 'vmw-billing-model-calibration-company',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Vmw Calibration Company']
              },
              component: () => import(/* webpackChunkName: 'billing-model-calibration-server' */ '../../views/Billing/Integrated/Correction/Group/BillingModelCalibCompany.vue')
            }
          ]
        },
        {
          path: 'standard', // 과금 모델
          name: 'vmw-billing-model-standard',
          meta: {
            breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Billing Model Standard Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'billing-model-standard' */ '../../views/Billing/Vmware/BillingModel/BillingModelStandard/BillingModelStandardList.vue'
            ),
          children: []
        },
        {
          path: 'standard/detail',
          name: 'vmw-billing-model-standard-new-detail',
          meta: {
            breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Billing Model Standard Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'billing-model-standard-new-detail' */ '../../views/Billing/Vmware/BillingModel/BillingModelStandard/BillingModelDetail.vue'
            )
        },
        {
          path: 'dist', // 배부 모델
          name: 'vmw-billing-model-dist',
          meta: {
            breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Billing Model Dist Vmw']
          },
          redirect: { name: 'vmw-billing-model-dist-list' },
          component: () =>
            import(
              /* webpackChunkName: 'billing-model-dist' */ '../../views/Billing/Vmware/BillingModel/BillingModelDist/BillingModelDist'
            ),
          children: [
            {
              path: '', // 배부 모델
              name: 'vmw-billing-model-dist-list',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Billing Model Dist Vmw']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-dist-list' */ '../../views/Billing/Vmware/BillingModel/BillingModelDist/BillingModelDistList.vue'
              )
            },
            {
              path: 'create', // 배부 모델
              name: 'vmw-billing-model-dist-create',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Billing Model Dist Vmw', 'Billing Model Dist Create Vmw']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-dist-list' */ '../../views/Billing/Vmware/BillingModel/BillingModelDist/BillingModelDistCreate.vue'
              )
            },
            {
              path: 'update/:id', // 배부 모델
              name: 'vmw-billing-model-dist-update',
              meta: {
                breadcrumbs: ['Billing Vmw', 'Billing Model Vmw', 'Billing Model Dist Vmw', 'Billing Model Dist Update Vmw']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-dist-list' */ '../../views/Billing/Vmware/BillingModel/BillingModelDist/BillingModelDistUpdate.vue'
              )
            }
          ]
        }
      ]
    }
  ]
}

export default billingRoutes
