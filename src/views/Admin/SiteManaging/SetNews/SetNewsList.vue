<template>
  <div
    v-loading="isPageLoading"
    class="news"
  >
    <simple-filter @reset="resetFilter">
      <div class="filter-item">
        <label>{{ $v("게시 여부") }}</label>
        <el-select v-model="filtering.postState">
          <el-option
            :label="$t('admin.NOTI.post')"
            :value="true"
          />
          <el-option
            :label="$t('admin.NOTI.unPost')"
            :value="false"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <label>{{ $t("common.REGCON.title") }}</label>
        <el-input
          v-model="filteringCache.searchTitle"
          :placeholder="$t('common.REGCON.title')"
          @input="onChangeFilterTitle"
        />
      </div>
      <div class="filter-item">
        <label>{{ $t("common.REGCON.regDate") }}</label>
        <el-date-picker
          v-model="filtering.date[0]"
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
    </simple-filter>
    <div class="news-list">
      <div class="news-list__option">
        <div class="news-list__option-total">
          <span v-html="$t('common.GRID.total', { n: totalCount })" />
        </div>
        <div class="news-list__option-new">
          <button
            class="button"
            type="is-primary"
            @click="
              $router.push({
                name: 'set-news-detail',
                params: { id: 0 },
                query: { create: true }
              })
            "
          >
            {{ $t("admin.NEWS.create") }}
          </button>
        </div>
      </div>
      <cmp-grid
        :columns="columns"
        :item-source="newsList"
        :use-column-filter="false"
        :total-page-size="totalCount"
        :server-side-now-page="currPage"
        server-side-paging
        @changingPage="onChangePage"
        routable="set-news-detail"
        style="margin-top: 15px;"
      >
        <template #isView="{ row }">
          <span
            :class="row.isView ? 'is-complete' : 'is-fail'"
            style="background-color: transparent;"
          >
            {{ row.isView ? $t("admin.NOTI.post") : $t("admin.NOTI.unPost") }}
          </span>
        </template>
        <template #createTime="{ row }">
          {{ row.createTime | date("YYYY-MM-DD HH:mm:ss") }}
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import SimpleFilter from '@/components/FilteringComponent/SimpleFilter.vue'
import { debounce } from 'lodash'
import API from '@sd-fe/cmp-core'
import columns from './NewsGridColumn'

export default {
  name: 'SetNewsList',
  components: {
    SimpleFilter
  },
  computed: {
    isSetFilter () {
      return (
        this.filtering.postState !== null ||
        (this.filtering.date && this.filtering.date.length) ||
        this.filtering.searchTitle
      )
    }
  },
  created () {
    this.initNewsList()
  },
  watch: {
    filtering: {
      deep: true,
      handler: 'changeFilter'
    }
  },
  methods: {
    onChangeDate () {
      const startDate = this.filtering.date[0]
      const endDate = this.filtering.date[1]
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
    pagingByIndex (index) {
      return (this.currPage - 1) * 10 + index + 1
    },
    changeFilter () {
      if (this.isSetFilter) {
        this.currPage = 1
      }
      this.initNewsList()
    },
    resetFilter () {
      this.currPage = 1
      this.filtering = {
        postState: null,
        date: [],
        searchTitle: ''
      }
      this.filteringCache = {
        serachTitle: ''
      }
    },
    onChangeFilterTitle: debounce(function (value) {
      this.filtering.searchTitle = value
    }, 500),
    async initNewsList () {
      try {
        this.isPageLoading = true
        const postSate = this.filtering.postState
        const filterObj = {
          nowPage: this.currPage,
          perPage: 10,
          isView: postSate === true ? true : postSate === false ? false : null,
          startTime: this.filtering.date[0] ? this.filtering.date[0] : null,
          endTime: this.filtering.date[1] ? this.filtering.date[1] : null,
          newsTitle: this.filtering.searchTitle || null
        }
        const { data } = await API.config.getNewsList(filterObj)
        this.totalCount = data.totalCount
        this.newsList = data.newsList.map((news, idx) => {
          return {
            ...news,
            id: news.newsIdx,
            number: Number(this.totalCount) - (10 * (this.currPage - 1) + idx)
          }
        })
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.NEWS.001'))
      } finally {
        this.isPageLoading = false
      }
    },
    onChangePage (page) {
      this.currPage = page
      this.initNewsList()
    }
  },
  data: root => ({
    columns: columns(root),
    isPageLoading: false,
    currPage: 1,
    totalCount: 0,
    startDate: '',
    endDate: new Date(),
    newsList: [],
    filtering: {
      postState: null, // 게시 상태
      date: [], // 등록일-종료일
      searchTitle: '' // 제목
    },
    filteringCache: {
      searchTitle: '' // 제목 (임시)
    },
    pickerOptions: {
      disabledDate (value) {
        const calendarDay = new Date(value)
        return calendarDay.getTime() > new Date().getTime()
      }
    },
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
  })
}
</script>

<style lang="scss" scoped>
.news {
  .filter-item {
    display: flex;
    align-items: center;
    padding: 0 10px;

    label {
      margin-right: $gap-s;
      white-space: nowrap;
    }

    .el-date-editor {
      width: 150px;

      &::v-deep {
        .el-range-input {
          border: none;
          background-color: transparent;

          &::placeholder {
            color: $input-placeholder;
          }
        }
      }
    }
  }

  &-list {
    padding: $gap 0;

    &__option {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .accent {
      color: $main-red;
    }
  }
}
</style>
