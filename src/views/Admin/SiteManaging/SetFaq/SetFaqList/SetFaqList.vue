<!--
  * 파일명 : SetFaqList.vue
  * 파일 기능 : FAQ 리스트 노출 및 FAQ 등록 기능
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="set-faq-list">
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
          @click="routeTo({ name: 'faq-register'})"
        >
          {{ $t('common.BTN.ADMIN.regFaq') }}
        </button>
      </div>
    </section>

    <section
      v-loading="loading"
      class="table-area"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
    >
      <cmp-grid
        :loading="loading"
        :item-source="faqTableData"
        :columns="columns"
        @selectedRow="selectRowFun"
        routable="faq-detail"
        ref="grid"
        :use-excel-download="true"
        @total-count="cnt => totalResultCnt = cnt"
        class="route-detail-grid"
        :column-data-map="columnDataMap"
      >
        <template #faqType="props">
          <el-tag
            v-if="!props.row.faqNoType"
            size="small"
          >
            {{ props.row.faqType }}
          </el-tag>
          <span
            v-else
            class="is-deleted"
          >
            {{ $t('admin.NOTI.unClassified') }}
          </span>
        </template>
        <template #faqPosting="props">
          <span
            :class="[props.row.faqRawPosting ? 'is-complete' : 'is-fail']"
            style="background-color: transparent;"
          >
            {{ props.row.faqPosting }}
          </span>
        </template>
        <template #createTime="props">
          {{ props.row.createTime | date }}
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
  name: 'SetFaqList',
  components: {
    SearchBar,
    FilteringComponent
  },
  watch: {
    filteredData: {
      deep: true,
      handler (data, oldData) {
        if (data.faqSearch !== oldData.faqSearch) {
          this.debounceInput(data)
        }
      }
    }
  },
  async created () {
    await this.getCodeList()
    await this.getFaqList()
    this.initRowData = this.faqTableData
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    debounceInput:
      debounce(function (data) {
        if (!data.faqSearch) {
          data.faqSearch = undefined
        }
        this.getFaqList(data)
      }, 300),
    handleInputFilterTitle (val) {
      this.filteredData = { ...this.filteredData, faqSearch: val }
    },
    async getFaqList (params) {
      try {
        const mappedDates = []
        this.loading = true
        const response = await API.config.getFaqList(params)
        this.faqTableData = response.map(data => {
          mappedDates.push({ value: data.createTime, caption: this.$options.filters.date(data.createTime) })

          const type = this.typeCheck(data.faqType)
          return {
            createTime: data.createTime,
            faqIdx: data.faqIdx,
            faqPosting: data.faqPosting ? this.$t('admin.NOTI.post') : this.$t('admin.NOTI.unPost'),
            faqRawPosting: data.faqPosting,
            faqQuestion: data.faqQuestion,
            faqType: type,
            faqNoType: !type
          }
        })
        this.columnDataMap.createTime = Array.from(new Set(mappedDates))
      } catch (err) {} finally {
        this.loading = false
      }
    },
    // 코드관리에 설정되어있는 코드를 가져와서 사용합니다.(ex. faq_project = '프로젝트'...)
    async getCodeList () {
      try {
        const response = await API.config.getCodeList({ codeType: 'FAQ' })
        if (response) {
          const filters = response.map(resp => { return { value: resp.codeVal, label: resp.codeName } })
          this.categoryOptions = [...filters]

          this.filteringList = this.filteringList.map(list => {
            if (list.field === 'faqType') list.selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...filters]
            return list
          })
        }
      } catch (error) {
        console.error('@@ getCodeList :: ', error)
      }
      this.loading = false
    },
    filterSelectAction (contents) {
      this.filteredData = { ...this.filteredData, ...contents }
      console.log('필터부분', this.filteredData)
      this.searchData(this.filteredData)
    },
    async startDateChangeEvent (date) {
      this.filteredData.startTime = date
      await this.getFaqList(this.filteredData)
    },
    async endDateChangeEvent (date) {
      this.filteredData.endTime = date
      await this.getFaqList(this.filteredData)
    },
    async resetData () {
      this.loading = true
      await this.getFaqList()
      this.$refs.theSearch.value = ''
      // this.faqTableData = this.initRowData
      this.loading = false
    },
    typeCheck (type) {
      const category = this.categoryOptions?.filter(cate => cate.value === type)[0]
      return category?.label
    },
    selectRowFun (param) {
      if (param) {
        this.routeTo({
          name: 'faq-detail',
          params: { idx: param._data.faqIdx }
        })
      }
    },
    searchData (condition) {
      this.loading = true
      let result = [...this.initRowData]

      // 상태
      if (condition?.faqPosting !== undefined) {
        result = result.filter(faq => {
          const postingType = (condition?.faqPosting) ? '게시' : '비게시'
          return postingType === faq.faqPosting
        })
      }

      // 카테고리
      if (condition?.faqType) {
        result = result.filter(faq => {
          return this.typeCheck(condition.faqType) === faq.faqType
        })
      }
      this.faqTableData = [...result]
      this.loading = false
    }
  },
  data () {
    return {
      loading: true,
      totalResultCnt: 0,
      searchText: '',
      startDate: '',
      endDate: new Date(),
      filteredData: { faqSearch: undefined },
      columns: [
        { header: '카테고리', binding: 'faqType', width: 150, customHtml: true, keyPath: 'admin.NOTI.category' },
        { header: this.$v('제목'), binding: 'faqQuestion', width: '*', align: 'left' },
        { header: this.$v('게시 여부'), binding: 'faqPosting', width: 200, customHtml: true },
        { header: '등록일', binding: 'createTime', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.NOTI.regDate' }
        // { header: '등록일', binding: 'createTime', width: 200, customHtml: true }
      ],
      categoryOptions: [],
      filteringList: [
        {
          field: 'faqType',
          label: '카테고리',
          keyPath: 'admin.NOTI.category',
          selections: [
            // { label: '회원', value: 'user' },
            // { label: '결재', value: 'faq_billing' },
            // { label: '프로젝트', value: 'faq_project' },
            // { label: '기타', value: 'faq_etc' }
          ]
        },
        {
          field: 'faqPosting',
          label: this.$v('게시 여부'),
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined },
            { label: '게시', value: true, keyPath: 'admin.NOTI.post' },
            { label: '비게시', value: false, keyPath: 'admin.NOTI.unPost' }
          ]
        }
      ],
      faqTableData: [
        // { number: 1, cate: '회원', title: '로그인이 되지 않습니다.', state: '게시', date: '2020.06.24' },
        // { number: 2, cate: '회원', title: '비밀번호를 잊어버렸어요.', state: '게시', date: '2020.06.23' },
        // { number: 3, cate: '결재', title: '결재 프로세스가 궁금합니다.', state: '비게시', date: '2020.06.23' },
        // { number: 4, cate: '프로젝트', title: '프로젝트 생성 방법이 궁금합니다.', state: '비게시', date: '2020.06.16' },
        // { number: 5, cate: '회원', title: '탈퇴하고 싶어요.', state: '비게시', date: '2020.06.11' },
        // { number: 6, cate: '회원', title: '회원가입은 어떻게 하나요?', state: '비게시', date: '2020.04.21' },
        // { number: 7, cate: '기타', title: 'AWS와의 차별점은 무엇인가요?', state: '비게시', date: '2020.04.21' },
        // { number: 8, cate: '결재', title: '결재 보안 처리가 어떻게 될까요?', state: '비게시', date: '2020.06.23' },
        // { number: 9, cate: '프로젝트', title: '프로젝트 생성 방법이 궁금합니다.', state: '비게시', date: '2020.03.17' },
        // { number: 10, cate: '회원', title: '비밀번호를 잊어버렸어요.', state: '비게시', date: '2020.06.23' },
        // { number: 11, cate: '결재', title: '결재 프로세스가 궁금합니다.', state: '비게시', date: '2020.06.23' }
      ],
      initRowData: [],
      createDateOpt: {
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
  & .is-deleted {
    color: $mp-red;
  }
}

.set-faq-list {
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
