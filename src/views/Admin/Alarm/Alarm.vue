<template>
  <div class="cmp-alarm">
    <g-tab
      :data="tabData"
      @click="onChangeTab"
    />
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'Alarm',
  created () {
    if (this.$route.name === 'cmp-alarm') {
      this.$router.push({ name: 'cmp-alarm-template' })
    }
  },
  methods: {
    onChangeTab ({ routeTo }) {
      this.$router.push({ name: routeTo })
    }
  },
  data: () => ({
    tabData: [
      { field: 'template', routeTo: 'cmp-alarm-template', name: '템플릿 관리' },
      { field: 'trigger', routeTo: 'cmp-alarm-trigger', name: '트리거 관리' },
      { field: 'history', routeTo: 'cmp-alarm-history', name: '발송 이력 관리' }
    ]
  })
}
</script>
