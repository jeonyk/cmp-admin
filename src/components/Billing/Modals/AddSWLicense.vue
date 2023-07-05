<!-- S/W 라이선스 추가 모달 -->
<template>
  <el-dialog
    :visible="active"
    :title="$t('bill.MODEL.addSwLicense')"
    width="830px"
    top="50px"
    @close="$emit('close')"
    style="overflow-y: scroll;"
  >
    <div
      v-if="active"
      v-loading="loadingSwLicense"
      class="add-sw"
    >
      <div class="new-filter">
        <div class="new-filter-item">
          <span class="new-filter-item__placeholder">{{
            $t('bill.MODEL.os')
          }}</span>
          <el-select v-model="filterOption.os">
            <el-option
              v-for="option in filterOptions.os"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </el-select>
        </div>
        <!-- 운영체제 -->
        <div class="new-filter-item type">
          <span class="new-filter-item__placeholder">{{
            $t('bill.kinds')
          }}</span>
          <el-select v-model="filterOption.type">
            <el-option
              v-for="option in filterOptions.type"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </el-select>
        </div>
        <!-- 종류 -->
        <div class="filter-search">
          <billing-model-search
            v-model="filterOption.searchText"
            style="margin-bottom: 0; min-width: 280px;"
            @reset="resetFilter"
          />
          <!-- <wj-flex-grid-search
            id="unchecked-search"
            style="margin-bottom: 0;"
            :placeholder="$t('bill.MODEL.PLACEHOLDER.searchNameVer')"
          />
          <search-icon class="search-icon" />
          <i class="mdi mdi-refresh refresh-icon" /> -->
        </div>
      </div>
      <!-- 추후에 컴포넌트화해서 사용할 수 있도록... -->
      <cmp-grid
        :columns="uncheckedColumns"
        :item-source="isFilter ? filterGridData : uncheckedGridData"
        :paging-size="5"
        grid-id="unchecked-search-grid"
        @changingPage="onChangePageUnChecked"
        ref="uncheckedGrid"
      >
        <!-- search-box-id="unchecked-search"
        searching -->
        <template #no="{ row }">
          <el-checkbox
            v-model="row.checkedRow"
            @change="v => checkRow(row.checkedRow, row.no, row)"
          />
          <span class="check-index-row">{{ row.index + 1 }}</span>
        </template>
        <template #name="{ row }">
          <span
            v-if="row.isNew"
            class="new-tag"
          >NEW</span>
          {{ row.name }} / {{ row.operatingSystem }}
        </template>
      </cmp-grid>
      <div class="selected-sw">
        {{ $t('bill.SW.countSelectSw', { count: checkedGridData.length }) }}
      </div>
      <cmp-grid
        :columns="uncheckedColumns"
        :item-source="checkedGridData"
        :paging-size="5"
        ref="checkedGrid"
        @changingPage="onChangePageChecked"
        key="checkedGrid"
      >
        <template #no="{ row }">
          <el-checkbox
            v-model="row.checkedRow"
            @change="v => checkRow(row.checkedRow, row.no, row)"
          />
          <span class="check-index-row">{{ row.index + 1 }}</span>
        </template>
        <template #name="{ row }">
          <span
            v-if="row.isNew"
            class="new-tag"
          >NEW</span>
          {{ row.name }} / {{ row.operatingSystem }}
        </template>
      </cmp-grid>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="$emit('apply', checkedGridData)"
      >
        {{ $t('common.BTN.enroll') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import BillingModelSearch from '@/components/Billing/Search/BillingModelSearch.vue'
import { uncheckedColumns, filterOptions } from './AddSwLicense.columns'
import { debounce } from 'lodash'
import Fuse from 'fuse.js'
// import SearchIcon from '@/components/Icons/SearchIcon.vue'

export default {
  name: 'AddSwLicenseModal',
  components: {
    // SearchIcon
    BillingModelSearch
  },
  props: {
    services: {
      type: [Object, Array],
      required: false,
      default: null
    },
    active: {
      type: Boolean,
      required: true
    },
    activeModel: {
      type: Object,
      required: true
    },
    standardModel: {
      type: Object,
      required: false,
      default: null
    },
    modelGroup: {
      type: Object,
      required: false,
      default: null
    }
  },
  computed: {
    isFilter () {
      return [
        this.filterOption.os !== 'all',
        this.filterOption.type !== 'all',
        this.filterOption.text
      ].some(item => item)
    },
    standardSw () {
      return this.standardModel.options.filter(option => option.billingModelCategory.categoryType === 2)
    },
    standardSwIdxs () {
      return this.standardSw.map(sw => sw.billingModelCategory.idx)
    }
  },
  watch: {
    'filterOption.os': {
      handler: 'changeFilter'
    },
    'filterOption.type': {
      handler: 'changeFilter'
    },
    'filterOption.searchText': {
      handler: 'changeFilterText'
    },
    active (visible) {
      if (visible) {
        this.getSwLicense()
      } else {
        this.uncheckedGridData = []
        this.checkedGridData = []
        this.filterOption.os = 'all'
        this.filterOption.type = 'all'
        this.filterOption.searchText = ''
      }
    }
  },
  methods: {
    syncPagination (gridKey, dataKey) {
      setTimeout(() => {
        if (this[dataKey] !== -1) {
          this.$refs[gridKey].data.moveToPage(this[dataKey] - 1)
          this[dataKey] = -1
        }
      }, 1)
    },
    onChangePageChecked (pageNumber) {
      this.syncPagination('checkedGrid', 'checkedGridPageTemp')
    },
    onChangePageUnChecked (pageNumber) {
      this.syncPagination('uncheckedGrid', 'uncheckedGridPageTemp')
    },
    async getSwLicense () {
      this.loadingSwLicense = true
      try {
        this.swLicenses = await API.billing.getSoftwares()
        this.setUpSwLicenses()
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.BASE.061'))
      } finally {
        this.loadingSwLicense = false
      }
    },
    setUpSwLicenses () {
      this.isNewSw()
      this.uncheckedGridData = this.swLicenses.map((license, idx) => ({
        ...license,
        checkedRow: false,
        no: idx + 1
      }))
      this.defaultCheckRow()
    },
    /**
     * (적용 과금모델일 경우) 적용 날짜 이후에 생성된 S/W 처리
     */
    isNewSw () {
      // 적용 과금모델이 아닐 경우
      if (!this.modelGroup.apply) return

      this.swLicenses.forEach(sw => {
        this.$set(sw, 'isNew', sw.createTime >= this.modelGroup.applyDate)
      })
    },
    defaultCheckRow () {
      if (!this.services || !this.services.length) return

      this.services.forEach((service, _idx) => {
        // const { serviceIdx: idx } = service
        const find = this.uncheckedGridData.findIndex(data => data.serviceId === service.billingModelCategory.serviceId)
        if (find === -1) return
        const existService = this.uncheckedGridData.splice(find, 1)[0]
        this.checkedGridData.push({ ...existService, ...service, checkedRow: true, no: _idx + 1 })
        this.syncIndexGridData()
      })
    },
    syncIndexGridData () {
      const sortingIsNew = (a, b) => {
        if (a.isNew && b.isNew) return a.no - b.no
        else if (a.isNew && !b.isNew) return -1
        else return 1
      }
      this.uncheckedGridData.sort(sortingIsNew)
      this.checkedGridData.sort(sortingIsNew)
      ;[this.uncheckedGridData, this.checkedGridData].forEach(gridData => {
        gridData.forEach((data, i) => (data.no = i + 1))
      })
    },
    // 표준 과금모델에 S/W 라이선스가 포함되어 있는지 체크
    validateStandardSw (row) {
      return this.standardSwIdxs.includes(row.idx)
    },
    checkRow (value, rowIdx, row) {
      if (value) {
        const specialIdx = this.uncheckedGridData.findIndex(data => data.serviceId === row.serviceId)
        if (this.activeModel.type !== 1) {
          if (!this.validateStandardSw(row)) {
            this.$nextTick(() => (this.uncheckedGridData[specialIdx].checkedRow = false))
            this.syncIndexGridData()
            if (this.isFilter) this.changeFilter()
            return this.$alert(this.$t('common.ALERT.BILL.043'), { dangerouslyUseHTMLString: true, callback: () => false })
          }
        }
        const item = this.uncheckedGridData.splice(specialIdx, 1)[0]
        this.uncheckedGridPageTemp = this.$refs.uncheckedGrid.page.currPage
        this.onChangePageUnChecked()
        this.checkedGridData.push(item)
      } else {
        const specialIdx = this.checkedGridData.findIndex(data => data.serviceId === row.serviceId)
        const item = this.checkedGridData.splice(specialIdx, 1)[0]
        this.checkedGridPageTemp = this.$refs.checkedGrid.page.currPage
        this.onChangePageChecked()
        this.uncheckedGridData.push(item)
      }
      this.syncIndexGridData()
      if (this.isFilter) {
        this.searchText(this.filterOption.searchText)
        this.changeFilter()
      }
    },
    changeFilter (_) {
      const filterByValue = (item, type) => {
        if (this.filterOption[type] === 'all') return true
        if (type === 'os') {
          return (
            item.operatingSystem.toLowerCase() === this.filterOption.os
          )
        } else if (type === 'type') {
          return (
            item.serviceType.toLowerCase() === this.filterOption.type
          )
        }
      }

      this.filterGridData = this.uncheckedGridData
        .filter(item => filterByValue(item, 'os'))
        .filter(item => filterByValue(item, 'type'))
    },
    resetFilter () {
      this.filterOption.os = 'all'
      this.filterOption.type = 'all'
      this.filterOption.searchText = ''
    },
    changeFilterText: debounce(function (value) {
      if (!value) {
        this.changeFilter()
        this.filterOption.text = ''
        return
      }

      this.searchText(value)
    }, 500),
    searchText (value) {
      const selectFilter = this.filterOption.type !== 'all' || this.filterOption.os !== 'all'

      const fuse = new Fuse(selectFilter ? this.filterGridData : this.uncheckedGridData, {
        threshold: 0.5,
        isCaseSensitive: false,
        keys: [
          'name',
          'version'
        ]
      })

      this.filterOption.text = value
      const filtered = fuse.search(value).map(source => source.item)
      this.filterGridData = filtered
    }
  },
  data: root => ({
    filterGridData: [],
    uncheckedGridData: [],
    checkedGridData: [],
    uncheckedColumns: uncheckedColumns(root),
    filterOptions: filterOptions(root),
    filterOption: {
      os: 'all',
      type: 'all',
      searchText: '',
      text: ''
    },
    swLicenses: [],
    loadingSwLicense: false,
    uncheckedGridPageTemp: -1,
    checkedGridPageTemp: -1
  })
}
</script>

<style lang="scss" scoped>
.add-sw {
  & .new-tag {
    padding: 2px 5px;
    font-size: 9px;
    background-color: #ca5b57;
    border-radius: 2px;
    color: white;
    margin-right: $gap-s;
  }

  & .check-index-row {
    margin-left: $gap-s;
  }

  & .selected-sw {
    margin-top: $gap-m * 2;
    margin-bottom: $gap;
  }

  & .new-filter {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    margin-bottom: $gap;

    & > :last-child {
      margin-left: auto;
    }

    & .filter-search {
      display: flex;
      align-items: center;

      & > #unchecked-search {
        min-width: 180px;
        display: inline-block;
      }

      & .search-icon,
      & .refresh-icon {
        cursor: pointer;
      }

      & .search-icon {
        margin-right: 6px;
      }
    }

    &-item {
      &__placeholder {
        /* display: inline-block; */
        margin-right: $gap-s;
      }

      & .el-select {
        max-width: 140px;

        &::v-deep .el-input {
          &__inner {
            border-radius: 0;
            border: none;
            border-bottom: 1px solid $input-stroke;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }

      &.type {
        margin-left: $gap;
      }
    }
  }
}
</style>
