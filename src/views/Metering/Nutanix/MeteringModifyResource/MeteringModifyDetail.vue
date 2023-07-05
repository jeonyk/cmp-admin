<!--
  * 파일명 : MeteringModifyDetail.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-09-01
  * License By Shinsegae I&C
  * 2020-09-01 fix: shp-grid의 paging-type / total-page 외부 props 삭제
 -->

<template>
  <div class="metering-modify-detail">
    <g-foldable
      title="주문 정보"
      id="applyContents"
    >
      <!-- :default-status="true" -->
      <template #contents>
        <task-detail-apply :data="applyExamData" />
      </template>
    </g-foldable>

    <g-foldable
      title="자원 변동 내용"
      id="changedResource"
      :default-status="true"
    >
      <template #contents>
        <article>
          <h6 class="skip-article-header">
            미터링 수정 필터링
          </h6>

          <filtering-component
            :data="filteringList"
          />
          <!-- @selected="selectFilter" -->
        </article>

        <article class="table-area">
          <h6 class="skip-article-header">
            자원 변동 테이블
          </h6>

          <cmp-grid
            :item-source="gridData"
            :columns="columnGroups"
            is-read-only
            column-group
          />
        </article>
      </template>
    </g-foldable>

    <g-foldable
      title="메모"
      :default-status="true"
    >
      <template #contents>
        <div
          class="memo-section"
          id="memo-section"
        >
          <task-memo />
        </div>
      </template>
    </g-foldable>
    <!-- /. 메모영역 -->
  </div>
</template>
<script>
import GFoldable from '@/components/common/g-foldable/g-foldable'
import TaskDetailApply from '../../Task/TaskDetail/TaskDetailApply'
import TaskMemo from '../../Task/TaskMemo/TaskMemo'

export default {
  name: 'MeteringModifyDetail',
  components: {
    'g-foldable': GFoldable,
    'task-detail-apply': TaskDetailApply,
    'task-memo': TaskMemo
  },
  created () {
    this.$store.commit('common/ADD_PARAMETERS', {
      label: this.$route.params ? this.$route.params.host : this.$t('bc.METER.product'),
      path: '',
      statusKo: this.headerItemState(),
      status: this.$route.params.processState
    })
  },
  methods: {
    routeTo (to, param) {
      this.$router.push({
        name: to,
        params: param
      })
    },
    headerItemState () {
      const processState = this.$route.params.processState
      if (processState === 'ing') return '처리 중'
      else if (processState === 'complete') return '완료'
      else return '대기'
    }
  },
  data () {
    return {
      filteringList: [
        {
          field: 'relatedCorp',
          label: '관계사',
          selections: [
            { label: '전체', value: 'all' },
            { label: '자원1', value: 'resource1' },
            { label: '자원2', value: 'resource2' },
            { label: '자원3', value: 'resource3' },
            { label: '자원4', value: 'resource4' }
          ]
        }
      ],
      selectedResource: 'all',
      applyExamData: {
        projectName: '구매', serviceName: 'BI_2020_Q1', target: '김포', deparment: '신세계', ownerRelation: '신세계 아이앤씨', task: 'IT 통합인프라 백화점 스마트 HUB', relation: '신세계푸드', team: '백화점 워크스마트팀', itsmName: '[에, Nu]발주', serverManager: '서버2', taskManager: '신세계 프라퍼티, 신세계 푸드', instresourceDate: '2020.06.08 10:00:00', chargeDate: '2020.06.08 10:00:00', attachment: 'file', applyDesc: '서버 증설로 인해 자원 신청합니다. 기일 엄수 부탁드립니다.'
      },

      // 자원 변동 테이블 데이터
      columnGroups: [
        {
          header: 'VM',
          align: 'center',
          // collapseTo: 'VM.ip',
          columns: [
            { binding: 'VM.node', header: '구분', width: 150 },
            { binding: 'VM.host', header: 'Host', width: 150 },
            { binding: 'VM.ip', header: 'IP', width: 150, cssClass: 'main-column' }
          ]
        },
        {
          header: '변경 전',
          align: 'center',
          // collapseTo: 'Before.sw',
          columns: [
            { binding: 'Before.vcpu', header: 'vCPU', width: 70 },
            { binding: 'Before.memory', header: 'Memory', width: 70 },
            { binding: 'Before.storage', header: 'Storage', width: 70 },
            { binding: 'Before.sw', header: 'S/W', width: 200 }
          ]
        },
        {
          header: '변경 후',
          align: 'center',
          // collapseTo: 'After.sw',
          columns: [
            { binding: 'After.vcpu', header: 'vCPU', width: 70 },
            { binding: 'After.memory', header: 'Memory', width: 70 },
            { binding: 'After.storage', header: 'Storage', width: 70 },
            { binding: 'After.sw', header: 'S/W', width: 200 }
          ]
        },
        { binding: 'date', header: '자원 변경 일시', width: '*', align: 'center' }
      ],
      gridData: [
        {
          VM: {
            node: '김포-내부망 A-Node02',
            host: 'scsta-ihpWEB1',
            ip: '61.250.84.100'
          },
          Before: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBENodeSafer 2'
          },
          After: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          date: new Date()
        }, {
          VM: {
            node: '김포-내부망 A-Node02',
            host: 'scsta-ihpWEB2',
            ip: '61.250.84.100'
          },
          Before: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          After: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          date: new Date()
        }, {
          VM: {
            node: '김포-내부망 A-Node02',
            host: 'scsta-ihpWEB3',
            ip: '61.250.84.100'
          },
          Before: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          After: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          date: new Date()
        }, {
          VM: {
            node: '김포-내부망 A-Node02',
            host: 'scsta-ihpWEB4',
            ip: '61.250.84.100'
          },
          Before: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          After: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          date: new Date()
        }, {
          VM: {
            node: '김포-내부망 A-Node02',
            host: 'scsta-ihpWEB5',
            ip: '61.250.84.100'
          },
          Before: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          After: {
            vcpu: 1,
            memory: 100,
            storage: 50,
            sw: 'WEBTOBE NodeSafer 2'
          },
          date: new Date()
        }
      ]
    }
  }
}
</script>

<style lang="scss">
</style>
