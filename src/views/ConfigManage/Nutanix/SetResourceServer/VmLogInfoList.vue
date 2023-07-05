<!--
  * 파일명 : VmLogInfoList.vue
  * 파일 기능 : 구성관리 > 자원관리 > Compute 상세 > 로그 정보
  * 작성자 : 김예담
  * 최종 작성일 : 2021-04-20
  * License By Shinsegae I&C
 -->
<template>
  <section
    class="vm-log-info-list"
    v-loading="isCodeData"
  >
    <filtering-component
      @reset-data="() => resetDate()"
    >
      <div class="filter-form">
        <span class="filter-name -required">{{ $v('로그 인덱스') }}</span>
        <div class="filter-options">
          <el-select
            slot="protocol"
            v-model="filterParam.logIndex"
            :placeholder="$v('로그 인덱스') "
            @change="changeLogIndex"
          >
            <el-option
              v-for="item in logIndexOptions"
              :key="item.codeVal"
              :label="item.codeName"
              :value="item.codeVal"
            />
          </el-select>
        </div>
      </div>

      <div class="filter-form">
        <span class="filter-name">{{ $v('검색일') }}</span>

        <div class="filter-date">
          <el-date-picker
            v-model="filterParam.startDate"
            type="datetime"
            :clearable="false"
            :placeholder="$v('검색 시작일')"
            value-format="yyyy-MM-dd HH:mm:ss"
            @change="val => changeDate(val, 'startDate')"
            :picker-options="startDateOptions"
            style="width: 180px"
          />
          <span class="date-line">~</span>
          <el-date-picker
            v-model="filterParam.endDate"
            type="datetime"
            :clearable="false"
            :placeholder="$v('검색 종료일')"
            value-format="yyyy-MM-dd HH:mm:ss"
            @change="val => changeDate(val, 'endDate')"
            :picker-options="endDateOptions"
            style="width: 180px"
          />
        </div>
      </div>
    </filtering-component>

    <div class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="logList.length"
      >
        <search-component
          v-model="filterParam.message"
          class="search-area"
          :placeholder="'Message ' + $v('검색')"
          @search="changeLogIndex()"
        />
      </total-count>
    </div>

    <div class="table-area">
      <cmp-grid
        v-loading="isLogData"
        :item-source="logList"
        :columns="columns"
        :init-custom-action="init"
        paging-type="list"
        :height="450"
      >
        <template #timestamp="{ row }">
          {{ row.timestamp | date }}
        </template>
      </cmp-grid>
    </div>
  </section>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default {
  name: 'VmLogInfoList',
  components: {
    FilteringComponent
  },
  props: {
    hostName: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      isLogData: false,
      isCodeData: false,

      logIndexOptions: [],
      logGrid: null,

      logList: [],
      columns: [
        // { header: 'index', binding: 'index', width: 50 },
        { header: 'Timestamp', binding: 'timestamp', width: 200, customHtml: true },
        { header: 'Message', binding: 'message', align: 'left' }
      ],
      totalResultCnt: 0,

      filterParam: {
        logIndex: '',
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        message: ''
      },
      startDateOptions: {
        disabledDate: this.disabledStDate
      },
      endDateOptions: {
        disabledDate: this.disabledEdDate
      },
      lastLogTimestamp: 0,
      lastLogList: []
    }
  },
  async created () {
    await this.setLogIndexOptions()
    this.logList = await this.getElasticsearchLog()
  },
  methods: {
    init (flexgrid) {
      this.logGrid = flexgrid
      flexgrid.scrollPositionChanged.addHandler((s, e) => {
        if (s.viewRange.bottomRow >= s.rows.length - 1) {
          const view = s.collectionView
          const index = view.currentPosition
          this._addData(this.logList)
          view.refresh()
          view.currentPosition = index
        }
      })
    },
    async _addData (data) {
      const lastLog = data[data.length - 1]
      const lastLogTimestamp = +new Date(lastLog.timestamp)

      const notIdList = []
      for (let i = data.length - 1; i > 0; i--) {
        if (+new Date(data[i].timestamp) > lastLogTimestamp) break

        if (+new Date(data[i].timestamp) === lastLogTimestamp) {
          notIdList.push(data[i].id)
        }
      }

      const response = await this.getElasticsearchLog({
        // from: data.length,
        endDate: dayjs(lastLogTimestamp).toISOString(),
        notIdList
      })
      if (!response?.length) return
      response.forEach(row => {
        data.push(row)
      })
    },
    /**
     * 로그 인덱스 옵션 리스트 세팅
     */
    async setLogIndexOptions () {
      const options = await this.getCodeList({ codeType: 'ELASTICSEARCH_INDEX' })
      this.logIndexOptions = [...options]

      if (this.logIndexOptions?.length) this.filterParam.logIndex = this.logIndexOptions[0].codeVal
    },
    /**
     * API : 코드 조회
     */
    async getCodeList (params) {
      try {
        this.isCodeData = true
        return await API.config.getCodeList(params)
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.IND.006')) // 코드 조회 실패
      } finally {
        this.isCodeData = false
      }
    },
    /**
     * API : 엘라스틱서치 로그 조회
     */
    async getElasticsearchLog (param) {
      if (!this.hostName) return
      if (!this.filterParam.logIndex) this.$alert(this.$v('로그인덱스 선택은 필수입니다.'), () => false)

      try {
        this.isLogData = true

        let payload = {
          from: 0,
          size: 30,
          hostname: this.hostName,
          // hostname: 'cmp-repo', // 임시
          index: this.filterParam.logIndex,
          message: this.filterParam.message,
          startDate: dayjs(this.filterParam.startDate).toISOString(),
          endDate: dayjs(this.filterParam.endDate).toISOString()
        }

        if (param) {
          payload = {
            ...payload,
            ...param
          }
        }

        const data = await API.config.getElasticsearchLog(payload)

        if (!data?.hits) return []

        const list = data.hits.map((item, idx) => {
          return {
            id: item.id,
            index: idx + 1,
            timestamp: item?.sourceAsMap['@timestamp'] || '-',
            message: item?.sourceAsMap?.message || '-'
          }
        })

        return list
      } catch (error) {
        console.error(error)
        this.logList = []
        throw error
      } finally {
        this.isLogData = false
      }
    },
    /**
     * <로그 인덱스 / 메세지> 선택 변경 이벤트
     */
    async changeLogIndex () {
      this.logList = await this.getElasticsearchLog()
      if (this.logGrid) this.logGrid.scrollIntoView(0, -1)
    },
    /**
     * <검색일> 변경 이벤트
     */
    async changeDate (param, field) {
      this.filterParam[field] = param

      this.logList = await this.getElasticsearchLog()
      if (this.logGrid) this.logGrid.scrollIntoView(0, -1)
    },
    async resetDate () {
      this.filterParam = {
        logIndex: this.logIndexOptions?.length ? this.filterParam.logIndex = this.logIndexOptions[0].codeVal : '',
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        message: ''
      }
      this.logList = await this.getElasticsearchLog()
    },
    disabledStDate (date) {
      date = new Date(date)
      const endDate = new Date(this.filterParam.endDate)
      return date > endDate
    },
    disabledEdDate (date) {
      date = new Date(date)
      const startDate = new Date(this.filterParam.startDate)
      return date < startDate
    }
  }
}
</script>

<style lang="scss" scoped>
  .vm-log-info-list { margin-top: $gap; }

  .total-count-wrap {
    align-items: flex-start;
    flex-direction: column;
    .search-area { margin-top: $gap-s; }
  }

  .-required {
    position: relative;
      &::before {
      position: absolute;
      top: -5px;
      left: 100%;
      content: '*';
      font-size: 15px;
      color: $main-red;
      height: 100%;
    }

  }
</style>
