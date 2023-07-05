<template>
  <el-dialog
    :title="$v('S/W 라이선스 현황')"
    :visible.sync="visible"
    width="1800px"
    :before-close="() => $emit('close')"
  >
    <section class="modal-body">
      <div class="grid-area">
        <cmp-grid
          :item-source="statusData"
          :columns="columns"
        >
          <template #history="props">
            <button
              class="button"
              @click.stop="setModalStatus({ view: true, row: props.row }, 'licenseHistoryModal')"
            >
              {{ $v('이력보기') }}
            </button>
          </template>
          <!-- /. 라이선스 이력 -->

          <template #remain="props">
            <button
              class="button"
              @click.stop="setModalStatus({ view: true, row: props.row }, 'sourceSettingModal')"
            >
              {{ $v('자원관리') }}
            </button>
          </template>
          <!-- /. 자원 관리 -->
        </cmp-grid>
      </div>

      <div>
        <div class="flex-wrap -space-between">
          <h5 class="modal-sub-title sub-title">
            {{ $v('월별판매금액') }}
          </h5>

          <div class="flex-wrap space-between">
            <filtering-component
              :data="filterData"
              :use-title="false"
              ref="filter"
              class="filtering-component"
              @selected="getMonthlyBilling"
            />
            <button
              class="button"
              @click="excelDownload"
            >
              {{ $v('Excel 다운로드') }}
              <download-icon style="position: relative; top: 3px" />
            </button>
          </div>
        </div>

        <cmp-chart
          v-if="chartData.length"
          :initialized="initialized"
          :items-source="chartData"
          :height="500"
          binding-x="month"
          selection-mode="Point"
          :palette="['rgba(141, 229, 167, 1)', 'rgba(115, 117, 218, 1)', 'rgba(137, 211, 240, 1)']"
          :chart-binding="vcpuChartBinding"
          chart-animation="None"
          chart-legend-position="None"
        />
        <div
          class="empty-zone"
          v-else
        >
          {{ $v('판매 실적이 없습니다') }}
        </div>
      </div>
    </section>

    <div class="modal-footer modal-button-area">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('닫기') }}
      </button>
    </div>

    <!-- 라이선스 이력 모달 -->
    <metering-license-history-modal
      :visible="licenseHistoryModal.view"
      :data="licenseHistoryModal.row"
      @close="setModalStatus({ view: false, row: null }, 'licenseHistoryModal')"
    />

    <!-- 자원관리 모달 -->
    <resource-management-modal
      :visible="sourceSettingModal.view"
      :data="sourceSettingModal.row"
      @close="setModalStatus({ view: false, row: null }, 'sourceSettingModal')"
    />
  </el-dialog>
</template>

<script>
import xlsx from 'xlsx'
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'
import MeteringLicemseHistoryModal from '@/components/MeteringLicense/MeteringLicemseHistoryModal'
import ResourceManagementModal from '@/components/MeteringLicense/ResourceManagementModal'

import API from '@sd-fe/cmp-core'

