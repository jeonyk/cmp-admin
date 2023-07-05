<template>
  <div
    class="sb-wrapper"
    v-if="items.length"
  >
    <!-- 🟨 {{ type }} -->
    <source-basket-folder
      :title="setTitle(title)"
      :info="info"
      :order-no="orderNo"
      :type="type"
    >
      <div class="sb">
        <ul class="sb-wrap">
          <li
            v-for="(sb, index) in itemWithPaginate"
            :key="index"
            class="sb-wrap-item"
          >
            <div :class="['basket', { '-ntx': !isAWS(sb) }]">
              <div :class="['basket-price', { '-center': !useActions }]">
                <span
                  v-if="useActions || checkboxOnly"
                  class="basket-check"
                >
                  <el-tooltip
                    effect="light"
                    placement="top"
                    :disabled="setCheckbocDisabled(sb) || checkboxOnly"
                  >
                    <el-checkbox
                      :disabled="setCheckbocDisabled(sb)"
                      v-model="sb.checked"
                      @change="onChangeCheckbox(sb.checked, sb._index)"
                    />

                    <span
                      slot="content"
                      style="display: block; color: #d95252; text-align: center"
                      v-html="$v('❖ 신규/변경/삭제는 동시에 주문할 수 없으며,<br>각각 주문할 수 있습니다.')"
                    />
                    <!-- tooltip 은 장바구니에서만 보여져야함! -->
                  </el-tooltip>
                </span>

                <span class="preview-info">
                  <div class="preview-text">{{ $v('예상 금액') }}</div>
                  <div class="preview-price">{{ showPrice(sb) }}</div>
                  <div
                    class="preview-rate"
                    v-if="showPriceDiff(sb)"
                  >({{ priceDiff(sb) }})</div>

                  <!-- [주문 취소 / 실패] 사유 -->
                  <div
                    class="preview-rate"
                    v-if="showProcessStatus(sb)"
                  >
                    <el-tooltip
                      effect="light"
                      placement="bottom"
                      :disabled="!showFailMessage(sb)"
                    >
                      <cmp-status-tag
                        :type="processStatusContent(sb).cssClass"
                        :contents="processStatusContent(sb).label"
                      />

                      <span
                        style="display: block; color: #d95252; text-align: center; max-width: 200px;"
                        slot="content"
                        v-if="showFailMessage(sb)"
                      >
                        {{ sb.memo }}
                      </span>
                    </el-tooltip>
                  </div>
                </span>

                <el-tooltip
                  effect="light"
                  placement="top"
                  v-if="sb.note"
                >
                  <div class="reorder">
                    {{ $v('재주문') }}
                  </div>

                  <!-- 재주문 사유 -->
                  <div
                    class="reorder-reason"
                    slot="content"
                    v-html="sb.note"
                  />
                </el-tooltip>
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
                :binding="binding.toUpperCase()"
                @click="$emit('item-detail', sb)"
              />
              <!-- /. 컬럼 정보 -->

              <div
                v-if="useActions && !sb.isUrgent"
                class="basket-actions"
              >
                <div class="basket-actions-icon">
                  <pencil-icon
                    :is-button="!setDisableButton('isRead', sb)"
                    :disabled="setDisableButton('isRead', sb)"
                    @click="onClickEdit(sb)"
                  />
                  <document-icon
                    :is-button="!setDisableButton('isCreate', sb)"
                    :disabled="setDisableButton('isCreate', sb)"
                    @click="onClickCopy(sb)"
                  />
                  <trash-icon
                    :is-button="!setDisableButton('isUpdate', sb)"
                    :disabled="setDisableButton('isUpdate', sb)"
                    @click="onClickRemove(sb)"
                  />
                </div>
                <!-- /. [수정 복사 삭제] 버튼 -->

                <!-- {{ sb.simulationStatus }}
                {{ setDisableButton('isRead', sb) }}
                {{ setDisableButton('isCreate', sb) }}
                {{ setDisableButton('isUpdate', sb) }} -->
                <div
                  class="basket-actions-status"
                  v-if="sb.simulationStatus"
                >
                  <el-tooltip
                    v-if="sb.simulationStatus === 'ERROR'"
                    placement="bottom"
                    popper-class="shade-popper error-reason"
                    effect="light"
                    :content="convertFailMessage(sb.failMessage)"
                  >
                    <new-status-tag :tag-type="simulationTags[sb.simulationStatus].type">
                      {{ simulationTags[sb.simulationStatus].tag }}
                    </new-status-tag>
                  </el-tooltip>
                  <!-- /. 시뮬레이션 상태 with 실패사유 -->

                  <new-status-tag
                    v-else
                    :tag-type="simulationTags[sb.simulationStatus].type"
                  >
                    {{ simulationTags[sb.simulationStatus].tag }}
                  </new-status-tag>
                  <!-- /. 시뮬레이션 상태 -->
                  <!-- 진행 중, 사용 가능, 실패 -->
                </div>
              </div>
            </div>
          </li>
        </ul>

        <div
          v-if="items.length > perPage"
          class="pagination-wrap"
        >
          <el-pagination
            :current-page="currPage"
            :total="items.length"
            :page-size="perPage"
            @current-change="onChangePage"
            layout="prev, pager, next"
          />
        </div>
      </div>
    </source-basket-folder>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'

