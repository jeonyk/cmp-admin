<!--
  * 파일명 : AdminSideNav.vue
  * 파일 기능 : side navigation 전용 컴포넌트입니다. tree 데이터를 스타일링합니다.
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 add: 비밀번호 찾기 페이지 추가
 -->

<template>
  <div class="admin-side-nav">
    <div
      :class="['nav-background', {'-expand': sidenavExpanded}]"
      @click="expandPanel(false)"
    />
    <h2
      :class="['cmp-logo', {'-expanded': sidenavExpanded}]"
      @click="e => {
        routeToMain()
        expandPanel(false)
      }"
    >
      <span class="cmp-logo-title">
        <b>Spharos</b>&nbsp;CMP
      </span>
    </h2>

    <div
      :class="['admin-side-menu', {'-expanded': sidenavExpanded}]"
    >
      <side-nav-tree
        v-if="nodes.length"
        class="side-menu-tree"
        ref="sideMenuTree"
        :data="nodes"
        :multi-foldable="false"
        @selected="setSelectedMenu"
        :parent-select-style="true"
      />
    </div>

    <a
      :class="['side-expand-button', '-only-mobile-hide', { '-opened': sidenavExpanded }]"
      @click="expandPanel(false)"
    >
      <i class="mdi side-expnad-icon" />
    </a>
  </div>
