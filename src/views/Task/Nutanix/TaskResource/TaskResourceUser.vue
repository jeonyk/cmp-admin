<template>
  <div class="task-resource-wrapper">
    <g-tab
      ref="resource"
      :data="tabs"
      @click="saveTab"
    >
      <template #name="{ row }">
        {{ row.name }}
        <span class="view-count">{{ row.count }}</span>
      </template>

      <template
        v-for="tab in tabs"
        :slot="tab.field"
      >
        <div
          class="task-common-contents"
          :key="tab.field"
        >
          <g-foldable
            ref="confList"
            v-for="(items, key) in roleData[tab.field]"
            :key="key"
            :title="setCount(key, items.length)"
            :use-state="orderType"
          >
            <template #contents>
              <ul class="sb-wrap">
                <li
                  v-for="sb in items"
                  :key="sb.orderItemIdx"
                  class="sb-wrap-item"
                >
                  <div :class="['basket', { '-ntx': !isAWS(sb) }]">
                    <div class="basket-price">
                      <span class="preview-info">
                        <div class="preview-text">{{ $v('예상 금액') }}</div>
                        <div class="preview-price">{{ showPrice(sb) }}</div>
                        <div
                          class="preview-rate"
                          v-if="showPriceDiff(sb)"
                        >({{ priceDiff(sb) }})</div>
                      </span>
                    </div>
                    <!-- /. 예상금액 -->

                    <div
                      class="basket-types"
                      @click="$emit('item-detail', sb)"
                    >
                      <div :class="['basket-types-badge', setOrderType(sb.resourceType).css]">
                        <!-- 상태(신규/변경/삭제) -->
                        {{ setOrderType(sb.resourceType).label }}
                      </div>
                      <div class="basket-types-main">
                        <div class="basket-types-main__title">
                          {{ sb.orderDataForTicket ? sb.orderDataForTicket.name : '-' }}
                          <!-- /. 호스트명/보안그룹명 등... -->
                        </div>
                        <div class="basket-types-main__author">
                          <span class="basket-types-main__author-text">
                            {{ $v('요청자') }}
                          </span>
                          <span class="basket-types-main__author-value">
                            {{ sb.userId }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <!-- /. [신규/변경/삭제] 배지, 호스트명, 요청자 -->

                    <source-basket-list-column
                      :data="sb"
                      :binding="key"
                    />
                    <!-- @click="$emit('item-detail', sb)" -->
                    <!-- /. 컬럼 정보 -->
                  </div>
                </li>
              </ul>
              <!-- /. 자원 목록 -->
            </template>
          </g-foldable>
        </div>
      </template>
    </g-tab>
  </div>
</template>

<script>
import GFoldable from '@/components/common/g-foldable/g-foldable'

// import TaskCompute from '../TaskResource/TaskCompute/TaskCompute'
// import TaskMarketplace from '../TaskResource/TaskMarketplace/TaskMarketplace'
// import TaskDatabase from '../TaskResource/TaskDatabase/TaskDatabase'
// import TaskStorage from '../TaskResource/TaskStorage/TaskStorage'
// import TaskL4 from '../TaskResource/TaskL4/TaskL4'
// import TaskL7 from '../TaskResource/TaskL7/TaskL7'
// import TaskSecurity from '../TaskResource/TaskSecurity/TaskSecurity'
// import TaskFileServer from '../TaskResource/TaskFileServer/TaskFileServer'
// import TaskVMware from '../TaskResource/TaskVMware/TaskVMware'
// import TaskVMStorage from '../TaskResource/TaskVMStorage/TaskVMStorage'
import TaskDetailCommon from '../TaskDetailCommon'
import SourceBasketListColumn from './SourceBasketList.script'
import {
  setOrderDataCOMPUTE,
  setOrderDataSECURITY,
  setOrderDataNETWORKL4,
  setOrderDataNETWORKL7,
  setOrderDataSTORAGE,
  setOrderDataDATABASE,
  setOrderDataMARKET,
  setOrderDataSHARE,
  setOrderDataEC2,
  setOrderDataEFS,
  setOrderDataSG,
  setOrderDataTARGETGROUP,
  setOrderDataNLB,
  setOrderDataTGW,
  setOrderDataVM,
  setOrderDataVSAN
} from './SourceBasketModules.script'

import { roleMixin } from '@/utils/work/role.js'

export default {
  name: 'TaskResourceUser',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    type: (root) => (root.$route.name.replace(/-detail|task-/, '').toUpperCase()) // 현재 페이지가 [사전협의/할일/한일/결재신청/결재함] 상세중 어딘지 알랴줌
  },
  components: {
    'g-foldable': GFoldable,
    SourceBasketListColumn

    // 'task-compute': TaskCompute,
    // 'task-marketplace': TaskMarketplace,
    // 'task-database': TaskDatabase,
    // 'task-storage': TaskStorage,
    // 'task-l4': TaskL4,
    // 'task-l7': TaskL7,
    // 'task-security': TaskSecurity,
    // 'task-file-server': TaskFileServer,
    // 'task-vmware': TaskVMware,
    // 'task-vmware-storage': TaskVMStorage
  },
  mixins: [TaskDetailCommon, roleMixin],
  created () {
    console.log('@@ TYPE', this.type)
    this.setTabs(this.data)
  },
  watch: {
    data (data) {
      // console.log(data)

      if (this.tabs.length) {
        const tab = (this.open.field) ? this.open : this.tabs[0]
        this.saveTab(tab) // 데이터 새로 저장하기 직전에 탭 정보 저장하기
      }

      this.setTabs(data)
      this.keepTab(this.open)
    }
  },
  methods: {
    /**
     * Tab 정보 가공
     * @param {Array} workRsps 자원 정보 목록
     */
    setTabs (orderItemRsps) {
      // 데이터 세팅 시작
      const setTabs = {}
      // const roleSetting = {} // 보고서, 결재설정 정보 분리

      orderItemRsps.forEach(({
        orderItemRspList: source, // 자원목록
        roleIdx, roleName
      }) => {
        const services = {} // COMPUTE / NEWTORK / STORAGE / DATABASE ... 분류
        // let block = false // 버튼 차단

        for (let i = 0; i < source.length; i++) {
        //   const { idx: srcIdx, workItemSpec, workItemConfig, autoScheduleAt, workItemState, resourceType, memo } = source[i]
          const { data: item, resourceType, orderItemIdx } = source[i]
          let { service } = source[i]
          // console.log(source[i], 'source[i]')

          // 특정 자원은 내부에서 데이터를 분리해주어야함 ㅎㅠ 예외파티~
          service = this.serviceDistributor(service)
          const basketData = this.serviceDataFormat(service, { orderData: JSON.parse(item) })

          const data = {
            orderItemIdx,
            resourceType,
            ...basketData,
            ...source[i]
            // ...JSON.parse(item)
          }
          console.log(data, service, 'data')

          if (services[service] === undefined) services[service] = [data]
          else services[service].push(data)

          this.orderType = resourceType // NEW|CHANGE|DELETE=
        }

        const key = `${roleIdx}_${roleName}`

        // // role 기반으로 데이터 분리 및 저장
        if (setTabs[key]) setTabs[key] = { ...services }
        else setTabs[key] = { ...setTabs[key], ...services }
      })

      this.tabs = [] // role 기반 분리

      // tab 설정
      for (const key in setTabs) {
        let count = 0
        for (const src in setTabs[key]) count += setTabs[key][src]?.length

        const roleName = key.split('_')[1]
        const roleIdx = key.split('_')[0]

        // console.log(key, roleSetting[key])
        // const setting = roleSetting[key]
        // const workId = setting.workId

        // const tab = { field: key, name: roleName, roleIdx, count, workId, setting }
        const tab = { field: key, name: roleName, roleIdx, count }
        this.tabs.push(tab)
      }

      // console.log(this.tabs)
      // this.tabs = this.tabs.filter(tab => tab && tab.count > 0) // 역할 서비스 카운트 존재 시 탭 담기

      this.roleData = setTabs // 자원 기반 분리
      console.log(this.roleData, '엉?')
      // this.$emit('role-data', this.roleData)
    },

    /**
     * 같은 서비스 자원인데, 내부에서 분리가 필요한 경우
     * @param {String} service
     */
    serviceDistributor (service) {
      const key = {
        COMPUTE_BY_TEMPLATE: 'COMPUTE',
        VM_BY_TEMPLATE: 'VM'
      }[service]

      // 굳이 분리해줄 필요 없는 경우는 그냥 그대로 사용
      if (!key) return service
      else return key
    },

    serviceDataFormat (service, item) {
      const func = {
        COMPUTE: setOrderDataCOMPUTE,
        SECURITY: setOrderDataSECURITY,
        NETWORK_L4: setOrderDataNETWORKL4,
        NETWORK_L7: setOrderDataNETWORKL7,
        STORAGE: setOrderDataSTORAGE,
        DATABASE: setOrderDataDATABASE,
        MARKET: setOrderDataMARKET,
        FILE_SERVER: setOrderDataSHARE,
        EC2: setOrderDataEC2,
        EFS: setOrderDataEFS,
        SG: setOrderDataSG,
        TARGET_GROUP: setOrderDataTARGETGROUP,
        NLB_L4: setOrderDataNLB,
        TRANSIT_GATEWAY: setOrderDataTGW,
        VM: setOrderDataVM,
        VSAN_ISCSI: setOrderDataVSAN
      }[service]

      // console.log(func(item), 'sjsl?')
      return func(item)
    },

    // ============================================
    // =================== 기타 ====================
    // ============================================

    /**
     * 현재 보고있는 TAB 정보 저장 함수
     * @param {Object} tab 탭 정보 (field) 키는 필수입니다.
     */
    saveTab  ({ field, ...tab }) {
      const folder = this.$refs.confList
      const states = folder.map(({ foldState }) => foldState) // 폴더 상태 저장
      this.open = { field, states }
    },
    /**
     * 저장된 탭 정보 불러와서 유지해줌
     * @param {Object} tab
     */
    keepTab (open = this.open) {
      if (!this.tabs.length) return

      this.$nextTick(() => {
        // 탭 자동 설정
        for (let i = 0; i < this.tabs.length; i++) {
          const tab = this.tabs[i]
          if (tab.field === open.field) {
            this.$refs.resource.clickEvent(tab, i)
            break
          }
        }

        // 왜 폴더 여는건 안돼 ㅠㅠ 🟧🟧🟧🟧🟧
        // const folder = this.$refs.confList
        // console.log(folder, 'ddddd')
        // // folder state 자동 설정
        // for (let i = 0; i < folder.length; i++) {
        // // console.log(folder[i], open.states[i])
        //   // folder[i].foldState = true
        //   folder[i].foldState = open.states[i]
        // }
      })
    }
  },
  data: root => ({
    orderType: 'NEW',
    tabs: [],
    open: { field: null, states: null }, // 최근에 열려있던 정보 저장
    roleData: [],
    setComponent (key) {
      return {
        COMPUTE: 'task-compute',
        STORAGE: 'task-storage',
        SECURITY: 'task-security',
        NETWORK_L4: 'task-l4',
        NETWORK_L7: 'task-l7',
        MARKET: 'task-marketplace',
        DATABASE: 'task-database',
        FILE_SERVER: 'task-file-server',
        VM: 'task-vmware',
        VSAN_ISCSI: 'task-vmware-storage'
      }[key]
    },

    setCount (key, length) {
      return `${key} (총 ${length}건)`
    },

    /**
     * 각 자원 편집 가능여부 확인
     * @param {Object} tab
     */
    setEditable: (item, { setting }) => {
      const { block, workState } = setting
      const [{ isExecutable }] = item

      const mustDisabled = /APPROVED|APPLY-APPROVAL/g

      if (
        this.readOnly ||
        block || // INSUFFICIENT 일때 편집 불가능
        !isExecutable || // 자원의 "실행권한" 여부 체크 -> false 라면 읽기전용
        mustDisabled.test(this.type) // 결재 관련 진행중이라면 읽기전용
      ) return false // 반드시 읽기전용이어야하는 경우

      // 연관자원일 때 {현재 보고있는 페이지 vs 현재 진행중인 상태값}이 서로 다른 경우가 있음 (상태값이 같은 경우에만 열어줘야함)
      const REVIEW = this.type === 'CONFERENCE' && /REVIEW/g.test(workState)
      const TODO = this.type === 'TODO' && /TODO/g.test(workState)
      // console.log(this.type, workState)

      return {
        REVIEW,
        CANCELED: true,
        APPROVAL1: false, // 사전협의 결재 대기중
        APPROVAL1_REJECTED: true, // 사전협의 결재 반려
        TODO, // 할일
        TODO_FINISHED: false, // 할일 완료
        APPROVAL2: false, // 할일 결재 대기중
        APPROVAL2_REJECTED: true, // 할일 결재 반려
        DONE: false // 한일
      }[workState]
    },

    currPage: 1,
    perPage: 5,
    info: [],
    activeDetailModal: false,
    checkedItems: [],
    convertFailMessage (raw) {
    // [시뮬레이션] 실패사유 JSON 데이터 가공 (🟡 JSON 데이터가 풀로 나오지 않은 상태)
    // const message = raw.split(' : ')[1]
    // const result = JSON.parse(message).map(({ code, message }) => {
    //   return `${code} : ${message}`
    // })
    // return result.join('<br>')
      return raw
    },
    simulationTags: {
      PROCEED: { type: 'progress', tag: root.$v('진행중') },
      DONE: { type: 'running', tag: root.$v('사용 가능') },
      ERROR: { type: 'error', tag: root.$v('실패') }
    },
    isAWS: ({ service }) => /EC2|EFS|EBS|SG|TARGET_GROUP|NLB_L4/g.test(service), // AWS (true) || NTX (false)
    setOrderType (type) {
      return {
        NEW: { label: root.$v('신규'), css: '-new' },
        CHANGE: { label: root.$v('변경'), css: '-change' },
        DELETE: { label: root.$v('삭제'), css: '-delete' }
      }[type]
    },
    /**
   *
   * AWS (true) || NTX (false)
   */
    showPrice ({ price, service }) {
      if (/NETWORK|SECURITY/g.test(service)) return '-'
      const currency = root.isAWS({ service }) ? '$' : '원'

      return root.isAWS({ service }) ? `${currency} ${price}` : `${price.toLocaleString()}${currency}`
    },
    /**
   * 예상 금액 차이 있는경우 차이를 보여줌
   */
    showPriceDiff ({ beforePrice, price }) {
      if (beforePrice === 0) return false
      if (price - beforePrice > 0) return true
    },
    /**
   * 체크박스 disabled 조건
   * 1) [장바구니] 에서 같은 종류의 자원끼리만 체크할 수 있음
   * 2) [장바구니] AWS 에서 시뮬레이션 [작업중] 이 아닌 자원만 체크할 수 있음
   * 3) [주문함] 주문함에서만 해당 && [작업실패|주문취소] 자원인 경우에만 체크할 수 있음
   * 4) [주문함] 주문함에서만 해당 && [일반] 자원인 경우만 체크할 수 있음 ([긴급] 여부를 가져오려면 ㅠㅠ 코드가 지저분... ^^)
   */
    setCheckbocDisabled (sb) {
      const condition1 = this.checkFirstRow(sb.resourceType)
      const condition2 = this.disabledBasedOnSimulation(undefined, sb)
      const condition3 = this.checkboxOnly && !this.showFailMessage(sb)
      const condition4 = (this.type === 'order') ? this.$parent?.$parent?.$parent?.taskData?.orderType === 'URGENT' : false

      return condition1 || condition2 || condition3 || condition4
    },
    /**
   * 작업 상태 노출
   */
    showProcessStatus ({ orderItemStatus }) {
    // 주문함 상세에서만 노출
      return root.type === 'order' && orderItemStatus !== 'PLACED'
    },
    /**
   * 작업 상태 설정
   */
    processStatusContent ({ orderItemStatus }) {
      return {
        WAIT: { label: root.$v('작업 대기'), cssClass: 'is-wait' },
        PROCEED: { label: root.$v('작업중'), cssClass: 'is-ing' },
        CANCELED: { label: root.$v('주문 취소'), cssClass: 'is-blue' },
        FAILED: { label: root.$v('작업 실패'), cssClass: 'is-fail' },
        REJECT: { label: root.$v('반려'), cssClass: 'is-blue' },
        DONE: { label: root.$v('작업 완료'), cssClass: 'is-complete' }
      }[orderItemStatus]
    },
    /**
   * 작업 상태 (주문취소, 실패) 인지 확인
   * + 사유 노출 여부 설정
   */
    showFailMessage ({ orderItemStatus }) {
    // 주문함 상세 사유 노출
      return orderItemStatus === 'CANCELED' || orderItemStatus === 'FAILED' || orderItemStatus === 'REJECT'
    },
    /**
   * 예상 금액 차이 입력
   * AWS (true) || NTX (false)
   */
    priceDiff ({ beforePrice, price, service }) {
      const currency = root.isAWS({ service }) ? '$' : ' 원'
      const plus = (price - beforePrice) > 0
      const flag = plus ? '+' : '-'
      const abs = Math.abs(price) - Math.abs(beforePrice)

      return root.isAWS({ service }) ? `${flag}${currency} ${abs}` : `${flag} ${abs.toLocaleString()}${currency}`
    },
    setTitle (title) {
      const titleKo = {
        SECURITY_GROUP: root.$v('보안그룹'),
        TARGET_GROUP: root.$v('대상그룹'),
        LOADBALANCER: root.$v('로드밸런서')
      }[title]

      return titleKo || title
    },
    checkFirstRow (resourceType) {
      const firstRow = root.$parent.firstCheckedRow
      return (firstRow && firstRow.resourceType) ? (firstRow.resourceType !== resourceType) : false
    }
  })
}
</script>

