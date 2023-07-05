<!--
  * 파일명 : NoticeList.vue
  * 파일 기능 : 공지사항 리스트 노출 및 공지사항 등록
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="set-notice-list">
    <filtering-component
      :data="filteringList"
      @selected="filterSelectAction"
      @reset-data="resetData"
    >
      <div class="filter-form">
        <span class="filter-name">{{ $v('제목') }}</span>
        <div class="filter-options">
          <search-bar
            ref="theSearch"
            :user-reset-icon="false"
            :user-search-icon="false"
            :placeholder="$v('제목을 입력해주세요.')"
            id="noticeSearch"
            @input="handleInputFilterTitle"
          />
        </div>
      </div>

      <div class="filter-form">
        <span class="filter-name">{{ $t('admin.NOTI.regDate') }}</span>

        <div class="filter-date">
          <el-date-picker
            v-model="startDate"
            type="date"
            :clearable="false"
            :placeholder="$v('시작일')"
            value-format="yyyy-MM-dd 00:00:01"
            :picker-options="createDateOptStart"
            @change="dateSelection"
          />
          <!-- format="yyyy.MM.dd" -->
          <span class="date-line">~</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            :clearable="false"
            :placeholder="$v('종료일')"
            value-format="yyyy-MM-dd 23:59:59"
            :picker-options="createDateOptEnd"
            @change="dateSelection"
          />
        </div>
      </div>
    </filtering-component>

    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
      <div class="button-area -right">
        <button
          class="button add-button"
          type="is-primary"
          @click="routeTo({ name: 'notice-register'})"
        >
          {{ $t('admin.NOTI.regNotice') }}
        </button>
      </div>
    </section>

    <section
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
      class="table-area"
    >
      <cmp-grid
        :loading="loading"
        class="route-detail-grid"
        :item-source="noticeTableData"
        :columns="columns"
        routable="notice-detail"
        ref="grid"
        @total-count="setTotalCount"
        :use-excel-download="false"
        :column-data-map="columnDataMap"
      >
        <template #noticeType="props">
          <el-tag
            v-if="props.row.noticeType"
            :disable-transitions="true"
            size="small"
          >
            {{ props.row.noticeType }}
          </el-tag>
          <span
            v-else
            class="-is-deleted"
          >
            {{ $t('admin.NOTI.unClassified') }}
          </span>
        </template>

        <template #noticePosting="props">
          <span
            :class="[props.row.noticePosting === $t('admin.NOTI.post') ? 'is-complete' : 'is-fail']"
            style="background-color: transparent;"
          >
            {{ props.row.noticePosting }}
          </span>
        </template>
        <template #createTime="prop">
          {{ prop.row.createTime | date }}
        </template>
      </cmp-grid>
    </section>
  </div>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import SearchBar from '@/components/SearchBar/SearchBar.vue'
import { debounce } from 'lodash'

