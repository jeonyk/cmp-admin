<template>
  <el-dialog
    :visible="visible"
    :title="title"
    :width="width"
    :top="top"
    @close="closeEvent"
  >
    <div
      class="install-program-history"
      v-loading="loading"
    >
      <div class="install-program-modal-body">
        <resource-filter-component
          ref="filter"
          :use-title="false"
          @search="values => searchFilter(values, keyword)"
        />
        <!-- /. 관조프 -->

        <total-count :total-count="totalResultCnt" />

        <div class="flex-wrap -space-between">
          <search-bar
            class="search-area"
            type="filterable"
            ref="search"
            :placeholder="$t('common.PLACEHOLDER.search')"
            @input="input"
            @refresh="reset"
          />

          <div style="color: #727797; font-size: 12px;">
            호스트명, 소프트웨어 이름, 스크립트 내용에 한하여 검색됩니다.
          </div>
        </div>

        <cmp-grid
          :item-source="installHistoryData"
          :columns="installHistoryColumn"
          :use-column-filter="false"
          @total-count="cnt => totalResultCnt = cnt"
        >
          <template #result="props">
            <div class="result-wrap">
              <span class="-result">
                <i :class="props.row.result === 'SUCCESS' ? '-success' : '-fail'" />
              </span>
              <!-- 성공 / 실패 -->
              {{ $t(`common.${props.row.result === 'SUCCESS' ? 'success' : 'fail'}`) }}
            </div>
          </template>
        </cmp-grid>
      </div>

      <div class="modal-button-area">
        <button
          class="button"
          @click="$emit('close')"
        >
          <!-- 닫기 -->
          {{ $t('common.BTN.close') }}
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import SearchBar from '@/components/SearchBar/SearchBar'
import API, { ResourceFilterComponent } from '@sd-fe/cmp-core'

export default {
  name: 'InstallProgramHistory',
  components: {
    'search-bar': SearchBar,
    ResourceFilterComponent
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: undefined
    },
    width: {
      type: String,
      default: 'auto'
    },
    top: {
      type: String,
      default: '50px'
    }
  },
  watch: {
    visible (status) {
      setTimeout(async () => {
        if (status === true) {
          this.installHistoryData = await this.getSwHistory()
        } else this.reset()
      }, 10)
    }
  },
  methods: {
    async getSwHistory (params) {
      try {
        this.loading = true
        const actionTypeName = {
          INSTALL: this.$t('service.INSTALL.install'), // 설치
          UPDATE: this.$t('service.INSTALL.update'), // 업데이트
          UNINSTALL: this.$t('service.INSTALL.uninstall'), // 삭제
          READ: this.$t('service.INSTALL.read') // 조회
        }
        const masking = name => this.$options.filters.maskingName(name)
        const date = date => this.$options.filters.date(date, 'YYYY.MM.DD HH.mm')

        const response = await API.sw.getSwHistory(params)
        return response.map(({ companyName, groupName, projectName, createDate, createUserName, createUserId, osType, ...item }) => {
          const result = {
            ...item,
            os: osType,
            executor: `${createUserName}(${masking(createUserId)})`,
            date: date(createDate),
            actionTypeName: actionTypeName[item.actionType],
            location: `${companyName} > ${groupName} > ${projectName}`
          }
          return result
        })
      } catch (error) {
        console.error('@@ getSwHistory : ', error)
        return []
      } finally {
        this.loading = false
      }
    },
    /**
     * [관조프] 변경 이벤트
     */
    async searchFilter ({ companyIdx, groupIdx, projectIdx }) {
      this.filterValues = {
        company: companyIdx,
        group: groupIdx,
        project: projectIdx
      }

      return this.getSearchResult(this.filterValues)
    },
    /**
     * 이력 Text 검색 이벤트
     */
    input (value) {
      this.keyword = value
      return this.getSearchResult(this.filterValues, this.keyword)
    },
    async getSearchResult (filterValues = this.filterValues, keyword = this.keyword) {
      const params = { ...filterValues, keyword }
      // console.log(params)

      this.installHistoryData = await this.getSwHistory(params)
    },
    reset (value) {
      this.keyword = undefined
      this.$refs.filter.resetAllFilter()
      // this.$refs.search.refresh() // 이건 사용하면 안됨! value = undefined 때문에 input 이벤트를 계속 내려줘서 무한루프 돌아용
      this.$refs.search.value = undefined
      this.$refs.search.remoteValue = undefined
    },
    closeEvent () {
      this.$emit('close')
    }
  },
  data: () => ({
    loading: false,
    keyword: undefined,
    filterValues: {},
    installHistoryColumn: [
      { header: '설치프로그램 명', binding: 'softwareName', width: 130, keyPath: 'service.INSTALL.COL.installerName' },
      { header: '프로젝트 위치', binding: 'location', align: 'left', keyPath: 'service.INSTALL.COL.projectLoc' },
      { header: 'VM(Host) 명', binding: 'hostName', width: 160, keyPath: 'service.INSTALL.COL.hostName' },
      { header: '수행내역', binding: 'actionTypeName', width: 85, keyPath: 'service.INSTALL.COL.performanceHist' },
      { header: '수행 스크립트 버전', binding: 'scriptVersion', width: 150, keyPath: 'service.INSTALL.COL.preformanceScriptVer' },
      { header: '지원 OS', binding: 'os', width: 150, keyPath: 'service.INSTALL.supportOS' },
      { header: '실행자', binding: 'executor', width: 130, keyPath: 'service.INSTALL.COL.executor' },
      { header: '실행 결과', binding: 'result', customHtml: true, width: 90, keyPath: 'service.INSTALL.COL.result' },
      { header: 'Date', binding: 'date', width: 135 }
    ],
    installHistoryData: [],
    totalResultCnt: 0
  })
}
</script>

<style lang="scss" scoped>
.search-area {
  margin-bottom: 15px;
}

.modal-button-area {
  border-top: 1px solid $purple-gray;
  padding-top: $gap;
}

.result-wrap {
  display: flex;
  align-items: center;
  justify-content: center;

  .-result {
    display: flex;
    align-content: center;

    i {
      display: block;
      width: 12px; height: 12px;
      position: relative;
      margin-right: 5px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        background-color: $main-red;
      }

      &.-success {
        &::before {
          transform: rotate(315deg);
          width: 10px;
          height: 1px;
          top: 4px;
          right: 0;
        }
        &::after {
          transform: rotate(45deg);
          width: 5px;
          height: 1px;
          top: 6px;
          left: 0;
        }
      }
      &.-fail {
        transform: rotate(45deg);

        &::before { top: 5px; left: 0px; width: 11px; height: 1px;  }
        &::after { top: 0; left: 5px; width: 1px; height: 11px }
      }
    }

  }
}
</style>

<style lang="scss">
  .install-program-modal-body {
    margin-bottom: 40px;
    height: 660px;
    width: 1390px;
    .filter-list {
      .el-input { width: 140px; }
      .el-input__inner {
        border: none;
        width: 140px;
        border-radius: 0;
        border-bottom: 1px solid #64676B;
      }
    }
  }
</style>
