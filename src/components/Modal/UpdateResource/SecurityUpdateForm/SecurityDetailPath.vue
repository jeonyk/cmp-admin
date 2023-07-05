<!--
  * 파일명 : SecurityDetailPath.vue
  * 파일 기능 : 보안그룹 - 경유지 정보 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2021-02-17
  * License By Shinsegae I&C
  * 2021-02-17 fix: [기등록 자원 이관 L4, L7] - read only fix: [기등록 자원 이관 보안그룹] - read only 처리 및 업데이트 폼 공통 컴포넌트로 분리
 -->

<template>
  <div class="security-detail-path">
    <section class="table-area">
      <cmp-grid
        :item-source="detailData"
        :columns="columns"
        :header-merge="headerMergeColumns"
        class="network-grid"
        selectable
        @selectedRow="setRowSelect"
        init-auto-select-row-key="vdomId"
        :init-auto-select-row="selectedRow"
        :use-excel-download="false"
      />
      <!-- style="width: 100%;" -->
    </section>

    <section
      class="detail-contents"
      v-if="selectedRow"
    >
      <register-contents
        class="more-info"
        :title="$t('common.REGCON.vipInfo')"
        :type="(data !== undefined) ? 'input' : ''"
        v-if="vipTableData && vipTableData.length"
      >
        <network-create-table
          :source-data="vipTableData"
          :info-column="vipColumns"
          class="detail-grid"
          :editable="false"
          :disabled="true"
          :project-idx="projectIdx"
        />
      </register-contents>
      <!-- "VIP 정보" -->

      <register-contents
        class="more-info"
        :title="$t('common.REGCON.poolInfo')"
        :type="(data !== undefined) ? 'input' : ''"
        v-if="poolTableData && poolTableData.length"
      >
        <network-create-table
          :source-data="poolTableData"
          :info-column="poolColumns"
          class="detail-grid"
          :editable="false"
          :disabled="true"
          :project-idx="projectIdx"
        />
      </register-contents>
      <!-- "POOL 정보" -->

      <register-contents
        class="more-info"
        :title="$t('common.REGCON.scheInfo')"
        :type="(data !== undefined) ? 'input' : ''"
      >
        <article class="flex-wrap schedule-info">
          <h5 class="schedule-info-title">
            <!-- 스케쥴 명 -->
            {{ $t('common.GRID.NETWORK.scheduleName') }}
          </h5>
          <el-input
            v-if="editable"
            v-model="schedule.scheduleName"
            @keyup.enter.native="setEmitData()"
            class="form-input"
            :disabled="true"
          />
          <span v-else>{{ schedule.scheduleName }}</span>
        </article>
        <article class="flex-wrap schedule-info">
          <h5 class="schedule-info-title">
            <!-- 시작일 -->
            {{ $t('common.GRID.NETWORK.startDate') }}
          </h5>
          <el-date-picker
            v-if="editable"
            v-model="schedule.start"
            type="datetime"
            class="date-time-picker form-input"
            prefix-icon="el-icon-date"
            format="yyyy.MM.dd"
            value-format="yyyy/MM/dd"
            @change="changeDate('start')"
            :disabled="true"
          />
          <span v-else>{{ schedule.start | date }}</span>
        </article>
        <article class="flex-wrap schedule-info">
          <h5 class="schedule-info-title">
            <!-- 완료일 -->
            {{ $t('common.GRID.NETWORK.completeDate') }}
          </h5>
          <el-date-picker
            v-model="schedule.end"
            v-if="editable"
            type="datetime"
            class="date-time-picker form-input"
            prefix-icon="el-icon-date"
            format="yyyy.MM.dd"
            value-format="yyyy/MM/dd"
            @change="changeDate('end')"
            :disabled="true"
          />
          <span v-else>{{ schedule.end | date }}</span>
        </article>
      </register-contents>
    </section>

    <!-- 추후 경유지 생성/변경 기능이 추가될 수 있습니다.. -->
    <div
      class="modal-button-area"
      v-if="data === undefined"
    >
      <button
        class="button"
        @click="$emit('close')"
        type="is-anti"
      >
        취소
      </button>
      <button
        class="button"
        @click="createNewPath"
        type="is-primary"
      >
        생성
      </button>
    </div>
  </div>
</template>
<script>
import { NetworkCreateTable } from '@sd-fe/cmp-core'
import { uniqBy } from 'lodash'

