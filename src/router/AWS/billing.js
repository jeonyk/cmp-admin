/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const routes = {
  path: 'billing',
  name: 'aws-billing',
  redirect: { name: 'aws-billing-dh' },
  meta: {
    breadcrumbs: ['Aws Billing']
  },
  component: () => import(
    /* webpackChunkName: 'aws-billing-dh' */ '../../views/Billing/AWS/BillingDashboardWrap.vue'
  ),
  children: [
    {
      path: 'dashboard',
      name: 'aws-billing-dh', // AppMain.vue showBreadcrumbs 조건에 걸려서.. 이름을 이렇게 하겠습니다
      meta: {
        breadcrumbs: ['Aws Billing', 'Aws Billing Dashboard']
      },
      component: () => import(
        /* webpackChunkName: 'aws-billing-dh' */ '../../views/Billing/AWS/BillingDashboard.vue'
      )
    }, {
      path: 'model',
      name: 'aws-billing-model',
      meta: {
        breadcrumbs: ['Aws Billing', 'Aws Billing Model']
      },
      redirect: { name: 'billingModelAWS' },
      component: () => import(
        /* webpackChunkName: 'billing' */ '../../views/Billing/AWS/BillingModel/BillingModel'
      ),
      children: [
        {
          path: 'billing-model-aws',
          name: 'billing-model-aws',
          component: () => import(
            /* webpackChunkName: 'billing-model-aws' */ '../../views/Billing/AWS/BillingModel/BillingModelStandard/BillingModelStandardList'
          ),
          meta: {
            breadcrumbs: ['Aws Billing', 'Aws Billing Model', 'Aws Billing Model Standard']
          }
        }
      ]
    }
  ]
}

export default routes
