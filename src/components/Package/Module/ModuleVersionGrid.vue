<template>
  <div class="module-grid">
    <div class="module-grid-top">
      <div class="module-grid-top__filter">
        <filtering-component
          horizontal
          :data="filterOptions"
          @selected="selectFilter"
          @reset-data="resetFilter"
        >
          <div class="module-grid-top__filter-item">
            <!-- <wj-flex-grid-search
              ref="moduleSearch"
              id="module-search"
              :placeholder="$t('license.PLACEHOLDER.searchModuleName')"
            /> -->
            <el-input
              v-model="filterKeyword"
              @input="onChangeFilterKeyword"
              :placeholder="$v('모듈명') + ' ' + $v('검색')"
            />
            <search-icon class="search-icon" />
          </div>
        </filtering-component>
      </div>
      <div class="module-grid-top__new">
        <button
          class="button"
          type="is-primary"
          @click="openNewModal"
        >
          {{ $t("license.TEXT.regNewModule") }}
        </button>
      </div>
    </div>
    <div class="module-grid-content">
      <cmp-grid
        :item-source="isSetFilter ? filteredData : cloneData"
        :columns="columns"
        selectable
        @selectedRow="moveToRouteDetail"
        grid-id="module-grid"
      >
        <template #index="{ row }">
          {{ cloneData.length - row.index }}
        </template>
        <template #packageTypeList="{ row }">
          <type-items :items="row.packageTypeList" />
        </template>
        <template #updateTime="{ row }">
          {{ row.updateTime | dateSimple("YYYY-MM-DD") }}
        </template>
        <template #createTime="{ row }">
          {{ row.createTime | dateSimple("YYYY-MM-DD") }}
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import TypeItems from '@/components/Package/Version/TypeItems.vue'
import columns from './GridColumn'
import { cloneDeep, debounce } from 'lodash'
import Fuse from 'fuse.js'

export default {
  name: 'ModuleVersionGrid',
  components: { SearchIcon, TypeItems },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  created () {
    this.getGridData()
  },
  methods: {
    onChangeFilterKeyword: debounce(function (e) {
      if (!e) {
        this.isSetFilter = false
        return
      }

      const fuse = new Fuse(this.cloneData, {
        keys: ['moduleName'],
        threshold: 0.15
      })

      this.filteredData = fuse.search(e).map(d => d.item)
      this.isSetFilter = true
    }, 350),
    openNewModal () {
      this.$emit('open-new-modal')
    },
    moveToRouteDetail (row) {
      this.$router.push({
        name: 'cmp-package-management-module-detail',
        params: {
          id: row.dataItem.moduleIdx
        }
      })
    },
    /**
     * props -> 그리드에 쓰일 데이터로 가공 (API 연동 후)
     */
    getGridData () {
      this.cloneData = cloneDeep(this.data)
    },
    /**
     * 필터 초기화
     */
    resetFilter () {
      this.selectedPackageType = null
      this.filterKeyword = ''

      this.getGridData()
      this.$emit('refresh')
    },
    /**
     * 필터 선택
     */
    selectFilter (filters) {
      this.selectedPackageType = filters.type

      if (this.selectedPackageType === 'All') {
        this.getGridData()
        return
      }

      this.cloneData = this.data.filter(modules => {
        return modules.packageTypeList?.filter(pt => {
          return pt.packageTypeName === this.selectedPackageType
        }).length
      })
    }
  },
  data: root => ({
    cloneData: [],
    selectedPackageType: null,
    isSetFilter: false,
    filterKeyword: '',
    filteredData: [],
    filterOptions: [
      {
        field: 'type',
        label: root.$t('license.TEXT.packageType'),
        selections: [
          { label: root.$t('main.DASHBOARD.all'), value: 'All' },
          { label: 'Plus', value: 'Plus' },
          { label: 'Basic', value: 'Basic' },
          { label: 'Standard', value: 'Standard' },
          { label: 'Enterprise', value: 'Enterprise' }
        ]
      }
    ],
    columns: columns(root)
  })
}
</script>

<style lang="scss" scoped>
.module-grid {
  &-top {
    display: flex;
    width: 100%;
    justify-content: space-between;

    &__filter {
      #module-search {
        width: 210px;

        &::v-deep .wj-input-group-btn {
          // 초기화 버튼
          display: none;
        }
      }

      &-item {
        &:first-of-type {
          margin-right: 45px;
        }

        .search-icon {
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