export default {
  name: 'AddMeteringLicenseModal',
  components: {
    DownloadIcon,
    'metering-license-history-modal': MeteringLicemseHistoryModal,
    'resource-management-modal': ResourceManagementModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    visible (active) {
      if (active) {
        // 조회기간 자동 선택
        this.$nextTick(() => { this.$refs.filter.filterTotalData = { beforeMonth: 6 } })
        this.statusData = [this.data]
      }
    }
  },
  methods: {
    /**
     * 라이선스 현황 목록 보기
     * @param {Number} beforeMonth
     */
    async getMonthlyBilling ({ beforeMonth }) {
      try {
        const { swIdx } = this.data
        const params = { swIdx, beforeMonth }

        const response = await API.metering.getMonthlyBilling(params)
        const setDate = date => this.$options.filters.date(date, 'YYYY.MM')
        // console.log(response)

        let accumulate = 0

        this.chartData = response.map(({ billingDate, expense }) => {
          accumulate += expense

          return {
            month: setDate(billingDate),
            value1: expense,
            value2: accumulate
          }
        })
      } catch (error) {
        console.error('@@ MeteringLicensStatusModal > getMonthlyBilling', error)
      }
    },
    /**
     * 모달 상세 open/close 담당
     * @param {String} key licenseHistoryModal(이력), licenseStatusModal(라이선스 현황), sourceSettingModal(자원관리)
     */
    setModalStatus ({ view, row }, key) {
      this[key] = { view, row }
    },
    /**
     * 차트 엑셀다운로드
     */
    excelDownload () {
      const workbook = xlsx.utils.book_new()
      const leftColumns = [' ', this.$v('월'), this.$v('누적')]

      const values = [[], [], []]

      for (const { month, value, value2 } of this.chartData) {
        values[0].push(month) // 월 (YYYY.MM)
        values[1].push(value) // 월 단위 값
        values[2].push(value2) // 누적 단위 값
      }

      const sheet = []
      for (let i = 0; i < 3; i++) {
        const cols = leftColumns[i]
        const value = values[i]
        sheet.push([cols, ...value])
      }

      // console.log(sheet)

      const worksheet = xlsx.utils.aoa_to_sheet(sheet)
      // const worksheet = xlsx.utils.aoa_to_sheet([ (형식 샘플)
      //   [' ', 'A1', 'B1', 'C1'],
      //   ['월', 'A2', 'B2', 'C2'],
      //   ['누적', 'A3', 'B3', 'C3']
      // ])

      const fileName = 'SW 라이선스 월별 판매금액.xlsx'
      xlsx.utils.book_append_sheet(workbook, worksheet)
      xlsx.writeFile(workbook, fileName)
    },
    /**
     * 차트 label 설정
     */
    initialized (chart) {
      chart.dataLabel.position = 'Top'
      chart.dataLabel.offset = 10
      chart.dataLabel.content = '<tspan fill="#e1e1e1">{value:n0}</tspan>'
    }
  },
  data: root => ({
    licenseHistoryModal: { view: false, type: undefined }, // 라이선스 이력보기 모달
    sourceSettingModal: { view: false, row: null }, // 라이선스 자원관리 모달
    filterData: [
      {
        label: '조회기간',
        field: 'beforeMonth',
        selections: [
          { label: '6개월', value: 6 },
          { label: '1년', value: 12 }
        ]
      }
    ],
    columns: [
      { header: root.$v('S/W 이름'), binding: 'name', width: 130 },
      { header: root.$v('S/W 버전'), binding: 'version', width: 130 },
      { header: root.$v('카테고리'), binding: 'categoryIdx', width: 130 },
      { header: root.$v('운영체제 유형'), binding: 'osType', width: 140 },
      { header: root.$v('운영체제 구분'), binding: 'osSystem', width: 140 },
      { header: root.$v('운영체제 버전'), binding: 'osVersion', width: 100 },
      { header: root.$v('구매 라이선스유형'), binding: 'purchaseLicenseType', width: 200 },
      { header: root.$v('총 구매수량'), binding: 'purchaseQuantityDisplayName', width: 100 },
      { header: root.$v('총 구매금액'), binding: 'purchaseAmount', width: 100 },
      { header: root.$v('판매 S/W 라이선스유형'), binding: 'salesLicenseType', width: 200 },
      { header: root.$v('판매수량'), binding: 'salesQuantity', width: 100 },
      { header: root.$v('누적판매금액 (청구금액기준)'), binding: 'cumulativeSalesAmount', width: 100 },
      { header: root.$v('S/W라이선스이력'), binding: 'history', customHtml: true, width: 150 },
      { header: root.$v('자원 관리'), binding: 'remain', customHtml: true, width: 150 }
    ],
    statusData: [],
    chartData: [],
    vcpuChartBinding: [
      { name: '누적판매금액', binding: 'value1' },
      { name: '누적판매금액', binding: 'value2', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#ffc000', stroke: '#ffc000' }, symbolSize: 0 }, color: '#ffc000' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.modal-body {
  max-height: 800px;
  overflow-y: auto;

  .grid-area {
    margin-bottom: 40px;
  }
}

.filtering-component::v-deep {
  margin: 0 15px 0;
  height: 30px;
  .filter-wrapper {
    margin: 0;
  }
}
</style>