export default {
  name: 'NoticeList',
  components: {
    SearchBar,
    FilteringComponent
  },
  async created () {
    await this.getCodeList()
    await this.getNoticeList({})
  },
  watch: {
    filteredData: {
      deep: true,
      handler (data, oldData) {
        if (data.noticeSearch !== oldData.noticeSearch) {
          this.debounceInput(data)
        } else {
          this.getNoticeList(data)
        }
      }
    }
  },
  methods: {
    debounceInput:
      debounce(function (data) {
        this.getNoticeList(data)
      }, 300),
    routeTo (to) {
      this.$router.push(to)
    },
    setTotalCount (cnt) {
      this.totalResultCnt = cnt
    },
    handleInputFilterTitle (val) {
      this.filteredData = { ...this.filteredData, noticeSearch: val }
    },
    async getNoticeList (params) {
      try {
        this.loading = true
        const mappedDates = []

        const response = await API.config.getNoticeInfo(params)

        if (response) {
          this.rawNotice = response.map((data, i, array) => {
            mappedDates.push({ value: data.createTime, caption: this.$options.filters.date(data.createTime) })

            return {
              number: array.length - i,
              createTime: data.createTime,
              noticeIdx: data.noticeIdx,
              noticePosting: data.noticePosting ? this.$t('admin.NOTI.post') : this.$t('admin.NOTI.unPost'),
              noticeStatus: data.noticeStatus,
              noticeTitle: data.noticeTitle,
              noticeType: this.typeCheckTemp(data.noticeType)
            }
          })
          this.noticeTableData = [...this.rawNotice]

          if (params.noticeSearch) {
            this.noticeTableData = []
            this.$nextTick(() => {
              this.noticeTableData = this.noticeTableData.filter((el) => {
                return el.noticeTitle.includes(params.noticeSearch)
              })
            })
            this.$forceUpdate()
          }
          this.columnDataMap.createTime = Array.from(new Set(mappedDates))
          this.dateSelection()
        }
      } catch (error) {
        console.error('@@ getNoticeList :: ', error)
      } finally {
        this.loading = false
      }
    },
    async getCodeList () {
      try {
        const response = await API.config.getCodeList({ codeType: 'NOTICE' })

        if (response) {
          const filters = response.map(resp => { return { value: resp.codeVal, label: resp.codeName } })
          this.categoryOptions = [...filters]

          this.filteringList = this.filteringList.map(list => {
            if (list.field === 'noticeType') list.selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...filters]
            return list
          })
        }
      } catch (error) {
        console.error('@@ getCodeList :: ', 'error')
      }
    },
    async filterSelectAction (contents) {
      this.loading = true
      // 만약 이전에 필터링한 값중 타이틀이 있다면 filterData에 그대로 삽입
      const title = this.filteredData.noticeSearch
      this.filteredData = { ...contents, noticeSearch: title }
      // this.filteredData = contentss
      this.dateSelection()
      this.loading = false
    },
    dateSelection () {
      if (this.startDate) {
        this.createDateOptEnd.disabledDate = (time) => {
          const today = new Date().toDate
          const untilToday = time.getTime() > new Date(today)

          const startDate = new Date(this.startDate)
          return untilToday || time.getTime() < startDate.setDate(startDate.getDate() - 1)
        }
      }

      return this.searchData({
        startDate: this.startDate === '' ? 0 : Date.parse(this.startDate),
        endDate: Date.parse(this.endDate)
      })
    },
    searchData (condition) {
      this.loading = true
      let result = [...this.rawNotice]
      result = result.filter(notice => notice.createTime > condition.startDate && notice.createTime <= condition.endDate)

      this.noticeTableData = [...result]
      this.loading = false
    },
    resetData () {
      try {
        this.loading = true
        this.filteredData = {}
        this.startDate = ''
        this.endDate = new Date()
        this.$refs.theSearch.value = ''
      } catch (err) {
      } finally {
        this.loading = false
      }
    },
    typeCheckTemp (type) {
      const category = this.categoryOptions?.filter(cate => cate.value === type)[0]
      return category?.label
    }
  },
  data () {
    return {
      loading: false,
      totalResultCnt: 0,
      startDate: '',
      endDate: new Date(),
      rawNotice: [],
      filteredData: { noticeSearch: '' },
      // searchedValue: { noticeTitle: '' },
      categoryOptions: [],
      filteringList: [
        {
          field: 'noticeType',
          label: '카테고리',
          keyPath: 'admin.NOTI.category',
          selections: [
            // { value: 'all', label: '전체' },
            // { value: 'notice_guide', label: '안내' },
            // { value: 'notice_new', label: '신규' },
            // { value: 'notice_inspection', label: '점검' },
            // { value: 'notice_issue', label: '장애' }
          ]
        },
        {
          field: 'noticePosting',
          label: this.$v('게시 여부'),
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined },
            { label: '게시', value: 'true', keyPath: 'admin.NOTI.post' },
            { label: '비게시', value: 'false', keyPath: 'admin.NOTI.unPost' }
          ]
        }
      ],
      noticeTableData: [],
      columns: [
        { header: '번호', binding: 'number', width: 150, format: 'd*', keyPath: 'admin.NOTI.number' },
        { header: '카테고리', binding: 'noticeType', width: 150, customHtml: true, keyPath: 'admin.NOTI.category' },
        { header: '제목', binding: 'noticeTitle', align: 'left', keyPath: 'admin.NOTI.title' },
        { header: this.$v('게시 여부'), binding: 'noticePosting', width: 200, customHtml: true },
        { header: '등록일', binding: 'createTime', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.NOTI.regDate' }
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
      },
      columnDataMap: {
        createTime: null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.route-detail-grid {
  .-is-deleted {
    color: #d95252;
  }
}

.set-notice-list {
  &::v-deep {
    .filtering-component {
      #noticeSearch {
        .el-input__inner {
          border-bottom-color: $purple-gray !important;
        }
      }
    }
  }
}
</style>
