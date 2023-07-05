<template>
  <div class="mv-detail-grid">
    <div class="mv-detail-grid__top">
      <div class="mv-detail-grid__top-filter">
        <filtering-component
          horizontal
          style="margin-bottom: 20px;"
          :data="filterOptions"
          @selected="selectFilter"
          @reset-data="resetFilter"
        >
          <div
            class="search-wrap"
            style="margin-bottom: 1px;"
          >
            <!-- <wj-flex-grid-search
              ref="detailModuleSearch"
              id="detail-module-search"
              placeholder="검색어 입력"
            /> -->
            <el-input
              class="grid-search"
              type="text"
              v-model="searchText"
              :placeholder="$t('license.PLACEHOLDER.inputSearch')"
              @input="searchByFilter"
            />
            <search-icon style="position: relative; top: 5px;" />
          </div>
        </filtering-component>
      </div>
      <div class="mv-detail-grid__top-buttons">
        <button
          class="button"
          type="is-primary"
          @click="clickUpdateModule"
        >
          {{ $t('license.TEXT.moduleUpdate') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="!selectedItem"
          @click="clickModify"
        >
          {{ $t('common.BTN.modify') }}
        </button>
      </div>
    </div>
    <div class="mv-detail-grid__content">
      <cmp-grid
        v-if="moduleData"
        :columns="columns"
        :item-source="cloneModuleData"
        selectable
        @selectedRow="selectedRow"
      >
        <template #modulePath="{ row }">
          <span class="module-location">
            {{ row.modulePath }}
          </span>
        </template>
        <template #regUser="{ row }">
          {{ row.adminName }}
          <span v-if="row.adminId">
            {{ row.adminId | maskingName }}
          </span>
        </template>
        <template #regDate="{ row }">
          {{ row.createTime | dateSimple("YYYY-MM-DD") }}
        </template>
      </cmp-grid>
    </div>
    <info-module
      :active.sync="isActiveInfoModal"
      :item="selectedItem"
      :is-edit="isEditMode"
      :module-data="moduleData"
      @close="closeInfoModal"
      @closed="isEditMode = false"
      @required-refresh="$emit('refresh')"
    />
  </div>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import columns from './DetailGridColumn'
import InfoModule from '@/components/Package/Module/Modal/InfoModule.vue'
import { cloneDeep, debounce } from 'lodash'
import Fuse from 'fuse.js'

export default {
  name: 'ModuleVersionDetailGrid',
  components: { SearchIcon, InfoModule },
  props: {
    moduleData: {
      type: Object,
      required: false,
      default: null
    }
  },
  watch: {
    moduleData (val) {
      this.resetFilter()
      this.cloneModuleData = cloneDeep(this.moduleData.moduleVersionList)
    }
  },
  methods: {
    searchByFilter: debounce(function (value) {
      if (!value) {
        this.cloneModuleData = cloneDeep(this.moduleData.moduleVersionList)
        return
      }

      const allVersions = this.moduleData.moduleVersionList

      if (this.selectedFilter === 'All' || !this.selectedFilter) {
        const fuse = new Fuse(allVersions, {
          threshold: 0.2,
          keys: ['moduleVersion', 'adminName', 'adminId', 'comment']
        })
        const result = fuse.search(value)

        this.cloneModuleData = result.map(d => d.item)
      } else {
        let searchKey

        if (this.selectedFilter === 'Version') searchKey = ['moduleVersion']
        else if (this.selectedFilter === 'Admin') searchKey = ['adminId', 'adminName']
        else if (this.selectedFilter === 'Desc') searchKey = ['comment']

        const fuse = new Fuse(allVersions, {
          threshold: 0.2,
          keys: searchKey
        })

        this.cloneModuleData = fuse.search(value).map(d => d.item)
      }
    }, 250),
    resetFilter () {
      this.searchText = ''
      this.cloneModuleData = cloneDeep(this.moduleData.moduleVersionList)
    },
    selectFilter (selected) {
      this.selectedFilter = selected.type
    },
    selectedRow (row) {
      if (!row) this.selectedItem = null
      else this.selectedItem = row.dataItem
    },
    clickModify () {
      this.isEditMode = true
      this.isActiveInfoModal = true
    },
    closeInfoModal () {
      this.isActiveInfoModal = false
    },
    clickUpdateModule () {
      this.isEditMode = false
      this.isActiveInfoModal = true
    }
  },
  data: root => ({
    columns: columns(root),
    selectedItem: null,
    selectedFilter: '',
    searchText: '',
    isActiveInfoModal: false,
    isEditMode: false,
    cloneModuleData: [],
    filterOptions: [
      {
        field: 'type',
        selections: [
          { label: root.$t('main.DASHBOARD.all'), value: 'All' },
          { label: root.$t('common.TERMS.version'), value: 'Version' },
          { label: root.$t('license.TEXT.registrant'), value: 'Admin' },
          { label: root.$t('common.GRID.explain'), value: 'Desc' }
        ]
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.mv-detail-grid {
  margin-top: $gap * 2;

  &__top {
    display: flex;
    justify-content: space-between;

    &-filter {
      & .search-wrap {
        display: flex;
        position: relative;
        top: 0.5px;
      }

      & .grid-search {
        margin-right: $gap-s;

        &::v-deep .el-input {
          &__inner {
            border-bottom: 1px solid $purple-gray;
            color: $light-gray;

            &:focus {
              background: transparent;
            }
          }
        }
      }
    }

    &-buttons {
      & > * + * {
        margin-left: $gap-s;
      }
    }
  }

  &__content {
    & .module-location {
      color: $primary;
      text-decoration: underline;
    }
  }
}
</style>
