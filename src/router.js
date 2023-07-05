
import Vue from 'vue'
import Router from 'vue-router'
import Store from './store/'
import VueCookies from 'vue-cookies'
import i18n from './i18n'

import nutanixRoutes from './router/Nutanix'
import awsRoutes from './router/AWS'
import vmwareRoutes from './router/Vmware'
import { MessageBox } from 'element-ui'
import commonOtherRoutes from './router/Common'
import workRoutes from './router/Common/work'
import setRoutes from './router/Common/set'
import linkSettingRoutes from './router/Common/link-setting'

Vue.use(Router)

const viewRouter = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    ...commonOtherRoutes,
    {
      path: '/main',
      name: 'main',
      meta: {
        breadcrumbs: ['Main']
      },
      redirect: {
        // name: Store.state.cloud.shortlyCloud === 'nx' || !Store.state.cloud.shortlyCloud ? 'dashboard' : 'dashboard-' + Store.state.cloud.shortlyCloud
        name: 'dashboard-v3'
      },
      component: () => import(
        /* webpackChunkName: 'main' */ './views/AppMain/AppMain'
      ),
      children: [
        { // V3) 곧 페이지 정의되면 정리될 예정 (CSP 대시보드) 🟨
          path: 'dashboard-v3',
          name: 'dashboard-v3',
          meta: {
            breadcrumbs: ['Dashboard']
          },
          component: () => import(
            /* webpackChunkName: 'dashboard-v3' */ './views/Dashboard/IntegratedDashboard/IntegratedDashboard'
          )
        },

        // ***** 클라우드 별 분기 *****
        // 뉴타닉스 Nutanix nx private
        { ...nutanixRoutes },
        // AWS AWS aws public
        { ...awsRoutes },
        { ...vmwareRoutes },

        // ***** 클라우드 관계없이 공통 *****
        // 업무
        { ...workRoutes },
        // 어드민 관리
        { ...setRoutes },
        // 연동 설정
        { ...linkSettingRoutes },
        {
          path: 'resource-tag-search/:searchValue',
          name: 'resource-tag-search',
          meta: {
            breadcrumbs: ['Resource Tag Search']
          },
          component: () => import(
            /* webpackChunkName: 'resource-tag-search' */ './views/ResourceTagSearch/ResourceTagSearch'
          )
        },

        {
          path: 'billing',
          name: 'nx-billing',
          meta: {
            breadcrumbs: ['Billing']
          },
          redirect: { name: 'integrated-billing-dashboard' },
          component: () =>
            import(
              /* webpackChunkName: 'billing' */ './views/Billing/Integrated/Billing'
            ),
          children: [
          /**
           * 통합 빌링 대시보드
           */
            {
              path: 'billing-dashboard',
              name: 'integrated-billing-dashboard',
              meta: {
                breadcrumbs: ['Integrated Billing', 'Integrated Billing Dashboard']
              },
              component: () => import(
                /* webpackChunkName: 'integrated-billing-dashboard' */ './views/Billing/Integrated/Dashboard/BillingDashboard.vue'
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
                  /* webpackChunkName: 'billing-status' */ './views/Billing/Integrated/Status/BillingStatus'
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
                  /* webpackChunkName: 'billing-allocation' */ './views/Billing/Integrated/Allocation/BillingAllocation'
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
                  /* webpackChunkName: 'billing-model' */ './views/Billing/Integrated/Model/BillingModel'
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
                        /* webpackChunkName: 'billing-model-calibration-server' */ './views/Billing/Integrated/Correction/Server/BillingModelCalibServer.vue'
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
                        /* webpackChunkName: 'calibrationWrap' */ './views/Billing/Integrated/Correction/Server/BillingModelCalibServerCreate.vue'
                      )
                    },
                    {
                      path: 'server/:field',
                      name: 'nx-calibration-server',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Server'],
                        relationRouteName: 'nx-billing-model-calibration-server'
                      },
                      component: () => import(/* webpackChunkName: 'billing-model-calib-grid' */ './views/Billing/Integrated/Correction/BillingModelCalibGrid.vue')
                    },
                    {
                      path: 'company', // 관계사별 보정 모델
                      name: 'nx-billing-model-calibration-company',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Company']
                      },
                      component: () => import(/* webpackChunkName: 'billing-model-calibration-server' */ './views/Billing/Integrated/Correction/Group/BillingModelCalibCompany.vue')
                    },
                    {
                      path: 'company/create', // 관계사별 보정 모델 등록
                      name: 'nx-billing-model-calibration-company-create',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Company', 'Nx Calibration Company Create'],
                        relationRouteName: 'nx-billing-model-calibration-company'
                      },
                      component: () => import(
                        /* webpackChunkName: 'calibrationWrap' */ './views/Billing/Integrated/Correction/Group/BillingModelCalibCompanyCreate.vue'
                      )
                    },
                    {
                      path: 'company/:field',
                      name: 'nx-calibration-company',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Nx Calibration Company'],
                        relationRouteName: 'nx-billing-model-calibration-company'
                      },
                      component: () => import(/* webpackChunkName: 'billing-model-calib-grid' */ './views/Billing/Integrated/Correction/BillingModelCalibGrid.vue')
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
                      /* webpackChunkName: 'billing-model-standard' */ './views/Billing/Integrated/Model/BillingModelStandard/BillingModelStandardList.vue'
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
                      /* webpackChunkName: 'billing-model-standard-new-detail' */ './views/Billing/Integrated/Model/BillingModelStandard/BillingModelDetail.vue'
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
                      /* webpackChunkName: 'billing-model-dist' */ './views/Billing/Integrated/Model/BillingModelDist/BillingModelDist'
                    ),
                  children: [
                    {
                      path: '', // 배부 모델
                      name: 'nx-billing-model-dist-list',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist']
                      },
                      component: () => import(
                        /* webpackChunkName: 'billing-model-dist-list' */ './views/Billing/Integrated/Model/BillingModelDist/BillingModelDistList.vue'
                      )
                    },
                    {
                      path: 'create', // 배부 모델
                      name: 'nx-billing-model-dist-create',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist', 'Billing Model Dist Create']
                      },
                      component: () => import(
                        /* webpackChunkName: 'billing-model-dist-list' */ './views/Billing/Integrated/Model/BillingModelDist/BillingModelDistCreate.vue'
                      )
                    },
                    {
                      path: 'update/:id', // 배부 모델
                      name: 'nx-billing-model-dist-update',
                      meta: {
                        breadcrumbs: ['Billing', 'Billing Model', 'Billing Model Dist', 'Billing Model Dist Update']
                      },
                      component: () => import(
                        /* webpackChunkName: 'billing-model-dist-list' */ './views/Billing/Integrated/Model/BillingModelDist/BillingModelDistUpdate.vue'
                      )
                    }
                  ]
                }

              ]
            }
          ]
        },

        /**
         * Web Push (통합 알람)
         */
        {
          path: 'web-push',
          name: 'web-push',
          meta: {
            breadcrumbs: ['Web Push']
          },
          component: () => import(
            /* webpackChunkName: 'web-push' */ './views/Admin/Alarm/AlarmWebPush.vue'
          )
        },

        {
          path: 'find',
          name: 'find-password',
          meta: {
            breadcrumbs: ['Find']
          },
          component: () => import(
            /* webpackChunkName: 'find' */ './views/User/FindPassword'
          )
        },
        {
          path: '*',
          name: 'not-found',
          meta: {
            breadcrumbs: ['']
          },
          component: () => import(/* webpackChunkName: "not-found" */ './views/ErrorPage/NotFoundPage')
        },
        {
          path: '/main/:code',
          name: 'not-found-status',
          meta: {
            breadcrumbs: ['']
          },
          component: () => import(/* webpackChunkName: "not-found" */ './views/ErrorPage/NotFoundPage')
        }
      ]
    },
    {
      path: '*',
      meta: {
        breadcrumbs: ['']
      },
      component: () => import(/* webpackChunkName: "not-found" */ './views/ErrorPage/NotFoundPage')
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    // 페이지 변경 시 페이지를 맨 위로 올립니다
    return { x: 0, y: 0 }
  }
})