</template>
<script>
import SideNavTree from './SideNavTree'
import { mapState, mapMutations, mapGetters } from 'vuex'
import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  name: 'AdminSideNav',
  components: {
    'side-nav-tree': SideNavTree
  },
  created () {
    if (this.packageType === 'PL') {
      this.setManageAccountRoute()
      this.deleteSiteManaging()
    }
    this.menuLists = [...this.cloudMenuList[this.shortlyCloud]]
  },
  mounted () {
    this.$watch(comp => [comp.packageType, comp.user, comp.loadedIsSsg], async ([packageType, user, loadedIsSsg]) => {
      if (user && Object.keys(user).length && packageType && loadedIsSsg) {
        console.log('packageType:', packageType)
        await this.initSideNav() // side nav 세팅
      }
    }, {
      immediate: true,
      deep: true
    })
  },
  watch: {
    packageType () {
      this.$forceUpdate()
    },
    sidenavExpanded (newVal) {
      this.$nextTick(function () {
        this.openSelectedNodes(this.nodes)
      })
    },
    '$route' (from, to) {
      this.openSelectedNodes(this.nodes)
      if (from !== to) {
        this.expandPanel(false)
        if (to.name === 'main') {
          setTimeout(() => this.closeAllNodes(this.nodes), 10)
        }
      }
    },
    selectedMenu (newVal) {
      newVal.isOpen = true
      newVal.selected = true
    },
    changeMonitoringLogging (value) {
      if (value) {
        this.$store.dispatch('common/setChangeMonitoringLogging', null)
      }
    }
  },
  computed: {
    ...mapState({
      sidenavExpanded: state => state.common.sidenavExpanded,
      perm: state => state.auth.perm,
      user: state => state.auth.user,
      changeMonitoringLogging: state => state.common.changeMonitoringLogging,
      packageType: state => state.auth.packageType,
      shortlyCloud: state => state.cloud.shortlyCloud
    }),
    ...mapGetters({
      loadedIsSsg: 'loadedIsSsg',
      shortlyCloud: 'cloud/getShortlyCloud'
    })
  },
  methods: {
    /**
     * PLUS 버전일 경우 사이트 관리 메뉴 삭제
     */
    deleteSiteManaging () {
      const siteManagingIdx = this.commonAdminMenu.children?.findIndex(child => child.id === 'siteManaging')
      this.commonAdminMenu.children.splice(siteManagingIdx, 1)
    },
    /**
     * 플러스 버전일 경우 계정 관리 이동 경로 수정
     */
    setManageAccountRoute () {
      const accountManageMenu = this.commonAdminMenu.children.find(child => child.id === 'setAccount')

      if (accountManageMenu) {
        accountManageMenu.routeTo = 'set-account-admin'
      }
    },
    /**
     * 헤더 로고 클릭시 클라우드 타입에 맞는 대시보드로 이동
     */
    routeToMain () {
      if (this.shortlyCloud === 'nx') {
        this.$router.push({ name: 'dashboard' })
      } else {
        this.$router.push({ name: `dashboard-${this.shortlyCloud}` })
      }
    },
    /**
     * 패키지 관리 메뉴 중앙-대외 구분해서 삽입
     */
    pushPackageMenu () {
      // 어드민 관리 > 환경설정 찾기
      const adminSet = this.commonAdminMenu.children?.find(childMenu => childMenu.id === 'config')
      if (adminSet && adminSet.children) {
        const { VUE_APP_USER_URL } = process.env

        // 데모 사이트 제외, 신세계 환경에서는 패키지 관리 중앙 + 대외를 보여줍니다.
        if (this.isSsg) {
          // 중앙
          adminSet.children.splice(-2, 0, { id: 'package', depth: 'third', title: this.$t('bc.ADMIN.PKG.main') + ' (' + this.$t('bc.ADMIN.PKG.ssg') + ')', routeTo: 'cmp-package-management', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] })

          // 대외
          adminSet.children.splice(-2, 0, { id: 'package-external', depth: 'third', title: this.$t('bc.ADMIN.PKG.mainExternal'), routeTo: 'cmp-package-management-external', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] })
        } else {
          // 신세계 환경이 아니면 패키지 관리 대외만 보여줍니다.
          adminSet.children.splice(-2, 0, { id: 'package-external', depth: 'third', title: this.$t('bc.ADMIN.PKG.main'), routeTo: 'cmp-package-management-external', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] })
        }

        if (this.isSsg && VUE_APP_USER_URL.indexOf('demo') > -1) {
          adminSet.children = adminSet.children.filter(x => x.routeTo !== 'cmp-package-management')
        }
      }
    },
    /**
     * 설정된 accessible 키와 packageType 에 따라 메뉴 filtering
     */
    versionCheck (item) {
      // console.log(item.title, item.accessible)
      if (item.children?.length) {
        item.children = item.children.filter(this.versionCheck)
        return true
      } else {
        return item.accessible.includes(this.packageType)
      }
    },
    /**
     * 역할 별 페이지 접근 권한 filtering
     */
    setMenuListByPerm (permMenuList, nodes = this.allModuleMenuLists[this.shortlyCloud]) {
      const newNodes = []
      for (const i in nodes) {
        let isShow = false
        for (const j in permMenuList) {
          if (nodes[i].routeTo === 'set') {
            isShow = false
            continue
          }
          if (nodes[i].routeTo === permMenuList[j]) {
            isShow = true
          }
        }
        if (nodes[i].children?.length > 0) {
          nodes[i].children = this.setMenuListByPerm(permMenuList, nodes[i].children)
        }
        if (nodes[i].id === 'monitoring' && (!nodes[i].children || nodes[i].children.length === 0)) {
          isShow = false
        }
        nodes[i].show = isShow
        if (isShow) {
          newNodes.push(nodes[i])
        }
      }
      return newNodes
    },
    setSelectedMenu (param) {
      this.selectedMenu = param
      if (this.selectedMenu.href) {
        window.open(this.selectedMenu.href, '_blank')
      } else if (this.selectedMenu.routeTo) {
        this.routeTo({ name: this.selectedMenu.routeTo })
        return this.expandPanel(false)
      }
    },
    // 모든 노드를 닫습니다.
    closeAllNodes (nodes) {
      nodes = nodes.map(item => {
        item.isOpen = false
        item.selected = false
        if (item.children?.length) {
          this.closeAllNodes(item.children)
        }
      })

      this.$forceUpdate()
      return nodes
    },

    // 계속 열려있도록 해주는 함수입니다.
    openSelectedNodes (nodes) {
      // comment 0820: 이런걸 원할것 같아서 한번 작성해보았습니다 ' -')/
      // 그런데... 요 로직은 sideNav 컴포넌트에 있어야겠죵.
      // 공통컴포넌트에 요게 있으면 이게 막 트리가 들어간 화면에서 마구 실행되어버려서 위험해용
      this.nodes = this.eachNodes(node => {
        node.isOpen = false
        node.selected = false
        return node
      })

      const routeNames = this.$route.matched.map(route => ({ name: route.name, relationRouteName: route.meta?.relationRouteName }))
      let matched = this.findAllNodes(node => {
        return node.routeTo ? (
          routeNames.map(routeName => routeName.name).includes(node.routeTo) ||
          routeNames.map(routeName => routeName.relationRouteName).includes(node.routeTo)
        ) : false
      })

      if (matched?.length) {
        matched = matched.map(node => {
          node.isOpen = true
          node.selected = true
          return node
        })
      }
      this.$forceUpdate()
    },
    /**
     * nodes의 모든 children에 action을 실행합니다.
     * @param {function} action 실행할 function
     */
    eachNodes (action = () => true, nodes = this.nodes) {
      nodes = [...nodes]
      for (let i = 0; i < nodes.length; i++) {
        nodes[i] = action(nodes[i])
        if (nodes[i].children?.length) {
          nodes[i].children = this.eachNodes(action, nodes[i].children)
        }
      }
      return nodes
    },
    /**
     * matcher function이 true를 리턴하는 조건을 만족하는 node를 찾아 부모까지 한방에 리턴합니다.
     * 일치하는 결과를 찾음과 관계 없이 가장 끝 루트까지 간 뒤에 결과를 리턴합니다
     * @function
     * @param {function} matcher true를 리턴하는 아이템을 찾습니다.
     * @param {array} nodes children을 가지고 있어야겠죠
     * @param {array} result 미리 넣어놓을 결과값이 있을 경우에 설정합니다.
     */
    findAllNodes (matcher = () => true, nodes = this.nodes, result = []) {
      for (let i = 0; i < nodes.length; i++) {
        if (matcher(nodes[i])) {
          result.push(nodes[i])
          // return result 만약 return이 여기면 일치하는 아이템을 하나만 찾습니다,
        }
        if (nodes[i].children?.length) this.findAllNodes(matcher, nodes[i].children, result)
      }
      return result
      // return이 여기라면 일치하는 모든 아이템을 찾은 후에 결과를 리턴합니다
    },
    routeTo (to) {
      if (to === 'main') {
        if (this.perm?.menu.length) {
          // 운영관리자
          const to = this.perm?.menu[0]
          this.$router.push({ name: to })
        } else {
        // 최고관리자
          this.$router.push({ name: 'main' })
        }
      } else {
        this.$router.push(to)
      }
    },
    expandPanel (value) {
      this.setSideNavExpand(value)
    },
    ...mapMutations({
      setSideNavExpand: 'common/SET_SIDENAV_EXPAND'
    }),
    /**
      * 모니터링 메뉴 삽입
      */
    async setMonitoringMenu () {
      this.monitoringServerList = await API.config.getMonitoringServerList()
      this.loggingServerList = await API.config.getLoggingServerList()
      const loggingLinkServer = this.loggingServerList.find((el) => el.loggingType === 'LINK') || null
      const customMenuMoni = { id: '', depth: 'second', title: '', href: '', read: false, accessible: this.monitoringMenu.accessible }
      let monitoring = cloneDeep(this.monitoringMenu)

      if (this.monitoringServerList?.length || loggingLinkServer) monitoring = { ...monitoring, children: [] }

      // 등록된 monitoring 서버 있으면 children 에 삽입
      if (this.monitoringServerList?.length) {
        const { monitoringServerName, monitoringServerUrl } = this.monitoringServerList[0]
        monitoring.children.push({ ...customMenuMoni, id: monitoringServerName, title: monitoringServerName, href: monitoringServerUrl })
      }
      // 등록된 logging 서버 있으면 children 에 삽입
      if (loggingLinkServer) {
        monitoring.children.push({ ...customMenuMoni, id: loggingLinkServer.loggingServerName, title: loggingLinkServer.loggingServerName, href: loggingLinkServer.loggingServerUrl })
      }

      // 모니터링 항목 있으면 메뉴에 삽입
      if ((monitoring.children?.length) && (Object.keys(this.allModuleMenuLists).includes('nx') || Object.keys(this.allModuleMenuLists).includes('vmw'))) {
        this.allModuleMenuLists.nx.push(monitoring)
        this.allModuleMenuLists.vmw.push(monitoring)
      }
    },
    async initSideNav () {
      // 기본 메뉴 세팅
      this.allModuleMenuLists = cloneDeep(this.cloudMenuList)
      console.log(this.allModuleMenuLists, 'DDATA')
      if (this.packageType !== 'ENT') {
        if (Object.keys(this.allModuleMenuLists).includes('aws')) {
          delete this.allModuleMenuLists.aws
        }
      }
      this.pushPackageMenu() // 어드민 관리 > 환경설정 안에 패키지 관리 메뉴 중앙-대외 구분해서 삽입

      // 연동 설정 메뉴 세팅
      for (const [key] of Object.entries(this.allModuleMenuLists)) {
        const basicMenu = cloneDeep(this.basicLinkSettingMenu)
        basicMenu.children = [...this.linkSettingMenu[key], ...basicMenu.children]
        this.finalLinkSettingMenu[key] = basicMenu
      }
      console.log('>> finalLinkSettingMenu ', this.finalLinkSettingMenu)

      // monitoring Menu 삽입
      if ((['STD', 'ENT'].includes(this.packageType)) && (Object.keys(this.allModuleMenuLists).includes('nx') || Object.keys(this.allModuleMenuLists).includes('vmw'))) {
        await this.setMonitoringMenu()
      }

      // 메뉴 합체
      for (const [key] of Object.entries(this.allModuleMenuLists)) {
        // 연동 설정 삽입
        this.allModuleMenuLists[key].push(this.finalLinkSettingMenu[key])
        // (공통) 어드민 관리 삽입
        this.allModuleMenuLists[key].push(this.commonAdminMenu)
        // Web Push
        this.allModuleMenuLists[key].push(this.webPushMenu)
      }

      // 버전에 따라 메뉴 최종 필터링
      for (const [key] of Object.entries(this.allModuleMenuLists)) {
        this.allModuleMenuLists[key] = this.allModuleMenuLists[key].filter(this.versionCheck)
      }

      this.$store.dispatch('common/setMenuList', JSON.stringify(this.allModuleMenuLists))
      console.log('sideNAV', this.user.userPermLevel, this.allModuleMenuLists)

      // 운영 관리자 분기 처리
      if (this.user.userPermLevel !== 0) { // 운영 관리자 일 경우
        this.nodes = this.setMenuListByPerm(this.perm.menu[this.shortlyCloud], cloneDeep(this.allModuleMenuLists[this.shortlyCloud]))
      } else { // 최고 관리자 일 경우
        this.nodes = cloneDeep(this.allModuleMenuLists)[this.shortlyCloud]
      }
      console.log('menuTreeNodes:', this.nodes)
      this.$store.commit('common/SET_USER_MENU_LIST', cloneDeep(this.nodes))
    }
  },
  data (root) {
    return {
      isSsg: process.env.VUE_APP_SSG_USER === 'true',
      nodes: [],
      selectedMenu: null,
      cloudMenuList: {
        nx: [
          {
            id: 'dashboard-v3',
            title: '통합 대시보드',
            // keyPath: 'main.LAYOUT.dashboard',
            icon: 'dashboard-v3',
            routeTo: 'dashboard-v3',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT']
          },
          {
            id: 'dashboard',
            title: '대시보드',
            keyPath: 'main.LAYOUT.dashboard',
            icon: 'dashboard',
            routeTo: 'dashboard',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT']
          },
          {
            id: 'task',
            title: '업무',
            keyPath: 'main.LAYOUT.task',
            icon: 'database',
            routeTo: 'task',
            depth: 'first',
            read: false,
            accessible: ['BS', 'STD', 'ENT']
          },
          {
            id: 'serviceCatalogue',
            title: '서비스 카탈로그',
            keyPath: 'main.LAYOUT.serviceCatalog',
            icon: 'attachment',
            routeTo: 'service-catalogue',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            // block: true,
            children: [
              { id: 'marketplace', depth: 'second', title: '마켓플레이스', keyPath: 'main.LAYOUT.marketPlace', routeTo: 'marketplace-template', read: false, accessible: ['ENT'] },
              { id: 'ova', depth: 'second', title: this.$t('service.OVA.template'), routeTo: 'vm-template', read: false, accessible: ['BS', 'STD', 'ENT'] },
              {
                id: 'installProgram',
                depth: 'second',
                title: '설치프로그램',
                keyPath: 'main.LAYOUT.install',
                routeTo: 'install-program',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT'],
                children: [
                  { id: 'installProgramList', depth: 'third', title: '설치프로그램 관리', routeTo: 'install-program-management', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'installProgramVms', depth: 'third', title: 'VM별 설치프로그램 관리', routeTo: 'install-program-management-vms', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
                ]
              },
              { id: 'instanceType', title: '인스턴스 타입', keyPath: 'main.LAYOUT.instance', routeTo: 'instance-type', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
            ]
          },
          {
            id: 'configManage',
            title: '구성 관리',
            keyPath: 'main.LAYOUT.configure',
            icon: 'config-manage',
            routeTo: 'config-manage',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            // block: true,
            children: [
              {
                id: 'setProject',
                depth: 'second',
                title: '프로젝트 관리',
                keyPath: 'main.LAYOUT.mngProj',
                routeTo: 'set-project',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT']
              },
              { id: 'setIp', depth: 'second', title: 'IP 관리', routeTo: 'set-ip', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'rackLists', depth: 'second', title: '랙실장도', keyPath: 'main.LAYOUT.rack', routeTo: 'rack-lists', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'setCluster', depth: 'second', title: '자원풀그룹', keyPath: 'main.LAYOUT.resPool', routeTo: 'set-cluster', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'setHost', depth: 'second', title: '물리서버', keyPath: 'main.LAYOUT.physical', routeTo: 'set-host', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              {
                id: 'setResource',
                depth: 'second',
                title: '자원관리',
                keyPath: 'main.LAYOUT.manageRes',
                routeTo: 'set-resource',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT'],
                // block: true,
                children: [
                  { id: 'setCompute', depth: 'third', title: 'Compute', routeTo: 'set-resource-server', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'setSwitch', depth: 'third', title: 'Network (스위치)', keyPath: 'main.LAYOUT.networkSwitch', routeTo: 'set-resource-switch', read: false, accessible: ['BS', 'STD', 'ENT'] },
                  { id: 'setSecurity', depth: 'third', title: 'Network (보안)', keyPath: 'main.LAYOUT.networkSecurity', routeTo: 'set-resource-security', read: false, accessible: ['BS', 'STD', 'ENT'] },
                  { id: 'setStorage', depth: 'third', title: 'Storage', routeTo: 'set-resource-storage', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'setDatabase', depth: 'third', title: 'Database', routeTo: 'set-resource-database', read: false, accessible: ['ENT'] },
                  { id: 'setFiles', depth: 'third', title: 'NAS (Files)', routeTo: 'set-resource-share', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  // { id: 'setAutoScaleGroup', depth: 'third', title: 'Auto Scale Group', routeTo: 'set-resource-autoscale-group', read: false, accessible: ['STD', 'ENT'] },
                  { id: 'unregisterResource', depth: 'third', title: '미등록 자원 관리', keyPath: 'main.LAYOUT.manageUnregisterResource', routeTo: 'unregister-resource', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
                ]
              },
              {
                id: 'set-itsm',
                depth: 'first',
                title: 'ITSM',
                routeTo: 'set-itsm',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT']
              }
            ]
          },
          {
            id: 'metering',
            title: '미터링',
            keyPath: 'main.LAYOUT.meter',
            icon: 'rotate-orbit',
            routeTo: 'metering',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            children: [
              { id: 'serverStatus', depth: 'second', title: '서버 현황', keyPath: 'main.LAYOUT.serverState', routeTo: 'metering-status', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'swLicense', depth: 'second', title: 'S/W 라이선스', keyPath: 'main.LAYOUT.sw', routeTo: 'metering-license', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
            ]
          },
          {
            id: 'billing',
            title: '빌링',
            keyPath: 'main.LAYOUT.bill',
            icon: 'camera-metering-partial',
            routeTo: 'nx-billing',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            children: [
              { id: 'billingDashboard', title: '대시보드', keyPath: 'main.LAYOUT.dashboard', routeTo: 'integrated-billing-dashboard', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'billingStatus', title: '과금 현황', keyPath: 'main.LAYOUT.billState', routeTo: 'nx-billing-status', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'billingAllocation', title: '과금 배치', keyPath: 'main.LAYOUT.billArrange', routeTo: 'nx-billing-allocation', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              {
                id: 'model',
                title: '모델',
                keyPath: 'main.LAYOUT.model',
                routeTo: 'nx-billing-model',
                depth: 'second',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT'],
                children: [
                  { id: 'billingModel', title: '과금 모델', keyPath: 'main.LAYOUT.billModel', routeTo: 'nx-billing-model-standard', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'distModel', title: '배부 모델', keyPath: 'main.LAYOUT.distModel', routeTo: 'nx-billing-model-dist', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'calibModelServer', title: '서버별 보정 모델', keyPath: 'main.LAYOUT.serverModel', routeTo: 'nx-billing-model-calibration-server', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'calibModelCompany', title: '관계사별 보정 모델', keyPath: 'main.LAYOUT.affModel', routeTo: 'nx-billing-model-calibration-company', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
                ]
              }
            ]
          }
        ],
        vmw: [
          {
            id: 'dashboard-v3',
            title: '통합 대시보드',
            // keyPath: 'main.LAYOUT.dashboard',
            icon: 'dashboard-v3',
            routeTo: 'dashboard-v3',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT']
          },
          {
            id: 'dashboard',
            title: '대시보드',
            // keyPath: 'main.LAYOUT.dashboard',
            icon: 'dashboard',
            routeTo: 'dashboard-vmw',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT']
          },
          {
            id: 'task',
            title: '업무',
            // keyPath: 'main.LAYOUT.task',
            icon: 'database',
            routeTo: 'task',
            depth: 'first',
            read: false,
            accessible: ['BS', 'STD', 'ENT']
          },
          {
            id: 'serviceCatalogue',
            title: '서비스 카탈로그',
            // keyPath: 'main.LAYOUT.serviceCatalog',
            icon: 'attachment',
            routeTo: 'service-catalogue-vmw',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            // block: true,
            children: [
              // { id: 'marketplace', title: '마켓플레이스', keyPath: 'main.LAYOUT.marketPlace', routeTo: 'marketplace-template', read: false, accessible: ['ENT'] },
              // { id: 'marketplace', depth: 'second', title: '마켓플레이스', routeTo: 'marketplace-template-vmw', read: false, accessible: ['ENT'] },
              { id: 'ova', depth: 'second', title: 'VM 템플릿', routeTo: 'vm-template-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
              {
                id: 'installProgram',
                title: '설치프로그램',
                depth: 'second',
                routeTo: 'install-program-vmw',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT'],
                children: [
                  { id: 'installProgramList', depth: 'third', title: '설치프로그램 관리', routeTo: 'install-program-management-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'installProgramVms', depth: 'third', title: 'VM별 설치프로그램 관리', routeTo: 'install-program-management-vms-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
                ]
              }
              // { id: 'instanceType', title: '인스턴스 타입', routeTo: 'instance-type-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] } // VMware 모듈에서 인스턴스 타입을 사용한다는 명확한 기획이 없어 메뉴에서 제거 (23/05/12 팀장님과 협의)
            ]
          },
          {
            id: 'configManage',
            title: '구성 관리',
            // keyPath: 'main.LAYOUT.configure',
            icon: 'config-manage',
            routeTo: 'config-manage-vmw',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            // block: true,
            children: [
              { id: 'setProject', depth: 'second', title: '프로젝트 관리', routeTo: 'set-project-manage-project-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              // { id: 'rackLists', depth: 'second', title: '랙실장도', keyPath: 'main.LAYOUT.rack', routeTo: 'rack-lists', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'setIp', depth: 'second', title: 'IP 관리', routeTo: 'set-ip-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'rackLists', depth: 'second', title: '랙실장도', routeTo: 'rack-lists-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'setDatacenter', depth: 'second', title: '데이터센터', keyPath: 'main.DASHBOARD.dataCenter', routeTo: 'set-datacenter-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'setCluster', depth: 'second', title: '자원풀그룹', routeTo: 'set-cluster-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'setHost', depth: 'second', title: '물리서버', routeTo: 'set-host-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              {
                id: 'setResource',
                depth: 'second',
                title: '자원관리',
                routeTo: 'set-resource-vmw',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT'],
                // block: true,
                children: [
                  { id: 'setCompute', depth: 'third', title: 'Compute', routeTo: 'set-resource-server-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  {
                    id: 'setStorage', depth: 'third', title: 'Storage (vSAN iSCSI)', routeTo: 'vmware-storage-vsan-iscsi-list', read: false, accessible: ['PL', 'BS', 'STD', 'ENT']
                  },
                  { id: 'setSwitch', depth: 'third', title: 'Network 스위치', routeTo: 'set-resource-switch-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
                  { id: 'setSecurity', depth: 'third', title: 'Network 보안', routeTo: 'set-resource-security-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
                  { id: 'unregisterResource', depth: 'third', title: '미등록 자원 관리', keyPath: 'main.LAYOUT.manageUnregisterResource', routeTo: 'vmware-unregister-resource', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
                ]
              },
              {
                id: 'set-itsm',
                depth: 'first',
                title: 'ITSM',
                keyPath: 'ITSM',
                routeTo: 'set-itsm-vmw',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT']
              }
            ]
          },
          {
            id: 'metering',
            title: '미터링',
            // keyPath: 'main.LAYOUT.meter',
            icon: 'rotate-orbit',
            routeTo: 'metering-vmw',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            children: [
              // { id: 'serverStatus', depth: 'second', title: '서버 현황', keyPath: 'main.LAYOUT.serverState', routeTo: 'metering-status', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'serverStatus', depth: 'second', title: '서버현황', routeTo: 'metering-status-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'swLicense', depth: 'second', title: 'S/W 라이선스', routeTo: 'metering-license-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
            ]
          },
          {
            id: 'billing',
            title: '빌링',
            // keyPath: 'main.LAYOUT.bill',
            icon: 'camera-metering-partial',
            routeTo: 'nx-billing',
            depth: 'first',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            children: [
              // { id: 'billingDashboard', title: '빌링-01', routeTo: 'vmw-billing-dh', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }

              { id: 'billingDashboard', title: '대시보드', routeTo: 'integrated-billing-dashboard', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'billingStatus', title: '과금 현황', routeTo: 'nx-billing-status', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'billingAllocation', title: '과금 배치', routeTo: 'nx-billing-allocation', depth: 'second', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              {
                id: 'model',
                title: '모델',
                routeTo: 'nx-billing-model',
                depth: 'second',
                read: false,
                accessible: ['PL', 'BS', 'STD', 'ENT'],
                children: [
                  { id: 'billingModel', title: '과금 모델', routeTo: 'nx-billing-model-standard', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'distModel', title: '배부 모델', routeTo: 'nx-billing-model-dist', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'calibModelServer', title: '서버별 보정 모델', keyPath: 'main.LAYOUT.serverModel', routeTo: 'nx-billing-model-calibration-server', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
                  { id: 'calibModelCompany', title: '관계사별 보정 모델', keyPath: 'main.LAYOUT.affModel', routeTo: 'nx-billing-model-calibration-company', depth: 'third', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
                ]
              }
            ]
          }
        ],
        aws: [
          {
            id: 'dashboard-v3',
            title: this.$v('통합 대시보드'),
            routeTo: 'dashboard-v3',
            depth: 'first',
            accessible: ['BS', 'STD', 'ENT']
          },
          {
            id: 'dashboard',
            title: this.$t('main.LAYOUT.dashboard'),
            routeTo: 'dashboard-aws',
            depth: 'first',
            accessible: ['BS', 'STD', 'ENT']
          },
          {
            id: 'task',
            title: '업무',
            keyPath: 'main.LAYOUT.task',
            routeTo: 'task',
            depth: 'first',
            accessible: ['BS', 'STD', 'ENT']
          },
          {
            id: 'serviceCatalogue',
            title: this.$t('main.LAYOUT.serviceCatalog'),
            routeTo: 'service-catalogue-aws',
            depth: 'first',
            accessible: ['BS', 'STD', 'ENT'],
            // block: true,
            children: [
              { id: 'ami-image', title: 'AMI 이미지 관리', keyPath: 'bc.SC.ami', routeTo: 'ami-image', accessible: ['BS', 'STD', 'ENT'] },
              { id: 'instance-type', title: '인스턴스 유형 관리', keyPath: 'bc.SC.instanceType', routeTo: 'instance-type-aws', accessible: ['BS', 'STD', 'ENT'] },
              { id: 'ebs-type', title: 'EBS 유형 관리', keyPath: 'bc.SC.ebs', routeTo: 'ebs-type', accessible: ['BS', 'STD', 'ENT'] }
            ]
          },
          {
            id: 'config-manage-aws',
            title: this.$t('main.LAYOUT.configure'),
            routeTo: 'config-manage-aws',
            depth: 'first',
            accessible: ['BS', 'STD', 'ENT'],
            // block: true,
            children: [
              {
                id: 'set-project-public',
                depth: 'second',
                title: this.$t('main.LAYOUT.mngProj'), // 프로젝트 관리
                routeTo: 'set-project-public',
                accessible: ['BS', 'STD', 'ENT']
              },
              {
                id: 'network',
                depth: 'second',
                title: '네트워크',
                keyPath: 'main.LAYOUT.network',
                accessible: ['BS', 'STD', 'ENT'],
                routeTo: 'network-aws',
                children: [
                  {
                    id: 'vpc',
                    depth: 'third',
                    title: 'VPC',
                    routeTo: 'vpc-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'subnet',
                    depth: 'third',
                    title: '서브넷',
                    keyPath: 'main.LAYOUT.subnet',
                    routeTo: 'subnet-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'routing-table',
                    depth: 'third',
                    title: '라우팅 테이블',
                    keyPath: 'main.LAYOUT.routingTable',
                    routeTo: 'routing-table-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'internet-gateway',
                    depth: 'third',
                    title: '인터넷 게이트웨이',
                    keyPath: 'main.LAYOUT.internetGateway',
                    routeTo: 'internet-gateway-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'nat-gateway',
                    depth: 'third',
                    title: 'NAT 게이트웨이',
                    keyPath: 'main.LAYOUT.natGateway',
                    routeTo: 'nat-gateway-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  }
                ]
              },
              {
                id: 'security',
                depth: 'second',
                title: '보안',
                keyPath: 'main.LAYOUT.security',
                accessible: ['BS', 'STD', 'ENT'],
                routeTo: 'security-aws',
                children: [
                  {
                    id: 'network-acl',
                    depth: 'third',
                    title: '네트워크 ACL',
                    keyPath: 'main.LAYOUT.networkACL',
                    routeTo: 'network-acl-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'security-group',
                    depth: 'third',
                    title: '보안 그룹',
                    keyPath: 'main.LAYOUT.networkGroup',
                    routeTo: 'security-group-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  }
                ]
              },
              {
                id: 'resource-manage',
                depth: 'second',
                title: '자원 관리',
                keyPath: 'main.LAYOUT.resourceManage',
                accessible: ['BS', 'STD', 'ENT'],
                routeTo: 'resource-aws',
                children: [
                  {
                    id: 'resource-ec2',
                    depth: 'third',
                    title: 'EC2',
                    routeTo: 'resource-ec2-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'resource-ebs',
                    depth: 'third',
                    title: 'EBS',
                    routeTo: 'resource-ebs-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'resource-efs',
                    depth: 'third',
                    title: 'EFS',
                    routeTo: 'resource-efs-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'resource-elb',
                    depth: 'third',
                    title: 'Load Balancer',
                    routeTo: 'resource-elb-aws',
                    accessible: ['BS', 'STD', 'ENT']
                  },
                  {
                    id: 'resource-tgw',
                    depth: 'third',
                    title: 'Transit Gateway',
                    routeTo: 'resource-tgw-main',
                    accessible: ['BS', 'STD', 'ENT']
                  }
                ]
              }
            ]
          },
          {
            id: 'billing',
            title: '빌링',
            keyPath: 'main.LAYOUT.bill',
            routeTo: 'nx-billing',
            depth: 'first',
            accessible: ['BS', 'STD', 'ENT'],
            children: [
              { id: 'billingDashboard', title: this.$t('main.LAYOUT.dashboard'), routeTo: 'integrated-billing-dashboard', depth: 'second', accessible: ['BS', 'STD', 'ENT'] },
              {
                id: 'model',
                title: this.$t('main.LAYOUT.model'),
                routeTo: 'billing-model-aws',
                depth: 'second',
                accessible: ['BS', 'STD', 'ENT'],
                children: [
                  { id: 'billingModelAWS', title: this.$t('main.LAYOUT.billModel'), routeTo: 'billing-model-aws', depth: 'third', accessible: ['BS', 'STD', 'ENT'] }
                ]
              }
            ]
          }
        ]
      },
      menuLists: null,
      monitoringMenu: {
        id: 'monitoring',
        title: '모니터링',
        keyPath: 'main.LAYOUT.monitor',
        icon: 'monitor',
        routeTo: 'monitoring',
        read: false,
        depth: 'first',
        accessible: ['STD', 'ENT']
        // children: [
        //   // { id: 'cmpMonitoring', depth: 'second', title: 'CMP 모니터링', href: 'http://fe-nginx.seowon.co.kr/', read: false, accessible: ['STD', 'ENT'] }
        // ]
      },
      linkSettingMenu: {
        nx: [
          { id: 'configNutanix', depth: 'second', title: '뉴타닉스 설정', keyPath: 'main.LAYOUT.manageNuta', routeTo: 'config-nutanix', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configNetworkRouting', depth: 'second', title: '경유지 관리', keyPath: 'main.LAYOUT.manageStopover', routeTo: 'network-routing', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configSwitchEquip', depth: 'second', title: '스위치 장비 정보', keyPath: 'main.LAYOUT.switchEquip', routeTo: 'switch-equip', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configFirewallEquip', depth: 'second', title: '방화벽 장비 정보', keyPath: 'main.LAYOUT.firewallEquip', routeTo: 'firewall-equip', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configFirewallVDOM', depth: 'second', title: '방화벽 VDOM 정보', keyPath: 'main.LAYOUT.firewallVDom', routeTo: 'firewall-vdom', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configAlarm', depth: 'second', title: '알람 서버 설정', keyPath: 'main.LAYOUT.alarmServer', routeTo: 'alarm-server', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configLoggingServer', depth: 'second', title: '로깅 서버 설정', keyPath: 'main.LAYOUT.loggingServer', routeTo: 'logging-server', read: false, accessible: ['STD', 'ENT'] },
          { id: 'configMonitoring', depth: 'second', title: '모니터링 설정', keyPath: 'main.LAYOUT.monit', routeTo: 'config-monitoring', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configCloudInitScript', depth: 'second', title: 'Cloud Init Script 관리', routeTo: 'set-config-cloud-init', read: false, accessible: ['STD', 'ENT'] }
        ],
        vmw: [
          { id: 'configVmware', depth: 'second', title: 'VMware 설정', routeTo: 'config-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configNetworkRouting', depth: 'second', title: '경유지 관리', routeTo: 'network-routing-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configSwitchEquip', depth: 'second', title: '스위치 장비 정보', routeTo: 'switch-equip-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configFirewallEquip', depth: 'second', title: '방화벽 장비 정보', keyPath: 'main.LAYOUT.firewallEquip', routeTo: 'firewall-equip-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configFirewallVDOM', depth: 'second', title: '방화벽 VDOM 정보', routeTo: 'firewall-vdom-vmw', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configAlarm', depth: 'second', title: '알람 서버 설정', routeTo: 'alarm-server-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configLoggingServer', depth: 'second', title: '로깅 서버 설정', routeTo: 'logging-server', read: false, accessible: ['STD', 'ENT'] },
          { id: 'configMonitoring', depth: 'second', title: '모니터링 설정', routeTo: 'config-monitoring-vmw', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configCustomSpecification', depth: 'second', title: 'VM 사용자 지정 규격 관리', routeTo: 'config-custom-specification', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
        ],
        aws: [
          { id: 'config-sync-account-vpc', depth: 'second', title: '동기화 계정 및 VPC 관리', keyPath: 'main.LAYOUT.configSyncAccVPC', routeTo: 'config-sync-account-vpc', accessible: ['BS', 'STD', 'ENT'] },
          { id: 'config-region', depth: 'second', title: '리전별 가용 영역 설정', keyPath: 'main.LAYOUT.configRegion', routeTo: 'config-region', accessible: ['BS', 'STD', 'ENT'] },
          { id: 'config-monitoring-aws', depth: 'second', title: '모니터링 설정', keyPath: 'main.LAYOUT.setMonitoring', routeTo: 'config-monitoring-aws', accessible: ['BS', 'STD', 'ENT'] }
        ]
      },
      basicLinkSettingMenu: {
        id: 'link-setting',
        depth: 'first',
        title: '연동 설정',
        keyPath: 'main.LAYOUT.linkSetting',
        routeTo: 'link-setting',
        accessible: ['BS', 'STD', 'ENT'],
        children: [
          { id: 'configJdbc', depth: 'second', title: '인사/조직 연동 설정', keyPath: 'main.LAYOUT.setJdbc', routeTo: 'jdbc', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'configItsm', depth: 'second', title: 'ITSM 설정', keyPath: 'main.LAYOUT.setItsm', routeTo: 'itsm', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configITAutomation', depth: 'second', title: 'IT Automation 연동', keyPath: 'main.LAYOUT.setITAutomation', routeTo: 'it-automation', read: false, accessible: ['BS', 'STD', 'ENT'] },
          { id: 'configApproval', depth: 'second', title: this.$v('외부 결재 설정'), routeTo: 'external-config-approval', read: false, accessible: ['BS', 'STD', 'ENT'] }
        ]
      },
      finalLinkSettingMenu: {},
      commonAdminMenu: {
        id: 'setAdmin',
        title: '어드민 관리',
        keyPath: 'main.LAYOUT.manageAdmin',
        icon: 'cog',
        routeTo: 'set',
        depth: 'first',
        read: false,
        accessible: ['PL', 'BS', 'STD', 'ENT'],
        children: [
          { id: 'setAccount', depth: 'second', title: '계정 관리', keyPath: 'main.LAYOUT.manageAcc', routeTo: 'set-account', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'setConsignment', depth: 'second', title: this.$v('위탁 관리'), routeTo: 'consignment-management', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'setOrg', depth: 'second', title: '조직 관리', keyPath: 'main.LAYOUT.manageOrg', routeTo: 'set-organization', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          { id: 'setRole', depth: 'second', title: '역할 관리', keyPath: 'main.LAYOUT.manageRole', routeTo: 'set-role', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
          {
            id: 'siteManaging',
            depth: 'second',
            title: '사이트 관리',
            keyPath: 'main.LAYOUT.siteManaging',
            routeTo: 'site-managing',
            read: false,
            accessible: ['BS', 'STD', 'ENT'],
            children: [
              { id: 'notice', depth: 'third', title: '공지사항', keyPath: 'main.LAYOUT.notice', routeTo: 'notice', read: false, accessible: ['BS', 'STD', 'ENT'] },
              { id: 'indivInquiry', depth: 'third', title: '1:1 문의', keyPath: 'main.LAYOUT.inq', routeTo: 'indiv-inquiry', read: false, accessible: ['BS', 'STD', 'ENT'] },
              { id: 'faq', depth: 'third', title: 'FAQ', routeTo: 'set-faq', read: false, accessible: ['BS', 'STD', 'ENT'] },
              { id: 'ref', depth: 'third', title: '자료실 관리', keyPath: 'main.LAYOUT.manageReference', routeTo: 'set-ref', read: false, accessible: ['BS', 'STD', 'ENT'] },
              { id: 'news', depth: 'third', title: '뉴스 관리', keyPath: 'main.LAYOUT.manageNews', routeTo: 'set-news', read: false, accessible: ['BS', 'STD', 'ENT'] }
            ]
          },
          {
            id: 'config',
            depth: 'second',
            title: '환경설정',
            keyPath: 'main.LAYOUT.pref',
            routeTo: 'set-configure',
            read: false,
            accessible: ['PL', 'BS', 'STD', 'ENT'],
            children: [
              { id: 'configCode', depth: 'third', title: this.$v('네트워크 카테고리 관리'), routeTo: 'config-network-cate', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'configCode', depth: 'third', title: '코드 관리', keyPath: 'main.LAYOUT.manageCode', routeTo: 'config-code', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'configGeneralSetting', depth: 'third', title: '일반 설정', keyPath: 'main.LAYOUT.setGen', routeTo: 'config-general', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'workFlow3', depth: 'third', title: '통합 업무 관리 (신규)', routeTo: 'integrated-work-management', read: false, accessible: ['BS', 'STD', 'ENT'] }, // 🟨
              { id: 'dynamic-meta', depth: 'third', title: '동적 메타데이터 관리', keyPath: 'bc.ADMIN.dynamicMetaData', routeTo: 'dynamic-meta', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'cmp-log', depth: 'third', title: this.$t('bc.ADMIN.log'), routeTo: 'cmp-log', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'audit', depth: 'third', title: this.$t('bc.ADMIN.access'), routeTo: 'cmp-audit', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'configOperation', depth: 'third', title: this.$t('운영그룹 관리'), routeTo: 'operation-management', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] },
              { id: 'alarm', depth: 'third', title: '통합 알람', routeTo: 'cmp-alarm', read: false, accessible: ['PL', 'BS', 'STD', 'ENT'] }
            ]
          }

        ]
      },
      webPushMenu: {
        id: 'web-push',
        title: 'Web Push',
        routeTo: 'web-push',
        depth: 'first',
        accessible: ['BS', 'STD', 'ENT']
      },

      monitoringServerList: [],
      loggingingServerList: [],
      allModuleMenuLists: {} // 모든 클라우드 서비스의 전체 메뉴 리스트 (패키지 타입 별)
    }
  }
}
</script>
<style lang="scss">
  .nav-background {
    background: rgba(#111, .5);
    z-index: -1;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    display: none;
    opacity: 0;
    transition: opacity .3s;
    &.-expand {
      display: block;
      opacity: 1;
    }
  }

  .admin-side-nav {
    align-items: stretch;
    vertical-align: middle;
    overflow-y: scroll;
    z-index: 1;

    > .cmp-logo {
      padding: 25px 0;
      width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      font-family: 'Roboto';
      color: #fff;
      opacity: 0;
      transition: all .3s;
      word-break: keep-all;
      white-space: nowrap;
      font-weight: 600;
      cursor: pointer;
      width: calc(100% - #{$gap * 10});
      padding-left: $gap * 8;
      &.-expanded {
        opacity: 1;
      }
      .cmp-logo-title {
        font-size: 26px;
        height: 25px;
        transition: width .2s;
        margin-bottom: 7px;
      }
      .cmp-logo-sub {
        font-weight: 500;
        font-size: 16px;
        height: 16.5px;
        text-transform: uppercase;
      }
    }

    > .admin-side-menu {

      > .side-menu-tree {
        padding: $gap 0;
        overflow: hidden;

        .tree-wrapper {
          > ul.tree-node {
            padding-left: 160px;
            padding-right: 40px;
          }

          ul.tree-node {
            height: auto;
            transition: .5s ease;
            .tree-label {
              display: inline-block;
              line-height: 20px;
            }
            .filter-text {
              display: flex;
              align-items: center;
              padding: 10px 0;
            }
            li {
              transition: all .5s;

              &.node-item-label {
                transition: all .3s;
                padding: $gap 0;
                width: calc(220px - 46px);
                cursor: pointer;
                color: #999;

                &.-selected {
                  color: $white !important;
                  font-weight: bold;
                }
                .node-title {
                  .tree-label-text {
                    display: inline-block;
                    line-height: auto;
                    white-space: nowrap;
                  }
                }
                > .unselected {
                  color: #999;
                }
              }

              &.node-item-child {
                transition: all .5s;
                overflow: hidden;
                padding: 10px 0 40px;

                > .tree-node {
                  transition: all 0.5s ease;
                  overflow: hidden;
                  > .-depths {
                    padding: $gap-s;
                    padding-left: 25px;
                    display: block;
                    font-size: 14px;
                    color: $color-lnb;
                    > .node-title {
                      .tree-label-text {
                        position: relative;
                        height: 14px;
                        &.dot {
                          display: block;
                          width: 0;
                          &::before {
                            content: '';
                            position: absolute;
                            top: 5px; left: -15px;
                            width: 5px; height: 5px;
                            border-radius: 50%;
                            background: $white;
                          }
                        }
                      }
                    }

                  }
                }

                &.-closed {
                  height: 0;
                  padding: 0;
                  opacity: 0;
                }
                &.-opened {
                  padding: 10px 0 40px;
                }
              }
            }
            &.first {
              &.-selected-tree {
                background-color: lighten($background-color, 5%);
                margin: 10px 0;
              }
            }

            &.second {
              > .node-item-label {
                color: $color-lnb;
                padding: $gap-s $gap $gap-s 25px;
                &.-selected {
                  color: $pink;
                  padding-left: 25px;
                }
                .node-title {
                  .toggle-button {
                    height: 14px;
                    &::before { line-height: 14px; }
                  }
                }
              }
              > .node-item-child {
                &.-opened { padding: $gap-s 0;}
              }
            }
            &.third {
               > .node-item-label {
                margin-left: $gap;
                padding: $gap $gap $gap * 2 $gap;
                color: $text-lighter-gray !important;
                font-size: 13px !important;
                &.-selected {
                  color: $pink;
                  padding-left: $gap;
                }
              }
            }
          }

        }
      }
    }
    /* width */
    &::-webkit-scrollbar { width: 2px; background-color: transparent; }

    /* Track, Handle, Hover */
    &::-webkit-scrollbar-track { background-color: transparent; }
    &::-webkit-scrollbar-thumb,
    &::-webkit-scrollbar-thumb:hover { background: transparent; }
  }

.side-expand-button {
  display: inline-block;
  position: absolute;
  top: 25px;
  left: calc(100% + #{$gap});
  width: 25px;
  height: 25px;
  opacity: 0;
  transition: all .2s ease;
  > .side-expnad-icon {
    display: block;
    width: 100%;
    height: 100%;
    color: $dark-gray;
    font-size: 28px;
    line-height: 50px;
    cursor: pointer;
    position: relative;
    background: url('../../assets/images/gnb_close.svg') no-repeat center center;
  }

  &.-opened {
    opacity: 1;
  }
}

  @media only screen and (max-width: 750px) {
    .admin-side-nav {
      > .cmp-logo {
        // display: none;
        width: 100%;
        padding-left: 0;
        margin-left: 0;
        text-align: center;
        .cmp-logo-sub {
          font-weight: 500;
          font-size: 16px;
          height: 16.5px;
          text-transform: uppercase;
        }
      }

      > .admin-side-menu {
        > .side-menu-tree {
          padding: 0 10%;

          .tree-wrapper {
            > ul.tree-node {
              padding-left: 0;
            }

            ul.tree-node {
              display: flex;

              li {
                &.node-item-label {
                  padding: 15px 0;
                  font-weight: bold;
                  flex: 2 1 100px;
                  font-size: 14px;

                  &.-selected {
                    color: $white !important;
                    .node-title {
                      .tree-label-text {
                        position: relative;
                        &::before {
                          position: absolute;
                          top: -$gap-s; right: -$gap-s;
                          content: '';
                          width: 5px;
                          height: 5px;
                          border-radius: 50%;
                          background-color: $primary;
                        }
                      }
                    }
                  }
                }

                &.node-item-child {
                  padding: 0;
                  flex: 0 0 150px;

                  > .tree-node {
                    > .-depths {
                      width: auto;
                      padding: $gap-s 0;
                      font-weight: normal;
                      color: #999;
                      font-size: 13px;

                      > .node-title {
                        .tree-label-text {
                          &.dot {
                            display: block;
                            width: 0;
                            &::before {
                              content: none;
                            }
                          }
                        }
                      }
                    }
                  }

                  &.-opened {
                    padding: 5px 0 $gap-m;
                    .-selected {
                      .tree-label-text {
                        color: $white;
                      }
                    }
                  }
                }

                .toggle-button {
                  display: none;
                }
              }

              &.first {
                &.-selected-tree {
                  background-color: transparent;
                  margin: 0;
                }
              }

              &.second {
                display: block;
                > .node-item-label {
                  color: $color-lnb;
                  font-weight: normal;
                  padding: $gap-s 0;
                  font-size: inherit;
                  width: auto;

                  .node-title {
                    justify-content: flex-start;
                    align-items: center;
                    .tree-label-text {
                      position: relative;
                      &::before {
                        content: none;
                      }
                    }
                    .toggle-button {
                      display: block;
                      margin-left: $gap-s;
                      display: flex;
                      align-items: center;
                      transition: .4s ease;
                      &::before {
                        content: '';
                        width: 12px;
                        height: 10px;
                        background: url('../../assets/images/mobile-nav-arrow.svg') no-repeat center center / 100%;
                      }

                      &.mdi-chevron-down {
                        transform: rotate(180deg);
                      }
                    }
                  }

                  &.-selected {
                    font-weight: normal;
                    padding-left: 0;
                    flex: 1 1 auto;
                    .node-title {
                      justify-content: flex-start;
                      .tree-label-text {
                        color: $white;
                        position: relative;
                        &::before {
                          content: none;
                        }
                      }
                    }
                  }
                }
              }

              &.third {
                margin-left: 0;

                & .node-item-child {
                  &.-depths {
                    padding: 0;
                  }
                }
                > .node-item-label {
                  padding: 0;
                  margin-left: $gap-s;
                  border-left: none;

                  &.-depths {
                    padding: 5px 0 !important;
                  }
                  .tree-label-text {
                    font-size: 12px;
                  }
                  &.-selected {
                    padding-left: 0;
                    .tree-label-text {
                      font-size: 12px;
                      color: $white !important;
                    }
                  }
                }
              }
            }

          }
        }
      }
    }

  .side-expand-button {
    left: initial;
    right: $gap;

    > .side-expnad-icon {
      background: none;

      &::before,
      &::after {
        content: '';
        position: absolute;
        background-color: $white;
        border-radius: 50px;
        width: 2px;
      }
      &::before {
        height: 26px;
        top: 0px; right: $gap-s;
        transform: rotate(-45deg);
      }
      &::after {
        height: 26px;
        top: -1px; right: 9px;
        transform: rotate(45deg);
        border: 1px solid $dark-gray;
      }
    }
  }
}

</style>
