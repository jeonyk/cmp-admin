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
          :module-type="moduleType"
          ref="filter"
          @reset-data="reset"
          @search="values => searchFilter(values)"
        />
        <!-- /. 관조프 -->

        <filtering-component
          class="filtering-component"
          :use-title="false"
        >
          <div
            class="filtering-list"
            v-for="option in filterOptions"
            :key="option.binding"
          >
            <span class="filter-name">{{ option.label }}</span>
            <div class="filter-options">
              <el-input
                v-model="filterValues[option.binding]"
                @keyup.enter.native="searchFilter(filterValues)"
              />
            </div>
          </div>
          <button
            class="button"
            type="is-primary"
            @click="searchFilter(filterValues)"
          >
            {{ $v('검색') }}
          </button>
        </filtering-component>

        <total-count :total-count="totalResultCnt" />

        <cmp-grid
          :item-source="installHistoryData"
          :columns="installHistoryColumn"
          :use-column-filter="false"
          @total-count="cnt => totalResultCnt = cnt"
        >
          <template #result="props">
            <el-tooltip
              effect="light"
              placement="bottom"
            >
              <!-- :disabled="props.row.result === 'SUCCESS'" -->
              <div class="result-wrap">
                <span class="-result">
                  <i :class="props.row.result === 'SUCCESS' ? '-success' : '-fail'" />
                </span>
                <!-- 성공 / 실패 -->
                {{ $t(`common.${props.row.result === 'SUCCESS' ? 'success' : 'fail'}`) }}
              </div>

              <div slot="content">
                multiple lines<br>second line
              </div>
            </el-tooltip>
          </template>

          <template #script="{ row }">
            <button
              class="button"
              type="is-primary"
              @click="scriptContent(true, row.scriptContents)"
            >
              {{ $v('Script 보기') }}
            </button>
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

    <el-dialog
      :visible="scriptContentModal.view"
      title="Script 보기"
      width="60%"
      top="40vh"
      @close="scriptContent(false)"
    >
      <CMPCodeEditor
        v-if="scriptContentModal"
        style="height: 200px"
        read-only
        :values="scriptContentModal.data"
      />
    </el-dialog>
  </el-dialog>
</template>

<script>
import API, { ResourceFilterComponent, CMPCodeEditor } from '@sd-fe/cmp-core'
import InstallProgramMixins from '../InstallProgramMixins.script'

export default {
  name: 'InstallProgramHistory',
  mixins: [InstallProgramMixins],
  components: {
    ResourceFilterComponent,
    CMPCodeEditor
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
          const swId = this.$route.params?.idx
          if (swId) this.installHistoryColumn.splice(0, 1) // 상세라면 "설치프로그램 명" 컬럼 삭제

          this.installHistoryData = await this.getSwHistory()
        } else this.reset()
      }, 10)
    }
  },
  methods: {
    async getSwHistory (condition) {
      try {
        this.loading = true
        const actionTypeName = {
          INSTALL: this.$t('service.INSTALL.install'), // 설치
          UPDATE: this.$t('service.INSTALL.update'), // 업데이트
          UNINSTALL: this.$t('service.INSTALL.uninstall'), // 삭제
          READ: this.$t('service.INSTALL.read') // 조회
        }
        const masking = name => this.$options.filters.maskingName(name)
        const date = date => this.$options.filters.date(date, 'YYYY.MM.DD HH:mm')

        const swId = this.$route.params?.idx
        const setParams = swId ? { ...condition, swId } : condition
        const response = await API.sw.getSwHistory({ ...setParams, moduleType: this.cloud })

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
     * 기타 검색어 입력시 변경 이벤트
     * @param { Object } values
     */
    async searchFilter ({ companyIdx, groupIdx, projectIdx, hostName, softwareName, scriptVersion, scriptContents }) {
      this.filterValues = {
        company: companyIdx, // 관계사
        group: groupIdx, // 조직
        project: projectIdx, // 프로젝트
        hostName, // 호스트명
        softwareName, // 설치프로그램
        scriptVersion, // 설치프러그램 버전
        scriptContents // Script 내용
      }

      return this.getSearchResult(this.filterValues)
    },

    async getSearchResult (filterValues = this.filterValues) {
      const params = { ...filterValues }
      // console.log(params)

      this.installHistoryData = await this.getSwHistory(params)
    },
    reset (value) {
      this.keyword = undefined
      this.$refs.filter.resetAllFilter()
    },
    closeEvent () {
      this.$emit('close')
    },

    // ---
    // ---
    // ---

    /**
     * script 보기
     */
    scriptContent (view, data = undefined) {
      this.scriptContentModal = { view, data }
    }
  },
  data: root => ({
    loading: false,
    keyword: undefined,
    filterValues: {},
    filterOptions: [
      { label: '호스트명', binding: 'hostName' },
      { label: '설치프로그램', binding: 'softwareName' },
      { label: '설치프로그램버전', binding: 'scriptVersion' },
      { label: 'Script 내용', binding: 'scriptContents' }
    ],
    installHistoryColumn: [
      { header: root.$v('설치프로그램 명'), binding: 'softwareName', width: 130 },
      { header: root.$v('프로젝트 위치'), binding: 'location', align: 'left' },
      { header: root.$v('호스트명'), binding: 'hostName', width: 160 },
      { header: root.$v('수행내역'), binding: 'actionTypeName', width: 85 },
      { header: root.$v('수행 스크립트 버전'), binding: 'scriptVersion', width: 150 },
      { header: root.$v('지원 OS'), binding: 'os', width: 150 },
      { header: root.$v('실행자'), binding: 'executor', width: 130 },
      { header: root.$v('실행 결과'), binding: 'result', customHtml: true, width: 90 },
      { header: 'Date', binding: 'date', width: 135 },
      { header: 'Script 보기', binding: 'script', width: 160, customHtml: true }
    ],
    installHistoryData: [],
    totalResultCnt: 0,
    scriptContentModal: {
      view: false,
      data: undefined
    }
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

.filtering-component {
  margin-top: -30px;
  margin-bottom: 0;
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
