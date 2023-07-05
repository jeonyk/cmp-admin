<template>
  <div class="alerts-wrapper">
    <g-tab :data="tabData">
      <template #nutanix>
        <nutanix-alerts />
      </template>

      <template #cmp>
        <cmp-alerts />
      </template>
    </g-tab>
  </div>
</template>

<script>
import NutanixAlerts from './NutanixAlerts'
import CMPAlerts from './CMPAlerts'
import { mapState } from 'vuex'

export default {
  name: 'ConfigAlerts',
  components: {
    'nutanix-alerts': NutanixAlerts,
    'cmp-alerts': CMPAlerts
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    })
  },
  created () {
    // 기획 나오면 주석 제거
    // if (this.packageType !== 'PL') this.tabData.push(this.basicTab)
  },
  data () {
    return {
      tabData: [{ field: 'nutanix', name: 'Nutanix' /* routeTo: 'set-account-user' */ }],
      basicTab: { field: 'cmp', name: 'CMP' /* routeTo: 'set-account-admin' */ }
    }
  }
}
</script>

<style lang="scss" scoped>
.alerts-wrapper {
  margin-top: 40px
}
</style>
