<template>
  <div>
    <g-tab
      class="set-resource-elb-list"
      @click="goToPage"
      :data="tabs"
    />

    <router-view />
  </div>
</template>

<script>
export default {
  name: 'SetResourceELBTabs',
  methods: {
    goToPage (tab) {
      if (!tab?.routeName) return

      this.$router.push({
        name: tab.routeName,
        params: {
          field: tab.field
        }
      })
    }
  },
  data () {
    return {
      tabs: [
        { field: 'nlb', name: 'NLB(L4)', routeName: 'set-resource-nlb-list', isActive: true },
        { field: 'target-group', name: this.$t('bc.AWS.targetGroup'), routeName: 'set-resource-target-group-list' } // 대상 그룹
        // { field: 'alb', name: 'ALB(L7)', routeName: 'set-resource-alb-list' },
        // { field: 'alb-rules', name: 'ALB 규칙', routeName: 'set-resource-alb-rules-list' }
      ]
    }
  }
}
</script>
