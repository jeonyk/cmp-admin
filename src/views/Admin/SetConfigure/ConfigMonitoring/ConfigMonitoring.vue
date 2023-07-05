<!--
  * 파일명 : ConfigMonitoring.vue
  * 파일 기능 : 어드민 관리 - 모티터링 설정 Wrapper
  * 작성자 : 이유준
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div class="set-account">
    <g-tab
      :data="tabs"
      @click="clickTabAction"
    >
      <template #set-monitoring>
        <router-view />
      </template>

      <template #set-monitoring-server>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ConfigMonitoring',
  created () {
    this.tabs = this.tabData.filter(item => item.accessible.includes(this.packageType))
  },
  computed: {
    ...mapGetters(['packageType'])
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    clickTabAction (item) {
      this.routeTo({ name: item.routeTo })
    }
  },
  data () {
    return {
      tabs: [],
      tabData: [
        {
          field: 'set-monitoring',
          name: 'set-monitoring',
          routeTo: 'set-monitoring',
          keyPath: 'admin.MONIT.setMonitoring',
          accessible: ['PL', 'BS', 'STD', 'ENT']
        },
        {
          field: 'set-monitoring-server',
          name: 'set-monitoring-server',
          routeTo: 'set-monitoring-server',
          keyPath: 'admin.MONIT.setMonitoringServer',
          accessible: ['STD', 'ENT']
        }
      ]
    }
  }
}
</script>
