<template>
  <div class="version-grid">
    <div class="version-grid-top">
      <div class="version-grid-top__filter">
        <filtering-component
          horizontal
          :data="filterOptions"
          @selected="selectFilter"
          @reset-data="resetFilter"
        >
          <div
            class="version-grid-top__filter-item"
            slot="prefix"
          >
            <el-input
              v-model="versionSearch"
              type="text"
              style="width: auto;"
              :placeholder="$t('license.PLACEHOLDER.searchVersion')"
              class="version-search"
              @input="handleChangeSearch"
            />
            <search-icon style="position: relative; top: 5px;" />
          </div>
        </filtering-component>
      </div>
      <div class="version-grid-top__new">
        <button
          class="button"
          type="is-primary"
          @click="isActiveNewVersionModal = true"
        >
          {{ $t('license.TEXT.newCmpVersion') }}
        </button>
      </div>
    </div>
    <div class="version-grid-content">
      <cmp-grid
        ref="versionGridRef"
        :item-source="isFilterMode ? filterGridData : data"
        :columns="columns"
        grid-id="cmp-version-grid"
        selectable
        @selectedRow="selectedRow"
        :init-custom-action="gridInit"
      >
        <template #gIndex="{ row }">
          {{ row.gIndex }}
        </template>
        <template #packageTypeList="{ row }">
          <div class="type-items-wrapper">
            <type-items
              v-if="row.packageTypeList && row.packageTypeList.length"
              :items="row.packageTypeList"
            />
          </div>
        </template>
        <template #moduleCount="{ row }">
          {{ row.moduleCount }}
        </template>
        <template #createTime="{ row }">
          {{ row.createTime }}
        </template>
      </cmp-grid>
    </div>
    <new-version-modal
      :active.sync="isActiveNewVersionModal"
      :module-list="moduleList"
      @close="isActiveNewVersionModal = false"
      @created="createdNewVersion"
    />
    <detail-version-modal
      :item="selectedRowData"
      :active.sync="isActiveDetailVersionModal"
      @close="closeDetailModal"
      @closed="afterCloseDetailModal"
      @end-edit="endEditDetailModal"
    />
  </div>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import columns from './GridColumn'
import TypeItems from '@/components/Package/Version/TypeItems.vue'
import NewVersionModal from '@/components/Package/Version/Modal/NewVersion.vue'
import DetailVersionModal from '@/components/Package/Version/Modal/DetailVersion.vue'
import { debounce } from 'lodash'
import Fuse from 'fuse.js'
import API from '@sd-fe/cmp-core'

