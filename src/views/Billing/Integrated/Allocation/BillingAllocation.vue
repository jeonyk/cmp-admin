 <!--
  * 파일명 : BillingAllocation.vue
  * 파일 기능 : [빌링 > 과금 배치] 그리드를 입력합니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 fix: 리포트 상세 필터링 관련 수정
 -->

<template>
  <div
    class="billing-allocation"
    v-loading="loading.batch"
  >
    <filtering-component
      :data="filteringOptions"
      @selected="selectFilter"
      @reset-data="selectFilter"
    />

    <section class="table-top-wrap">
      <total-count
        v-if="tableTotal"
        :total-count="tableTotal"
      />
      <span
        v-else
        class="empty"
      />
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="pickBillingBatchDateModal = true"
        >
          {{ $t('bill.addBillArrange') }}
        </button>
        <!-- 과금 배치 추가 -->
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        ref="billingGrid"
        :item-source="tableData"
        :columns="columns"
        :init-custom-action="init"
        :custom-init-filter="onInitFilter"
        :column-data-map="columnDataMap"
        :sort-keeping="sortKeeping"
        @total-count="count => tableTotal = count"
        @changingPage="page => pageTemp = page - 1"
      >
        <template #billingModelName="props">
          <div class="flex-wrap center">
            <button
              class="button"
              v-if="!props.row.billingModelName"
              @click="e => changeModel(props.row, 'billingModel')"
            >
              {{ $t('common.MODAL.selectBillModel') }}
            </button>
            <a
              v-else-if="props.row.billingModelName && !props.row.serverCorrectionName"
              class="-link"
              @click="changeModel(props.row, 'billingModel')"
            >{{ props.row.billingModelName }}</a>

            <span v-else>{{ props.row.billingModelName }}</span>
          </div>
        </template>
        <!-- 과금모델 선택 -->

        <template #reportData="props">
          <a
            v-if="props.row.billingModelBatchDate && props.row.billingModelBatchEnd"
            class="-link"
            @click="e => getRawMeteringReportData(props)"
          >{{ $t('common.BTN.detail') }}</a>
          <span
            v-else-if="props.row.billingModelBatchDate && !props.row.billingModelBatchEnd"
            class="-link"
          >
            <cmp-status-tag
              type="is-loading"
            >
              <i
                class="el-icon-loading"
                style="margin-right: 5px;"
              />
              <span>{{ $t('bill.writing') }}</span>
            </cmp-status-tag>
          </span>
        </template>
        <!-- 리포트 데이터 -->

        <template #serverCalib="props">
          <div class="flex-wrap center">
            <button
              class="button"
              v-if="!props.row.serverCorrectionName && props.row.billingModelName && props.row.billingModelBatchEnd"
              @click="changeModel(props.row, 'serverCalib')"
            >
              {{ $t('bill.selectServerCorr') }}
            </button>
            <span v-else-if="props.row.serverCorrectionBatchDate && !props.row.serverCorrectionBatchEnd">

              <cmp-status-tag
                type="is-loading"
              >
                <i
                  class="el-icon-loading"
                  style="margin-right: 5px;"
                />
                <span>{{ $t('bill.writing') }}</span>
              </cmp-status-tag></span>
            <!-- <a
              v-else-if="!props.row.groupCorrectionName"
              class="-link"
              @click="changeModel(props.row, 'serverCalib')"
            >{{ props.row.serverCalib }}</a>
            <span v-else>{{ props.row.serverCalib }}</span> -->
            <div
              class="cell-flex-wrap"
              v-else-if="props.row.serverCorrectionName"
            >
              {{ props.row.serverCalib }}
              <a
                v-if="!props.row.groupCorrectionName"
              >
                <i
                  class="mdi mdi-refresh reset-button"
                  @click="billingBatchReset(props.row, 'server')"
                />
              </a>
            </div>
          </div>
        </template>
        <!-- 서버 보정 -->

        <template #companyCalib="props">
          <div class="flex-wrap center">
            <button
              v-if="!props.row.groupCorrectionName && props.row.serverCorrectionName && props.row.serverCorrectionBatchEnd"
              class="button"
              @click="changeModel(props.row, 'companyCalib')"
            >
              {{ $t('common.PLACEHOLDER.selectName', { name: $t('bill.affCorrection') }) }}
            </button>
            <span v-else-if="props.row.groupCorrectionBatchDate && !props.row.groupCorrectionBatchEnd">
              <cmp-status-tag
                type="is-loading"
              >
                <i
                  class="el-icon-loading"
                  style="margin-right: 5px;"
                />
                <span>{{ $t('bill.writing') }}</span>
              </cmp-status-tag></span>
            <div
              v-else-if="props.row.groupCorrectionName"
              class="cell-flex-wrap"
            >
              {{ props.row.companyCalib }}
              <a
                v-if="!props.row.distModelName"
              >
                <i
                  class="mdi mdi-refresh reset-button"
                  @click="billingBatchReset(props.row, 'group')"
                />
              </a>
            </div>
          </div>
        </template>
        <!-- 관계사 보정 -->

        <template #distModel="props">
          <div class="flex-wrap center">
            <button
              class="button"
              v-if="!props.row.distModelName && props.row.groupCorrectionName && props.row.groupCorrectionBatchEnd"
              @click="changeModel(props.row, 'distModel')"
            >
              {{ $t('common.PLACEHOLDER.selectName', { name: $t('bill.commonAllo') }) }}
            </button>
            <span v-else-if="props.row.distModelBatchDate && !props.row.distModelBatchEnd">
              <cmp-status-tag
                type="is-loading"
              >
                <i
                  class="el-icon-loading"
                  style="margin-right: 5px;"
                />
                <span>{{ $t('bill.writing') }}</span>
              </cmp-status-tag></span>
            <div
              class="cell-flex-wrap"
              v-else-if="props.row.distModelName"
            >
              {{ props.row.distModel }}
              <a
                v-if="!props.row.confirmed"
              >
                <i
                  class="mdi mdi-refresh reset-button"
                  @click="billingBatchReset(props.row, 'dist')"
                />
              </a>
            </div>
          </div>
        </template>
        <!-- 공통 배분 -->

        <template #confirm="props">
          <template v-if="props.row.confirm">
            <cmp-status-tag
              type="is-success"
              :contents="$t('bill.confirm')"
            />
          </template>
          <button
            v-else-if="!props.row.confirm && props.row.distModelName && !confirmedDateMap[props.row.billingDate] && props.row.distModelBatchEnd"
            class="button"
            @click.stop="setConfirmAction(props.row)"
            :disabled="confirmDateCheck(props.row)"
          >
            {{ $t('common.BTN.BILL.confirmRun') }}
          </button>
          <span v-else />
        </template>
        <!-- 확정 -->

        <template #billingReport="props">
          <a
            v-if="props.row.billingModelBatchDate && props.row.billingModelBatchEnd"
            class="-link"
            @click="e => getRawBillingReport(props)"
          >{{ $t('common.BTN.detail') }}</a>
          <span
            v-else-if="props.row.billingModelBatchDate && !props.row.billingModelBatchEnd"
            class="-link"
          >
            <cmp-status-tag
              type="is-loading"
            >
              <i
                class="el-icon-loading"
                style="margin-right: 5px;"
              />
              <span>{{ $t('bill.writing') }}</span>
            </cmp-status-tag>
          </span>
          <!-- <a
            v-if="props.row.confirm"
            class="-link"
            @click="e => getRawBillingReport(props)"
          >{{ $t('common.BTN.detail') }}</a> -->
        </template>

        <template #delete="props">
          <div class="cell-flex-wrap">
            <button
              v-if="!props.row.confirm"
              class="button"
              @click.stop="deleteBillingBatch(props.row)"
              type="is-icon"
            >
              <i class="delete-icon" />
            <!-- 삭제 -->
            </button>
          </div>
        </template>
        <!-- 빌링 리포트 -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <el-dialog
      :title="$t('common.PLACEHOLDER.selectName', { name: modalTitle })"
      :visible.sync="billingModelModal"
      :top="viewSelectModel ? '5vh' : '20vh'"
      :width="viewSelectModel ? '80%' : '550px'"
      @close="modalClose"
      class="dist-model-modal"
    >
      <section class="modal-body">
        <template v-if="!viewSelectModel">
          <vertical-table
            :data="selectModelData"
            :columns="selectModelColumns"
            table-type="input"
          >
            <template #model>
              <button
                class="button"
                @click="viewSelectModel = true"
                v-if="!selectModelData.model"
              >
                {{ $t('common.PLACEHOLDER.selectName', { name: modalTitle}) }}
              </button>
              <a
                class="-link"
                v-else
                @click="viewSelectModel = true"
              >{{ selectModelData.model }}</a>
            </template>
            <!-- 과금모델 -->
            <template #createReport>
              <el-radio-group
                v-model="selectModelData.createReport"
              >
                <el-radio label="immediate">
                  {{ $t('bill.exeNow') }}
                </el-radio>
                <el-radio
                  label="reserve"
                  style="margin-left: 10px;"
                >
                  {{ $t('bill.exeReser') }}
                </el-radio>
              </el-radio-group>
            </template>
            <!-- 리포트 생성 -->

            <template #time>
              <el-date-picker
                v-model="selectModelData.time"
                type="datetime"
                :placeholder="$t('bill.setReserTime')"
                class="date-time-picker"
                prefix-icon="el-icon-date"
                @change="datePickerChange($event)"
                ref="batchDatePicker"
                :picker-options="pickerOptions"
                popper-class="reser-bill-date-time-picker"
              />
            </template>
            <!-- 예약 시작 -->
          </vertical-table>
        </template>
        <template v-if="viewSelectModel && updateColumn === 'billingModel'">
          <billing-select-model
            :init-auto-select-row="selectedModel"
            @cancel="viewSelectModel = false"
            @save-model="selectModel"
          />
        </template>
        <template v-if="viewSelectModel && updateColumn === 'serverCalib'">
          <server-calib-select-model
            :init-auto-select-row="selectedModel"
            @cancel="viewSelectModel = false"
            @save-model="selectModel"
          />
        </template>
        <template v-if="viewSelectModel && updateColumn === 'companyCalib'">
          <group-calib-select-model
            :init-auto-select-row="selectedModel"
            @cancel="viewSelectModel = false"
            @save-model="selectModel"
          />
        </template>
        <template v-if="viewSelectModel && updateColumn === 'distModel'">
          <dist-select-model
            :init-auto-select-row="selectedModel"
            @cancel="viewSelectModel = false"
            @save-model="selectModel"
          />
        </template>
      </section>

      <section
        class="modal-footer modal-button-area"
        v-if="!viewSelectModel"
      >
        <button
          class="button -modal-button"
          type="is-anti"
          @click="billingModelModal=false"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          :disabled="isGeneratingReport"
          class="button -modal-button"
          type="is-primary"
          @click.stop="applySaveModel"
        >
          {{ $t('bill.addReport') }}
        </button>
      </section>
    </el-dialog>

    <!-- 리포트 데이터 모달 -->
    <!-- <billing-report-modal
      :batch-id="selectedBatchId"
      :batch-date="selectedBatchDate"
      key="before-billing-report"
      with-modal
      :active.sync="reportDataModal"
      @close="e => {
        reportDataModal = false
        fullLoadedReportModal = false
      }"
      :title="$t('bill.detailReport')"
    /> -->
    <!-- 빌링 리포트 모달 -->
    <billing-report-modal
      :batch-id="selectedBatchId"
      :batch-date="selectedBatchDate"
      key="after-billing-report"
      with-modal
      :active.sync="billingReportModal"
      @close="e => {
        billingReportModal = false
        fullLoadedBillingReportModal = false
      }"
      :title="$t('bill.billReportDetail')"
      :is-include-correction="isIncludeCorrection"
    />
    <pick-billing-batch-model
      :active.sync="pickBillingBatchDateModal"
      @close="pickBillingBatchDateModal = false"
      @confirm="createBillingBatch"
    />
  </div>
