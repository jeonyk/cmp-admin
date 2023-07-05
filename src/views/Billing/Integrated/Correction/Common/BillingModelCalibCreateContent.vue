<template>
  <div
    class="billing-model-calib-create-wrap"
  >
    <!-- SECTION - 좌측 대시보드 -->
    <billing-model-calib-create-select-board
      :items="centerList"
      :is-server="isServer"
      :server-map="serverMap"
      :grid-data="modelItems"
      :fallback-update-model="fallbackUpdateModel"
      @fetch-model="model => $emit('fetch-model', model)"
      @load-models="models => $emit('load-models', models)"
    />
    <!-- !SECTION - 좌측 대시보드 -->

    <!-- (중앙 대시보드)선택된 서버의 정보 -->
    <dashboard-panel
      class="dashboard__center"
      :class="{ 'dashoard__center__no-empty': modelItems && modelItems.length }"
      :padding-top="0"
    >
      <h3
        v-if="isServer"
        class="center-title"
      >
        {{ $v("서버 정보") }}
      </h3>
      <h3
        v-else
        class="center-title"
      >
        {{ $v('관계사 정보') }}
      </h3>

      <cmp-grid
        v-if="modelItems && modelItems.length"
        :item-source="modelItems"
        :columns="listColumns"
        :init-auto-select-row="modelItems[0]"
        :init-custom-action="onInitContentGrid"
        init-auto-select-row-key="__ui_uid__"
        class="server-list"
        keep-select
        selectable
        key="content-list"
        ref="registerContentList"
        @selectedRow="onSelectContent"
      >
        <template #index="{ row }">
          {{ row.index + 1 }}
        </template>
        <template #ipAddress="{ row }">
          <span v-if="row.moduleType === 'VMware' && row.ipAddress && row.ipAddress.length === 1">
            {{ row.ipAddress[0] }}
          </span>
          <el-tooltip
            v-else-if="row.moduleType === 'VMware' && row.ipAddress && row.ipAddress.length > 1"
            effect="light"
          >
            <span>{{ row.ipAddress[0] }} 외 {{ row.ipAddress.length - 1 }}</span>
            <div slot="content">
              <div
                v-for="ip in row.ipAddress"
                :key="ip"
              >
                {{ ip }}
              </div>
            </div>
          </el-tooltip>
        </template>
        <template #__ui_action__="{ row }">
          <trash-icon
            class="trash-icon"
            icon-color="#727797"
            is-button
            :add-class="false"
            @click="() => onRemoveRegisteredItem(row)"
          />
        </template>
      </cmp-grid>

      <div
        v-else
        class="server-list__empty empty-data"
      >
        보정할 {{ displayServerOrCompay }}를 추가해주세요.
      </div>
      <billing-add-model-btn
        @click="$emit('add-server-or-company')"
        :text="`${displayServerOrCompay} 추가`"
      />
    </dashboard-panel>
    <div
      class="dashboard__right"
    >
      <div class="dashboard__right-head">
        <h3 class="center-title">
          {{ isServer ? $v('서버') : $v('관계사') }}별 보정 상세
        </h3>
      </div>
      <div
        v-if="selectedServer"
        class="dashboard__right-body"
      >
        <div
          v-if="isServer"
          class="grid-wrap"
        >
          <cmp-grid
            :item-source="[selectedServer]"
            :columns="serverDetailTopColumn"
            skip-map-index
            key="detail-content-top"
          />
          <cmp-grid
            :item-source="[selectedServer]"
            :columns="serverDetailBottomColumn"
            skip-map-index
            key="detail-content-bottom"
          />
        </div>
        <template v-if="selectedServer && selectedServer.corrections && correctionClasses.length">
          <billing-model-calib-regist-form
            v-for="(item, index) in selectedServer.corrections"
            :key="getRenderKey(item.hostName)"
            :correction-item="item"
            :correction-classes="correctionClasses"
            @inject-uid="(uid) => onInjectUidCorrectionItem(item, uid, index)"
            @request-remove="onClickRemoveCorrectionItem"
            @sync-correction-item="onSyncCorrectionItem"
          />
          <billing-add-model-btn
            class="calib-add-button"
            @click="handleClickAddCalib"
            :text="$v('보정 추가')"
          />
        </template>
      </div>
      <div
        v-else
        class="no-select-server"
      >
        <div class="empty-data">
          {{ isServer ? $v('선택한 서버가 없습니다.') : $v('선택한 관계사가 없습니다.') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import BillingAddModelBtn from '../BillingAddModelBtn.vue'
import BillingModelCalibCreateSelectBoard from './BillingModelCalibCreateSelectBoard.vue'
import BillingModelCalibRegistForm from './BillingModelCalibRegistForm.vue'
import TrashIcon from '@/components/Icons/TrashIcon.vue'
import { uniqueId } from 'lodash'
import { EventBus } from '@/components/Billing/Correction/CorrectionEventBus'

export default {
  props: {
    isServer: {
      type: Boolean,
      default: true
    },
    modelItems: {
      type: Array,
      default () {
        return []
      }
    },
    centerList: {
      type: Array,
      default () {
        return []
      }
    },
    serverMap: {
      type: Object,
      default: () => null
    },
    fallbackUpdateModel: {
      type: Object,
      default: null
    }
  },
  components: {
    DashboardPanel,
    BillingAddModelBtn,
    BillingModelCalibCreateSelectBoard,
    BillingModelCalibRegistForm,
    TrashIcon
  },
  computed: {
    displayServerOrCompay () {
      return this.isServer ? this.$v('서버') : this.$v('관계사')
    },
    listColumns () {
      return this.columnByType[this.isServer ? 'server' : 'company']
    }
  },
  watch: {
  },
  created () {
    EventBus.$on('reset-form', this.resetForm)

    this.getCorrectionClasses()
  },
  methods: {
    /**
     * 폼 초기화
     */
    resetForm () {
      this.selectedServer = null
    },
    onInitContentGrid (grid) {
    },
    getRenderKey (hostName = 'correction-render-key-') {
      return uniqueId(hostName)
    },
    /**
     * 보정 분류 조회 (코드 관리)
     */
    async getCorrectionClasses () {
      try {
        this.isLoadingCorrectionClass = true
        const res = await API.config.getCodeList({ codeType: this.isServer ? 'ADJUSTMENT_AMOUNT' : 'COMPANY_ADJUSTMENT_AMOUNT' })
        this.correctionClasses = res
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 분류 목록 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingCorrectionClass = false
      }
    },
    /**
     * 자식 데이터와 부모 데이터 동기화
     */
    onSyncCorrectionItem (uid, form) {
      const findIndex = this.selectedServer?.corrections?.findIndex(item => item.__ui_uid__ === uid)
      if (findIndex !== -1) this.selectedServer.corrections[findIndex] = form
    },
    /**
     * 등록한 보정 삭제
     */
    onClickRemoveCorrectionItem (uid) {
      this.selectedServer.corrections = this.selectedServer.corrections
        .filter(correction => correction.__ui_uid__ !== uid)
    },
    /**
     * 화면에서 사용하기위한 유니크 아이디 할당
     */
    onInjectUidCorrectionItem (item, uid, index) {
      this.$set(this.selectedServer.corrections[index], '__ui_uid__', uid)
      // item.__ui_uid__ = uid
    },
    /**
     * 등록된 서버(관계사) 선택 이벤트
     */
    onSelectContent (row) {
      this.selectedServer = row ? row.dataItem : null
    },
    /**
     * 가운데 그리드 > 아이템 삭제
     */
    onRemoveRegisteredItem (row) {
      this.$confirm(this.isServer ? this.$v('등록한 서버를 삭제하시겠습니까?') : this.$v('등록한 관계사를 삭제하시겠습니까?'))
        .then(() => {
          if (this.modelItems.length === 1) {
            this.selectedServer = null
          }
          this.$emit('remove-register-item', row)
        })
        .catch(() => false)
    },
    /**
     * 등록된 서버(관계사)가 있을 경우 가장 첫번째 아이템을 선택함
     */
    selectFirstRow () {
      if (this.modelItems.length && this.$refs.registerContentList) {
        const contentRef = this.$refs.registerContentList
        contentRef.selectableHandler({ row: 0 }, contentRef.grid.rows)
      }
    },
    /**
     * 보정 추가 클릭 이벤트
     */
    handleClickAddCalib () {
      if (!this.selectedServer || !this.selectedServer.corrections) return

      this.selectedServer.corrections.push({
        discountClass: this.isServer ? 'billing_default' : 'default', // 회선, 소산 종류
        discountKinds: 'WON', // 금액, 비율 (WON, PER)
        discountPeriodBegin: null, // 보정 시작
        discountPeriodEnd: null, // 보정 종료
        discountPrice: 0, // 보정 금액
        hostName: this.selectedServer.hostName,
        vmUuid: this.selectedServer.vmUuid,
        discountReason: '',
        priceType: ''
      })
    }
  },
  data () {
    return {
      isLoadingCorrectionClass: false,
      correctionClasses: [],
      columnByType: {
        server: [
          { header: 'No', binding: 'index', width: 80, customHtml: true },
          { header: 'IP', binding: 'ipAddress', customHtml: true },
          { header: this.$v('호스트명'), binding: 'hostName' },
          { header: ' ', binding: '__ui_action__', customHtml: true, width: 50, filtable: false }
        ],
        company: [
          { header: 'No', binding: 'index', width: 80, customHtml: true },
          { header: this.$v('관계사명'), binding: 'groupName' },
          { header: ' ', binding: '__ui_action__', customHtml: true, width: 50, filtable: false }
        ]
      },
      selectedServer: null,
      serverDetailTopColumn: [
        { header: '관계사', binding: 'companyName', width: '*' },
        { header: '프로젝트', binding: 'projectName', width: '*' }
      ],
      serverDetailBottomColumn: [
        { header: 'IP', binding: 'ipAddress', width: '*' },
        { header: '호스트명', binding: 'hostName', width: '*' }
        // { header: '업무명', binding: 'taskName', width: '*' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-model-calib-create-wrap {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  height: 100%;
  width: 100%;

  > .dashboard__center {
    height: 100%;
    box-sizing: border-box;
    min-width: 440px;
    max-width: 440px;
    margin-right: $gap-m;
    border-radius: $radius;

    .content-title {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .server-list {
      margin: 25px 0;

      &::v-deep .trash-icon {
        :hover * {
          color: $primary !important;
          fill: $primary !important;
          stroke: $primary !important;
        }
      }
    }

    .server-list__empty {
      padding: 30px;
      text-align: center;
    }
    &.dashoard__center__no-empty {
      background: #0a0c20;
      padding: {
        left: 20px;
        right: 20px;
      }
    }
  }

  .dashboard__right {
    flex: 1;
    overflow: hidden;

    .no-select-server {
      .empty-data {
        min-height: 600px;
        border: 1px solid #3D435E;
        border-radius: 6px;
      }
    }

    .grid-wrap {
      margin-top: $gap;
    }

    &-body {
      > .correction + .correction {
        border-top: 1px dashed $purple-gray;
      }
    }
  }
}
</style>
