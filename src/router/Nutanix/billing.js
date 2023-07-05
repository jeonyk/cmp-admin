/** 공통, 빌링 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const billingRoutes = {
  path: 'billing',
  name: 'nx-billing',
  meta: {
    breadcrumbs: ['Billing']
  },
  redirect: { name: 'nx-billing-dh' },
  component: () =>
    import(
      /* webpackChunkName: 'billing' */ '../../views/Billing/Integrated/Billing'
    ),
  children: [
    {
      path: 'dh', // 대시보드
      name: 'nx-billing-dh',
      meta: {
        breadcrumbs: ['Billing', 'Billing Dashboard']
      },
      component: () =>
        import(
          /* webpackChunkName: 'billing-dashboard' */ '../../views/Billing/Nutanix/BillingDashboard/BillingDashboard'
        )
    },
    {
      path: 'status', // 과금 현황
      name: 'nx-billing-status',
      meta: {
        breadcrumbs: ['Billing', 'Billing Status']
      },
      component: () =>
        import(
          /* webpackChunkName: 'billing-status' */ '../../views/Billing/Integrated/Status/BillingStatus'
        )
    },
    {
      path: 'allocate', // 과금 배치
      name: 'nx-billing-allocation',
      meta: {
        breadcrumbs: ['Billing', 'Billing Allocation']
      },
      component: () =>
        import(
          /* webpackChunkName: 'billing-allocation' */ '../../views/Billing/Integrated/Allocation/BillingAllocation'
        )
    },

    {
      path: 'model', // 과금 모델
      name: 'nx-billing-model',
      meta: {
        breadcrumbs: ['Billing', 'Billing Model']
      },
      redirect: { name: 'nx-billing-model-standard' },
      component: () =>
        import(
          /* webpackChunkName: 'billing-model' */ '../../views/Billing/Integrated/Model/BillingModel'
        ),
      children: [
        {
          name: 'nx-billing-correction',
          path: 'correction',
          component: {
            render: (c) => c('router-view')
          },
          children: [
            {
              path: 'server', // 서버별 보정 모델
              name: 'nx-billing-model-calibration-server',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Server']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-calibration-server' */ '../../views/Billing/Integrated/Correction/Server/BillingModelCalibServer.vue'
              )
            },
            {
              path: 'server/create', // 서버별 보정 모델 등록
              name: 'nx-billing-model-calibration-server-create',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Server', 'Nx Calibration Server Create'],
                relationRouteName: 'nx-billing-model-calibration-server'
              },
              component: () => import(
                /* webpackChunkName: 'calibrationWrap' */ '../../views/Billing/Integrated/Correction/Server/BillingModelCalibServerCreate.vue'
              )
            },
            {
              path: 'server/:field',
              name: 'nx-calibration-server',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Server'],
                relationRouteName: 'nx-billing-model-calibration-server'
              },
              component: () => import(/* webpackChunkName: 'billing-model-calib-grid' */ '../../views/Billing/Integrated/Correction/BillingModelCalibGrid.vue')
            },
            {
              path: 'company', // 관계사별 보정 모델
              name: 'nx-billing-model-calibration-company',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Company']
              },
              component: () => import(/* webpackChunkName: 'billing-model-calibration-server' */ '../../views/Billing/Integrated/Correction/Group/BillingModelCalibCompany.vue')
            },
            {
              path: 'company/create', // 관계사별 보정 모델 등록
              name: 'nx-billing-model-calibration-company-create',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Company', 'Nx Calibration Company Create'],
                relationRouteName: 'nx-billing-model-calibration-company'
              },
              component: () => import(
                /* webpackChunkName: 'calibrationWrap' */ '../../views/Billing/Integrated/Correction/Group/BillingModelCalibCompanyCreate.vue'
              )
            },
            {
              path: 'company/:field',
              name: 'nx-calibration-company',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Company'],
                relationRouteName: 'nx-billing-model-calibration-company'
              },
              component: () => import(/* webpackChunkName: 'billing-model-calib-grid' */ '../../views/Billing/Integrated/Correction/BillingModelCalibGrid.vue')
            }
          ]
        },
        {
          path: 'standard', // 과금 모델
          name: 'nx-billing-model-standard',
          meta: {
            breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Standard']
          },
          component: () =>
            import(
              /* webpackChunkName: 'billing-model-standard' */ '../../views/Billing/Integrated/Model/BillingModelStandard/BillingModelStandardList.vue'
            ),
          children: []
        },
        {
          path: 'standard/detail',
          name: 'nx-billing-model-standard-new-detail',
          meta: {
            breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Standard']
          },
          component: () =>
            import(
              /* webpackChunkName: 'billing-model-standard-new-detail' */ '../../views/Billing/Integrated/Model/BillingModelStandard/BillingModelDetail.vue'
            )
        },
        {
          path: 'dist', // 배부 모델
          name: 'nx-billing-model-dist',
          meta: {
            breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist']
          },
          redirect: { name: 'nx-billing-model-dist-list' },
          component: () =>
            import(
              /* webpackChunkName: 'billing-model-dist' */ '../../views/Billing/Integrated/Model/BillingModelDist/BillingModelDist'
            ),
          children: [
            {
              path: '', // 배부 모델
              name: 'nx-billing-model-dist-list',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-dist-list' */ '../../views/Billing/Integrated/Model/BillingModelDist/BillingModelDistList.vue'
              )
            },
            {
              path: 'create', // 배부 모델
              name: 'nx-billing-model-dist-create',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist', 'Billing Model Dist Create']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-dist-list' */ '../../views/Billing/Integrated/Model/BillingModelDist/BillingModelDistCreate.vue'
              )
            },
            {
              path: 'update/:id', // 배부 모델
              name: 'nx-billing-model-dist-update',
              meta: {
                breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist', 'Billing Model Dist Update']
              },
              component: () => import(
                /* webpackChunkName: 'billing-model-dist-list' */ '../../views/Billing/Integrated/Model/BillingModelDist/BillingModelDistUpdate.vue'
              )
            }
          ]
        }

      ]
    }
  ]
}

export default billingRoutes