<style lang="scss" scoped>

.view-count {
  display: inline-block;
  font-size: 12px;
  margin-left: $gap-s;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  color: $white;
  border-radius: 50%;
  background-color: $main-red;
}

.sb {
  &-wrap {
    border: 1px solid #cbced0;
    border-left: none;
    border-right: none;
    overflow-x: scroll;

    > li + li {
      border-top: 1px solid #cbced0;
    }

    .basket {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      min-height: 188px;
      // overflow: hidden;

      > * { height: 188px; }

      &-types,
      &-info { cursor: pointer; }

      &-price {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        flex: 0 1 180px;
        border-right: 1px solid #e0e0e0;
        position: relative;

        &.-center { justify-content: center; }

        > * { display: inline-block; }

        > .basket-check {
          // margin-right: 35px;
          margin-left: 10px;
        }

        .preview {
          &-info {
            display: flex;
            align-items: center;
            flex-direction: column;
            flex: 1 1 auto;
          }

          &-text {
            margin-bottom: $gap-s;
            font-size: 13px;
            font-weight: 400;
            color: #666;
          }

          &-price {
            color: $main-blue;
            font-size: 23px;
            font-weight: bold;
          }

          &-rate {
            margin-top: 5px;
            color: $main-blue;
            font-weight: 400;
          }

          &-status {
            margin-top: 5px;
          }
        }

        .reorder {
          background: $warn;
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 0px 0px 2px 0px;
          color: $white;
          font-size: 11px;
          padding: 4px 5px;
          z-index: 2;
        }
      }

      &-types {
        position: relative;
        overflow: hidden;

        &-badge {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 0px 0px 2px 0px;
          color: $white;
          font-size: 11px;
          padding: 4px 5px;

          &.-new { background: $main-blue; }
          &.-change { background: $warn; }
          &.-delete { background: $text-lighter-gray; }
        }

        &-main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          padding: 0 60px 0 30px;

          &__title {
            font-weight: bold;
            font-size: 18px;
            width: 250px;
            margin-bottom: $gap-s;
            word-break: break-all;
          }

          &__author {
            &-text {
              color: $text-lighter-gray;
            }
          }
        }
      }

      &::v-deep .basket-info {
          width: 800px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;

          &-wrapper {
            display: flex;
            flex-wrap: nowrap;
          }

          &-top {
            padding-bottom: 25px;
            margin-bottom: 25px;
            border-bottom: 1px solid #f0f0f0;
          }

          .title {
            color: $text-lighter-gray;
            margin-bottom: $gap-s;
          }

          .start-col1_1 { flex: 0 0 135px; }
          .start-col1_2 { flex: 0 0 145px; }
          .start-col2 { flex: 0 0 280px; }
          .start-col3 { flex: 0 0 450px; }

          .middle-col1_1 { flex: 0 0 170px; }
          .middle-col1_2 { flex: 0 0 215px; }
          .middle-col1_3 { flex: 0 0 145px; }
          .middle-col2 { flex: 1 1 auto; }

          .end { flex: 0 0 180px; }
        }

      &-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        flex: 1;

        &-status {
          display: inline-block;
          margin-top: $gap-s;
        }

        > :first-child {

          & > * + * {
            margin-left: 3px;
          }

          &.disabled {
            & > * {
              cursor: not-allowed !important;
              color: #e0e0e0 !important;
            }
          }

          & > * {
            padding: 5px;
            color: #9596a0 !important;

            &:hover {
              * { color: #333 !important; }
            }
          }
        }
      }
    }
  }

  .pagination-wrap {
    margin-top: 45px;
  }
}

</style>
