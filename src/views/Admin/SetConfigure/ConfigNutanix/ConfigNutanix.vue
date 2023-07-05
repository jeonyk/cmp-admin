<!--
  * 파일명 : ConfigNutanix.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2020-08-24
  * License By Shinsegae I&C
  * 2020-08-24 Merge commit '1d2b3d902a02e8910dec191b80b03dbaa651dc5a' into publish/task-server
 -->

<template>
  <div class="config-project">
    <g-tab
      :data="tabData"
      @click="clickTabAction"
    >
      <template #central>
        <router-view />
      </template>

      <template #element>
        <router-view />
      </template>

      <template #era>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ConfigNutanix',
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
        { field: 'central', name: 'Central', routeTo: 'nutanix-central' },
        { field: 'element', name: 'Element', routeTo: 'nutanix-element' },
        { field: 'era', name: 'Era', routeTo: 'nutanix-era' }
      ],
      lastSync: null
    }
  }
}
</script>
<style lang="scss">
  .config-project {
    .sync-state {
      // position: absolute;
      // bottom: 0;
      // right: 0;
    }
  }
</style>