export default {
  name: 'CmpVersionGrid',
  components: {
    SearchIcon,
    TypeItems,
    NewVersionModal,
    DetailVersionModal
  },
  props: {
    data: {
      type: [Object, Array],
      required: false,
      default: () => []
    }
  },
  watch: {
    selectedType (type) {
      if (type && type !== 'All') {
        this.isFilterMode = true
        this.filterByType(type)
      } else {
        if (!this.versionSearch) {
          this.isFilterMode = false
        } else {
          this.handleChangeSearch(this.versionSearch)
        }
      }
    }
  },
  created () {
    this.initFilter()
  },
  methods: {
    initFilter () {
      this.versionSearch = ''
      this.selectedType = ''
      this.isFilterMode = false
    },
    gridInit (grid) {
      this.versionGrid = grid
    },
    /** ================== 필터 시작 ================== */
    selectFilter ({ type }) {
      this.selectedType = type
    },
    resetFilter () {
      this.selectedType = ''
      this.versionSearch = ''
      this.isFilterMode = false
      // this.$refs.versionSearch.control.text = ''
    },
    handleChangeSearch: debounce(function (value) {
      if (!value) {
        if (!this.selectedType || this.selectedType === 'All') {
          this.isFilterMode = false
        }
        this.filterGridData = []
        return
      }

      this.isFilterMode = true

      const fuse = new Fuse(this.data, { keys: ['cmpVersion'], threshold: 0.1 })
      const result = fuse.search(value)

      this.filterGridData = result.map(node => node.item)
    }, 500),
    resultSearch (value = this.versionSearch) {
      if (!value) return this.data

      const fuse = new Fuse(this.data, { keys: ['cmpVersion'], threshold: 0.1 })
      return fuse.search(value).map(node => node.item)
    },
    /**
     * CMP 유형별로 그리드 데이터를 필터링 한다.
     * 이미 버전 검색을 입력한 상태(필터링이 이미 된 상태)에서
     * CMP 유형 선택시 필터링이 걸려있는 데이터를 기준으로 해당하는 CMP 유형을 반환한다.
     */
    filterByType (type) {
      const targetKey = this.isFilterMode ? 'filterGridData' : 'data'
      const filterTarget = this.resultSearch()

      this[targetKey] = filterTarget.filter(version => {
        return version.packageTypeList &&
          version.packageTypeList.filter(packageType => packageType.packageTypeName === type).length
      })
    },
    /** ================== 필터 종료 ================== */
    selectedRow (row) {
      this.selectedRowData = row.dataItem
      this.isActiveDetailVersionModal = true
    },
    /** ================== 모달 관련 ================== */
    /**
     * 새로운 버전이 정상적으로 만들어졌을 때
     */
    createdNewVersion (created) {
      if (created) {
        this.$alert(this.$t('common.ALERT.LIC.012'))
        this.$emit('refresh')
        this.isActiveNewVersionModal = false
      }
    },
    /**
     * 상세 모달 닫힐 때
     */
    closeDetailModal () {
      this.isActiveDetailVersionModal = false
      this.$refs.versionGridRef.setSelectState()
    },
    /**
     * 상세 모달 닫히고 나서 이벤트
     */
    afterCloseDetailModal () {
      this.selectedRowData = null
    },
    /**
     * 상세 모달에서 수정을 끝내고 완료 눌렀을 때
     */
    async endEditDetailModal (newComment, cmpVersionIdx) {
      if (!newComment || !cmpVersionIdx) {
        return this.$alert(this.$t('common.ALERT.LIC.013'), { callback: () => false })
      }

      this.isActiveDetailVersionModal = false

      try {
        const { data: updated } = await API.license.updateVersion({ comment: newComment }, cmpVersionIdx)
        if (updated) {
          this.$alert(this.$t('common.ALERT.LIC.014'))
          this.$emit('refresh')
        }
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.021'))
      }
    }
    /** ================== 모달 관련 끝 ================== */
  },
  data: root => ({
    isFilterMode: false,
    versionSearch: '',
    versionGrid: null,
    selectedRowData: null,
    isActiveNewVersionModal: false,
    isActiveDetailVersionModal: false,
    allGridData: [],
    filterGridData: [],
    columns: columns(root),
    selectedType: '',
    moduleList: [],
    filterOptions: [
      {
        field: 'type',
        label: root.$v('패키지 유형'),
        selections: [
          { label: root.$t('main.DASHBOARD.all'), value: 'All' },
          { label: 'Plus', value: 'Plus' },
          { label: 'Basic', value: 'Basic' },
          { label: 'Standard', value: 'Standard' },
          { label: 'Enterprise', value: 'Enterprise' }
        ]
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.version-grid {
  &-top {
    display: flex;
    width: 100%;
    justify-content: space-between;

    &__filter {
      #version-search {
        width: 210px;

        &::v-deep .wj-input-group-btn { // 초기화 버튼
          display: none;
        }
      }

      &-item {
        &:first-of-type {
          margin-right: 45px;
        }

        & .version-search {
          width: auto;
          border-bottom: 1px solid $purple-gray;

          &::v-deep input:focus {
            color: white !important;
            background-color: transparent !important;
          }
        }
      }
    }
  }

  &-content {
    & .type-items-wrapper {
      display: flex;
      justify-content: center;
      margin: 0 auto;
    }
  }
}
</style>
