/** 뉴타닉스, 서비스 카탈로그 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
export default {
  path: 'catalogue',
  name: 'service-catalogue',
  meta: {
    breadcrumbs: ['Service Catalogue']
  },
  redirect: { name: 'marketplace-template' },
  component: () =>
    import(
      /* webpackChunkName: 'service-catalogue' */ '../../views/ServiceCatalogue/Nutanix/ServiceCatalogue.vue'
    ),
  children: [
    {
      path: 'mp-template', // 마켓플레이스 탬플릿
      name: 'marketplace-template',
      redirect: { name: 'marketplace-lists' },
      meta: {
        breadcrumbs: ['Service Catalogue', 'Marketplace Template']
      },
      component: () =>
        import(
          /* webpackChunkName: 'marketplace-template' */ '../../views/ServiceCatalogue/Nutanix/MarketplaceTemplate/MarketplaceTemplate.vue'
        ),
      children: [
        {
          path: 'lists', // 마켓플레이스 리스트
          name: 'marketplace-lists',
          meta: {
            breadcrumbs: ['Service Catalogue', 'Marketplace Lists'],
            accessible: ['ENT']
          },
          component: () =>
            import(
              /* webpackChunkName: 'marketplace-template' */ '../../views/ServiceCatalogue/Nutanix/MarketplaceTemplate/MarketplaceList/MarketPlaceContents.vue'
            )
        },
        {
          path: 'detail/:bpIdx', // 마켓플레이스 제품상세
          name: 'marketplace-detail',
          meta: {
            breadcrumbs: ['Service Catalogue', 'Marketplace Lists'],
            accessible: ['ENT']
          },
          component: () =>
            import(
              /* webpackChunkName: 'marketplace-template' */ '../../views/ServiceCatalogue/Nutanix/MarketplaceTemplate/MarketPlaceDetail/MarketPlaceDetail.vue'
            )
        }
      ]
    },
    {
      path: 'vm-template', // OVA
      name: 'vm-template',
      meta: {
        breadcrumbs: ['Service Catalogue', 'VM Template']
      },
      component: () =>
        import(
          /* webpackChunkName: 'vm-template' */ '../../views/ServiceCatalogue/Nutanix/VmTemplate/VmTemplate.vue'
        ),
      redirect: { name: 'vm-template-list' },
      children: [
        {
          path: 'vm-template-list',
          name: 'vm-template-list',
          meta: {
            breadcrumbs: ['Service Catalogue', 'VM Template']
          },
          component: () =>
            import(
              /* webpackChunkName: 'vm-template' */ '../../views/ServiceCatalogue/Nutanix/VmTemplate/VmTemplateList.vue'
            )
        },
        {
          path: 'detail/:uuid',
          name: 'vm-template-detail',
          props: route => ({
            ...route.params
          }),
          meta: {
            breadcrumbs: ['Service Catalogue', 'VM Template']
          },
          component: () =>
            import(
              /* webpackChunkName: 'vm-template' */ '../../views/ServiceCatalogue/Nutanix/VmTemplate/VmTemplateDetail.vue'
            )
        }
      ]
    },
    {
      path: 'install-program', // 설치프로그램
      name: 'install-program',
      meta: {
        breadcrumbs: ['Service Catalogue', 'Install Program']
      },
      redirect: { name: 'install-program-management' },
      component: () =>
        import(
          /* webpackChunkName: 'install-program' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgram.vue'
        ),
      children: [
        {
          path: 'management', // 설치프로그램 목록
          name: 'install-program-management',
          meta: {
            breadcrumbs: ['Service Catalogue', 'Install Program Lists']
          },
          redirect: { name: 'install-program-lists' },
          component: () =>
            import(
              /* webpackChunkName: 'install-program-lists' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramLists/InstallProgramListsManagement'
            ),
          children: [
            {
              path: 'lists', // 설치프로그램 목록
              name: 'install-program-lists',
              meta: {
                breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Lists']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'install-program-lists' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramLists/InstallProgramLists.vue'
                )
            },
            {
              path: 'detail/:name/:idx', // 설치프로그램 상세 포괄
              name: 'install-program-detail-view',
              redirect: { name: 'install-program-detail' },
              meta: {
                breadcrumbs: ['Service Catalogue']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'install-program-detail' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramDetail/InstallProgramDetailView'
                ),
              children: [
                {
                  path: '', // 설치프로그램 상세
                  name: 'install-program-detail',
                  meta: {
                    breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Lists']
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'install-program-detail' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramDetail/InstallProgramDetail'
                    )
                },
                // {
                //   path: ':versionId/vm-install', // 설치프로그램 상세 > VM 설치 => (220404) 기획이 잘못되어 페이지가 삭제되었습니다
                //   name: 'install-program-detail-install',
                //   meta: {
                //     breadcrumbs: ['Service Catalogue', 'Install Program Lists']
                //   },
                //   component: () =>
                //     import(
                //       /* webpackChunkName: 'install-program-detail-install' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramDetail/InstallVMList'
                //     )
                // },
                {
                  path: ':versionId/installed-vm', // 설치프로그램 상세 > 설치된 VM 리스트
                  name: 'install-program-detail-installed',
                  meta: {
                    breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Lists']
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'install-program-detail-installed' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramDetail/InstallVMList'
                    )
                },
                {
                  path: ':versionId/mamage-script', // 설치프로그램 상세 > 스크립트 관리
                  name: 'install-program-script',
                  meta: {
                    breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Lists']
                  },
                  component: () =>
                    import(
                      /* webpackChunkName: 'install-program-detail-installed' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramDetail/InstallProgramScript'
                    )
                }
              ]
            }
          ]
        },
        {
          path: 'management', // VM별 설치프로그램 관리
          name: 'install-program-management-vms',
          meta: {
            breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Vms']
          },
          redirect: { name: 'install-program-lists-vms' },
          component: () =>
            import(
              /* webpackChunkName: 'install-program-management-vms' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramListsVms/InstallProgramListsVmsManagement'
            ),
          children: [
            {
              path: 'lists-vms', // VM별 설치프로그램 관리
              name: 'install-program-lists-vms',
              meta: {
                breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Vms']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'install-program-lists-vms' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramListsVms/InstallProgramListsVms'
                )
            },
            {
              path: 'detail/softwares', // VM 별 설치프로그램 관리 상세
              name: 'install-program-detail-vms',
              meta: {
                breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Vms']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'install-program-detail-vms' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramListsVms/InstallVMListDetail'
                )
            }
          ]
        }
      ]
    },
    {
      path: 'instance-type', // 인스턴스 타입
      name: 'instance-type',
      meta: {
        breadcrumbs: ['Service Catalogue', 'InstanceType']
      },
      redirect: { name: 'instance-type-lists' },
      component: () =>
        import(
          /* webpackChunkName: 'instance-type' */ '../../views/ServiceCatalogue/Nutanix/InstanceType/InstanceType.vue'
        ),
      children: [
        {
          path: 'lists',
          name: 'instance-type-lists',
          meta: {
            breadcrumbs: ['Service Catalogue', 'InstanceType Lists']
          },
          component: () =>
            import(
              /* webpackChunkName: 'instance-type-lists' */ '../../views/ServiceCatalogue/Nutanix/InstanceType/InstanceTypeLists/InstanceTypeLists.vue'
            )
        },
        {
          path: 'lists-add', // 서버 사양 추가
          name: 'instance-type-lists-add',
          meta: {
            breadcrumbs: [
              'Service Catalogue',
              'InstanceType Lists',
              'InstanceType Lists Add'
            ]
          },
          component: () =>
            import(
              /* webpackChunkName: 'instance-type-lists-add' */ '../../views/ServiceCatalogue/Nutanix/InstanceType/InstanceTypeAdd/InstanceTypeAdd.vue'
            )
        }
      ]
    }
  ]
}