</template>
<script>
import { keys, cloneDeep } from 'lodash'
// import MeteringReportModal from './BillingSelectModel/MeteringReportModal'
// import BillingReportModal from './BillingSelectModel/BillingReportModal'
import BillingSelectModel from './BillingSelectModel/BillingSelectModel'
import ServerCalibSelectModel from './BillingSelectModel/ServerCalibSelectModel'
import GroupCalibSelectModel from './BillingSelectModel/GroupCalibSelectModel'
import DistSelectModel from './BillingSelectModel/DistSelectModel'
import PickBillingBatchDateModal from './BillingSelectModel/PickBillingBatchDateModal'
import API, { VerticalTable, BillingReportModal } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

/**
 * 리포트 데이터 vs 빌링 리포트 무슨 차이인가?
 * 리포트 데이터 = 과금 모델만 적용되서 산출된 비용
 * 빌링 리포트 = 과금 모델, 보정, 배부가 적용되서 산출된 비용
 * 따라서 리포트 데이터 상세 모달은 과금 모델을 지정하고 생성될 때
 * 변하지 않는 리포트이며 빌링 리포트는 설정한 보정/배부 모델에 따라
 * 산출된 비용이 달라지는 리포트라 할 수 있다.
 *
 * 근데 API는 같은 API? 같은 데이터만 내려오는디..
 * 컬럼을 뺀다고 총 비용이 달라지나..
 */
