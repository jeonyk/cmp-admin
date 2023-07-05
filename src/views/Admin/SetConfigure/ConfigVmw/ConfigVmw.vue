<!--
  * 파일명 : ConfigVmw.vue
  * 파일 기능 :
  * 작성자 : 이유준
  * 최종 작성일 : 2020-08-24
  * License By Shinsegae I&C
  * 2020-08-24 Merge commit '1d2b3d902a02e8910dec191b80b03dbaa651dc5a' into publish/task-server
 -->

<template>
  <div class="config-project">
    <g-tab
      ref="tabRef"
      :data="tabData"
      @click="clickTabAction"
    >
      <template #vCenter>
        <router-view />
      </template>

      <template #ESXi>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ConfigVmw',
  created () {
    if (['PL', 'BS', 'STD'].includes(this.packageType)) {
      this.tabData.splice(this.tabData.length - 1, 1)
    }
  },
  computed: {
    ...mapGetters(['packageType'])
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
        .then(() => {
          if (this.$refs.tabRef) {
            this.$refs.tabRef.checkActivationByName(this.$route.name)
          }
        })
    },
    clickTabAction (item) {
      this.routeTo({ name: item.routeTo })
    },
    activeSync () {
      this.lastSync = new Date()
    }
  },
  data () {
    return {
      tabData: [
        { field: 'vCenter', name: 'vCenter', routeTo: 'vmw-vcenter' },
        { field: 'ESXi', name: 'ESXi', routeTo: 'vmw-esxi' }
      ],
      lastSync: null
    }
  }
}
</script>
<style lang="scss">
</style>
