<!--
  * 파일명 : SetResourceSwitchList.vue
  * 파일 기능 : 구성관리 > 자원관리 > Network(스위치) > L4/L7 선택 탭
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 fix: [구성관리] > 필터링 성능 개선
 -->

<template>
  <div class="set-resource-switch-list">
    <g-tab
      :data="tabData"
      @click="clickTabAction"
    >
      <template #l4>
        <router-view />
      </template>

      <template #l7>
        <router-view />
      </template>
      <template #service>
        <router-view />
      </template>
      <template #certification>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import BlockRouteMixins from '@/components/Utils/BlockRoute.mixins'

export default {
  name: 'SetResourceSwitchList',
  mixins: [BlockRouteMixins],
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    clickTabAction (item) {
      this.routeTo({ name: item.routeTo })
    },
    /**
     * projectIdx 를 바탕으로 속한 그룹 정보(조직)를 리턴합니다, 관조프 필터링을 위해 반드시 필요한 작업
     */
    getGroupInfo (treeData, projectIdx) {
      for (let i = 0; i < treeData.length; i++) {
        if (!treeData[i].groupProject.length) {
          const res = this.getGroupInfo(treeData[i].children, projectIdx)
          if (res) { return res }
        }
        const filtered = treeData[i].groupProject.filter(item => item.projectIdx === projectIdx)
        if (filtered?.length) return filtered[0]
        else {
          if (!treeData[i].children?.length) return treeData[i]
          this.getGroupInfo(treeData[i].children, projectIdx)
        }
      }
    }
  },
  data () {
    return {
      // 필터링 데이터
      tabData: [
        { field: 'l4', name: '로드 밸런스(L4)', isActive: true, routeTo: 'set-resource-switch-l4-list', keyPath: 'common.GRID.NETWORK.l4' },
        { field: 'l7', name: '로드 밸런스(L7)', routeTo: 'set-resource-switch-l7-list', keyPath: 'common.GRID.NETWORK.l7' },
        { field: 'service', name: '서비스', routeTo: 'set-resource-switch-service-list' },
        { field: 'certification', name: 'SSL 인증서 관리', routeTo: 'set-resource-switch-certification-list' }
      ],

      // 체크된 친구들
      // checkedL7Items: [],

      // 테이블 데이터
      // filteredL4TableData: [],
      // filteredL7TableData: [],
      // l4TableData: [],
      // l7TableData: [],
      switchColumns: [
        { header: '로드 밸런스명', binding: 'name', keyPath: 'common.GRID.NETWORK.lbName' },
        { header: '가상IP', binding: 'ip', keyPath: 'common.GRID.NETWORK.virtualIp' },
        { header: '포트', binding: 'port', keyPath: 'common.GRID.NETWORK.port' },
        { header: '프로토콜', binding: 'protocolType', keyPath: 'common.GRID.STORAGE.protocol' },
        { header: '방식', binding: 'method', keyPath: 'common.GRID.NETWORK.system' },
        { header: '설명', binding: 'comment', keyPath: 'common.GRID.explain' },
        { header: '삭제 예정일', binding: 'deleteDate', width: '*', keyPath: 'common.GRID.deleteDate' }
      ],
      originL4TableData: [
        {
          idx: '',
          name: '',
          ip: '',
          port: '',
          protocolType: '',
          method: '',
          comment: ''
        }
      ],

      // L7 테이블 데이터
      originL7TableData: [
        {
          idx: '',
          name: '',
          ip: '',
          port: '',
          protocolType: '',
          method: '',
          comment: ''
        }
      ]
    }
  }
}
</script>
