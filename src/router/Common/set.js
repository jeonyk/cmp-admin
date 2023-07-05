/** 공통, 어드민 관리 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const setRoutes = {
  path: 'set',
  name: 'set',
  meta: {
    breadcrumbs: ['Set']
  },
  redirect: { name: 'set-account-user' },
  component: () => import(
    /* webpackChunkName: 'aws-dashboard' */ '@/views/SetConfiguration/AWS/SetConfigurationResource/SetConfigurationResource.vue'
  ),
  children: [
    {
      path: 'consignment',
      name: 'consignment-management',
      meta: {
        breadcrumbs: ['Set', 'ConsignmentManagement']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-account' */ '../../views/Admin/ConsignmentManagement/ConsignmentCreate'
        )
    },
    {
      path: 'account', // 계정관리
      name: 'set-account',
      meta: {
        breadcrumbs: ['Set', 'Account']
      },
      redirect: { name: 'set-account-user' },
      component: () =>
        import(
          /* webpackChunkName: 'set-account' */ '../../views/Admin/SetAccount/SetAccount'
        ),
      children: [
        {
          path: 'user', // 사용자 계정관리
          name: 'set-account-user',
          meta: {
            breadcrumbs: ['Set', 'Account', 'UserList']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-user' */ '../../views/Admin/SetAccount/SetAccountUser/SetAccountUserList'
            )
        },
        {
          path: 'admin', // 운영관리자 계정관리
          name: 'set-account-admin',
          meta: {
            breadcrumbs: ['Set', 'Account', 'AdminList']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-admin' */ '../../views/Admin/SetAccount/SetAccountAdmin/SetAccountAdminList'
            )
        },
        {
          path: 'ad', // ad 유저 계정관리
          name: 'set-account-ad',
          meta: {
            breadcrumbs: ['Set', 'Account', 'adList']
          },
          component: () =>
            import(
            /* webpackChunkName: 'set-account-admin' */ '../../views/Admin/SetAccount/SetAccountAd/SetAccountAdList'
            )
        },
        {
          path: ':detailField/:id/detail', // 계정관리 상세
          name: 'set-account-detail',
          props: true,
          meta: {
            breadcrumbs: ['Set', 'Account']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-detail' */ '../../views/Admin/SetAccount/SetAccountDetail/SetAccountDetail'
            )
        },
        {
          path: ':detailField/new', // 계정관리 생성 (관리자만)
          name: 'set-account-create',
          props: true,
          meta: {
            breadcrumbs: ['Set', 'Account']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-account-create' */ '../../views/Admin/SetAccount/SetAccountCreate/SetAccountCreate'
            )
        }
      ]
    },
    {
      path: 'org', // 조직 관리
      name: 'set-organization',
      meta: {
        breadcrumbs: ['Set', 'Organization']
      },
      redirect: { name: 'set-organization-account' },
      component: () =>
        import(
          /* webpackChunkName: 'set-organization' */ '../../views/Admin/SetOrganization/SetOrganization'
        ),
      children: [
        // 조직-프로젝트 화면은 삭제 처리 결졍 (22.03.04)
        // {
        //   path: 'project',
        //   name: 'set-organization-project',
        //   meta: {
        //     breadcrumbs: ['Set', 'Organization', 'Organization Project']
        //   },
        //   component: () =>
        //     import(
        //       /* webpackChunkName: 'set-organization-project' */ '../../views/Admin/SetOrganization/SetOrganizationProject/SetOrganizationProject'
        //     )
        // },
        {
          path: 'account',
          name: 'set-organization-account',
          meta: {
            breadcrumbs: ['Set', 'Organization', 'Organization Account']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-organization-account' */ '../../views/Admin/SetOrganization/SetOrganizationAccount/SetOrganizationAccount'
            )
        }
      ]
    },

    {
      path: 'role', // 역힐 관리
      name: 'set-role',
      meta: {
        breadcrumbs: ['Set', 'Role']
      },
      component: () =>
        import(
          /* webpackChunkName: 'set-role' */ '../../views/Admin/SetRole/SetRole'
        ),
      redirect: { name: 'set-role-list' },
      children: [
        {
          path: '',
          name: 'set-role-list',
          meta: {
            breadcrumbs: ['Set', 'Role']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-role-list' */ '../../views/Admin/SetRole/SetRoleList/SetRoleList'
            )
        },
        {
          path: 'detail/:idx',
          name: 'set-role-detail',
          meta: {
            breadcrumbs: ['Set', 'Role']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-role-detail' */ '../../views/Admin/SetRole/SetRoleDetail/SetRoleDetail'
            )
        },
        {
          path: 'create',
          name: 'set-role-create',
          meta: {
            breadcrumbs: ['Set', 'Role']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-role-create' */ '../../views/Admin/SetRole/SetRoleCreate/SetRoleCreate'
            )
        }
      ]
    },

    // {
    //   path: 'set-noti', // 통보 서버 설정(메일)
    //   name: 'set-notification',
    //   meta: {
    //     breadcrumbs: ['Set', 'Notification']
    //   },
    //   component: () => import(
    //     /* webpackChunkName: 'set-auth' */ '../../views/Admin/SetNotification/SetNotification'
    //   )
    // },

    {
      path: 'site-managing', // 사이트 관리
      name: 'site-managing',
      meta: {
        breadcrumbs: ['Set', 'Site Managing']
      },
      redirect: { name: 'notice' },
      component: () => import(
        /* webpackChunkName: 'site-managing' */ '../../views/Admin/SiteManaging/SiteManaging'
      ),
      children: [
        {
          path: 'notice', // 공지 사항
          name: 'notice',
          meta: {
            breadcrumbs: ['Set', 'Site Managing', 'Notice']
          },
          redirect: { name: 'notice-list' },
          component: () =>
            import(/* webpackChunkName: 'notice' */ '../../views/Admin/SiteManaging/Notice/Notice'),
          children: [
            {
              path: 'list',
              name: 'notice-list',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Notice']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'notice-list' */ '../../views/Admin/SiteManaging/Notice/NoticeList'
                )
            },
            {
              path: 'register', // 공지사항 - 등록
              name: 'notice-register',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Notice', 'Notice Register']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'notice-register' */ '../../views/Admin/SiteManaging/Notice/NoticeRegister'
                )
            },
            {
              path: 'detail/:noticeIdx', // 공지사항 - 상세조회
              name: 'notice-detail',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Notice', 'Notice Detail']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'notice-detail' */ '../../views/Admin/SiteManaging/Notice/NoticeDetail'
                )
            },
            {
              path: 'modify', // 공지사항 - 수정
              name: 'notice-modify',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Notice', 'Notice Modify']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'notice-modify' */ '../../views/Admin/SiteManaging/Notice/NoticeDetail'
                )
            }
          ]
        },
        {
          path: 'indiv-inquiry', // 1:1 문의
          name: 'indiv-inquiry',
          meta: {
            breadcrumbs: ['Set', 'Site Managing', 'Inquiry']
          },
          redirect: { name: 'indiv-inquiry-list' },
          component: () =>
            import(
              /* webpackChunkName: 'indiv-inquiry' */ '../../views/Admin/SiteManaging/IndivInquiry/IndivInquiry'
            ),
          children: [
            {
              path: 'list',
              name: 'indiv-inquiry-list',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Inquiry List']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'indiv-inquiry-list' */ '../../views/Admin/SiteManaging/IndivInquiry/IndivInquiryList'
                )
            },
            {
              path: 'detail/:inqIdx',
              name: 'indiv-inquiry-detail',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Inquiry List', 'Inquiry Detail']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'indiv-inquiry-detail' */ '../../views/Admin/SiteManaging/IndivInquiry/IndivInquiryDetail'
                )
            }
          ]
        },
        {
          path: 'set-faq', // FAQ
          name: 'set-faq',
          meta: {
            breadcrumbs: ['Set', 'Site Managing', 'FAQ']
          },
          redirect: { name: 'faq-list' },
          component: () =>
            import(/* webpackChunkName: 'faq' */ '../../views/Admin/SiteManaging/SetFaq/SetFaq'),
          children: [
            {
              path: 'list',
              name: 'faq-list',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'FAQ List']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'faq-list' */ '../../views/Admin/SiteManaging/SetFaq/SetFaqList/SetFaqList'
                )
            },
            {
              path: 'detail/:faqIdx',
              name: 'faq-detail',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'FAQ List', 'FAQ Detail']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'faq-detail' */ '../../views/Admin/SiteManaging/SetFaq/SetFaqDetail/SetFaqDetail'
                )
            },
            {
              path: 'register',
              name: 'faq-register',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'FAQ List', 'FAQ Register']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'faq-register' */ '../../views/Admin/SiteManaging/SetFaq/SetFaqDetail/SetFaqRegister'
                )
            },
            {
              path: 'modify',
              name: 'faq-modify',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'FAQ List', 'FAQ Modify']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'faq-modify' */ '../../views/Admin/SiteManaging/SetFaq/SetFaqDetail/SetFaqModify'
                )
            }
          ]
        },
        {
          path: 'ref', // 자료실 관리
          name: 'set-ref',
          meta: {
            breadcrumbs: ['Set', 'Site Managing', 'Ref']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-ref' */ '../../views/Admin/SiteManaging/SetRef/SetRefWrapper.vue'
            ),
          redirect: { name: 'set-ref-list' },
          children: [
            {
              path: 'list', // 자료실 관리 (리스트)
              name: 'set-ref-list',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Ref']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-ref' */ '../../views/Admin/SiteManaging/SetRef/SetRefList.vue'
                )
            },
            {
              path: ':id', // 자료실 관리 (상세)
              name: 'set-ref-detail',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'Ref Detail']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-ref' */ '../../views/Admin/SiteManaging/SetRef/SetRefDetail.vue'
                )
            }
          ]
        },
        {
          path: 'news', // News 관리
          name: 'set-news',
          meta: {
            breadcrumbs: ['Set', 'Site Managing', 'News']
          },
          component: () =>
            import(
              /* webpackChunkName: 'set-news' */ '../../views/Admin/SiteManaging/SetNews/SetNewsWrapper.vue'
            ),
          redirect: { name: 'set-news-list' },
          children: [
            {
              path: 'list', // News 관리 (리스트)
              name: 'set-news-list',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'News']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-news' */ '../../views/Admin/SiteManaging/SetNews/SetNewsList.vue'
                )
            },
            {
              path: ':id', // News 관리 (상세)
              name: 'set-news-detail',
              meta: {
                breadcrumbs: ['Set', 'Site Managing', 'News Detail']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'set-news' */ '../../views/Admin/SiteManaging/SetNews/SetNewsDetail.vue'
                )
            }
          ]
        }
      ]
    },

    {
      path: 'configure', // 환경설정
      name: 'set-configure',
      meta: {
        breadcrumbs: ['Set', 'Set Configure']
      },
      redirect: { name: 'config-network-cate' },
      component: () =>
        import(
          /* webpackChunkName: 'set-configure' */ '../../views/Admin/SetConfigure/SetConfigure'
        ),
      children: [
        {
          path: 'operation',
          name: 'operation-management',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Operation Management']
          },
          component: () =>
            import(
              /* webpackChunkName: 'operation-management' */ '@/views/Billing/Integrated/Operation/OperationManagement.vue'
            )
        },
        {
          path: 'config-network-cate',
          name: 'config-network-cate',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Config Network Cate']
          },
          component: () =>
            import(
            /* webpackChunkName: 'config-network-cate' */ '../../views/Admin/SetConfigure/ConfigNetworkCategory/ConfigNetworkCategory.vue'
            )
        },
        {
          path: 'alarm',
          name: 'cmp-alarm',
          meta: {
            breadcrumbs: ['Set', 'Cmp Alarm']
          },
          redirect: {
            name: 'cmp-alarm-template'
          },
          component: () => import(
            /* webpackChunkName: 'cmp-alarm' */ '../../views/Admin/Alarm/Alarm.vue'
          ),
          children: [
            {
              path: 'template',
              name: 'cmp-alarm-template',
              meta: {
                breadcrumbs: ['Set', 'Cmp Alarm', 'Cmp Alarm Template']
              },
              component: () => import(
                /* webpackChunkName: 'cmp-alarm-template' */ '../../views/Admin/Alarm/AlarmTemplate.vue'
              )
            },
            {
              path: 'template/detail',
              name: 'cmp-alarm-template-detail',
              meta: {
                breadcrumbs: ['Set', 'Cmp Alarm', 'Cmp Alarm Template']
              },
              component: () => import(
                /* webpackChunkName: 'cmp-alarm-template' */ '../../views/Admin/Alarm/AlarmTemplateDetail.vue'
              )
            },
            {
              path: 'trigger',
              name: 'cmp-alarm-trigger',
              meta: {
                breadcrumbs: ['Set', 'Cmp Alarm', 'Cmp Alarm Trigger']
              },
              component: () => import(
                /* webpackChunkName: 'cmp-alarm-trigger' */ '../../views/Admin/Alarm/AlarmTrigger.vue'
              )
            },
            {
              path: 'history',
              name: 'cmp-alarm-history',
              meta: {
                breadcrumbs: ['Set', 'Cmp Alarm', 'Cmp Alarm History']
              },
              component: () => import(
                /* webpackChunkName: 'cmp-alarm-history' */ '../../views/Admin/Alarm/AlarmHistory.vue'
              )
            }
          ]
        },
        {
          path: 'code', // 코드 관리
          name: 'config-code',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Code']
          },
          redirect: { name: 'config-code-type' },
          component: () =>
            import(
              /* webpackChunkName: 'config-code' */ '../../views/Admin/SetConfigure/ConfigCode/ConfigCode'
            ),
          children: [
            {
              path: 'type',
              name: 'config-code-type',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Code', 'Type Define']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'config-code-type' */ '../../views/Admin/SetConfigure/ConfigCode/ConfigCodeType/ConfigCodeType'
                )
            },
            {
              path: 'all',
              name: 'config-code-all',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Code', 'All Define']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'config-code-all' */ '../../views/Admin/SetConfigure/ConfigCode/ConfigCodeAll/ConfigCodeAll'
                )
            }
          ]
        },
        {
          path: 'general', // 일반 설정
          name: 'config-general',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Config General']
          },
          component: () =>
            import(
              /* webpackChunkName: 'config-general' */ '../../views/Admin/SetConfigure/ConfigGeneral/ConfigGeneral'
            )
        },
        {
          path: 'work-flow', // 워크플로우
          name: 'work-flow',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Work Flow']
          },
          component: () =>
            import(
              /* webpackChunkName: 'work-flow' */ '../../views/Admin/SetWorkFlow/SetWorkFlow'
            )
        },
        // ========================
        // ========= V3 ===========  (v3 = 임시)
        // ========================
        {
          path: 'integrated-work-management', // 통합 업무 관리
          name: 'integrated-work-management',
          redirect: { name: 'integrated-set-workflow' },
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Integrated Work Management']
          },
          component: () =>
            import(
            /* webpackChunkName: 'integrated-work-management' */ '../../views/Admin/IntegratedWorkManagement/IntegratedWorkManagement.vue'
            ),
          children: [
            {
              path: 'set-workflow', // 워크플로우 관리
              name: 'integrated-set-workflow',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Integrated Work Management']
              },
              component: () =>
                import(
                /* webpackChunkName: 'integrated-set-workflow' */ '../../views/Admin/IntegratedWorkManagement/IntegratedWorkManagementDetail.vue'
                )
            },
            {
              path: 'set-template', // 보고서 템플릿
              name: 'integrated-set-template',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Integrated Work Management']
              },
              component: () =>
                import(
                /* webpackChunkName: 'integrated-set-template' */ '../../views/Admin/IntegratedWorkManagement/SetWorkFlowTemplate/SetWorkFlowTemplate.vue'
                )
            }
          ]
        },
        {
          path: 'integrated-work-management/template', // 템플릿 등록
          name: 'integrated-work-management-template-detail',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Integrated Work Management', 'Integrated Work Management Template']
          },
          component: () =>
            import(
            /* webpackChunkName: 'integrated-work-management-template-detail' */ '../../components/DocumentDetail/DocumentTemplateDetail/DocumentTemplateDetail'
            )
        },
        // ===========================
        // ========= /. V3 ===========
        // ===========================
        {
          path: 'package', // CMP 패키지 (신세계)
          name: 'cmp-package-management',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Package']
          },
          redirect: { name: 'cmp-package-management-license' },
          component: () => {
            if (process.env.VUE_APP_SSG_USER === 'true') {
              return import(
                /* webpackChunkName: 'cmp-package-management' */ '../../views/Admin/Package/PackageMain.vue'
              )
            } else {
              return import(
                /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
              )
            }
          },
          children: [
            {
              path: 'license',
              name: 'cmp-package-management-license',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Package', 'License']
              },
              component: () => {
                if (process.env.VUE_APP_SSG_USER === 'true') {
                  return import(
                    /* webpackChunkName: 'cmp-package-management-license' */ '../../views/Admin/Package/License.vue'
                  )
                } else {
                  return import(
                    /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
                  )
                }
              }
            },
            {
              path: 'license/:id',
              name: 'cmp-package-management-license-detail',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Package', 'License']
              },
              component: () => {
                if (process.env.VUE_APP_SSG_USER === 'true') {
                  return import(
                    /* webpackChunkName: 'cmp-package-management-license' */ '../../views/Admin/Package/LicenseDetail.vue'
                  )
                } else {
                  return import(
                    /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
                  )
                }
              }
            },
            {
              path: 'version',
              name: 'cmp-package-management-version',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Package', 'Version']
              },
              component: () => {
                if (process.env.VUE_APP_SSG_USER === 'true') {
                  return import(
                    /* webpackChunkName: 'cmp-package-management-version' */ '../../views/Admin/Package/Version.vue'
                  )
                } else {
                  return import(
                    /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
                  )
                }
              }
            },
            {
              path: 'module',
              name: 'cmp-package-management-module',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Package', 'Module']
              },
              component: () => {
                if (process.env.VUE_APP_SSG_USER === 'true') {
                  return import(
                    /* webpackChunkName: 'cmp-package-management-module' */ '../../views/Admin/Package/ModuleVersion.vue'
                  )
                } else {
                  return import(
                    /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
                  )
                }
              }
            },
            {
              path: 'module/:id',
              name: 'cmp-package-management-module-detail',
              meta: {
                breadcrumbs: ['Set', 'Set Configure', 'Package', 'Module']
              },
              component: () => {
                if (process.env.VUE_APP_SSG_USER === 'true') {
                  return import(
                    /* webpackChunkName: 'cmp-package-management-module' */ '../../views/Admin/Package/ModuleVersionDetail.vue'
                  )
                } else {
                  return import(
                    /* webpackChunkName: "ErrorPage" */ '../../views/ErrorPage/ErrorPage'
                  )
                }
              }
            }
          ]
        },
        {
          path: 'package-external', // CMP 패키지 (대외)
          name: 'cmp-package-management-external',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Package']
          },
          component: () =>
            import(
              /* webpackChunkName: 'cmp-package-management-external' */ '../../views/Admin/Package/External/PackageMain.vue'
            )
        },
        {
          path: 'cmp-audit', // 접근 기록
          name: 'cmp-audit',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Cmp Audit']
          },
          component: () =>
            import(
              /* webpackChunkName: 'cmp-audit' */ '../../views/Admin/CMPAudit/CMPAudit.vue'
            )
        },
        {
          path: 'cmp-audit/:auditId', // 접근 기록 상세
          name: 'cmp-audit-detail',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Cmp Audit']
          },
          component: () => import(
            /* webpackChunkName: 'cmp-audit' */ '../../views/Admin/CMPAudit/CMPAuditDetail.vue'
          )
        },
        {
          path: 'cmp-log', // 로그 다운로드
          name: 'cmp-log',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Cmp Log']
          },
          component: () =>
            import(/* webpackChunkName */ '../../views/Admin/CMPLog/CMPLog.vue')
        },
        {
          path: 'alerts', // header - Alerts
          name: 'config-alerts',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Alerts']
          },
          component: () =>
            import(
              /* webpackChunkName: 'config-alert' */ '../../views/Admin/SetConfigure/ConfigAlerts/ConfigAlerts'
            )
        },
        {
          path: 'dynamic-meta', // 동적 메타 데이터 관리
          name: 'dynamic-meta',
          meta: {
            breadcrumbs: ['Set', 'Set Configure', 'Dynamic Meta Data']
          },
          component: () =>
            import(
              /* webpackChunkName: 'dynamic-meta' */ '../../views/Admin/SetDynamicMetaData/SetDynamicMetaData'
            )
        }
      ]
    },
    {
      path: 'license-initialize', // 라이선스 미등록 페이지
      name: 'license-initialize',
      meta: {
        breadcrumbs: ['Set', 'Package']
      },
      component: () => import(
        /* webpackChunkName: 'license-initialize' */ '../../components/Package/License/LicenseInitialize.vue'
      )
    },
    // 환경설정
    {
      path: 'manage-profile-detail/:field/:userProfIdx', // 프로파일 관리
      name: 'manage-profile-detail',
      meta: {
        breadcrumbs: ['Manage Profile']
      },
      component: () =>
        import(
          /* webpackChunkName: 'manage-profile-detail' */ '../../views/Admin/ManageProfile/ManageProfileDetail'
        )
    },
    {
      path: 'manage-profile-create/:field', // 프로파일 관리-생성
      name: 'manage-profile-create',
      meta: {
        breadcrumbs: ['Manage Profile']
      },
      component: () =>
        import(
          /* webpackChunkName: 'manage-profile-create' */ '../../views/Admin/ManageProfile/ManageProfileCreate'
        )
    }
  ]
}

export default setRoutes