export default {
  name: 'BillingAllocation',
  components: {
    VerticalTable,
    // 'metering-report-modal': MeteringReportModal,
    'billing-report-modal': BillingReportModal,
    'billing-select-model': BillingSelectModel, // check
    'server-calib-select-model': ServerCalibSelectModel, // check
    'group-calib-select-model': GroupCalibSelectModel, // check
    'dist-select-model': DistSelectModel, // check
    'pick-billing-batch-model': PickBillingBatchDateModal
  },
  created () {
    this.getRawBatchTableData()
    this.startInterval()
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  watch: {
    /**
     * 과금 모델 선택 > 리포트 생성 즉시실행/예약실행 change 이벤트
     */
    'selectModelData.createReport': {
      immediate: true,
      handler (newVal) {
        const originSelectModelCols = cloneDeep(this.selectModelColumnsOrg)

        if (newVal === 'immediate') { // 즉시 실행
          this.selectModelColumns = originSelectModelCols.filter(item => item.binding !== 'time')
        } else { // 예약 실행
          this.selectModelColumns = [...originSelectModelCols]
          this.$nextTick(() => {
            this.$watch(
              this.watchDatePicker,
              this.dateCheck
            )
          })
        }
      }
    }
  },
  methods: {
    onInitFilter (f) {
      this.gridFilter = f
    },
    /**
     * 그리드의 row date가 당월일 경우 확정 버튼을 disabled 처리
     */
    confirmDateCheck (row) {
      const { date } = row
      const compare = new Date(date)
      const current = new Date()

      if (current.getFullYear() <= compare.getFullYear() && current.getMonth() <= compare.getMonth()) {
        return true
      }
      return false
    },
    dateCheck (newVal, oldVal) {
      if (!newVal || !oldVal) return

      const newDate = Dayjs(newVal)
      const oldDate = Dayjs(oldVal)
      const formatNewDate = newDate.format('YYYY-MM-DD')
      const formatOldDate = oldDate.format('YYYY-MM-DD')
      const formatNowDate = Dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')

      if (formatNewDate === formatOldDate || formatNowDate === newDate.format('YYYY-MM-DD HH:mm:ss')) return

      this.selectModelData.time = newDate.set('h', 0).set('m', 0).set('s', 0).toDate()
    },
    watchDatePicker () {
      if (this.selectModelData.createReport !== 'immediate' && this.billingModelModal) {
        return this.$refs.batchDatePicker.displayValue
      }
    },
    async refreshData () {
      const filterEl = document.querySelector('.wj-columnfiltereditor')
      if (filterEl) return

      const sortDescriptions = cloneDeep(this.$refs.billingGrid.data.sortDescriptions[0])
      this.sortKeeping = {
        binding: sortDescriptions?._bnd?._path,
        asc: sortDescriptions?._asc
      }

      if (this.gridFilter) {
        const grid = {
          filterDefinition: this.gridFilter.filterDefinition
        }
        this.beforeGridFilter = JSON.stringify(grid)
      }

      await this.settingBackgroundData()
      const tableData = [...this.settingTableData(this.selectedFilter)]
      const pageIdx = this.$refs.billingGrid.data.pageIndex
      const data = this.$refs.billingGrid.settingCollectionViewDate(tableData)

      this.$refs.billingGrid.data = data
      this.pageTemp = pageIdx

      if (this.beforeGridFilter) {
        this.$nextTick(() => {
          const state = JSON.parse(this.beforeGridFilter)
          this.gridFilter.filterDefinition = state.filterDefinition
          this.beforeGridFilter = null
        })
      }
    },
    async startInterval () {
      this.interval = setInterval(this.refreshData, 5000)
    },
    /**
     * 배치ID로 해당 미터링 리포트 데이터를 가져옴
     * 리포트 데이터 컬럼 - 상세
     */
    async getRawMeteringReportData (props) {
      this.selectedBatchId = props.row.id
      this.selectedBatchDate = props.row.date
      this.billingReportModal = true
      this.isIncludeCorrection = false
    },
    /**
     * 배치 테이블 데이터를 가져옴
     */
    async settingBackgroundData () {
      const billingDate = await API.billing.getBillingBatchData()
      this.tempTableData = billingDate.map(d => {
        return {
          ...d,
          id: d.id,
          billingDate: `${new Date(d.date).getFullYear()}-${new Date(d.date).getMonth() + 1}`,
          billingModel: d.billingModelName,
          reportData: '',
          serverCalib: d.serverCorrectionName,
          companyCalib: d.groupCorrectionName,
          distModel: d.distModelName,
          confirm: d.confirmed,
          billingReport: ''
        }
      })
    },
    /**
     * 과금 배치 데이터들을 가져옵니다.
     */
    async getRawBatchTableData () {
      this.loading.batch = true
      try {
        const data = await API.billing.getBillingBatchData()
        this.confirmedDateMap = {}
        this.filteringOptions[0].selections = []
        const filterBillingDateMap = {}
        this.tempTableData = data.map(d => {
          const year = new Date(d.date).getFullYear()
          const month = new Date(d.date).getMonth() + 1
          const billingDate = `${year}-${month}`
          if (d.confirmed) {
            this.confirmedDateMap[billingDate] = 1
          }
          filterBillingDateMap[billingDate] = 1
          return {
            ...d,
            billingDate,
            billingModel: d.billingModel,
            serverCalib: d.serverCorrectionName,
            companyCalib: d.groupCorrectionName,
            distModel: d.distModelName,
            reportData: '',
            confirm: d.confirmed,
            billingReport: ''
          }
        })
        const filterBillingDateMapKey = keys(filterBillingDateMap)
        for (const k in filterBillingDateMapKey) {
          this.filteringOptions[0].selections.push({
            label: filterBillingDateMapKey[k],
            value: filterBillingDateMapKey[k]
          })
        }
        this.filteringOptions[0].selections = this.filteringOptions[0].selections.filter((c, index, self) => {
          return self.findIndex(s => s.value === c.value) === index
        })
        this.filteringOptions[0].selections.unshift({ label: this.$t('main.DASHBOARD.all'), value: undefined })
        this.tableData = [...this.tempTableData]
      } catch (error) {
        this.$alert(error.message || this.$t('common.ALERT.BASE.061'))
      } finally {
        this.loading.batch = false
      }
    },
    /**
     * 배치ID로 해당 빌링 리포트를 가져옴
     * 빌링 리포트 컬럼 - 상세
     */
    async getRawBillingReport (props) {
      this.selectedBatchId = props.row.id
      this.selectedBatchDate = props.row.date
      this.billingReportModal = true
      this.isIncludeCorrection = true
    },
    async createBillingBatch (date) {
      // console.log(new Date(date))
      try {
        const d = new Date(date)
        d.setHours(9)
        await API.billing.createBatchModel(d)
        this.getRawBatchTableData()
      } catch (error) {
        this.$alert('과금 배치 생성에 실패하였습니다.')
      }
    },
    rowSelect (selected) {
      this.selectedRow = selected
    },
    init (grid) {
      this.grid = grid
      if (!this.grid.itemsSourceChanging.handlerCount) {
        this.grid.itemsSourceChanging.addHandler((s, t) => {
          this.$nextTick(() => {
            if (this.$refs && this.$refs.billingGrid) {
              this.$refs.billingGrid.data.moveToPage(this.pageTemp)
            }
          })
        }, this)
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectFilter (selectedArr) {
      this.tableData = [...this.settingTableData(selectedArr)]
    },
    settingTableData (selectedArr) {
      selectedArr = selectedArr || {}
      this.selectedFilter = JSON.parse(JSON.stringify(selectedArr))
      if (selectedArr == null || selectedArr.length === 0) return
      let temp = this.tempTableData
      if (selectedArr.billingDate) {
        if (selectedArr.billingDate === 'all') {
          temp = this.tempTableData
        } else {
          temp = this.tempTableData.filter(e => {
            return e.billingDate === selectedArr.billingDate
          })
        }
      }
      if (selectedArr.allocateState) {
        if (selectedArr.allocateState === 'Y') {
          temp = temp.filter(e => {
            return e.billingModelBatchEnd !== null
          })
        } else {
          temp = temp.filter(e => {
            return e.billingModelBatchEnd === null
          })
        }
      }
      if (selectedArr.confirmState) {
        if (selectedArr.confirmState === 'Y') {
          temp = temp.filter(e => {
            return e.confirmed === true
          })
        } else {
          temp = temp.filter(e => {
            return e.confirmed === false
          })
        }
      }
      return temp
    },
    stateAllocation (state = undefined) {
      return {
        success: '완료',
        error: '에러',
        undefined: ''
      }[state]
    },
    /**
     * https://jira.growthsoft.co.kr/browse/SSGCMP-1414
     * @param {boolean} isApplyModel 적용된 과금모델 여부
     * @param {number} modelGroupId 모델 그룹 아이디
     */
    async validateModelGroups (isApplyModel, modelGroupId) {
      // 적용된 과금모델이 아니면 validate 대상 아님
      if (!isApplyModel) return true
      try {
        // 모든 과금모델
        const modelGroups = await API.billing.getModelGroups()
        // 배치 확정안된 과금모델 && 적용 과금모델이 아닌 모델
        const nonBillingModelGroups = modelGroups.filter(group => !group.billing && !group.apply)
        // 자동으로 바꿀 과금모델이 하나도 없으면 false 리턴
        if (!nonBillingModelGroups.length) return false
      } catch (error) {
        // 모델 그룹 반환 에러
        return false
      }
    },
    /**
     * [미확정] 버튼을 눌렀을 때, 발생하는 이벤트
     */
    setConfirmAction (row) {
      if (!row) return
      if (this.confirmDateCheck(row)) {
        // 당월 과금 배치인데 확정누르는 경우 처리
        return this.$alert('현재 달의 배치는 확정할 수 없습니다.', { callback: () => false })
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.035'), '확정', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const isPass = await this.validateModelGroups()
        if (isPass) {
          API.billing.confirmBatchModel(row).then(res => {
            row.confirm = true
            row.confirmed = true
          }).catch(res => {
            if (res?.data?.code === 'BIL10002') {
              this.$alert(this.$t('common.ALERT.BILL.024'))
            } else if (res?.data?.code === 'BIL10001') {
              this.$alert(this.$t('common.ALERT.BILL.014'))
            } else if (res?.data?.code === 'BIL10006') {
              this.$alert(this.$v('변경 가능한 과금 모델이 존재하지 않습니다.'))
            } else {
              this.$alert(res.data.message)
            }
          })
        } else {
          // this.$alert('fail')
        }
      }).catch(() => {
        return false
      })
    },
    /**
     * [모델 선택] 또는 [모델 변경] 버튼 클릭
     * @param {Object} row 수정 중인 row
     * @param {String} field 수정 중인 column.binding
     */
    changeModel (row, field) {
      this.selectModelData = { createReport: 'immediate', model: '', time: null }
      this.selectedModel = {}
      // console.log('버튼 클릭시 넘어오는 데이터 확인 ::', row)
      this.updateRow = row
      this.updateColumn = field
      this.billingModelModal = true
      switch (field) {
        case 'billingModel':
          this.modalTitle = this.$t('bill.billModel')
          this.selectModelColumns[0].header = this.modalTitle
          if (row.billingModelName) {
            this.selectedModel.id = row.billingModelId
            this.selectedModel.label = row.billingModelName
            this.selectModelData.model = row.billingModelName
            this.selectModelData.time = new Date(row.billingModelBatchDate)
            if (new Date(row.billingModelBatchDate) > new Date()) {
              this.selectModelData.createReport = 'reserve'
            }
          }

          break
        case 'serverCalib':
          this.modalTitle = this.$t('bill.serverCorr')
          this.selectModelColumns[0].header = this.modalTitle
          if (row.serverCorrectionName) {
            this.selectedModel.id = row.serverCorrectionId
            this.selectedModel.label = row.serverCorrectionName
            this.selectModelData.model = row.serverCorrectionName
            this.selectModelData.time = new Date(row.serverCorrectionBatchDate)
            if (new Date(row.serverCorrectionBatchDate) > new Date()) {
              this.selectModelData.createReport = 'reserve'
            }
          }
          break
        case 'companyCalib':
          this.modalTitle = this.$t('bill.affCorrection')
          this.selectModelColumns[0].header = this.modalTitle
          if (row.groupCorrectionName) {
            this.selectedModel.id = row.groupCorrectionId
            this.selectedModel.label = row.groupCorrectionName
            this.selectModelData.model = row.groupCorrectionName
            this.selectModelData.time = new Date(row.groupCorrectionBatchDate)
            if (new Date(row.groupCorrectionBatchDate) > new Date()) {
              this.selectModelData.createReport = 'reserve'
            }
          }
          break
        case 'distModel':
          this.modalTitle = this.$t('bill.commonAllo')
          this.selectModelColumns[0].header = this.modalTitle
          if (row.distModelName) {
            this.selectedModel.id = row.distModelId
            this.selectedModel.label = row.distModelName
            this.selectModelData.model = row.distModelName
            this.selectModelData.time = new Date(row.distModelBatchDate)
            if (new Date(row.distModelBatchDate) > new Date()) {
              this.selectModelData.createReport = 'reserve'
            }
          }
          break
      }
    },
    /**
     * 과금 모델 선택 섹션에서 선택한 모델 적용
     */
    selectModel (paramItem) {
      // console.log('paramItem', paramItem)
      this.selectedModel = paramItem
      // console.log('this.selectedModel', this.selectedModel)
      this.selectModelData.model = paramItem.label
      this.viewSelectModel = false
    },
    /**
     * 과금모델선택 -> [리포트 생성] 임시..
     */
    async applySaveModel () {
      if (this.isGeneratingReport) return
      this.isGeneratingReport = true
      if (!this.selectedModel.id) {
        // name 선택이 필요합니다.
        this.$alert(this.$t('common.ALERT.BASE.004', { name: this.modalTitle }))
        this.isGeneratingReport = false
        return
      }
      if (this.selectModelData.createReport === 'reserve' && !this.selectModelData.time) {
        // 예약 실행인 경우 예약 시간 설정이 필요합니다.
        this.$alert(this.$t('common.ALERT.BILL.013'))
        this.isGeneratingReport = false
        return
      }
      if (this.selectModelData.createReport === 'immediate') {
        // 과금 배치 즉시 실행
        this.selectedModel.date = new Date()
      } else {
        // 예약 실행
        this.selectedModel.date = this.selectModelData.time
      }

      try {
        if (this.updateColumn === 'billingModel') {
          console.log('데이터 확인 ::', this.updateRow)
          await API.billing.batchBillingModel(this.selectedModel.id, this.selectedModel.label, this.selectedModel.date, this.updateRow.id)
        } else if (this.updateColumn === 'serverCalib') {
          await API.billing.batchServerCorrectModel(this.selectedModel.id, this.selectedModel.label, this.selectedModel.date, this.updateRow.id)
        } else if (this.updateColumn === 'companyCalib') {
          await API.billing.batchGroupCorrectModel(this.selectedModel.id, this.selectedModel.label, this.selectedModel.date, this.updateRow.id)
        } else if (this.updateColumn === 'distModel') {
          await API.billing.batchDistModel(this.selectedModel.id, this.selectedModel.label, this.selectedModel.date, this.updateRow.id)
        }
      } catch (error) {
        if (error?.data?.code === 'ODR10002') {
          // 과금 배치가 종료되지 않았습니다.
          this.$alert(this.$t('common.ALERT.BILL.024'))
        } else if (error?.data?.code === 'ODR10001') {
          // 이미 해당 월에 확정된 배치가 있습니다.
          this.$alert(this.$t('common.ALERT.BILL.014'))
        } else {
          this.$alert(error.data.message)
        }
      } finally {
        setTimeout(() => {
          this.isGeneratingReport = false
        }, 1000)
      }

      this.getRawBatchTableData()
      this.billingModelModal = false
    },
    modalClose () {
      this.viewSelectModel = false
      this.billingModelModal = false
    },
    datePickerChange (time) {
      if (!time) return

      const date = new Date(time)
      const now = Date.now()

      if (date.getTime() < now) {
        this.selectModelData.time = null
        return this.$alert('현재 시간보다 이전 시간을 선택할 수 없습니다.')
      }
      // this.selectModelData.time = date
    },
    async billingBatchReset (row, type) {
      this.$confirm(this.$t('common.CONFIRM.BILL.002'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        const res = await API.billing.billingBatchReset(row.id)
        if (res) {
          // for (const i in this.tableData) {
          //   if (this.tableData[i].id === row.id) {
          //     this.tableData[i].serverCalib = null
          //     this.tableData[i].serverCorrectionId = 0
          //     this.tableData[i].serverCorrectionName = null
          //     this.tableData[i].serverCorrectionBatchDate = null
          //     this.tableData[i].serverCorrectionBatchEnd = null
          //     this.tableData[i].groupCalib = null
          //     this.tableData[i].groupCorrectionId = 0
          //     this.tableData[i].groupCorrectionName = null
          //     this.tableData[i].groupCorrectionBatchDate = null
          //     this.tableData[i].groupCorrectionBatchEnd = null
          //     this.tableData[i].distModel = null
          //     this.tableData[i].distModelId = 0
          //     this.tableData[i].distModelName = null
          //     this.tableData[i].distModelBatchDate = null
          //     this.tableData[i].distModelBatchEnd = null
          //     break
          //   }
          // }
          this.getRawBatchTableData()
          this.refreshData()
        }
      }).catch(() => {
        return false
      })
    },
    async deleteBillingBatch (row) {
      // this.$confirm('\'' + row.billingDate + '\' 과금 배치를<br>삭제 하시겠습니까?', '알림', {
      this.$confirm(this.$t('common.CONFIRM.BILL.001', { billingDate: row.billingDate }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        const res = await API.billing.deleteBillingBatch(row.id)
        if (res) {
          await this.getRawBatchTableData()
        }
      }).catch(() => {
        return false
      })
    }
  },
  data () {
    return {
      gridFilter: null,
      beforeGridFilter: null,
      pickerOptions: {
        disabledDate (_date) {
          const date = new Date(_date)
          const now = new Date()

          now.setHours(0, 0, 0, 0)

          return date.getTime() < now.getTime()
        }
      },
      fullLoadedBillingReportModal: false,
      fullLoadedReportModal: false,
      pageTemp: 0,
      isGeneratingReport: false,
      tableTotal: null,
      sortKeeping: {},
      selectedFilter: null,
      interval: null,
      loading: {
        batch: false,
        report: false,
        billing: false
      }, // 로딩
      // 모달 활성화 여부
      pickBillingBatchDateModal: false,
      billingModelModal: false,
      billingReportModal: false,
      reportDataModal: false,
      viewSelectModel: false,
      updateRow: null, // 업데이트 중인 로우
      updateColumn: '', // 업데이트 중인 컬럼
      modelSelectField: undefined, // 모델 선택이 어느 분야인지? ('billingModel', 'distModel')
      // 필터링 옵션
      filteringOptions: [
        {
          field: 'billingDate',
          label: '과금년월',
          keyPath: 'bill.billDateG',
          selections: [
            { label: '전체', value: 'all' }
          ]
        },
        {
          field: 'allocateState',
          label: '배치여부',
          keyPath: 'bill.isBatch',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined },
            { label: this.$t('bill.allocate'), value: 'Y' },
            { label: this.$t('bill.nonAllocate'), value: 'N' }
          ]
        },
        {
          field: 'confirmState',
          label: '확정 여부',
          keyPath: 'bill.isConfirm',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined },
            { label: this.$t('bill.confirm'), value: 'Y' },
            { label: this.$t('bill.noConfirm'), value: 'N' }
          ]
        }
      ],
      // reportFilteringOptions: [
      //   {
      //     field: 'format',
      //     label: '보기 방식',
      //     keyPath: 'bill.view',
      //     selections: [
      //       { label: this.$t('bill.filterCurrentMonth'), value: 'cur' },
      //       { label: this.$t('bill.filterPrevMonth'), value: 'pre' }
      //     ]
      //   },
      //   {
      //     field: 'company',
      //     label: '관계사',
      //     keyPath: 'common.TERMS.rel',
      //     selections: [
      //       // { label: '전체', value: 'all' }
      //     ]
      //   }
      // ],
      // 모델 선택 관련
      selectModelData: { model: '', createReport: 'immediate', time: '' },
      selectModelColumnsOrg: [
        { binding: 'model', header: '과금 모델' },
        { binding: 'createReport', header: '리포트 생성', keyPath: 'bill.addReport' },
        { binding: 'time', header: '예약 시간', keyPath: 'bill.reserTime' }
      ],
      selectModelColumns: null,
      selectedModel: {},
      // 과금배치 테이블 컬럼 정보
      columns: [
        { header: '과금년월', binding: 'billingDate', width: 100, align: 'left', keyPath: 'bill.billDateG' },
        { header: '과금모델', binding: 'billingModelName', width: '*', customHtml: true, keyPath: 'bill.billModel' },
        { header: '리포트 데이터', binding: 'reportData', width: '*', customHtml: true, sorting: false, keyPath: 'bill.reportData' },
        // { header: '리포트 생성 시각', binding: 'reportCreateDate', width: 150, customHtml: true },
        { header: '서버 보정', binding: 'serverCalib', width: '*', customHtml: true, keyPath: 'bill.serverCorr' },
        { header: '관계사 보정', binding: 'companyCalib', width: '*', customHtml: true, keyPath: 'bill.affCorrection' },
        { header: '공통 배분', binding: 'distModel', width: '*', customHtml: true, keyPath: 'bill.commonAllo' },
        { header: '확정', binding: 'confirm', width: 120, customHtml: true, keyPath: 'bill.confirm' },
        { header: '빌링 리포트', binding: 'billingReport', width: '*', customHtml: true, sorting: false, keyPath: 'bill.billReport' },
        { header: '삭제', binding: 'delete', width: 100, customHtml: true, filtable: false, keyPath: 'common.BTN.delete' }
      ],
      // 과금배치 테이블 관련
      tempTableData: [],
      tableData: [],
      // 리포트 관련
      // rawReport: [],
      // reportCompareData: [],
      // reportDataColumns: [
      //   { header: '클러스터', binding: 'clusterName', width: '*', customHtml: true, keyPath: 'bill.div', noBill: true },
      //   { header: '호스트명', binding: 'hostName', width: '*', customHtml: true, keyPath: 'common.GRID.hostName', noBill: true },
      //   { header: 'IP Address', binding: 'ipAddress', width: '*', customHtml: true, noBill: true },
      //   { header: '수량', binding: 'cnt', width: '*', customHtml: true, keyPath: 'bill.count', noBill: true },
      //   { header: '운영기/개발기', binding: 'servicePart', width: '*', customHtml: true, keyPath: 'bill.operDev', noBill: true },
      //   { header: '과금 청구 대상', binding: 'isBilling', width: '*', customHtml: true, keyPath: 'bill.billTarget', noBill: true },
      //   { header: '과금 청구 시작일', binding: 'chargeDate', width: '*', customHtml: true, keyPath: 'bill.billStart', noBill: true },
      //   { header: '과금 청구 만료일', binding: 'deleteReqDate', width: '*', customHtml: true, keyPath: 'bill.billExpireDate', noBill: true },
      //   { header: '업무명', binding: 'itsmName', width: '*', customHtml: true, keyPath: 'common.GRID.busiName', noBill: true },
      //   { header: '소속분류', binding: 'roleName', width: '*', customHtml: true, keyPath: 'bill.class', noBill: true },
      //   { header: '관계사', binding: 'companyName', width: '*', customHtml: true, keyPath: 'common.TERMS.rel', noBill: true },
      //   { header: '프로젝트명', binding: 'projectName', width: '*', customHtml: true, keyPath: 'common.GRID.projectName', noBill: true },
      //   { header: '운영팀', binding: 'appManageTeamName', width: '*', customHtml: true, keyPath: 'common.GRID.opTeam', noBill: true },
      //   { header: 'OS', binding: 'imageName', width: '*', customHtml: true, noBill: true },
      //   { header: 'CPU 비용', binding: 'cpuExpense', width: '*', customHtml: true, keyPath: 'bill.costCpu' },
      //   { header: 'Memory 비용', binding: 'memExpense', width: '*', customHtml: true, keyPath: 'bill.costMemory' },
      //   { header: 'Disk 비용', binding: 'diskExpense', width: '*', customHtml: true, keyPath: 'bill.costDisk' },
      //   { header: 'Storage 비용', binding: 'vgExpense', width: '*', customHtml: true },
      //   { header: 'SDN(방화벽) 비용', binding: 'firewallExpense', width: '*', customHtml: true, keyPath: 'bill.costSdn' },
      //   { header: 'SDN(L4) 비용', binding: 'l4Expense', width: '*', customHtml: true, keyPath: 'bill.costSdnL4' },
      //   { header: 'SDN(L7) 비용', binding: 'l7Expense', width: '*', customHtml: true, keyPath: 'bill.costSdnL7' },
      //   { header: 'OS 비용', binding: 'osExpense', width: '*', customHtml: true, keyPath: 'bill.costOs' }
      // ],
      // reportDataColumns2: [
      //   { header: '기타(네트웍,보안)', binding: 'etc', width: '*', customHtml: true, keyPath: 'bill.others' },
      //   { header: 'MW/보안 운영비(NW+NW유지보수+보안)', binding: 'sosan', width: '*', customHtml: true, keyPath: 'bill.costMWSecurity' },
      //   { header: '회선사용료(DWDM TCP/IP+인터넷회선)', binding: 'hoeseon', width: '*', customHtml: true, keyPath: 'bill.costUsageLine' },
      //   { header: '데이터복제', binding: 'copy', width: '*', customHtml: true, keyPath: 'bill.copyData' },
      //   { header: '보정 전 비용', binding: 'beforeTotal', width: '*', customHtml: true, keyPath: 'bill.beforeCost' },
      //   { header: '서버 보정 비용', binding: 'correctionServer', width: '*', customHtml: true, keyPath: 'bill.serverCost' },
      //   { header: '관계사 보정 비용', binding: 'correctionGroup', width: '*', customHtml: true, keyPath: 'bill.affCorrCost' },
      //   { header: '보정 후 비용', binding: 'afterTotal', width: '*', customHtml: true, keyPath: 'bill.afterCost' }
      // ],
      // newReportDataColumns: [],
      // reportDataTableData: [],
      // billingReportTableData: [],
      // billingReportCompareData: [],
      // headerMergeColumns: {
      //   colSpan: [
      //     { startIdx: 14, endIdx: 21, header: '하드웨어 비용', keyPath: 'bill.hardCost' },
      //     { startIdx: 21, endIdx: 42, header: '소프트웨어 비용', keyPath: 'bill.softCost' },
      //     { startIdx: 42, endIdx: 47, header: '기타 비용', keyPath: 'bill.otherCost' }
      //   ],
      //   rowSpan: ['clusterName', 'hostName', 'ipAddress', 'cnt', 'servicePart', 'roleName', 'isBilling', 'chargeDate', 'deleteReqDate', 'itsmName', 'companyName', 'appManageTeamName', 'imageName', 'correction', 'beforeTotal', 'afterTotal', 'projectName', 'correctionServer', 'correctionGroup']
      // },
      modalTitle: this.$t('bill.billModel'),
      confirmedDateMap: {},
      columnDataMap: {
        confirm: [
          { value: true, caption: this.$t('bill.confirm') },
          { value: false, caption: this.$t('bill.noConfirm') }
        ]
      },
      selectedBatchId: null,
      selectedBatchDate: null,
      isIncludeCorrection: false
    }
  }
}
</script>

<style lang="scss" scoped>
.billing-allocation {
  .reset-button {
    display: block;
    width: 18px; height: 20px;
    margin-left: $gap-s;
    color: $primary;
    cursor: pointer;
    transition: .5s ease;
    &::before {
      transition: .5s ease;
      font-size: 18px;
      display: block;
    }
    &:hover {
      transform: rotate(180deg);
    }
  }
  .dist-model-modal {
    transition: all .3s;
  }
}

.reser-bill-date-time-picker {
  .el-picker-panel__footer .el-button--text {
    display: none;
  }
}
</style>
