<!--
  * 파일명 : IndivInquiryList.vue
  * 파일 기능 : 1:1 문의 리스트 노출
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-02-05
  * License By Shinsegae I&C
  * 2021-02-05 Merge branch 'publish/grid-loading-text' into 'dev'
 -->

<template>
  <div class="set-inquiry-list">
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
            @change="dateSelection"
            type="date"
            :clearable="false"
            :placeholder="$v('시작일')"
            value-format="yyyy-MM-dd 00:00:01"
            :picker-options="createDateOptStart"
          />
          <span class="date-line">~</span>
          <el-date-picker
            v-model="endDate"
            @change="dateSelection"
            type="date"
            :clearable="false"
            :placeholder="$v('종료일')"
            value-format="yyyy-MM-dd 23:59:59"
            :picker-options="createDateOptEnd"
          />
        </div>
      </div>
    </filtering-component>

    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
    </section>

    <section
      class="table-area"
      v-loading="loading"
      :element-loading-text="$t('common.PLACEHOLDER.loadingWait')"
    >
      <cmp-grid
        :loading="loading"
        :item-source="inquiryList"
        :columns="columns"
        selectable
        routable="indiv-inquiry-detail"
        :use-excel-download="true"
        @total-count="cnt => totalResultCnt = cnt"
        class="route-detail-grid"
      >
        <template #inqType="props">
          <el-tag
            v-if="props.row.inqNoType"
            size="small"
          >
            {{ props.row.inqType }}
          </el-tag>
          <el-tag
            v-else-if="checkExistType(props.row.inqRawType)"
            size="small"
          >
            {{ checkExistType(props.row.inqRawType) }}
          </el-tag>
          <span
            class="is-deleted"
            v-else
          >
            {{ checkExistType(props.row.inqRawType) }}
          </span>
        </template>
        <template #inqStatus="props">
          <span
            :class="[
              {'is-new' : props.row.inqStatus === $t('admin.NOTI.receipt') },
              {'is-complete' : props.row.inqStatus === $t('admin.NOTI.completeAnswer') },
              {'is-delay' : props.row.inqStatus === $t('admin.NOTI.waitAnswer') },
              {'is-wait' : props.row.inqStatus === $t('admin.NOTI.checking') },
            ]"
            style="background-color: transparent;"
          >
            {{ props.row.inqStatus }}
          </span>
        </template>
        <template #regDt="props">
          {{ props.row.regDt | date }}
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
  name: 'IndivInquiryList',
  components: {
    SearchBar,
    FilteringComponent
  },
  async created () {
    await this.getInquiryCodeList()
    await this.getInquiryList()
  },
  watch: {
    'filteredData.inqQuestionTitle': {
      deep: true,
      handler (data, oldData) {
        // 제목부분은 디바운스를 해주기 위해서 따로 워치에서 감지를 합니다.
        if (data !== oldData) {
          this.debounceInput(data)
        }
      }
    }
  },
  methods: {
    checkExistType (type) {
      return this.questionTypeCheck[type] || this.$t('admin.NOTI.unClassified')
    },
    debounceInput:
      debounce(function (data) {
        // this.getInquiryCondition({ ...this.filteredData, inqQuestionTitle: data })
        this.searchData(this.filteredData)
      }, 300),
    handleInputFilterTitle (val) {
      this.filteredData = { ...this.filteredData, inqQuestionTitle: val }
    },
    routeTo (to) {
      this.$router.push(to)
    },

    moveToDetail (param) {
      this.routeTo({
        name: 'indiv-inquiry-detail',
        params: { idx: param.dataItem.number, name: param.dataItem.title }
      })
    },
    async getInquiryList () {
      try {
        const response = await API.config.getInquiryList()
        this.rawInquiry = response.map((data, i, array) => {
          return {
            number: array.length - i,
            inqIdx: data.inqIdx,
            isLogin: data.isLogin ? this.$t('admin.NOTI.member') : this.$t('admin.NOTI.nonMember'),
            inqType: this.questionTypeCheck[data.inqType.toLowerCase()] || '',
            inqQuestionTitle: data.inqQuestionTitle || '',
            inqStatus: this.statusTypeCheck[data.inqStatus],
            inqUpdateTime: this.$options.filters.date(data.inqCreateTime),
            inqNoType: !!this.questionTypeCheck[data.inqType.toLowerCase()],
            rawInqType: data.inqType
          }
        })

        this.inquiryList = [...this.rawInquiry]
      } catch (error) {
        console.error('@@ getInquiryList :: ', 'error')
      }
      this.loading = false
    },
    async getInquiryCodeList () {
      const response = await API.config.getCodeList({ codeType: 'INQUIRY' })
      if (!response) {
        this.$alert(this.$t('common.ALERT.BASE.006'))
        return
      }

      response
        .map(code => ({ val: code.codeVal, name: code.codeName }))
        .forEach(code => (this.questionTypeCheck[code.val] = code.name))

      this.filteringList[1].selections = response.map(
        data => { return { label: data.codeName, value: data.codeVal } }
      ).concat({ label: this.$t('common.TERMS.unClassified'), value: 'unClassified' })
      this.filteringList[1].selections.unshift({ label: this.$t('main.DASHBOARD.all'), value: undefined })
    },
    async getInquiryCondition (params) {
      this.loading = true
      let response = await API.config.getInquiryList(params)
      response = response.map((data, i, array) => {
        return {
          number: array.length - i,
          inqIdx: data.inqIdx,
          isLogin: data.isLogin ? this.$t('admin.NOTI.member') : this.$t('admin.NOTI.nonMember'),
          inqType: this.questionTypeCheck[data.inqType.toLowerCase()] || this.$t('common.TERMS.unClassified'),
          inqQuestionTitle: data.inqQuestionTitle,
          inqStatus: this.statusTypeCheck[data.inqStatus],
          inqUpdateTime: this.$options.filters.date(data.inqCreateTime),
          inqRawType: data.inqType
        }
      })
      this.inquiryList = [...response]

      if (params.inqQuestionTitle) {
        this.inquiryList = []

        this.$nextTick(() => {
          this.inquiryList = this.inquiryList.filter((el) => {
            return el.inqQuestionTitle.includes(params.inqQuestionTitle)
          })
        })
      }

      this.$forceUpdate()
      this.loading = false
      return this.inquiryList
    },

    // 메소들가 여러번 수정작업을 거치면서 두번씩 렌더링하는 이슈가 있어서
    // 메소드 리팩토링하였습니다.(2022-07-26)
    async filterSelectAction (contents) {
      this.loading = true
      const inqQuestionTitle = this.filteredData.noticeTitle
      // const inqStatus = this.statusTypeCheck[contents.inqStatus]
      // const inqType = this.questionTypeCheck[contents.inqType.toLowerCase()]
      this.filteredData = { ...contents, inqQuestionTitle }
      this.dateSelection()
      this.searchData(this.filteredData)

      //   const inqQuestionTitle = this.filteredData.inqQuestionTitle
      //   this.filteredData = { ...selectedFilter, inqQuestionTitle }

      //   console.log(this.filteredData)
      //   if (Object.keys(this.filteredData).length) {
      //     // if (this.filteredData.inqType === undefined) await this.getInquiryList()
      //     if (this.filteredData.inqType) {
      //       if (this.filteredData.inqType === 'unClassified') {
      //         await this.getInquiryList()
      //         this.rawInquiry = this.rawInquiry.filter(item => {
      //           return !Object.keys(this.questionTypeCheck).includes(item.rawInqType)

    //         })
    //       } else {
    //         this.getInquiryCondition(this.filteredData)
    //       }
    //     }
    //     this.dateSelection()
    //   } else this.getInquiryCondition(this.filteredData)
    //   this.loading = false
    },
    dateSelection () {
      if (this.startDate) {
        this.filteredData.startDate = Date.parse(this.startDate)

        this.createDateOptEnd.disabledDate = (time) => {
          const today = new Date().toDateString()
          const untilToday = time.getTime() > new Date(today)

          const startDate = new Date(this.filteredData.startDate)
          return untilToday || time.getTime() < startDate.setDate(startDate.getDate() - 1)
        }
      } else this.filteredData.startDate = 1

      if (this.endDate) this.filteredData.endDate = Date.parse(this.endDate)
      this.searchData(this.filteredData)
    },
    searchData (condition) {
      this.loading = true
      let result = [...this.rawInquiry]
      if (condition?.isLogin) result = result.filter(inq => condition?.isLogin === inq.isLogin)
      if (condition?.inqType) result = result.filter(inq => this.questionTypeCheck[condition?.inqType] === inq.inqType)
      if (condition?.inqStatus) result = result.filter(inq => this.statusTypeCheck[condition?.inqStatus] === inq.inqStatus)
      if (condition?.inqQuestionTitle) result = result.filter(inq => inq.inqQuestionTitle.includes(condition.inqQuestionTitle))
      if (condition?.startDate && condition?.endDate) {
        result = result.filter(inq => Date.parse(inq.inqUpdateTime) > condition.startDate && Date.parse(inq.inqUpdateTime) <= condition.endDate)
      }

      this.inquiryList = [...result]
      this.loading = false
    },
    async resetData () {
      try {
        this.loading = true
        await this.getInquiryList()
        this.filteredData = {}
        this.$refs.theSearch.value = ''
        this.$forceUpdate()
        this.startDate = undefined
        this.endDate = new Date()
      } catch (err) {

      } finally {
        this.loading = false
      }
    }
  },
  data () {
    return {
      questionTypeCheck: {},
      totalResultCnt: 0,
      loading: true,
      searchText: '',
      startDate: '',
      endDate: new Date(),
      rawInquiry: [],
      filteredData: {
        inqQuestionTitle: ''
      },
      filterObj: undefined,
      filteringList: [
        {
          field: 'isLogin',
          label: '회원구분',
          keyPath: 'admin.NOTI.memberClass',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined }, // 전체
            { label: this.$t('admin.NOTI.member'), value: this.$t('admin.NOTI.member') }, // 회원
            { label: this.$t('admin.NOTI.nonMember'), value: this.$t('admin.NOTI.nonMember') } // 비회원
          ]
        },
        {
          field: 'inqType',
          label: '문의유형',
          keyPath: 'admin.NOTI.inqType',
          selections: []
        },
        {
          field: 'inqStatus',
          label: '답변 상태',
          keyPath: 'admin.NOTI.stateAnswer',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined }, // 전체
            { label: this.$t('admin.NOTI.waitAnswer'), value: 'ANSWER_WAIT' }, // 답변 대기
            // { label: this.$t('admin.NOTI.receipt'), value: 'INQUIRY_RECEPTION' } // 문의 접수
            // { label: this.$t('admin.NOTI.checking'), value: 'CHECKING' }, // 확인중
            { label: this.$t('admin.NOTI.completeAnswer'), value: 'ANSWER_COMPLETE' } // 답변 완료
          ]
        }
      ],
      inquiryList: [],
      columns: [
        { header: this.$t('admin.NOTI.number'), binding: 'number', width: 100 }, // 번호
        { header: this.$t('admin.NOTI.memberClass'), binding: 'isLogin', width: 150 }, // 회원 구분
        { header: this.$t('admin.NOTI.inqType'), binding: 'inqType', width: 200, customHtml: true }, // 문의 유형
        { header: this.$t('admin.NOTI.title'), binding: 'inqQuestionTitle', width: '*', align: 'left' }, // 제목
        { header: this.$t('admin.NOTI.stateAnswer'), binding: 'inqStatus', width: 200, customHtml: true }, // 답변 상태
        { header: this.$t('admin.NOTI.regDate'), binding: 'inqUpdateTime', width: 200, customHtml: true, dataType: 'Date' } // 등록일
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
      statusTypeCheck: {
        INQUIRY_RECEPTION: this.$t('admin.NOTI.receipt'),
        ANSWER_COMPLETE: this.$t('admin.NOTI.completeAnswer'),
        ANSWER_WAIT: this.$t('admin.NOTI.waitAnswer'),
        CHECKING: this.$t('admin.NOTI.checking')
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

.set-inquiry-list {
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
