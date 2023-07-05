<!--
  * 파일명 : MeteringLicense.vue
  * 파일 기능 : [S/W 라이선스] 관련 페이지입니다. 라이선스 추가 / 스케줄 관리가 가능합니다
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 push~
 -->

<template>
  <div class="metering-license">
    <div class="filter-wrap">
      <filtering-component
        :data="filteringOptions"
        @selected="changeFilter"
        @reset-data="resetData()"
      >
        <div class="filter-search">
          <div class="text-search">
            <el-input
              v-model="searchText"
              @input="searchData"
              placeholder="검색어를 입력해주세요"
            />

            <i class="search-icon" />
          </div>
        </div>
      </filtering-component>
    </div>
    <div
      v-loading="loading"
    >
      <section class="table-top-wrap">
        <!-- <total-count :total-count="totalResultCnt" /> -->
        <div class="button-area -left">
          <button
            class="button"
            type="is-primary"
            @click="sellingThresholdModal = true"
          >
            {{ $v('판매량 임계치설정') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="categoryModal = true"
          >
            {{ $v('카테고리 관리') }}
          </button>
          <button
            class="button"
            type="is-primary"
            :disabled="isEditing"
            @click="addLicenseModal = { view: true, type: 'new' }"
          >
            {{ $v('라이선스 추가') }}
          </button>
        </div>
        <div class="button-area -right">
          <button
            class="button"
            @click="excelDownload"
          >
            {{ $v('Excel 다운로드') }}
            <download-icon style="position: relative; top: 3px" />
          </button>
          <button
            class="button"
            :disabled="!selectedRow"
            @click="addLicenseModal = { view: true, type: 'update' }"
          >
            {{ $v('변경') }}
          </button>
          <button
            class="button"
            type="is-anti"
            :disabled="!selectedRow"
            @click="deleteLicense(selectedRow)"
          >
            {{ $v('삭제') }}
          </button>
        </div>
      </section>

      <section class="table-area">
        <!-- <cmp-grid
          :init-custom-action="init"
          :item-source="tableData"
          :columns="columns"
          selectable
          :use-excel-download="true"
          @selectedRow="setSelectedRow"
          @total-count="cnt => totalResultCnt = cnt"
        >
          <template #categories="{ row }">
            <el-tooltip
              :disabled="row.categories.length === 1"
              effect="light"
            >
              <span v-if="row.categories.length > 1">
                {{ row.categories[0] }} 외 {{ row.categories.length - 1 }}
              </span>
              <span v-else>
                {{ row.categories[0] }}
              </span>

              <div slot="content">
                <div
                  v-for="category in row.categories"
                  :key="category"
                >
                  {{ category }}
                </div>
              </div>
            </el-tooltip>
          </template>

          <template #licenseStatus="props">
            <div class="license-status flex-wrap -space-between">
              <span>{{ props.row.licenseStatusDisplayName }}</span>
              <button
                class="button"
                @click="setModalStatus({ view: true, row: props.row }, 'licenseStatusModal')"
              >
                {{ $v('현황보기') }}
              </button>
            </div>
          </template>

          <template #history="props">
            <button
              class="button"
              @click.stop="setModalStatus({ view: true, row: props.row }, 'licenseHistoryModal')"
            >
              {{ $v('이력보기') }}
            </button>
          </template>

          <template #remain="props">
            <button
              class="button"
              @click.stop="setModalStatus({ view: true, row: props.row }, 'sourceSettingModal')"
            >
              {{ $v('자원관리') }}
            </button>
          </template>
        </cmp-grid> -->
        <metering-license-list
          :items-by-page="getItemsByPage"
          @set-status="setModalStatus"
          @selected-row-item="setSelectedRowItem"
        />
        <div
          v-if="filteredTableData && filteredTableData.length > 10"
          class="pagination-wrap"
        >
          <el-pagination
            :current-page="currentPage"
            @current-change="(num) => {
              currentPage = num
            }"
            :total="filteredTableData.length"

            layout="prev, pager, next"
          />
        </div>
      </section>

      <!-- 라이선스 이력 모달 -->
      <metering-license-history-modal
        :visible="licenseHistoryModal.view"
        :data="licenseHistoryModal.row"
        @close="setModalStatus({ view: false, row: null }, 'licenseHistoryModal')"
      />

      <!-- 라이선스 현황 모달 -->
      <metering-license-status-modal
        :visible="licenseStatusModal.view"
        :data="licenseStatusModal.row"
        @close="setModalStatus({ view: false, row: null }, 'licenseStatusModal')"
      />

      <!-- 자원관리 모달 -->
      <resource-management-modal
        :visible="sourceSettingModal.view"
        :data="sourceSettingModal.row"
        @close="setModalStatus({ view: false, row: null }, 'sourceSettingModal')"
      />

      <!-- 라이선스 추가 모달 -->
      <add-metering-license-modal
        :visible="addLicenseModal.view"
        :type="addLicenseModal.type"
        :data="selectedRow"
        @save="saveLicense"
        @update="saveLicense"
        @close="addLicenseModal.view = false"
      />

      <!-- 카테고리 관리 모달 -->
      <category-modal
        :visible="categoryModal"
        @close="categoryModal = false"
      />

      <!-- 판매량 임계치설정 -->
      <set-selling-threshold
        :visible="sellingThresholdModal"
        :data="threshold"
        @close="sellingThresholdModal = false"
        @save="updateSWLicenseThreshold"
      />
    </div>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import MeteringLicemseHistoryModal from '@/components/MeteringLicense/MeteringLicemseHistoryModal'
import MeteringLicenseStatusModal from '@/components/MeteringLicense/MeteringLicenseStatusModal'
import ResourceManagementModal from '@/components/MeteringLicense/ResourceManagementModal'
import AddMeteringLicenseModal from '@/components/MeteringLicense/AddMeteringLicenseModal'
import CategoryModal from '@/components/MeteringLicense/CategoryModal'
import SetSellingThreshold from '@/components/MeteringLicense/SetSellingThreshold'
import dayjs from 'dayjs'
import Fuse from 'fuse.js'
import xlsx from 'xlsx'
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'
import MeteringLicenseList from './MeteringLicenseList.vue'

export default {
  name: 'MeteringLicense',
  components: {
    'metering-license-history-modal': MeteringLicemseHistoryModal,
    'metering-license-status-modal': MeteringLicenseStatusModal,
    'resource-management-modal': ResourceManagementModal,
    'category-modal': CategoryModal,
    'add-metering-license-modal': AddMeteringLicenseModal,
    'set-selling-threshold': SetSellingThreshold,
    FilteringComponent,
    DownloadIcon,
    MeteringLicenseList
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    getItemsByPage () {
      const firstIndex = (this.currentPage - 1) * this.pageSize
      const lastIndex = firstIndex + this.pageSize
      return this.filteredTableData.slice(firstIndex, lastIndex)
    }
  },
  provide () {
    return {
      categoryKeys: () => this.categoryKeys
    }
  },
  async created () {
    this.init_V3()
  },
  methods: {
    /**
     * 목록 호출
     */
    async init_V3 () {
      this.setSelectedRow(null) // 선택한 row 초기화
      this.getSWLicenseCategory()
      this.getSWLicenseThreshold()
      await this.getSWLicense()
    },

    /**
     * SW 라이선스 목록 조회
     */
    async getSWLicense () {
      try {
        this.loading = true
        const response = await API.metering.getSWLicense()
        // console.log('%c@@ API로 가져온 S/W 라이선스', 'color: pink', response)

        if (!response) return

        const { lowValue, upperValue } = this.threshold

        this.rawTableData = response
        this.tableData = response.map(({ ...sw }) => {
          // console.log(sw)
          const categories = sw.categoryIdxList.map(idx => this.categoryKeys[idx])

          const compare = (sw.salesQuantity / sw.purchaseQuantity) * 100
          let licenseStatusDisplayName = this.$v('정상')
          if (compare < lowValue) licenseStatusDisplayName = this.$v('판매저조')
          if (compare > upperValue) licenseStatusDisplayName = this.$v('추가 구매 필요')

          // console.log(`판매 수량 : ${sw.salesQuantity}, 구매 수량 : ${sw.purchaseQuantity}, 비율 : ${compare}\n최저 임계치 : ${lowValue}%, 최대 임계치 : ${upperValue}%, 계산 결과 : ${compare}`)

          return {
            ...sw,
            categories, // 카테고리
            licenseStatusDisplayName, // 라이선스 현황 => (판매량 / 구매량) * 100 vs 임계치 비교
            cumulativeSalesAmountDisplayName: (sw.cumulativeSalesAmount || 0).toLocaleString() + this.$v('원'), // 누적판매금액
            purchaseQuantityDisplayName: (sw.purchaseQuantity || 0) + ' EA', // 총 구매수량
            purchaseAmountDisplayName: (sw.purchaseAmount || 0).toLocaleString() + this.$v('원') // 총 구매금액
          }
        })

        this.setSelectOptions() // 필터 옵션 설정
        this.filteredTableData = [...this.tableData]
      } catch (error) {
        console.error('@@ MeteringLicense > getSWLicense :: ', error)
        this.$alert(this.$v('SW 라이선스 목록을 가져오는데 실패했습니다.'))
        this.tableData = []
      } finally {
        this.loading = false
      }
    },

    /**
     * [판매량 임계치] 조회
     */
    async getSWLicenseThreshold () {
      try {
        const response = await API.metering.getSWLicenseThreshold()
        if (!response) return

        const { idx, lowValue, upperValue } = response

        this.threshold = { idx, lowValue, upperValue }
      } catch (error) {
        console.error('@@ MeteringLicense > getSWLicenseThreshold', error)
        this.$alert(this.$v('판매량 임계치를 가져오는 도중 문제가 발생하였습니다. 다시 시도해주세요.'))
      }
    },

    /**
     * [판매량 임계치] 업데이트 이벤트
     * @param {Object} payload
     */
    async updateSWLicenseThreshold (payload) {
      try {
        await API.metering.updateSWLicenseThreshold(payload)

        await this.init_V3()
        this.sellingThresholdModal = false
      } catch (error) {
        console.error('@@ MeteringLicense > updateSWLicenseThreshold', error)
        this.$alert(this.$v('판매량 임계치 저장 도중 문제가 발생하였습니다. 다시 시도해주세요.'))
      }
    },

    /**
     * 차트 엑셀다운로드
     */
    excelDownload () {
      const workbook = xlsx.utils.book_new()
      const columns = this.columns.map(column => column.header)
      const rowDatas = this.filteredTableData.map(row => {
        const categories = row.categories.join(',')
        const data = { ...row, categories }

        const sheet = []
        this.columns.forEach(item => {
          const key = item.binding
          sheet.push(data[key])
        })
        return sheet
      })

      const worksheet = xlsx.utils.aoa_to_sheet([columns, ...rowDatas])
      const fileName = `SW_라이선스_${dayjs().format(
        'YYYYMMDDHHmmss'
      )}.xlsx`
      xlsx.utils.book_append_sheet(workbook, worksheet)
      xlsx.writeFile(workbook, fileName)
    },

    /**
     * [라이선스 추가 / 변경] 저장
     * @param {Object} data
     */
    async saveLicense (data) {
      const type = this.addLicenseModal.type
      const categorize = {
        new: { apiName: 'createSWLicense', text: '추가가' },
        update: { apiName: 'updateSWLicense', text: '변경이' }
      }[type]

      const { apiName, text } = categorize

      try {
        await API.metering[apiName](data)
        this.$alert(this.$v(`라이선스 ${text} 완료되었습니다.`), { callback: this.init_V3 })
      } catch (error) {
        console.error(`@@ MeteringLicense > saveLicense > ${apiName} :: `, error)
        this.$alert(this.$v('라이선스를 저장하는 도중 문제가 발생하였습니다. 다시 시도해주세요.'))
      }
    },

    /**
     * [라이선스 삭제] 실행
     * @param { Object } row
     */
    deleteLicense ({ swIdx, ...row }) {
      try {
        const action = async () => {
          const { userId, userIdx, userName } = this.user
          const params = { swIdx, userId, userIdx, userName }

          await API.metering.deleteSWLicense(params)
          this.$alert(this.$v('라이선스가 삭제되었습니다.'), { callback: this.init_V3 })
        }

        this.$confirm(this.$t('라이선스를 삭제하시겠습니까?'), {
          confirmButtonText: this.$v('삭제'),
          cancelButtonText: this.$v('취소')
        }).then(action).catch(() => false)
      } catch (error) {
        console.error('@@ MeteringLicense > deleteLicense :: ', error)
        this.$alert(this.$v('라이선스를 삭제하는데 문제가 발생하였습니다. 다시 시도해주세요.'))
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
     * [카테고리 목록] 호출 (key-value 저장해서 바인딩에 사용)
     */
    async getSWLicenseCategory () {
      try {
        const response = await API.metering.getSWLicenseCategory()
        if (!response) return []

        const keys = {}
        for (const { categoryIdx, categoryName } of response) {
          keys[categoryIdx] = categoryName
        }

        this.categoryKeys = keys
      } catch (error) {
        console.error('@@ MeteringLicense > getSWLicenseCategory', error)
        this.$alert(this.$v('카테고리 목록을 가져오는데 문제가 발생했습니다. 다시 시도해주세요.'))
        return []
      }
    },
    // -----
    // -----
    // -----

    /**
     * 선택한 Row 저장
     */
    setSelectedRow (row) {
      this.selectedRow = row ? row.dataItem : null
    },
    setSelectedRowItem (evt, row) {
      if (this.selectedRow?.swIdx === row.swIdx) {
        evt.target.closest('.lst-sw').classList.remove('selected')
        row = null
      } else {
        const lst = document.querySelectorAll('.lst-sw')
        lst.forEach(item => {
          item.classList.remove('selected')
        })
        evt.target.closest('.lst-sw').classList.add('selected')
      }

      this.selectedRow = row ? { ...row } : null
    },
    init (grid) {
      this.grid = grid
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    setSelectOptions () {
      const swList = this.tableData.map(item => {
        return {
          label: item.name,
          value: item.swIdx
        }
      })

      const categoryList = []
      for (const key in this.categoryKeys) {
        categoryList.push({ label: this.categoryKeys[key], value: key })
      }

      const statusList = this.tableData.map(item => {
        return item.licenseStatusDisplayName
      })
      const uniqueStatusList = [...new Set(statusList)]
      const filteredStatusList = uniqueStatusList.map(item => {
        return {
          label: item,
          value: item
        }
      })
      this.filteringOptions[0].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...swList] // S/W 이름
      this.filteringOptions[1].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...categoryList] // 카테고리
      this.filteringOptions[2].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...filteredStatusList] // 판매성과
    },
    /**
     * 필터링 시, 발생 이벤트 입니다.
     * @param {Object} filtering 필터링 전체 선택된 valye
     */
    changeFilter (filtering) {
      console.log('changeFilter: ', filtering)
      for (const key in filtering) {
        this.filterObj[key] = filtering[key]
      }
      this.searchData()
    },
    changeSearchCondition (test) {
      this.searchText = undefined
      this.searchData()
    },

    /**
     * 조회 버튼 클릭시 실행하는 검색 메소드
     *
     * 1. 각 조건별 필터
     */
    searchData () {
      let swData = [...this.tableData]

      if (this.filterObj.swName) {
        swData = swData.filter(
          item => item.swIdx === this.filterObj.swName
        )
      }

      if (this.filterObj.category) {
        swData = swData.filter(
          item => item.categoryIdxList.includes(Number(this.filterObj.category))
        )
      }

      if (this.filterObj.licenseStatus) {
        swData = swData.filter(
          item => item.licenseStatusDisplayName === this.filterObj.licenseStatus
        )
      }

      if (this.searchText) {
        const fuse = new Fuse(swData, {
          keys: ['name', 'cumulativeSalesAmount', 'cumulativeSalesAmountDisplayName', 'licenseStatusDisplayName', 'memo', 'osSystem', 'osType', 'osVersion', 'purchaseAmount', 'purchaseAmountDisplayName', 'purchaseLicenseType', 'purchaseQuantity', 'purchaseQuantityDisplayName', 'salesLicenseType', 'salesQuantity', 'version', 'categories'],
          threshold: 0.2
        })

        swData = fuse.search(this.searchText).map(node => node.item)
        console.log(swData)
      }

      this.filteredTableData = swData
    },
    /**
     * 초기화 버튼 클릭시 실행하는 메소드
     *
     * 1. 사용자 원본 데이터 입력
     * 2. 필터 값 초기화 (셀렉트 박스 자체 초기화는 미적용)
     */
    resetData () {
      this.filterObj = {
        swName: undefined,
        category: undefined,
        licenseStatus: undefined
      }
      this.searchText = undefined
      this.searchData()
    }
  },
  data () {
    return {
      isEditing: false, // 편집중인 상태를 저장합니다.
      totalResultCnt: 0,
      loading: false,
      categoryKeys: {}, // 카테고리 keys 저장
      threshold: { // 판매량 임계치 설정
        idx: undefined,
        lowValue: undefined,
        upperValue: undefined
      },
      selectedRow: undefined,
      licenseHistoryModal: { view: false, row: null }, // 라이선스 이력보기 모달
      licenseStatusModal: { view: false, row: null }, // 라이선스 현황보기 모달
      sourceSettingModal: { view: false, row: null }, // 라이선스 자원관리 모달
      sellingThresholdModal: false, // 판매량 임계치설정 모달
      addLicenseModal: { view: false, row: null }, // 라이선스 추가 모달
      categoryModal: false, // 카테고리 관리 모달
      rawTableData: [],
      tableData: [],
      // [SW 라이선스] 목록 테이블 컬럼
      columns: [
        { header: this.$v('S/W 이름'), binding: 'name', width: 130 },
        { header: this.$v('S/W 버전'), binding: 'version', width: 130 },
        { header: this.$v('카테고리'), binding: 'categories', width: 130, customHtml: true },
        { header: this.$v('운영체제 유형'), binding: 'osType', width: 140 },
        { header: this.$v('운영체제 구분'), binding: 'osSystem', width: 140 },
        { header: this.$v('운영체제 버전'), binding: 'osVersion', width: 100 },

        { header: this.$v('구매 라이선스유형'), binding: 'purchaseLicenseType', width: 200 },
        { header: this.$v('총 구매수량'), binding: 'purchaseQuantityDisplayName', width: 100 },
        { header: this.$v('총 구매금액'), binding: 'purchaseAmountDisplayName', width: 100 },
        { header: this.$v('판매 S/W 라이선스유형'), binding: 'salesLicenseType', width: 200 },
        { header: this.$v('판매수량'), binding: 'salesQuantity', width: 100 },
        { header: this.$v('누적판매금액 (청구금액기준)'), binding: 'cumulativeSalesAmountDisplayName', width: 100 },
        { header: this.$v('라이선스 현황'), binding: 'licenseStatus', customHtml: true, width: 230 },
        { header: this.$v('S/W라이선스이력'), binding: 'history', customHtml: true, width: 150 },
        { header: this.$v('자원 관리'), binding: 'remain', customHtml: true, width: 150 }
      ],
      filteredTableData: [], // filteredtableData
      pageSize: 10,
      currentPage: 1,
      searchText: undefined,
      chartData: [],
      filterObj: {
        swName: undefined,
        category: undefined,
        licenseStatus: undefined
      },
      // 필터링 데이터
      filteringOptions: [
        {
          field: 'swName',
          label: 'S/W 이름',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
          ]
        },
        {
          field: 'category',
          label: '카테고리',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
          ]
        },
        {
          field: 'licenseStatus',
          label: '판매 성과',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
          ]
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.license-status {
  > span {
    flex: 0 0 75px;
    display: block;
    margin-right: $gap-s;
  }
}

.filter-search {
  height: 30px;
  display: flex;
  align-items: center;

  .search-option {
    width: 200px;
  }

  .text-search {
    width: 210px;
    margin: 0 $gap;
    margin-left: 0;
    height: 32px;
    position: relative;
  }

  .search-icon {
    position: absolute;
    top: 5px;
    right: -$gap;
    width: 15px;
    height: 15px;
    cursor: pointer;

    &::before,
    &::after {
      content: "";
      position: absolute;
    }
    &::before {
      width: 13px;
      height: 13px;
      top: 0;
      right: 0;
      border: 2px solid $input-placeholder;
      border-radius: 50%;
    }
    &::after {
      width: 2px;
      height: 6px;
      top: 13px;
      right: 0;
      transform: rotate(-45deg);
      background-color: $input-placeholder;
    }
  }
}
</style>
