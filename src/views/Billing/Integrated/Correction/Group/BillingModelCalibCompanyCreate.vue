<template>
  <div
    v-loading="isLoadingGetData"
    class="billing-model-calib-company-create"
  >
    <billing-model-calib-create-content
      :model-columns="companyColumns"
      :model-items="companyItems"
      :is-server="false"
      @add-server-or-company="onClickAddContent"
      @remove-register-item="onRemoveRegisteredItem"
      @fetch-model="onFetchModel"
      @load-models="onLoadSimpleModels"
    />
    <el-dialog
      v-loading="isLoadingGroupList"
      :title="$v('관계사 추가')"
      width="800px"
      class="create-dialog"

      :visible="isOpenedCompanyAddModal"
      @close="isOpenedCompanyAddModal = false"
    >
      <!-- 버튼 및 태그확인 영역 -->
      <div class="form-wrap tiny-scroll">
        <div class="form">
          <div class="form-flex__row">
            <span class="form-label">{{ $v('과금 모델 적용') }}</span>
            <button
              class="button apply-btn"
              @click="isOpendBillingSelect=true"
            >
              {{ $v('과금 모델 선택') }}
            </button>
            <span
              v-if="selectedBillingModel"
              class="selected-model"
            >
              {{ selectedBillingModel.name }}
            </span>
          </div>
          <div class="form-flex__row">
            <span class="form-label">{{ $v('서버 보정 모델 적용') }}</span>
            <button
              class="button apply-btn"
              @click="isOpendCalibServerSelect= true"
            >
              {{ $v('보정 모델 선택') }}
            </button>
            <span
              v-if="selectedServerCorrModel"
              class="selected-model"
            >
              {{ selectedServerCorrModel.name }}
            </span>
          </div>
          <div class="form-flex__row">
            <span class="form-label">{{ $v('선택 관계사') }}</span>
            <span
              v-if="!checkedGridList.length"
              class="form-value__is-empty"
            >
              {{ $v('관계사를 선택해주세요.') }}
            </span>
            <span
              v-else
              class="form-value"
            >
              <clearable-tag
                v-for="group in checkedGridList"
                :key="group.groupIdx"
                unique-key="groupIdx"
                :content="group.groupName"
                @clear="() => onRemoveCheck(group)"
              />
            </span>
          </div>
        </div>

        <search-component
          @input="onChangeSearchGroup"
          :placeholder="$v('관계사 입력')"
          style="margin-bottom: 20px;"
        />

        <cmp-grid
          ref="groupGrid"
          :item-source="isSetFilter ? filterGridList : serverAddGridList"
          :columns="serverAddGridColumns"
          :changing-page-reset="false"
          use-checkbox
          header-checkbox
          @checkedRowsData="onCheckGroup"
        >
          <template #cost="{ row }">
            <!-- <cmp-status-tag
            v-if="
              simulateInterval.state === SIMULATE_STATE.PROGRESS &&
                !isLoadedPrevMonthBill
            "
            tag-type="progress"
          >
            {{ $v("진행중") }}
          </cmp-status-tag> -->
            <span v-if="!row.cost && row.cost === 0">
              0
            </span>
            <span v-else-if="!row.cost">
              -
            </span>
            <span v-else>
              {{ row.cost | moneyFormat }}
            </span>
          </template>
          <template #finishCost="{ row }">
            <cmp-status-tag
              v-if="simulateInterval.state === SIMULATE_STATE.PROGRESS"
              tag-type="progress"
            >
              {{ $v("진행중") }}
            </cmp-status-tag>
            <span v-else>
              <span v-if="!row.finishCost && row.finishCost === 0">
                0
              </span>
              <span v-else-if="!row.finishCost">
                -
              </span>
              <span v-else>
                {{ row.finishCost | moneyFormat }}
              </span>
            </span>
          </template>
        </cmp-grid>
      </div>

      <!--푸터 버튼 영역-->
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="isOpenedCompanyAddModal =false"
        >
          {{ $v('취소') }}
        </button>
        <button
          :disabled="!checkedGridList.length"
          class="button"
          type="is-primary"
          @click="registerGroups"
        >
          {{ $v('등록') }}
        </button>
      </section>
    </el-dialog>

    <!--과금모델 선택 (모달)-->
    <modal-billing-model-calib-billing-select
      :visible="isOpendBillingSelect"
      @close="isOpendBillingSelect=false"
      @register-billing-model="onChangeSimulateBillingModel"
    />
    <modal-billing-model-calib-select
      :visible="isOpendCalibServerSelect"
      @close="isOpendCalibServerSelect=false"
      @change-selected-model="onChangeSimulateServerBilling"
    />
  </div>
