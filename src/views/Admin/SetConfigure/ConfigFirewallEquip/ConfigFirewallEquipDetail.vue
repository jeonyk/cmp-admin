<template>
  <div>
    <dashboard-panel
      :title="$v('방화벽 장비 정보')"
      :padding-top="0"
      class="product-info -default"
    >
      <vertical-table
        class="product-table"
        :columns="columns"
        :data="firewallData"
        type="horizontal"
      >
        <template #masterUrl="props">
          <span class="test">
            {{ props.row.masterUrl }}
          </span>
        </template>
        <template #isManualManagement="props">
          <el-checkbox
            v-model="props.row.isManualManagement"
            :disabled="true"
          />
        </template>
        <template #intervalSec="props">
          {{ convertSecondsToMinutes(props.row.intervalSec) }}
        </template>
        <template #isSync="props">
          <cmp-status-tag
            v-if="props.row.isSync !== null"
            :type="props.row.isSync ? 'is-success' : 'is-fail'"
          >
            <span>{{ props.row.isSync ? '성공' : '실패' }}</span>
          </cmp-status-tag>
        </template>
        <template #isConnect="props">
          <div style="text-align: left;">
            <span
              v-if="props.row.isConnect"
              class="state-icon success"
            />
            <span
              v-else
              class="state-icon error"
            />
          </div>
        </template>
        <template #lastSyncTime="props">
          {{ $options.filters.date(props.row.lastSyncTime, 'YYYY-MM-DD HH:MM') }}
        </template>
      </vertical-table>
    </dashboard-panel>
    <dashboard-panel
      :title="'VDOM'"
      :padding-top="0"
      class="product-info -default"
    >
      <cmp-grid
        :columns="vdomColumns"
        :item-source="vdomData"
      >
        <template #isNat="props">
          <el-checkbox
            :disabled="true"
            v-model="props.row.isNat"
          />
        </template>
      </cmp-grid>
    </dashboard-panel>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
export default {
  components: { VerticalTable, DashboardPanel },
  async created () {
    this.selectedIdx = this.$route.params.netIdx
    this.firewallData = await this.getEquipDetail(this.selectedIdx)
    this.vdomData = this.firewallData.vdoms
    this.setBcDetail(this.firewallData.netName)
  },
  methods: {
    setBcDetail (label) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: `${label}`,
        path: ''
      })
    },
    convertSecondsToMinutes (seconds) {
      const minutes = Math.round(seconds / 60 * 100) / 100
      const remainingSeconds = Math.round((minutes - Math.floor(minutes)) * 60)
      // 남은 초가 0일 경우 분만 리턴
      if (remainingSeconds === 0) {
        return Math.floor(minutes) + this.$v('분')
      }
      return Math.floor(minutes) + this.$v('분') + ' ' + remainingSeconds + this.$v('초')
    },
    //   // API_HANDLER (GET) 방화벽 장비 상세
    async getEquipDetail (newIdx) {
      try {
        console.log('getFirewallDetail')
        // TODO API 연동
        const response = await API.network.getEquipDetail(newIdx)
        return response
      } catch (err) {
        console.log(err)
      }
    }
  },
  data () {
    return {
      isOpenConnection: false,
      selectedIdx: null,
      connectionForm: {
        id: null,
        password: null,
        masterURL: null
      },
      vdomColumns: [
        { binding: 'vdomId', header: 'VDOM ID' },
        { binding: 'interface', header: this.$v('인터페이스') },
        { binding: 'isNat', header: this.$v('NAT 방화벽 사용여부'), width: 200, customHtml: true },
        { binding: 'comment', header: this.$v('설명') }
      ],
      vdomData: [],
      // TODO 설계 미스 - 없어도 동잘할 수 있도록 수정해야합니다.
      // OTP인증을 해야 해쉬를 비밀번호를 전환해서 볼 수 있습니다. -> 해당 컴포넌트에서 modalStatus가 필요합니다.
      modalStatus: {
        isOpen: false,
        type: 'UPDATE' // CREATE
      },
      columns: [
        { binding: 'netName', header: this.$v('방화벽 장비명') },
        { binding: 'equipType', header: this.$v('장비 타입') },
        { binding: 'id', header: this.$v('계정 정보') },
        { binding: 'masterUrl', header: this.$v('현재 Active된 URL') },
        { binding: 'apiUrl1', header: 'API URL_1' },
        { binding: 'apiUrl2', header: 'API URL_2' },
        { binding: 'isManage', header: this.$v('운영 여부') },
        { binding: 'isManualManagement', header: this.$v('수기관리여부(미지원장비)') },
        { binding: 'isConnect', header: this.$v('연결 상태') },
        { binding: 'isSync', header: this.$v('동기화 상태') },
        { binding: 'intervalSec', header: this.$v('동기화 주기') },
        { binding: 'lastSyncTime', header: this.$v('마지막 동기 시간') },
        { binding: 'comment', header: this.$v('설명'), colspan: true }
      ],
      firewallData: {}
    }
  }
}
</script>

<style>

</style>
