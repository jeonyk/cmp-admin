<template>
  <div
    v-loading="isPageLoading"
    class="ref-list"
  >
    <simple-page-layout>
      <template #filter>
        <filtering-component
          @selected="selectedFilter"
          @reset-data="resetFilter"
          :data="filterData"
        >
          <div class="filter-wrap">
            <div class="filter-item">
              <label class="filter-name">{{ $t("common.REGCON.title") }}</label>
              <el-input
                v-model="cacheText"
                :placeholder="$t('common.REGCON.title')"
                @input="onInputTitle"
              />
            </div>
            <div class="filter-item date">
              <label class="filter-name">{{ $t("common.REGCON.regDate") }}</label>
              <el-date-picker
                v-model="startDate"
                type="date"
                :clearable="false"
                :placeholder="$v('시작일')"
                value-format="yyyy-MM-dd 00:00:01"
                :picker-options="createDateOptStart"
                @change="onChangeDate"
              />
              <span class="date-line">~</span>
              <el-date-picker
                v-model="endDate"
                type="date"
                :clearable="false"
                :placeholder="$v('종료일')"
                value-format="yyyy-MM-dd 23:59:59"
                :picker-options="createDateOptEnd"
                @change="onChangeDate"
              />
            </div>
          </div>
        </filtering-component>
      </template>
      <reference-grid
        :curr-page="currPage"
        :total-count="totalCount"
        @page="onChangePage"
      />
    </simple-page-layout>
  </div>
</template>

<script>
import SimplePageLayout from '@/components/SimplePageLayout/SimplePageLayout.vue'
import ReferenceGrid from '@/components/Reference/ReferenceGrid.vue'
import API, { FilteringComponent } from '@sd-fe/cmp-core'

// import dayjs from 'dayjs'
import { debounce } from 'lodash'

export default {
  name: 'SetRefList',
  components: {
    SimplePageLayout,
    ReferenceGrid,
    FilteringComponent
  },
  provide () {
    const v = {}

    Object.defineProperty(v, 'data', {
      enumerable: true,
      get: () => {
        return this.refList
      }
    })

    return {
      isPageLoading: this.isPageLoading,
      refData: v
    }
  },
  computed: {
    isSetFilter () {
      return !!(
        this.customFilters.title ||
        (this.customFilters.date[0] && this.customFilters.date[1]) ||
        this.customFilters.isView !== undefined
      )
    }
  },
  watch: {
    customFilters: {
      handler: 'changeFilter',
      deep: true
    }
  },
  created () {
    this.initRefList()
  },
  methods: {
    onChangeDate () {
      const startDate = this.customFilters.date[0]
      const endDate = this.customFilters.date[1]
      const today = new Date()

      if (startDate) {
        this.createDateOptEnd.disabledDate = time => {
          return (
            time.getTime() > new Date(today.toDateString()) ||
            time.getTime() <
              new Date(new Date(startDate).toDateString()).getTime()
          )
        }
      }

      if (endDate) {
        this.createDateOptStart.disabledDate = time => {
          return (
            time.getTime() > new Date(today.toDateString()) ||
            time.getTime() >
              new Date(new Date(endDate).toDateString()).getTime()
          )
        }
      }
    },
    onInputTitle: debounce(function (value) {
      this.customFilters.title = value
    }, 500),
    resetFilter () {
      this.customFilters.isView = undefined
      this.customFilters.date = []
      this.customFilters.title = ''
      this.initRefList()
    },
    selectedFilter (data) {
      this.customFilters.isView = data.state
    },
    changeFilter (data) {
      if (this.isSetFilter) {
        this.currPage = 1
      }
      this.initRefList()
    },
    onChangePage (page) {
      this.currPage = page
      this.initRefList()
    },
    async initRefList () {
      try {
        this.isPageLoading = true

        const { data } = await API.config.getRefList({
          referenceRoomTitle: this.customFilters.title || null,
          isView:
            this.customFilters.isView === undefined
              ? null
              : this.customFilters.isView,
          nowPage: this.currPage,
          perPage: 10,
          startTime: this.customFilters.date[0] || null,
          endTime: this.customFilters.date[1] || null
        })

        this.refList = data.referenceRoomList.map(ref => {
          return { ...ref, id: ref.referenceRoomIdx }
        })
        this.totalCount = data.totalCount
      } catch (error) {
        console.error(error)
      } finally {
        this.isPageLoading = false
      }
    }
  },
  data () {
    return {
      pickerOptions: {
        disabledDate (value) {
          const calendarDay = new Date(value)
          return calendarDay.getTime() > new Date().getTime()
        }
      },
      isPageLoading: true,
      refList: [],
      currPage: 1,
      totalCount: 0,
      startDate: '',
      endDate: new Date(),
      customFilters: {
        title: '',
        date: [],
        isView: undefined
      },
      cacheText: '',
      filterData: [
        {
          field: 'state',
          label: this.$t('common.TERMS.isPost'),
          selections: [
            { label: this.$t('common.TERMS.post'), value: true },
            { label: this.$t('common.TERMS.unPost'), value: false }
          ]
        }
      ],
      createDateOptStart: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() > new Date(today)
        }
      },
      createDateOptEnd: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() > new Date(today)
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ref-list {
  min-height: 800px;
  overflow: hidden;

  .filter-wrap {
    display: flex;

    .filter-item {
      display: inline-flex;
      align-items: center;
      margin-right: $gap;
      &.date {
        .el-date-editor {
          width: 150px;
          border-bottom: 1px solid $purple-gray;

          &::v-deep {
            .el-range-input {
              background-color: transparent;

              &::placeholder {
                color: $input-placeholder;
              }
            }
          }
        }
      }
    }
  }
}
</style>