</template>

<script>
import BillingModelCalibCreateContent from '../Common/BillingModelCalibCreateContent.vue'
import ModalBillingModelCalibBillingSelect from '../Common/Modal/ModalBillingModelCalibBillingSelect.vue'
import ModalBillingModelCalibSelect from '../Common/Modal/ModalBillingModelCalibSelect.vue'
import API, { ClearableTag } from '@sd-fe/cmp-core'
import Fuse from 'fuse.js'
import { uniqueId } from 'lodash'
import { EventBus } from '@/components/Billing/Correction/CorrectionEventBus'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'

const __SIMULATE_INTERVAL_DELAY__ = 2000
const __SIMULATE_STATE__ = {
  UNKNOWN: 'UNKNOWN',
  SUCCESS: 'SUCCESS',
  PROGRESS: 'PROGRESS'
}

export default {
  name: 'BillingModelCalibCompanyCreate',
  components: {
    BillingModelCalibCreateContent,
    ModalBillingModelCalibBillingSelect,
    ModalBillingModelCalibSelect,
    ClearableTag
  },
  async created () {
    EventBus.$on('reset-form', this.resetForm)

    await this.getGroupList()
    await this.getBeforeMonthBilling()

    if (this.isEdit) {
      this.getCorrectionModelDetail(this.$route.query.id)
    }
  },
  computed: {
    ...mapGetters({
      cloud: 'cloud/getCloud'
    }),
    isEdit () {
      return !!(this.$route.query && (this.$route.query.edit && this.$route.query.id))
    }
  },
  watch: {
    isOpenedCompanyAddModal (active) {
      if (active) {
        if (this.companyItems.length) {
          this.defaultCheckRegisteredGroup()
        }
      }
    },
    selectedBillingModel (model) {
      this.simulateGroupCorrection(model, this.selectedServerCorrModel)
    },
    selectedServerCorrModel (model) {
      this.simulateGroupCorrection(this.selectedBillingModel, model)
    }
  },
  beforeDestroy () {
    this.clearSimulateInterval()
  },
  methods: {
    /**
     * 모뎅를 불러온다.
     */
    onFetchModel (model) {
      EventBus.$emit('reset-form')
      this.resetForm()
      this.getCorrectionModelDetail(model.id)
    },
    /**
     * 전달 확정 배치 조회
     */
    async getConfirmedBatch () {
      let res = await API.billing.getBillingBatchData()
      res = res ? res.map(batch => ({ ...batch, formatDate: dayjs(new Date(batch.date)).format('YYYY-MM') })) : []

      const beforeMonth = dayjs(new Date()).add(-1, 'month').format('YYYY-MM')
      const confirmedBatch = res.find(batch => batch.confirmed && batch.formatDate === beforeMonth)

      if (confirmedBatch) {
        const report = await API.billing.getListById(confirmedBatch.id)
        if (report && report.compute) return [].concat(report.compute, report.nas)
        else return null
      } else {
        return null
      }
    },
    /**
     * 전달 청구 금액 조회
     */
    async getBeforeMonthBilling () {
      const confirmedBatch = await this.getConfirmedBatch()
      this.beforeMonthBillingMap = new Map()

      if (confirmedBatch && confirmedBatch.length) {
        confirmedBatch.forEach(batch => {
          const beforeData = this.beforeMonthBillingMap.get(batch.companyIdx)
          if (beforeData) {
            this.beforeMonthBillingMap.set(batch.companyIdx, (beforeData || 0) + (batch.priceSum || 0))
          } else {
            this.beforeMonthBillingMap.set(batch.companyIdx, batch.priceSum || 0)
          }
        })
      }
    },
    onLoadSimpleModels (models) {
      if (models && models.length && !this.isEdit) {
        const copyModels = models.map(model => ({
          id: model.id,
          createTime: model.createTime
        }))

        let recentModel = null

        copyModels.forEach(model => {
          if (!recentModel || recentModel.createTime < model.createTime) {
            recentModel = model
          }
        })

        this.getCorrectionModelDetail(recentModel.id)
      }
    },
    /**
     * 모듈 타입 변환
     */
    // getModuleType () {
    //   return {
    //     nutanix: 'NX',
    //     vmware: 'VMWARE'
    //   }[this.cloud]
    // },
    /**
     * 시뮬레이션 결과 비용 바인딩
     */
    bindSimulateResult (data) {
      if (!data || !data.length) return

      data.forEach(group => {
        const targetGroup = this.groupMap.get(group.companyIdx)

        if (targetGroup) {
          // targetGroup.cost = group.forwardBillingAmount
          targetGroup.finishCost = group.batchApplyAmount
        }
      })

      if (!this.isLoadedPrevMonthBill) this.isLoadedPrevMonthBill = true
    },
    /**
     * 시뮬레이션 결과 조회
     */
    async getSimulateResult () {
      try {
        const { data } = await API.billing.getSimulatedGroupCorrection(
          this.simulateInterval.billingModel,
          this.simulateInterval.serverModel
          // this.getModuleType()
        )
        if (data.every(result => result.expectBatchStatus === 'DONE')) {
          this.bindSimulateResult(data)
          this.clearSimulateInterval()
        }
      } catch (error) {
        console.log(error)
      }
    },
    /**
     * 시뮬레이션 인터벌 설정
     */
    setSimulateInterval () {
      this.simulateInterval.billingModel = this.lastCalculateBillingModel.id
      this.simulateInterval.serverModel = this.lastCalculateServerModel.id
      this.simulateInterval.state = __SIMULATE_STATE__.PROGRESS
      this.simulateInterval.interval = setInterval(
        this.getSimulateResult,
        __SIMULATE_INTERVAL_DELAY__
      )
    },
    /**
     * 시뮬레이션 인터벌 초기화
     */
    clearSimulateInterval () {
      if (this.simulateInterval && this.simulateInterval.interval) {
        clearInterval(this.simulateInterval.interval)
      }
      this.simulateInterval = {
        interval: null,
        billingModel: null,
        serverModel: null,
        state: __SIMULATE_STATE__.UNKNOWN
      }
    },
    onChangeSimulateServerBilling (id, model) {
      if (model) {
        this.selectedServerCorrModel = model
        this.isOpendCalibServerSelect = false
      }
    },
    async simulateGroupCorrection (billingModel, serverModel) {
      if (!billingModel || !serverModel) return
      if (this.lastCalculateBillingModel && this.lastCalculateServerModel) {
        if (this.lastCalculateBillingModel.id === billingModel.id && this.lastCalculateServerModel.id === serverModel.id) return
      }

      this.lastCalculateBillingModel = billingModel
      this.lastCalculateServerModel = serverModel

      this.isLoadingGroupList = true

      try {
        await API.billing.simulateGroupCorrection(
          this.lastCalculateBillingModel.id,
          this.lastCalculateServerModel.id
          // this.getModuleType()
        )
        this.setSimulateInterval()
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 모델 시뮬레이션에 실패하였습니다.'))
      } finally {
        this.isLoadingGroupList = false
      }
    },
    onChangeSimulateBillingModel (model) {
      if (model) {
        this.selectedBillingModel = model
        this.isOpendBillingSelect = false
      }
    },
    /**
     * 폼 초기화
     */
    resetForm () {
      this.companyItems = []
      this.initCheckState()
      if (this.$refs.groupGrid) {
        this.$refs.groupGrid.changedCheckbox()
      }
    },
    /**
     * API에서 내려온 데이터를 UI에 적용 (업데이트 데이터 적용)
     */
    initForm (model = this.updateModelData) {
      if (!model || !model.groupInfo || !model.groupInfo.length) return

      const groupMap = new Map()
      const groupIdxs = []

      model.groupInfo.forEach(groupInfo => {
        groupIdxs.push(groupInfo.companyIdx)
        groupMap.set(groupInfo.companyIdx, groupInfo)
      })

      const shouldRegisterGroups = this.serverAddGridList.filter(group => groupIdxs.includes(group.groupIdx))
      const transformGroupInfo = groupInfo => ({
        ...groupInfo,
        priceType: groupInfo.discountPrice > 0 ? 'plus' : 'minus',
        discountPrice: Math.abs(groupInfo.discountPrice)
      })

      this.companyItems = shouldRegisterGroups.map(group => ({
        ...group,
        __ui_uid__: uniqueId('group-corr-list-'),
        corrections: (((groupMap.get(group.groupIdx) || {}).groupInfo) || []).map(transformGroupInfo)
      }))
    },
    /**
     * 수정시 보정 모델 상세 조회
     */
    async getCorrectionModelDetail (id) {
      this.isLoadingGetData = true

      try {
        const { data } = await API.billing.getGroupCorrModelByModelIdx(id)
        this.updateModelData = data

        EventBus.$emit('init-form', this.updateModelData)
        this.initForm()
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 모델 조회에 실패하였습니다.', {
          callback: () => this.$router.go(-1)
        }))
      } finally {
        this.isLoadingGetData = false
      }
    },
    onRemoveRegisteredItem (row) {
      this.companyItems = this.companyItems.filter(group => group.groupIdx !== row.groupIdx)
    },
    /**
     * 체크된 거 초기화
     */
    initCheckState () {
      this.serverAddGridList.forEach(group => (group.checked = false))
      this.checkedGridList = []
    },
    /**
     * 등록된 관계사를 기본적으로 체크 표시로 노출한다.
     */
    defaultCheckRegisteredGroup () {
      this.initCheckState()

      const registered = this.companyItems.map(group => group.groupIdx)
      const filtered = this.serverAddGridList.filter(group => registered.includes(group.groupIdx))
      filtered.forEach(group => (group.checked = true))

      if (this.$refs.groupGrid) {
        this.$refs.groupGrid.changedCheckbox()
      }

      this.checkedGridList = filtered
    },
    registerGroups () {
      this.$confirm(this.$v('선택한 관계사를 등록하시겠습니까?'))
        .then(() => {
          this.companyItems = this.checkedGridList
            .map(group => {
              const findGroup = this.companyItems.find(fGroup => fGroup.groupIdx === group.groupIdx)
              let corrections = []
              if (findGroup) {
                corrections = findGroup.corrections
              }
              return {
                ...group,
                __ui_uid__: uniqueId('group-corr-list-'),
                corrections
              }
            })
          this.isOpenedCompanyAddModal = false
        })
        .catch(() => false)
    },
    onRemoveCheck (filterGroup) {
      filterGroup.checked = false
      this.checkedGridList = this.checkedGridList.filter(group => group.groupIdx !== filterGroup.groupIdx)

      if (this.$refs.groupGrid) {
        this.$refs.groupGrid.changedCheckbox()
      }
    },
    onCheckGroup (group) {
      this.checkedGridList = group
    },
    onClickAddContent () {
      this.isOpenedCompanyAddModal = true
    },
    onChangeSearchGroup (value) {
      if (!value) {
        this.isSetFilter = false
        return
      }

      const fuse = new Fuse(this.serverAddGridList, {
        keys: ['groupName']
      })

      const result = fuse.search(value).map(node => node.item)
      this.filterGridList = result.map((group, arrIdx) => ({ ...group, mapIdx: arrIdx + 1 }))
      this.isSetFilter = true
    },
    /**
     * API 데이터 --> UI 매핑
     */
    mappingGroupList (groupList) {
      if (!groupList || !groupList.length) {
        this.serverAddGridList = []
        return
      }

      this.groupMap = new Map()

      this.serverAddGridList = groupList
        .map((group, arrIdx) => {
          const findBefore = this.beforeMonthBillingMap.get(group.groupIdx)

          return {
            ...group, mapIdx: arrIdx + 1, checked: false, cost: findBefore || 0, finishCost: null
          }
        })

      this.serverAddGridList.forEach(group => {
        this.groupMap.set(group.groupIdx, group)
      })
    },
    /**
     * 관계사 데이터 조회
     */
    async getGroupList () {
      if (this.isLoadingGroupList) return

      this.isLoadingGroupList = true

      try {
        const res = await API.iam.getGroupList({ groupUpper: 0 })
        this.mappingGroupList(res)
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('관계사 조회에 실패하였습니다.'), {
          callback: () => this.$router.go(-1)
        })
      } finally {
        this.isLoadingGroupList = false
      }
    }
  },
  data () {
    return {
      isLoadedPrevMonthBill: false,
      SIMULATE_STATE: __SIMULATE_STATE__,
      simulateInterval: {
        interval: null,
        billingModel: null,
        serverModel: null,
        state: __SIMULATE_STATE__.UNKNOWN
      },
      beforeMonthBillingMap: new Map(),
      groupMap: null,
      lastCalculateBillingModel: null,
      lastCalculateServerModel: null,
      selectedServerCorrModel: null, // 서버 보정 모델
      selectedBillingModel: null, // 과금 모델
      updateModelData: null,
      isLoadingGetData: false,
      isLoadingGroupList: false,
      isSetFilter: false,
      filterGridList: [],
      checkedGridList: [],

      companyColumns: [{ header: 'no', binding: 'no' }, { header: 'ip', binding: 'ip' }, { header: '호스트명', binding: 'hostname' }],
      companyItems: [],
      serverAddGridColumns: [
        { header: 'No', binding: 'mapIdx', width: 50 },
        { header: this.$v('관계사'), binding: 'groupName' },
        { header: this.$v('전월 청구 금액'), binding: 'cost', customHtml: true },
        { header: this.$v('배치 적용 금액'), binding: 'finishCost', customHtml: true }
      ],
      serverAddGridList: [],

      // 관계사추가 모달
      isOpenedCompanyAddModal: false,
      // 과금모델 선택 모달
      isOpendBillingSelect: false,
      // 서버 보정 모델 적용 모달
      isOpendCalibServerSelect: false
    }
  }
}
</script>
<style lang="scss" scoped>
.form {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .form-flex__row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    .form-label {
      display: flex;
      min-width: 140px;
      align-self: center;
    }
    .selected-model {
      margin-left: $gap-s;
    }
    .form-value__is-empty {
      display: flex;
      align-self: center;
      color: $gray;
      font-size: 14px;
      font-weight: 300;
    }
    .button {
      display: flex;
      background-color: $primary;
    }
  }

  &-value {
    display: flex;
    flex-wrap: wrap;
  }
}
.filter-bar {
  margin-top: 30px;
  margin-bottom: 10px;
}
.modal-button-area {
  border-top: 1px solid $purple-gray;
  padding-top: 20px;
}

.form-wrap {
  max-height: 800px;
  overflow-y: auto;
}
</style>
