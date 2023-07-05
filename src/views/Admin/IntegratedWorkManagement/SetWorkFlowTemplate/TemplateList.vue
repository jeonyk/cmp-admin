<template>
  <section
    class="template-lists"
    v-loading="loading"
  >
    <div class="template-tabs">
      <div class="template-tabs-headers">
        <div
          v-for="tab in tabs"
          :key="tab.field"
          :class="{ '-active': field === tab.field }"
          @click="setField(tab.field)"
        >
          {{ tab.name }}
        </div>
      </div>
      <!-- /. [작업계획서, 작업완료보고서, 사후완료보고서] 탭 헤더 영역 -->

      <div class="template-tabs-body">
        <div class="tab-search">
          <el-input
            v-model="value"
            @input="search"
            :placeholder="$v('보고서명을 입력해주세요.')"
          />
          <i class="search-icon" />
        </div>
        <!-- /. [검색] 영역 -->

        <cmp-grid
          :columns="columns"
          :item-source="data"
          header-checkbox
          @checkedRowsData="checkedEvent"
          paging-type="list"
        />

        <!-- // 삭제되지만... 또 복구해달라고 할지도 몰라서 ㅡㅡ... -->
        <span
          v-if="false"
          class="-empty"
        >
          {{ $v('데이터가 없습니다.') }}
        </span>

        <div
          v-if="false"
          class="template-list-wrapper"
        >
          <ul class="template-list">
            <li
              class="template-list-item"
              v-for="item in data"
              :key="item.idx"
            >
              <div class="template-info">
                <el-checkbox
                  v-model="item.checked"
                  @change="checkedEvent(item)"
                />
                <strong>{{ item.title }}</strong>
              </div>
              <!-- /. 복사/편집/삭제 버튼 -->

              <span>{{ item.updatedTime | date('YYYY.MM.DD') }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <!-- /. 문서 템플릿 목록 -->
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import Mixins from '../Mixins.script'

export default {
  name: 'SetWorkFlowTemplate',
  mixins: [Mixins],
  props: {
    process: {
      type: [Object, null],
      default: null
    },
    autoSelectedTemplates: { // 이미 선택되어 저장된 보고서
      type: Array,
      default: () => []
    }
  },
  watch: {
    process (data) {
      this.init()
    }
  },
  created () {
    this.init()
  },
  methods: {
    /**
     * [보고서] 목록 초기화
     */
    async init () {
      if (this.process) {
      // 이미 선택되어있는 경우는 true 표기
        this.checkedData = JSON.parse(JSON.stringify(this.autoSelectedTemplates))

        this.setField(this.tabs[0]?.field)
        this.rawTemplates = await this.getDocTemplates()

        this.search()
      }
    },
    /**
     * [보고서 템플릿 목록] 탭 클릭 이벤트
     * @param {String} field
     */
    setField (field) {
      this.field = field
      this.value = undefined

      this.search(this.value)
    },

    /**
     * 모든 템플릿 가져오기
     * 개수가 많지 않아 내부에서 분류 및 검색
     */
    async getDocTemplates () {
      try {
        this.loading = true
        const response = await API.work_v3.getDocTemplates()

        // 날짜 가공
        const data = response.map(doc => {
          const setDate = date => this.$options.filters.date(date, 'YYYY.MM.DD')
          doc.updatedTimeLabel = setDate(doc.updatedTime)
          return doc
        })

        // [프로세스]
        const { roleIdx, orderType, cloud: cloudType } = this.process.workflowId

        const result = data.filter(template => {
          const { roleIdx: idx, cloud, mode } = template.category

          return (
            cloud === cloudType &&
            mode === orderType &&
            idx === roleIdx
          )
        })

        return result
      } catch (error) {
        console.error('@@ getDocTemplates', error)
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * [검색] Input 이벤트
     * @param {String} value
     */
    search (text = this.value) {
      const value = text?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regexp = new RegExp(value, 'gi')

      // 이미 선택되어있는 경우는 true 표기
      const templateIdxs = {}
      this.checkedData.forEach(({ idx }) => { templateIdxs[idx] = true })

      const result = []
      for (let i = 0; i < this.rawTemplates.length; i++) {
        const template = { ...this.rawTemplates[i] }
        if (templateIdxs[template.idx]) template.checked = true
        // console.log(template.title, templateIdxs[template.idx])

        if (
          template.category.docType === this.field && // 보고서 탬플릿 타입 확인
          regexp.test(template.title)// 검색 내용 확인
        ) result.push(template)
      }

      this.data = result
      this.$emit('checked', this.checkedData)
    },

    /**
     * checked 된 상태 체크
     * @param {Array} checkedData checked 된 보고서
     */
    checkedEvent (checkedData) {
      // const index = this.checkedData.findIndex(({ idx }) => item.idx === idx)

      // if (index === -1) this.checkedData.push(item)
      // else this.checkedData.splice(index, 1)

      this.checkedData = checkedData
      this.$emit('checked', this.checkedData)
    }
  },
  data: root => ({
    loading: false, // 로딩바
    field: undefined, // [보고서 템플릿 목록] 선택된 보고서 타입
    value: undefined, // 템플릿 목록 input value
    tabs: [
      { field: 'PLAN', name: root.$v('작업계획서') },
      { field: 'REPORT', name: root.$v('작업완료보고서') },
      { field: 'AA_REPORT', name: root.$v('사후완료보고서') }
    ],
    rawTemplates: [], // 가공되지 않은 템플릿 목록
    columns: [ // 보고서 설정 컬럼
      { header: root.$v('제목'), binding: 'title' },
      { header: root.$v('최근 작성일'), binding: 'updatedTimeLabel', width: 200 }
    ],
    data: [], // 가공된 템플릿 목록
    checkedData: [] // checked 된 템플릿 idx 저장
  })
}
</script>

<style lang="scss" scoped>
.template-lists {
  .template-tabs {
    &-headers {
      display: flex;
      align-items: center;
      position: relative;

      > div {
        z-index: 1;
        line-height: 40px;
        width: 150px;
        text-align: center;
        margin-right: 3px;
        border-radius: 5px 5px 0px 0px;
        background-color: #353951;
        cursor: pointer;

        &.-active { background-color: $primary; }
      }

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        height: 2px;
        width: 100%;
        background-color: #353951;
        z-index: 0;
      }
    }

    &-body {
      padding-top: $gap;

      .tab-search {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $gap;

        .el-input::v-deep {
          .el-input__inner {
            border: none;
            border-radius: 0;
            border-bottom: 1px solid $purple-gray;
          }
        }

        .search-icon {
          margin-left: 5px;
          display: block;
          position: relative;
          width: 15px; height: 15px;
          box-sizing: border-box;
          background-image: url('../../../../assets/images/icon-search.svg');
        }
      }
    }

    .template-list {
      overflow-y: auto;
      height: 150px;
      padding-right: 15px;

      &-wrapper {
        .pagination-wrap { margin-top: $gap; }
      }

      &-item {
        box-sizing: border-box;
        border-bottom: 1px solid $dark-slate;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: .3s ease background;
        padding: 0 $gap;

          &:hover { background-color:  rgba(63, 85, 187, 0.3); }

          .template-info {
            display: flex;
            align-items: center;
            width: 100%;

            strong {
              margin-left: $gap-s;
              display: block;
              font-weight: normal;
              line-height: 1.5;
              font-size: 15px;
            }
          }
          span { color: $input-placeholder }

        .button-area {
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }

    }

  }

  .-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: $input-placeholder;
  }
}
</style>
