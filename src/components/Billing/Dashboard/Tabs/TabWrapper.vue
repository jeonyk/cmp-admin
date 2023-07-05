<template>
  <div class="tab-wrapper">
    <g-tab :data="tabData">
      <template
        v-for="tab in tabData"
        v-slot:[tab.field]
      >
        <tab-chart
          :raw-tab="tab"
          :field="tab.field"
          :key="tab.field"
        />
      </template>
    </g-tab>
  </div>
</template>

<script>
import TabChart from './TabChart.vue'

export default {
  name: 'TabWrapper',
  components: {
    TabChart
  },
  data: () => ({
    tabData: [
      { field: 'nutanix', name: 'Nutanix', target: 'private', moduleType: 'NX' },
      { field: 'vmware', name: 'VMWare', target: 'private', moduleType: 'VMWARE' },
      { field: 'aws', name: 'AWS', target: 'public', moduleType: 'AWS' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.tab-wrapper {
  margin-top: 120px;
}
</style>