const removeConfigServerGridPage = (to) => { // localStorage에 저장되어있는 구성관리 > compute 그리드 페이지 넘버를 remove 합니다.
  if (!to.meta?.breadcrumbs?.includes('Set Resource Server')) {
    const configServerGridPage = sessionStorage.getItem('configServerGridPage')
    if (configServerGridPage) {
      sessionStorage.removeItem('configServerGridPage')
    }
  }
}

viewRouter.beforeEach((to, from, next) => {
  // console.log('to: ', to) // 대상 Route 객체로 이동(Route 객체)
  // console.log('from: ', from) // 현재 라우트로 오기전 라우트 (Route 객체)
  const token = VueCookies.get('Authorization')

  if (to.name === 'change-password') {
    if (!from.name && !document.referrer) next({ name: 'error-page' })
  }
  if (to.name === 'find-password' || to.name === 'change-password') {
    return next()
  }
  if (to.name !== 'user-login' && token === null) {
    next({ name: 'user-login' })
  }
  if (to.name === 'user-login' && token !== null) {
    next({ name: 'main' })
  }
  if (to.name === 'error-page') {
    next()
  }
  // PLUS 버전에 사용자 계정 없음
  if (Store.state.auth.packageType === 'PL' && to.name === 'set-account-user') {
    next({ name: 'set-account-admin' })
  }

  removeConfigServerGridPage(to)

  const perm = VueCookies.get('Perm')
  if (perm && to.name !== 'error-page' && to.name !== 'user-login' && to.name !== 'find-password' && perm.userPermLevel !== 0) {
    let isMenuAuth = false
    for (const i in perm.menu[Store.state.cloud.shortlyCloud]) {
      if (perm.menu[Store.state.cloud.shortlyCloud][i] === to.matched[to.matched.length - 1].name || perm.menu[Store.state.cloud.shortlyCloud][i] === to.matched[to.matched.length - 2].name) {
        isMenuAuth = true
      }
      if (perm.menu[Store.state.cloud.shortlyCloud][i] === 'task' && (to.name === 'todo-detail' || to.name === 'done-detail' || to.name === 'conference-detail' || to.name === 'approved-detail' || to.name === 'task-conference' || to.name === 'task-todo' || to.name === 'task-done' || to.name === 'task-approved' || to.name === 'task-status')) {
        isMenuAuth = true
      }
      if (perm.menu[Store.state.cloud.shortlyCloud][i] === 'set-resource-switch' && (to.matched[to.matched.length - 3] && to.matched[to.matched.length - 3].name && perm.menu[Store.state.cloud.shortlyCloud][i] === to.matched[to.matched.length - 3].name)) {
        isMenuAuth = true
      }
    }

    if (to.path.startsWith('/main/set') && !isMenuAuth) {
      MessageBox({
        message: i18n.t('common.ALERT.BASE.078'),
        dangerouslyUseHTMLString: true,
        callback: () => {
          viewRouter.go(-1)
        },
        confirmButtonText: i18n.t('common.BTN.confirm')
      })

      console.log('현재 권한(perm.userPermLevel): ', perm.userPermLevel)
      return
    } else if (!isMenuAuth) {
      viewRouter.push({ name: 'error-page', params: { message: i18n.t('main.LAYOUT.accessDenied') } })
      // 만약 권한이 없는 페이지에 접근하였을 경우라면 권한이 있는페이지중 첫번째 페이지로 접근
      if (perm.menu[Store.state.cloud.shortlyCloud].length) {
        viewRouter.push({ name: perm.menu[Store.state.cloud.shortlyCloud][0] })
      }
      return
    }
  }

  const identifyMenu = (label) => {
    const { packageType } = Store.state.auth
    let sub = label.replace(/(\s*)/g, '')
    sub = sub.charAt(0).toLowerCase() + sub.slice(1)
    // console.log(sub)

    return {
      userLogin: { label: i18n.t('main.LAYOUT.login'), name: 'user-login' },
      main: { label: i18n.t('bc.main'), name: 'main' },
      find: { label: i18n.t('common.GRID.findPw'), name: 'find-password' },
      changePassword: { label: i18n.t('common.REGCON.changePw'), name: 'change-password' },
      resourceTagSearch: { label: i18n.t('bc.SEARCH.ResourceTagSearch'), name: 'resource-tag-search' },
      dashboard: { label: i18n.t('bc.dashboard'), name: 'dashboard' },
      task: { label: i18n.t('bc.TASK.title'), name: 'task-list' },
      taskStatusBoard: { label: '업무 현황판', name: 'task-status' },
      taskConference: { label: i18n.t('task.PRIOR.title'), name: 'task-conference' },
      taskTodo: { label: i18n.t('bc.TASK.todo'), name: 'task-todo' },
      taskDone: { label: i18n.t('bc.TASK.done'), name: 'task-done' },
      taskApproved: { label: i18n.t('bc.TASK.pay'), name: 'task-approved' },
      taskDocument: { label: i18n.t('bc.TASK.document'), name: 'task-conference' },
      // server: setTaskCategory(),
      // network: setTaskCategory(),
      // security: setTaskCategory(),
      // todoDetail: { label: '할 일', name: 'task-conference' },
      //  doneDetail: { label: '사전협의', name: 'task-conference' },
      // conferenceDetail: { label: '사전협의', name: 'task-conference' },
      approvedDetail: { label: i18n.t('bc.TASK.pay'), name: 'approved-detail' },

      serviceCatalogue: { label: i18n.t('bc.SC.title'), name: packageType === 'ENT' ? 'service-catalogue' : 'install-program-lists' },
      marketplaceLists: { label: i18n.t('bc.SC.mp'), name: 'marketplace-template' },
      installProgram: { label: i18n.t('bc.SC.installProgram'), name: 'install-program' },
      installProgramLists: { label: i18n.t('bc.SC.install'), name: 'install-program-lists' },
      installProgramListsAdd: { label: i18n.t('common.BTN.SERV.addInstall'), name: 'install-program-lists-add' },
      installProgramVms: { label: i18n.t('common.BTN.SERV.programVms'), name: 'install-program-lists-vms' },
      instanceTypeLists: { label: i18n.t('bc.SC.instance'), name: 'instance-type-lists' },
      instanceTypeListsAdd: { label: i18n.t('service.addServerSpec'), name: 'instance-type-lists-add' },

      vMTemplate: { label: i18n.t('service.OVA.template'), name: 'vm-template' },

      configManage: { label: i18n.t('bc.MANAGE.title'), name: 'config-manage' },
      setItsm: { label: 'ITSM', name: 'set-itsm' },
      setItsmVmw: { label: 'ITSM', name: 'set-itsm-vmw' },
      approvalWaiting: { label: '승인대기', name: 'set-project-list' },
      approvalWaitingVmw: { label: '승인대기', name: 'set-project-list-vmw' },
      setResource: { label: i18n.t('bc.MANAGE.resource'), name: 'set-resource' },
      // configManageCompute: { label: 'Compute', name: 'set-compute' },
      // configManageNetwork: { label: 'Network', name: 'set-network' },
      // configManageStorage: { label: 'Storage', name: 'set-storage' },
      manageUnregisteredResources: { label: i18n.t('main.LAYOUT.manageUnregisterResource'), name: 'unregister-resource' },
      unregisteredResourcesBasket: { label: i18n.t('main.LAYOUT.registerBasket'), name: 'unregister-resource-basket' },
      rackLists: { label: i18n.t('bc.MANAGE.lac'), name: 'rack-lists' },
      setCluster: { label: i18n.t('bc.MANAGE.pool'), name: 'set-cluster' },
      setClusterSimulation: { label: '가용량 시뮬레이션', name: 'set-cluster-simulation' },
      setHost: { label: i18n.t('bc.MANAGE.physical'), name: 'set-host' },
      setResourceServer: { label: 'Compute', name: 'set-resource-server' },
      setResourceSwitch: { label: i18n.t('main.LAYOUT.networkSwitch'), name: 'set-resource-switch' },
      l4: { label: i18n.t('common.GRID.NETWORK.l4'), name: 'set-resource-switch-l4-list' },
      l7: { label: i18n.t('common.GRID.NETWORK.l7'), name: 'set-resource-switch-l7-list' },
      service: { label: i18n.t('bc.MANAGE.service'), name: 'set-resource-switch-service-list' },
      certification: { label: i18n.t('bc.MANAGE.certification'), name: 'set-resource-switch-certification-list' },
      setResourceSecurity: { label: i18n.t('main.LAYOUT.networkSecurity'), name: 'set-resource-security' },
      setResourceStorage: { label: 'Storage', name: 'set-resource-storage' },
      setResourceDatabase: { label: 'Database', name: 'set-resource-database' },
      setResourceAutoScaleGroup: { label: 'Auto Scale Group', name: 'set-resource-autoscale-group' },
      setResourceShare: { label: 'NAS (Files)', name: 'set-resource-share' },
      setIp: { label: i18n.t('common.ipManagement'), name: 'set-ip' },
      setProject: { label: i18n.t('bc.MANAGE.project'), name: 'set-project' },
      manageProject: { label: i18n.t('bc.MANAGE.manageProject'), name: 'set-project-manage-project' },
      resourceOperation: { label: i18n.t('bc.MANAGE.resourceOperation'), name: 'set-project-resource-operation' },
      resourceOperationBasket: { label: i18n.t('bc.MANAGE.resourceOperationBasket'), name: 'resource-operation-basket' },

      ref: { label: i18n.t('bc.ADMIN.ref'), name: 'set-ref-list' },
      refList: { label: i18n.t('bc.ADMIN.ref'), name: 'set-ref-list' },
      refDetail: { label: i18n.t('bc.ADMIN.ref'), name: 'set-ref-list' },

      news: { label: i18n.t('bc.ADMIN.NEWS'), name: 'set-news' },
      newsList: { label: i18n.t('bc.ADMIN.NEWS'), name: 'set-news-list' },
      newsDetail: { label: i18n.t('bc.ADMIN.NEWS'), name: 'set-news-list' },

      metering: { label: i18n.t('bc.METER.title'), name: 'metering' },
      meteringStatus: { label: i18n.t('bc.METER.status'), name: 'metering-status' },
      meteringLicense: { label: i18n.t('bc.METER.license'), name: 'metering-license' },
      // meteringDashboard: { label: '대시보드', name: 'metering-dashboard' },
      // allResource: { label: '전체 자원', name: 'metering-all-resource' },
      // modifyResource: { label: '변경/삭제 자원', name: 'metering-modify-resource' },
      // modifyResourceDetail: { label: '변경/삭제 자원', name: 'metering-modify-resource' },

      billing: { label: i18n.t('bc.BILL.title'), name: 'integrated-billing-dashboard' },
      billingDashboard: { label: i18n.t('bc.BILL.dashboard'), name: 'integrated-billing-dashboard' },
      billingStatus: { label: i18n.t('bc.BILL.status'), name: 'nx-billing-status' },
      billingAllocation: { label: i18n.t('bc.BILL.arrange'), name: 'nx-billing-allocation' },
      billingModel: { label: i18n.t('bc.BILL.MODEL.title'), name: 'nx-billing-model' },
      billingModelStandard: { label: i18n.t('bc.BILL.MODEL.bill'), name: 'nx-billing-model-standard' },
      billingModelDist: { label: i18n.t('bc.BILL.MODEL.dist'), name: 'nx-billing-model-dist' },
      billingModelDistCreate: { label: i18n.t('common.BTN.enroll'), name: 'nx-billing-model-dist-create' },
      billingModelDistUpdate: { label: i18n.t('common.BTN.modify'), name: 'nx-billing-model-dist-update' },

      nxCalibrationServer: { label: i18n.t('bc.BILL.MODEL.server'), name: 'nx-billing-model-calibration-server' },
      nxCalibrationServerCreate: { label: i18n.t('bc.BILL.MODEL.regist'), name: 'nx-billing-model-calibration-server-create' },
      nxCalibrationCompanyCreate: { label: i18n.t('bc.BILL.MODEL.regist'), name: 'nx-billing-model-calibration-company-create' },
      nxCalibrationCompany: { label: i18n.t('main.LAYOUT.affModel'), name: 'nx-billing-model-calibration-company' },

      vmwCalibrationServer: { label: i18n.t('bc.BILL.MODEL.server'), name: 'vmw-billing-model-calibration-server' },
      vmwCalibrationServerCreate: { label: i18n.t('bc.BILL.MODEL.regist'), name: 'vmw-billing-model-calibration-server-create' },
      vmwCalibrationCompanyCreate: { label: i18n.t('bc.BILL.MODEL.regist'), name: 'vmw-billing-model-calibration-company-create' },
      vmwCalibrationCompany: { label: i18n.t('main.LAYOUT.affModel'), name: 'vmw-billing-model-calibration-company' },

      awsBilling: { label: i18n.t('bc.BILL.title'), name: 'aws-billing' },
      awsBillingModel: { label: i18n.t('bc.BILL.MODEL.title'), name: 'aws-billing-model' },
      awsBillingModelStandard: { label: i18n.t('bc.BILL.MODEL.bill'), name: 'billing-model-aws' },
      awsBillingDashboard: { label: i18n.t('bc.BILL.dashboard'), name: 'aws-billing-dh' },

      set: { label: i18n.t('bc.ADMIN.title'), name: 'set' },
      consignmentManagement: { label: i18n.t('common.consignmentManagement'), name: 'consignment-management' },
      account: { label: i18n.t('bc.ADMIN.ACC.title'), name: 'set-account' },
      userList: { label: i18n.t('bc.ADMIN.ACC.user'), name: 'set-account-user' },
      configMonitoring: { label: i18n.t('bc.ADMIN.CONF.MONIT.title'), name: 'config-monitoring' },
      setMonitoring: { label: i18n.t('bc.ADMIN.CONF.MONIT.monit'), name: 'set-monitoring' },
      setMonitoringServer: { label: i18n.t('bc.ADMIN.CONF.MONIT.monitServer'), name: 'set-monitoring-server' },
      adminList: { label: i18n.t('bc.ADMIN.ACC.manager'), name: 'set-account-admin' },
      adList: { label: i18n.t('bc.ADMIN.ACC.ad'), name: 'set-account-ad' },
      // accountDetail: { label: '계정 설정', name: 'set-account-detail' },
      organization: { label: i18n.t('bc.ADMIN.ORG.title'), name: 'set-organization' },
      organizationProject: { label: i18n.t('bc.ADMIN.ORG.orgp'), name: 'set-organization-project' },
      organizationAccount: { label: i18n.t('bc.ADMIN.ORG.orga'), name: 'set-organization-account' },
      role: { label: i18n.t('bc.ADMIN.role'), name: 'set-role' },
      // roleDetail: { label: '역할 관리', name: 'set-role-detail' },
      // auth: { label: '권한 관리', name: 'set-auth' },
      // notification: { label: '통보 설정(메일)', name: 'set-notification' },
      notice: { label: i18n.t('bc.ADMIN.NOTICE.title'), name: 'notice' },
      noticeRegister: { label: i18n.t('bc.ADMIN.NOTICE.reg'), name: 'notice-register' },
      noticeDetail: { label: i18n.t('bc.ADMIN.NOTICE.detail'), name: 'notice-detail' },
      noticeModify: { label: i18n.t('common.BTN.modify'), name: 'notice-modify' },
      inquiryList: { label: i18n.t('bc.ADMIN.IND.title'), name: 'indiv-inquiry-list' },
      inquiryDetail: { label: i18n.t('bc.ADMIN.IND.detail'), name: 'indiv-inquiry-detail' },
      fAQList: { label: 'FAQ', name: 'faq-list' },
      fAQDetail: { label: i18n.t('bc.ADMIN.FAQ.detail'), name: 'faq-detail' },
      fAQRegister: { label: i18n.t('bc.ADMIN.NOTICE.reg'), name: 'faq-register' },
      fAQModify: { label: i18n.t('common.BTN.modify'), name: 'faq-modify' },
      workFlow: { label: i18n.t('bc.ADMIN.workflow'), name: 'work-flow' },
      integratedWorkManagement: { label: i18n.t('bc.ADMIN.integratedWorkManagement'), name: 'integrated-work-management' },
      integratedWorkManagementTemplate: { label: i18n.t('bc.ADMIN.integratedWorkManagementTemplate'), name: 'integrated-work-management' },
      dynamicMetaData: { label: i18n.t('bc.ADMIN.dynamicMetaData'), name: 'dynamic-meta' },
      package: { label: i18n.t('bc.ADMIN.PKG.main'), name: 'cmp-package-management' },
      packageExternal: { label: i18n.t('bc.ADMIN.PKG.main'), name: 'cmp-package-management-external' },
      module: { label: i18n.t('bc.ADMIN.PKG.moduleVersion'), name: 'cmp-package-management-module' },
      license: { label: i18n.t('bc.ADMIN.PKG.license'), name: 'cmp-package-management-license' },
      version: { label: i18n.t('bc.ADMIN.PKG.version'), name: 'cmp-package-management-version' },

      setConfigure: { label: i18n.t('bc.ADMIN.CONF.title'), name: 'set-configure' },
      code: { label: i18n.t('bc.ADMIN.CONF.CODE.title'), name: 'config-code' },
      configNetworkCate: { label: i18n.t('bc.ADMIN.CONF.networkCate'), name: 'config-network-cate' },
      typeDefine: { label: i18n.t('bc.ADMIN.CONF.CODE.defType'), name: 'config-code-type' },
      allDefine: { label: i18n.t('bc.ADMIN.CONF.CODE.defCode'), name: 'config-code-all' },
      configNutanix: { label: i18n.t('bc.ADMIN.CONF.NUTA.title'), name: 'config-nutanix' },
      nutanixCentral: { label: 'Central', name: 'nutanix-central' },
      nutanixElement: { label: 'Element', name: 'nutanix-element' },
      fileServerDetail: { label: 'File Server', name: 'file-server-detail' },
      nutanixEra: { label: 'Era', name: 'nutanix-era' },
      networkCategory: { label: i18n.t('bc.ADMIN.CONF.networkCate'), name: 'network-category' },
      // /*AWS-Network && Security
      awsNetwork: { label: i18n.t('bc.AWS.network'), name: 'vpc-aws' },
      awsVpc: { label: 'VPC', name: 'vpc-aws' },
      awsSubnet: { label: i18n.t('bc.AWS.subnet'), name: 'subnet-aws' },
      awsRoutingTable: { label: i18n.t('bc.AWS.routingTable'), name: 'routing-table-aws' },
      awsInternetGateWay: { label: i18n.t('bc.AWS.internetGateway'), name: 'internet-gateway-aws' },
      awsNatGateWay: { label: i18n.t('bc.AWS.natGateway'), name: 'nat-gateway-aws' },
      awsSecurity: { label: i18n.t('bc.AWS.security'), name: 'security-aws' },
      awsNetworkAcl: { label: i18n.t('bc.AWS.networkAcl'), name: 'network-acl-aws' },
      awsSecurityGroup: { label: i18n.t('bc.AWS.securityGroup'), name: 'security-group-aws' },
      // AWS-Network && Security */
      networkRouting: { label: i18n.t('bc.ADMIN.CONF.sto'), name: 'network-routing' },
      networkEquip: { label: i18n.t('bc.ADMIN.CONF.netEquip'), name: 'network-equip' },
      switchEquip: { label: i18n.t('bc.ADMIN.CONF.switch'), name: 'switch-equip' },
      firewallEquip: { label: i18n.t('bc.ADMIN.CONF.firewallEquip'), name: 'firewall-equip' },
      firewallVDOM: { label: i18n.t('bc.ADMIN.CONF.vdom'), name: 'firewall-vdom' },
      alarmServer: { label: i18n.t('bc.ADMIN.CONF.alarm'), name: 'alarm-server' },
      loggingServer: { label: i18n.t('bc.ADMIN.CONF.logging'), name: 'logging-server' },
      // configOrganization: { label: i18n.t('bc.ADMIN.CONF.HR.title'), name: 'config-organization' },
      jdbc: { label: i18n.t('bc.ADMIN.CONF.jdbc'), name: 'jdbc' },
      itsm: { label: i18n.t('bc.ADMIN.CONF.itsm'), name: 'itsm' },
      itAutomation: { label: i18n.t('bc.ADMIN.CONF.itAutomation'), name: 'it-automation' },
      configApproval: { label: i18n.t('bc.ADMIN.CONF.approval'), name: 'config-approval' },
      externalConfigApproval: { label: i18n.t('common.BTN.externalApprovalSetting'), name: 'external-config-approval' },
      configGeneral: { label: i18n.t('bc.ADMIN.CONF.general'), name: 'config-general' },

      manageProfile: { label: i18n.t('bc.PROFILE.title'), name: 'manage-profile-detail' },
      manageProfileCreate: { label: i18n.t('bc.PROFILE.reg'), name: 'manage-profile-create' },

      cmpLog: { label: i18n.t('bc.ADMIN.log'), name: 'cmp-log' },
      cmpAudit: { label: i18n.t('bc.ADMIN.audit'), name: 'cmp-audit' },

      // AWS Breadcrumbs
      configManageAWS: { label: i18n.t('bc.MANAGE.title'), name: 'config-manage-aws' },
      setResourceAWS: { label: i18n.t('bc.MANAGE.resource'), name: 'resource-ec2-aws' },

      setProjectManagement: { label: i18n.t('main.LAYOUT.mngProj'), name: 'set-project-public-management' }, // 프로젝트 관리
      setResourceEc2: { label: 'EC2', name: 'resource-ec2-aws' },
      setResourceEbs: { label: 'EBS', name: 'resource-ebs-aws' },
      setResourceEfs: { label: 'EFS', name: 'resource-efs-aws' },
      setResourceElb: { label: 'Load Balancer', name: 'resource-elb-aws' },
      setResourceNlb: { label: 'NLB(L4)', name: 'set-resource-nlb-list' },
      setResourceAlb: { label: 'ALB(L7)', name: 'set-resource-alb-list' },
      setResourceTargetGroup: { label: i18n.t('bc.AWS.targetGroup'), name: 'set-resource-target-group-list' },
      setResourceAlbRules: { label: i18n.t('bc.AWS.targetGroup'), name: 'set-resource-alb-rules-list' },

      // AWS 환경설정
      config: { label: i18n.t('bc.AWS.set'), name: 'set-aws' },
      setAWS: { label: i18n.t('bc.AWS.setAws'), name: 'set-aws' },
      syncAccountVPC: { label: i18n.t('bc.AWS.syncAccVpc'), name: 'config-sync-account-vpc' },
      configRegion: { label: i18n.t('bc.AWS.configRegion'), name: 'config-region' },
      monitoringAWS: { label: i18n.t('bc.AWS.monitoring'), name: 'config-monitoring-aws' },

      // AWS 대시보드
      dashboardAWS: { label: i18n.t('bc.dashboard'), name: 'dashboard-aws' },

      // AWS 서비스 카탈로그
      serviceCatalogueAWS: { label: i18n.t('bc.SC.title'), name: 'service-catalogue-aws' },
      aMIImage: { label: i18n.t('bc.SC.ami'), name: 'ami-image' },
      instanceType: { label: i18n.t('bc.SC.instanceType'), name: 'instance-type-aws' },
      eBSType: { label: i18n.t('bc.SC.ebs'), name: 'ebs-type' },

      // 연동설정
      linkSetting: { label: i18n.t('bc.ADMIN.linkSetting'), name: 'config-nutanix' },
      linkSettingAws: { label: i18n.t('bc.ADMIN.linkSetting'), name: 'config-sync-account-vpc' },
      // 사이트 관리
      siteManaging: { label: i18n.t('bc.ADMIN.siteManaging'), name: 'site-managing' },

      /* ---------------------------- SECTION Vmware 설정 --------------------------- */
      dashboardVmw: { label: i18n.t('bc.dashboard'), name: 'dashboard-vmw' },
      // 서비스 카탈로그 - Vmware
      serviceCatalogueVmw: { label: i18n.t('bc.SC.title'), name: packageType === 'ENT' ? 'service-catalogue-vmw' : 'install-program-lists-vmw' },
      marketplaceListsVmw: { label: i18n.t('bc.SC.mp'), name: 'marketplace-template-vmw' },
      vMTemplateVmw: { label: i18n.t('service.OVA.template'), name: 'vm-template-vmw' },
      installProgramVmw: { label: i18n.t('bc.SC.installProgram'), name: 'install-program-vmw' },
      installProgramListsVmw: { label: i18n.t('bc.SC.install'), name: 'install-program-lists-vmw' },
      instanceTypeListsVmw: { label: i18n.t('bc.SC.instance'), name: 'instance-type-lists-vmw' },
      instanceTypeListsAddVmw: { label: i18n.t('service.addServerSpec'), name: 'instance-type-lists-add-vmw' },
      // 구성관리 - Vmware
      configManageVmw: { label: i18n.t('bc.MANAGE.title'), name: 'config-manage-vmw' },
      rackListsVmw: { label: i18n.t('bc.MANAGE.lac'), name: 'rack-lists-vmw' },
      setDatacenterVmw: { label: i18n.t('bc.MANAGE.datacenter'), name: 'set-datacenter-vmw' },
      setClusterVmw: { label: i18n.t('bc.MANAGE.pool'), name: 'set-cluster-vmw' },
      setHostVmw: { label: i18n.t('bc.MANAGE.physical'), name: 'set-host-vmw' },
      setResourceVmw: { label: i18n.t('bc.MANAGE.resource'), name: 'set-resource-vmw' },
      setResourceServerVmw: { label: 'Compute', name: 'set-resource-server-vmw' },
      setResourceSwitchVmw: { label: i18n.t('main.LAYOUT.networkSwitch'), name: 'set-resource-switch-vmw' },
      l4Vmw: { label: i18n.t('common.GRID.NETWORK.l4'), name: 'set-resource-switch-l4-list-vmw' },
      l7Vmw: { label: i18n.t('common.GRID.NETWORK.l7'), name: 'set-resource-switch-l7-list-vmw' },
      serviceVmw: { label: i18n.t('bc.MANAGE.service'), name: 'set-resource-switch-service-list-vmw' },
      certificationVmw: { label: i18n.t('bc.MANAGE.certification'), name: 'set-resource-switch-certification-list-vmw' },
      setResourceStorageVmw: { label: 'Storage', name: 'set-resource-storage-vmw' },
      setResourceDatabaseVmw: { label: 'Database', name: 'set-resource-database-vmw' },
      setResourceAutoScaleGroupVmw: { label: 'Auto Scale Group', name: 'set-resource-autoscale-group-vmw' },
      setProjectVmw: { label: i18n.t('bc.MANAGE.project'), name: 'set-project-vmw' },
      manageProjectVmw: { label: i18n.t('bc.MANAGE.manageProject'), name: 'set-project-manage-project-vmw' },
      resourceOperationVmw: { label: i18n.t('bc.MANAGE.resourceOperation'), name: 'set-project-resource-operation-vmw' },
      resourceOperationBasketVmw: { label: i18n.t('bc.MANAGE.resourceOperationBasket'), name: 'resource-operation-basket-vmw' },
      vmwareVsanIscsi: { label: 'vSAN iSCSI', name: 'vmware-storage-vsan-iscsi-list' },
      setIpVmw: { label: i18n.t('common.ipManagement'), name: 'set-ip-vmw' },
      manageUnregisteredResourcesVmw: { label: i18n.t('main.LAYOUT.manageUnregisterResource'), name: 'vmware-unregister-resource' },
      unregisteredResourcesBasketVmw: { label: i18n.t('main.LAYOUT.registerBasket'), name: 'vmware-unregister-resource-basket' },
      // 연동설정-Vmare
      linkSettingVmw: { label: i18n.t('bc.ADMIN.linkSetting'), name: 'link-setting-vmw' },
      configMonitoringVmw: { label: i18n.t('bc.ADMIN.CONF.MONIT.title'), name: 'config-monitoring-vmw' },
      setMonitoringVmw: { label: i18n.t('bc.ADMIN.CONF.MONIT.monit'), name: 'set-monitoring-vmw' },
      setMonitoringServerVmw: { label: i18n.t('bc.ADMIN.CONF.MONIT.monitServer'), name: 'set-monitoring-server-vmw' },
      configVmware: { label: i18n.t('bc.VMware.configVmware'), name: 'config-vmw' },
      configVmwareCenter: { label: i18n.t('bc.VMware.configVmwareCenter'), name: 'config-vcenter' },
      configVmwareEsxi: { label: i18n.t('bc.VMware.configVmwareEsxi'), name: 'config-esxi' },
      // 미터링-Vmware
      meteringVmw: { label: i18n.t('bc.METER.title'), name: 'metering-vmw' },
      meteringStatusVmw: { label: i18n.t('bc.METER.status'), name: 'metering-status-vmw' },
      meteringLicenseVmw: { label: i18n.t('bc.METER.license'), name: 'metering-license-vmw' },
      // 빌링-Vmware
      billingVmw: { label: i18n.t('bc.BILL.title'), name: 'vmw-billing' },
      billingDashboardVmw: { label: i18n.t('bc.BILL.dashboard'), name: 'vmw-billing-dh' },
      billingStatusVmw: { label: i18n.t('bc.BILL.status'), name: 'vmw-billing-status' },
      billingAllocationVmw: { label: i18n.t('bc.BILL.arrange'), name: 'vmw-billing-allocation' },
      billingModelVmw: { label: i18n.t('bc.BILL.MODEL.title'), name: 'vmw-billing-model' },
      billingModelStandardVmw: { label: i18n.t('bc.BILL.MODEL.bill'), name: 'vmw-billing-model-standard' },
      billingModelDistVmw: { label: i18n.t('bc.BILL.MODEL.dist'), name: 'vmw-billing-model-dist' },
      billingModelDistCreateVmw: { label: i18n.t('common.BTN.enroll'), name: 'vmw-billing-model-dist-create' },
      billingModelDistUpdateVmw: { label: i18n.t('common.BTN.modify'), name: 'vmw-billing-model-dist-update' },
      calibrationServerVmw: { label: i18n.t('bc.BILL.MODEL.server'), name: 'vmw-billing-model-calibration-server' },
      calibrationCompanyVmw: { label: i18n.t('main.LAYOUT.affModel'), name: 'vmw-billing-model-calibration-company' },
      cloudInitScript: { label: 'Cloud Init Script 관리', name: 'set-config-cloud-init' },

      transitGateway: { label: 'Transit Gateway', name: 'resource-tgw-main' },
      cmpAlarm: { label: '통합 알람', name: 'cmp-alarm' },
      cmpAlarmTemplate: { label: '템플릿 관리', name: 'cmp-alarm-template' },
      cmpAlarmTrigger: { label: '트리거 관리', name: 'cmp-alarm-trigger' },
      cmpAlarmHistory: { label: '발송 이력 관리', name: 'cmp-alarm-history' },
      operationManagement: { label: '운영그룹 관리', name: 'operation-management' },
      webPush: { label: 'Web Push', name: 'web-push' },
      customSpec: { label: 'VM 사용자 지정 규격 관리', name: 'config-custom-specification' },
      integratedBilling: { label: '빌링', name: 'nx-billing' },
      integratedBillingDashboard: { label: '대시보드', name: 'integrated-billing-dashboard' }

    }[sub]
  }

  // meta > breadcrumbs를 확인합니다.
  const setBreadcrumbs = (meta) => {
    const crumbs = meta.breadcrumbs

    const breadcrumbsLists = crumbs.map(crumb => {
      const crumbInfo = identifyMenu(crumb)

      if (crumbInfo) {
        return {
          label: crumbInfo.label,
          name: crumbInfo.name,
          path: crumbInfo.name
        }
      } else {
        // breadcrumbs가 애매하게 설정되어있을 경우에 breadcrumb을 확인하기 위해 화면에 임시로 렌더링 합니다
        return {
          label: crumb ? crumb + ' 없습니다' : '',
          name: crumb,
          path: crumb
        }
      }
    })

    breadcrumbsLists[breadcrumbsLists.length - 1].path = false

    return breadcrumbsLists
  }

  // login이 아닌 경우에만 실행합니다.
  if (to.meta.breadcrumbs) {
    const insidePage = to.meta.breadcrumbs.every(bread => bread.includes('Login'))
    if (!insidePage) {
      const breadcrumbsInfo = setBreadcrumbs(to.meta)

      Store.dispatch('common/setBreadcrumbs', breadcrumbsInfo)
    }
  }

  // next(false) // 현재 네비게이션 중단
  // next('/') // 현재 네비게이션 중단
  next() // 파이프 라인의 다음 훅으로 이동
})

// const originalPush = Router.prototype.push
// Router.prototype.push = function push(location) {
//   return originalPush.call(this, location).catch(err => err)
// }

/**
 * router error => NavigationDuplicated error 예외 처리
 */
const originalPush = Router.prototype.push
Router.prototype.push = function push (location) {
  return new Promise((resolve, reject) => {
    originalPush.call(this, location, () => {
      resolve(this.currentRoute)
    }, (error) => {
      if (error.name === 'NavigationDuplicated') resolve(this.currentRoute)
      else reject(error)
    })
  })
}
export default viewRouter
