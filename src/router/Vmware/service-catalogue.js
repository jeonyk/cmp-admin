/** 뉴타닉스, 서비스 카탈로그 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
export default {
  path: 'catalogue',
  name: 'service-catalogue-vmw',
  meta: {
    breadcrumbs: ['Service Catalogue']
  },
  redirect: { name: 'marketplace-template-vmw' },
  component: () =>
    import(
      /* webpackChunkName: 'service-catalogue' */ '../../views/ServiceCatalogue/Vmware/ServiceCatalogue.vue'
    ),
  children: [
    {
      path: 'mp-template', // 마켓플레이스 탬플릿
      name: 'marketplace-template-vmw',
      redirect: { name: 'marketplace-lists-vmw' },
      meta: {
        breadcrumbs: ['Service Catalogue Vmw', 'Marketplace Template']
      },
      component: () =>
        import(
          /* webpackChunkName: 'marketplace-template' */ '../../views/ServiceCatalogue/Vmware/MarketplaceTemplate/MarketplaceTemplate.vue'
        ),
      children: [
        {
          path: 'lists', // 마켓플레이스 리스트
          name: 'marketplace-lists-vmw',
          meta: {
            breadcrumbs: ['Service Catalogue Vmw', 'Marketplace Lists Vmw'],
            accessible: ['ENT']
          },
          component: () =>
            import(
              /* webpackChunkName: 'marketplace-template' */ '../../views/ServiceCatalogue/Vmware/MarketplaceTemplate/MarketplaceList/MarketPlaceContents.vue'
            )
        },
        {
          path: 'detail/:bpIdx', // 마켓플레이스 제품상세
          name: 'marketplace-detail-vmw',
          meta: {
            breadcrumbs: ['Service Catalogue Vmw', 'Marketplace Lists Vmw'],
            accessible: ['ENT']
          },
          component: () =>
            import(
              /* webpackChunkName: 'marketplace-template' */ '../../views/ServiceCatalogue/Vmware/MarketplaceTemplate/MarketPlaceDetail/MarketPlaceDetail.vue'
            )
        }
      ]
    },
    {
      path: 'vm-template', // OVA
      name: 'vm-template-vmw',
      meta: {
        breadcrumbs: ['Service Catalogue Vmw', 'VM Template Vmw']
      },
      component: () =>
        import(
          /* webpackChunkName: 'vm-template' */ '../../views/ServiceCatalogue/Vmware/VmwareTemplate/VmwareTemplate.vue'
        ),
      redirect: { name: 'vm-template-list-vmw' },
      children: [
        {
          path: 'list',
          name: 'vm-template-list-vmw',
          meta: {
            breadcrumbs: ['Service Catalogue Vmw', 'VM Template Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'vm-template' */ '../../views/ServiceCatalogue/Vmware/VmwareTemplate/VmwareTemplateList.vue'
            )
        },
        {
          path: 'detail/:key/:id',
          name: 'vm-template-detail-vmw',
          props: route => ({
            ...route.params
          }),
          meta: {
            breadcrumbs: ['Service Catalogue Vmw', 'VM Template Vmw']
          },
          component: () =>
            import(
              /* webpackChunkName: 'vm-template' */ '../../views/ServiceCatalogue/Vmware/VmwareTemplate/VmwareTemplateDetail.vue'
            )
        }
      ]
    },
    {
      path: 'install-program', // 설치프로그램
      name: 'install-program-vmw',
      meta: {
        breadcrumbs: ['Service Catalogue', 'Install Program']
      },
      redirect: { name: 'install-program-management-vmw' },
      component: () =>
        import(
          /* webpackChunkName: 'install-program' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgram.vue'
        ),
      children: [
        {
          path: 'management', // 설치프로그램 목록
          name: 'install-program-management-vmw',
          meta: {
            breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Lists']
          },
          redirect: { name: 'install-program-lists-vmw' },
          component: () =>
            import(
              /* webpackChunkName: 'install-program-lists' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramLists/InstallProgramListsManagement'
            ),
          children: [
            {
              path: 'lists', // 설치프로그램 목록
              name: 'install-program-lists-vmw',
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
              name: 'install-program-detail-view-vmw',
              redirect: { name: 'install-program-detail-vmw' },
              meta: {
                breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Lists']
              },
              component: () =>
                import(
                  /* webpackChunkName: 'install-program-detail' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramDetail/InstallProgramDetailView'
                ),
              children: [
                {
                  path: '', // 설치프로그램 상세
                  name: 'install-program-detail-vmw',
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
                  name: 'install-program-detail-installed-vmw',
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
                  name: 'install-program-script-vmw',
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
          name: 'install-program-management-vms-vmw',
          meta: {
            breadcrumbs: ['Service Catalogue', 'Install Program', 'Install Program Vms']
          },
          redirect: { name: 'install-program-lists-vms-vmw' },
          component: () =>
            import(
              /* webpackChunkName: 'install-program-management-vms' */ '../../views/ServiceCatalogue/Nutanix/InstallProgram/InstallProgramListsVms/InstallProgramListsVmsManagement'
            ),
          children: [
            {
              path: 'lists-vms', // VM별 설치프로그램 관리
              name: 'install-program-lists-vms-vmw',
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
              name: 'install-program-detail-vms-vmw',
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
      name: 'instance-type-vmw',
      meta: {
        breadcrumbs: ['Service Catalogue Vmw', 'InstanceType']
      },
      redirect: { name: 'instance-type-lists-vmw' },
      component: () =>
        import(
          /* webpackChunkName: 'instance-type' */ '../../views/ServiceCatalogue/Nutanix/InstanceType/InstanceType.vue'
        ),
      children: [
        {
          path: 'lists',
          name: 'instance-type-lists-vmw',
          meta: {
            breadcrumbs: ['Service Catalogue Vmw', 'InstanceType Lists']
          },
          component: () =>
            import(
              /* webpackChunkName: 'instance-type-lists' */ '../../views/ServiceCatalogue/Nutanix/InstanceType/InstanceTypeLists/InstanceTypeLists.vue'
            )
        },
        {
          path: 'lists-add', // 서버 사양 추가
          name: 'instance-type-lists-add-vmw',
          meta: {
            breadcrumbs: [
              'Service Catalogue Vmw',
              'InstanceType Lists Vmw',
              'InstanceType Lists Add Vmw'
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