export default {
  name: 'SecurityDetailPath',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: true
    },
    orderInfo: {
      type: Object,
      default: null
    },
    projectIdx: {
      type: Number,
      default: 0
    },
    updating: {
      type: Boolean,
      default: false
    }

  },
  components: {
    NetworkCreateTable
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      async handler (newVal) {
        const tableData = JSON.parse(JSON.stringify(newVal))
        this.detailData = uniqBy(tableData, 'vdomId')
        this.setEmitData()
      }
    }
  },
  methods: {
    setRowSelect (row) {
      if (row) {
        this.selectedRow = row._data

        this.vipTableData = this.selectedRow?.virtualIps
        this.schedule = { ...this.selectedRow?.schedule }
      } else {
        this.selectedRow = null
      }
    },
    setEmitData (data, field) {
      if (data && field) this[field] = data

      const policies = this.roadDetailData.map(row => {
        return {
          vdomId: row.originPolicyData.vdomId,
          nat: row.originPolicyData.nat,
          srcintf: row.originPolicyData.srcintf,
          scheduleName: this.schedule.scheduleName,
          dstintf: row.originPolicyData.dstintf,
          srcaddr: row.originPolicyData.srcaddr,
          dstaddr: row.originPolicyData.dstaddr,
          ipPools: row.originPolicyData.ipPools,

          schedule: this.schedule,
          virtualIps: this.vipTableData?.length ? this.vipTableData.filter(item => !item.edit) : [],
          poolInfo: this.poolTableData?.length ? this.poolTableData.filter(item => !item.edit) : []
        }
      })

      this.$emit('changed-data', policies)
    },

    createNewPath () {
      if (!this.groupValid()) return

      this.$confirm(this.$t('common.CONFIRM.SECURITY.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        // this.changedPolicyData = null
        this.$emit('create', this.pathDetail)
        this.$emit('close')
      }).catch(() => false)
    },

    alert (message, callback) {
      this.$alert(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        callback: callback
      })
    },

    groupValid (data = this.pathDetail) {
      if (this.editable) {
        if (data) {
          if (!data.vipInfo || !data.vipInfo.length) return this.alert(this.$t('common.ALERT.SECURITY.045'), () => false)
          if (!data.poolInfo || !data.poolInfo.length) return this.alert(this.$t('common.ALERT.SECURITY.044'), () => false)
          if (Object.values(data.scheduleInfo).includes(undefined)) return this.alert(this.$t('common.ALERT.SECURITY.040'), () => false)
        }
      }
      return true
    },
    /**
     * 날짜 변경시 이벤트, 시작일 > 만료일 을 방지하기 위함
     * @param {String} field 시작일인지 만료일인지.. 'start'||'end'
     */
    changeDate (field) {
      if (!this.schedule[field]) return

      const startT = this.schedule.start
      const startTimeData = new Date(startT).getTime()

      const endT = this.schedule.end
      const endTimeData = new Date(endT).getTime()

      if (endTimeData < startTimeData) {
        this.$alert(this.$t('common.ALERT.SECURITY.038'))
        this.schedule.end = ''
      } else this.setEmitData()
    }
  },
  data () {
    return {
      selectedRow: undefined,

      pathDetail: null,
      // 테이블 데이터
      headerMergeColumns: {
        colSpan: [
          { startIdx: 3, endIdx: 5, header: this.$t('common.GRID.NETWORK.stopover') }, // 경유지
          { startIdx: 6, endIdx: 8, header: this.$t('admin.PREF.policy') } // 정책
        ],
        rowSpan: ['roadName', 'srcRoadType', 'dstRoadType']
      },
      columns: [
        { header: this.$v('경유지명'), binding: 'roadName' },
        { header: this.$v('출발지'), binding: 'srcRoadType' },
        { header: this.$v('목적지'), binding: 'dstRoadType' },
        { header: this.$v('VDOM 명'), binding: 'routeName' },
        { header: this.$v('SRC 망 구분'), binding: 'srcIntf' },
        { header: this.$v('DST 망 구분'), binding: 'dstIntf' },
        { header: 'SRC', binding: 'srcIpType' },
        { header: 'DST', binding: 'dstIpType' },
        { header: 'NAT', binding: 'nat' }
      ],
      tableData: [],

      // 상세 정보
      roadDetailData: [],
      detailData: {},

      vipTableData: [],
      poolTableData: [],
      // startTableData: [],
      // destTableData: [],
      // portTableData: [],
      // scheduleTableData: [],
      schedule: {
        scheduleName: undefined,
        start: undefined,
        end: undefined
      },

      // VIP 정보
      vipColumns: [
        { header: 'VIP명', binding: 'virtualIpName', width: '*', customHtml: true },
        { header: 'External IP', binding: 'extIp', width: '*', customHtml: true, ip: true },
        { header: 'Mapped IP', binding: 'mappedIp', width: '*', customHtml: true, ip: true }
      ],
      // POOL 정보
      poolColumns: [
        { header: 'Pool명', binding: 'ipPoolName', width: '*', customHtml: true },
        { header: 'Pool Start IP', binding: 'startIp', width: '*', customHtml: true, ip: true },
        { header: 'Pool End IP', binding: 'endIp', width: '*', customHtml: true, ip: true }
      ],
      // // 출발지 정보
      // startColumns: [
      //   { header: '출발지명', binding: 'addressName', customHtml: true },
      //   { header: '타입', binding: 'addressType', customHtml: true, type: true },
      //   { header: 'IP', binding: 'value', customHtml: true, ip: true }
      // ],
      // // 목적지 정보
      // destColumns: [
      //   { header: '목적지명', binding: 'addressName', customHtml: true },
      //   { header: '타입', binding: 'addressType', customHtml: true, type: true },
      //   { header: 'IP', binding: 'value', customHtml: true, ip: true }
      // ],
      // // 포트 정보
      // portColumns: [
      //   { header: '포트명', binding: 'serviceName', customHtml: true },
      //   { header: '프로토콜', binding: 'serviceType', customHtml: true },
      //   { header: '포트', binding: 'port', customHtml: true, port: true }
      // ],
      // 스케줄 정보
      scheduleColumns: [
        { header: '스케쥴명', binding: 'scheduleName', customHtml: true },
        { header: '시작일', binding: 'start', customHtml: true, date: true, dataType: 'Date' },
        { header: '완료일', binding: 'end', customHtml: true, date: true, dataType: 'Date' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .security-detail-path {
    .detail-contents {
      margin-top: $gap-m;
      border-top: 1px solid $border-color;
      .detail-grid {
        // width: calc(100% - 200px);
        // width: 100%;
      }
    }

    .ip-popup-background {
      position: fixed;
      top: 0; left: 0;
      bottom: 0; right: 0;
      z-index: 5;

      &::before {
        content: '';
        background-color: rgba(0,0,0,.5);
        width: 100%; height: 100%;
        display: block;
      }
    }
    .more-info {
      > .contents-title {
        width: 150px;
      }
      .schedule-info {
        & + .schedule-info {
          margin-top: $gap-s;
        }
        &-title {
          width: 100px;
        }
      }
    }

  }
</style>
