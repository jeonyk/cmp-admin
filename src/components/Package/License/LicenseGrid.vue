<template>
  <div class="package-license-grid">
    <div class="package-license-grid__top">
      <filtering-component
        horizontal
        :data="filterOptions"
        @reset-data="resetFilter"
      >
        <div class="filter-text">
          <!-- <wj-flex-grid-search
            ref="affSearch"
            id="aff-search"
            :placeholder="$t('common.PLACEHOLDER.searchEnter')"
          /> -->
          <el-input
            v-model="filterForm.searchKeyword"
            @input="onChangeFilterKeyword"
            :placeholder="$t('common.PLACEHOLDER.searchEnter')"
          />
          <search-icon
            class="search-icon"
            is-button
          />
        </div>
        <!-- 검색어 필터 -->
        <div class="date-filter">
          <span class="date-filter-label">
            {{ $t("license.TEXT.purchaseDate") }}
          </span>
          <div class="date-filter-form">
            <el-date-picker
              v-model="filterForm.startDate"
              type="date"
              :placeholder="$t('main.DASHBOARD.all')"
              value-format="yyyy-MM-dd"
            />
            <span class="date-filter-form__separator">~</span>
            <el-date-picker
              v-model="filterForm.endDate"
              type="date"
              :placeholder="$t('main.DASHBOARD.all')"
              value-format="yyyy-MM-dd"
            />
          </div>
        </div>
      </filtering-component>
      <div
        class=""
        style="margin-left: auto;"
      >
        <button
          class="button"
          type="is-primary"
          @click="isActiveNewPkgModal = true"
        >
          {{ $t("license.TEXT.addPackage") }}
        </button>
      </div>
    </div>
    <div class="package-license-grid__main">
      <cmp-grid
        :item-source="isSetFilter ? filteredData : license"
        :columns="columns"
        grid-id="cmp-package-license-grid"
        selectable
        @selectedRow="selectRow"
        :column-data-map="columnDataMap"
      >
        <template #index="{ row }">
          {{ license.length - row.index }}
        </template>
        <template #licensePackageType="{ row }">
          {{ licenseTypeMap[row.licensePackageType].packageTypeName }}
        </template>
        <template #createTime="{ row }">
          {{ row.createTime | date("YYYY-MM-DD", true) }}
        </template>
      </cmp-grid>
    </div>
    <new-package-modal
      :active.sync="isActiveNewPkgModal"
      @close="isActiveNewPkgModal = false"
      @apply="
        () => {
          isActiveNewPkgModal = false;
          $emit('refresh');
        }
      "
    />
  </div>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import columns from './GridColumn'
import NewPackageModal from './Modal/NewPackage.vue'
import Fuse from 'fuse.js'
import { debounce } from 'lodash'

export default {
  name: 'LicenseGrid',
  components: {
    SearchIcon,
    NewPackageModal
  },
  props: {
    license: {
      type: [Array],
      required: true
    },
    licenseTypeMap: {
      type: Object,
      required: true
    }
  },
  watch: {
    'filterForm.startDate': async function (value) {
      if (await this.validatePurchaseDate('startDate')) {
        this.emitRefreshByFilter()
      }
    },
    'filterForm.endDate': async function (value) {
      if (await this.validatePurchaseDate('endDate')) {
        this.emitRefreshByFilter()
      }
    }
  },
  methods: {
    onChangeFilterKeyword: debounce(function (e) {
      if (!e) {
        this.isSetFilter = false
        return
      }

      const fuse = new Fuse(this.license, {
        keys: ['companyName'],
        threshold: 0.2
      })

      this.filteredData = fuse.search(e).map(data => data.item)
      this.isSetFilter = true
    }, 350),
    emitRefreshByFilter () {
      this.$emit('refresh-by-filter', this.filterForm)
    },
    /**
     * 구매일 필터 validate
     * 시작일 <= 종료일
     */
    async validatePurchaseDate (changeKey) {
      if (!this.filterForm.startDate || !this.filterForm.endDate) return false
      const start = new Date(this.filterForm.startDate).getTime()
      const end = new Date(this.filterForm.endDate).getTime()

      if (start > end) {
        return this.$alert(this.$t('common.ALERT.BASE.068'), {
          callback: () => {
            this.filterForm[changeKey] = null
            return false
          }
        })
      }
      return true
    },
    resetFilter () {
      this.filterForm.startDate = null
      this.filterForm.endDate = null
      this.filterForm.searchKeyword = ''
      this.isSetFilter = false
      // 여기서 다시 API 호출
      this.$emit('refresh')
    },
    selectRow (row) {
      this.$router.push({
        name: 'cmp-package-management-license-detail',
        params: { id: row.dataItem.licenseIdx }
      })
    }
  },
  data: root => ({
    filterOptions: [],
    filteredData: [],
    filterForm: {
      startDate: null, // 구매 시작일
      endDate: null, // 구매 종료일
      searchKeyword: '' // 검색어
    },
    isSetFilter: false,
    columns: columns(root),
    isActiveNewPkgModal: false,
    columnDataMap: {
      licensePackageType: [
        { value: 1, caption: 'Plus' },
        { value: 2, caption: 'Basic' },
        { value: 3, caption: 'Standard' },
        { value: 4, caption: 'Enterprise' }
      ]
    }
  })
}
</script>

<style lang="scss" scoped>
@mixin flex-center {
  display: flex;
  align-items: center;
}

.package-license-grid {
  &__top {
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-top: 60px;

    & .filter-text {
      @include flex-center();
      margin-right: 45px;

      .search-icon {
        margin-left: 5px;
      }
    }

    & .date-filter {
      @include flex-center();

      &-label {
        margin-right: 10px;
      }

      &-form {
        &__separator {
          margin: 0 5px;
        }

        & .el-date-editor {
          border-bottom: 1px solid $input-stroke;
          max-width: 140px;
        }
      }
    }
  }
}
</style>