import SourceBasketFolder from '@/components/common/g-foldable/SourceBasketFolder.vue'
import PencilIcon from '@/components/Icons/PencilIcon.vue'
import DocumentIcon from '@/components/Icons/DocumentIcon.vue'
import TrashIcon from '@/components/Icons/TrashIcon.vue'
import SourceBasketListColumn from './SourceBasketList.script'
import { cloneDeep } from 'lodash'

export default {
  name: 'AWSViewSourceBasketList',
  components: {
    PencilIcon,
    DocumentIcon,
    TrashIcon,
    SourceBasketListColumn,
    SourceBasketFolder
  },
  props: {
    /**
     * 자원 이름
     */
    title: {
      type: String,
      default: undefined
    },
    /**
     * 자원 바인딩명
     */
    binding: {
      type: String,
      default: undefined
    },
    /**
     * [장바구니/주문함/결재함] 타입
     */
    type: {
      type: String,
      default: 'basket',
      validator: type => {
        return ['basket', 'order', 'approval'].includes(type)
      }
    },
    /**
     * 리스트 우측 액션 영역 렌더링 여부
     * 장바구니에서 사용, 나머지 주문함 상세 등에서 미사용
     */
    useActions: {
      type: Boolean,
      default: false
    },
    /**
     * 장바구니 리스트
     */
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    orderNo: { // [결재함 > 주문티켓] 에는 orderNo 가 있습니다
      type: String,
      default: undefined
    },
    /**
     * 클릭 가능한지 여부
     * - 장바구니 외 다른 페이지에서 클릭이 불가능하게
     */
    clickableItem: {
      type: Boolean,
      default: false
    },
    authDisabled: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    ...mapGetters({
      fullLayout: 'common/getFullLayout'
    }),
    itemWithPaginate () {
      const sliced = this.setPagenatedItems()

      // 자원목록에 변화가 있어서 페이지가 앞으로 이동해야하는 경우는
      // 한번 더 실행하기 (이전페이지로 이동 및 데이터 세팅)
      if (!sliced.length) {
        this.onChangePage(this.currPage - 1)
        return this.setPagenatedItems()
      }

      return sliced
    },
    /**
     * 편집 불가 + 체크박스만 사용할것인지 확인 => [주문함] 에서만
     */
    checkboxOnly () {
      return this.type === 'order'
    }
  },
  watch: {
    items () {
      this.items.forEach((item, idx) => {
        item._index = idx
        item.checked = false // 미리 데이터 프로퍼티 세팅해놓기
      })
      this.info = this.setInfos(this.items)
    }
  },
  mounted () {
    this.info = this.setInfos(this.items)
    this.setFullLayout(true)
    this.totalItems = this.items.length
  },
  beforeDestroy () {
    this.setFullLayout(false)
  },
  methods: {
    ...mapMutations({
      setFullLayout: 'common/SET_FULL_LAYOUT'
    }),
    test (sliced) {
      if (!sliced.length) {
        this.onChangePage(this.currPage - 1)
      }
    },
    onClickEdit (sb) {
      this.$emit('item-edit', sb)
    },
    onClickCopy (sb) {
      this.$emit('item-copy', sb)
    },
    onClickRemove (sb) {
      this.$emit('item-remove', sb)
    },
    onChangePage (page) {
      this.currPage = page
      window.scrollTo({ top: this.$el.offsetTop, behavior: 'smooth' })
      this.$forceUpdate()
    },
    setPagenatedItems () {
      const start = (this.currPage - 1) * this.perPage
      const end = start + this.perPage

      return cloneDeep(this.items.slice(start, end))
    },
    /**
     * 체크박스 변경이벤트
     */
    onChangeCheckbox (checked, index) {
      this.items[index].checked = checked
      this.checkedItem = this.items.filter(item => item.checked === true)
      this.$forceUpdate()

      return this.$emit('checked', this.checkedItem)
    },
    calculatePriceDiff ({ beforePrice, price }) {
      return (price - beforePrice) > 0 ? (price - beforePrice) : false
    },
    /**
     * 폴더 타이틀에 개수를 표기하기 위해 [신규/변경/삭제] 정보 세팅해서 info 개수 저장
     * @param {Array} items 그리드 데이터
     * @return {Array} result 그리드 데이터 갯수 확인
     */
    setInfos (items = this.items) {
      const count = { NEW: null, CHANGE: null, DELETE: null } // 각 개수(EA)
      const names = { NEW: '신규', CHANGE: '변경', DELETE: '삭제' } // 이름
      const func = cnt => { count[cnt] += 1 }
      items.forEach(item => func(item.resourceType))

      const result = []
      for (const key in count) {
        if (count[key] !== null) {
          const info = { label: names[key], cnt: count[key] }
          result.push(info)
        }
      }

      // 형식 :: [ { label: '신규', cnt: 1 }, { label: '변경', cnt: 4 }, { label: '삭제', cnt: 5 } ]
      return result
    },
    /**
     * 자원 [수정/복사/삭제] 관련 disabled 처리
     * 조건 1. NTX Network 인지 판단
     * 조건 2. AWS simulation 상태 판단
     * 조건 3. 초대받은 계정의 권한에 따라 판단
     */
    setDisableButton (key, sb) {
      // 조건 1.
      // NTX 네트워크 자원은 [복사] 기능이 없음 (disabled 처리)
      // AWS 네트워크 자원(NLB, SG, TG)은 [수정/복사] 기능이 없음
      // NTX/AWS [변경] 지원은 [복사] 기능이 없음 (disabled 처리)
      // NTX/AWS [삭제] 자원은 [수정/복사] 기능이 없음
      if (
        (sb !== undefined && /isCreate|isDelete/g.test(key) && /NETWORK|SECURITY/g.test(sb.service)) ||
        (/isCreate/g.test(key) && sb.resourceType === 'CHANGE') ||
        (/isCreate|isRead/g.test(key) && sb.resourceType === 'DELETE') ||
        (/isCreate/g.test(key) && sb.service === 'TRANSIT_GATEWAY')
      ) return true

      // 조건 2. 시뮬레이션 상태 판단
      const simulation = this.disabledBasedOnSimulation(key, sb)

      // 조건 3. 권한에 따라서 차단 여부 결정
      const auth = this.authDisabled ? !this.authDisabled[key] : false

      return simulation || auth
    },
    disabledBasedOnSimulation (key, sb) {
      const setStatus = {
        PROCEED: true, // [진행중] 인경우는 모두 비활성화
        DONE: false, // [사용 가능] 인경우는 모두 사용가능

        // (key가 있는경우) ? [실패] 인 경우는 복사(isCreate)만 비활성화하도록 설정 해야하므로 상태 확인
        // key 가 없으면 무조건 비활성화 ([장바구니 > 체크박스] 에서만 key가 없을 예정)
        ERROR: key ? (key === 'isCreate') : true
      }[sb.simulationStatus]

      return setStatus === undefined ? false : setStatus
    }
  },
  data: root => ({
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
.sb-wrapper {
  .sb-options {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    margin-bottom: 15px;
    align-items: center;
  }
}

.sb {
  &-wrap {
    border: 1px solid #cbced0;
    border-left: none;
    border-right: none;

    > li + li {
      border-top: 1px solid #cbced0;
    }

    .basket {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      min-height: 188px;
      overflow: hidden;

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
            color: $main-red;
            font-size: 23px;
            font-weight: bold;
          }

          &-rate {
            margin-top: 5px;
            color: $main-red;
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

          &.-new { background: $main-red; }
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

<style lang="scss">
.error-reason {
  max-width: 300px;
}

.reorder-reason {
  max-width: 300px;

  b { color: $main-red }
  p {
    font-weight: normal;
    margin-top: 5px;
    line-height: 2;
  }
}
</style>
