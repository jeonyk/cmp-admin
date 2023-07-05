<!--
  * 파일명 : SetProject.vue
  * 파일 기능 : VMware > 구성관리 > Storage(vSAN)
  * 작성자 : 염창윤
  * License By Shinsegae I&C
 -->

<template>
  <g-tab
    :data="tabData"
    @click="clickTab"
  >
    <template #iscsi>
      <router-view />
    </template>
  </g-tab>
</template>
<script>
import { mapState } from 'vuex'

export default {
  name: 'SetProject',
  created () {
    // console.log('userPermLevel:', this.user.userPermLevel)
    // userPermLevel 1: 운영 관리자
    // userPermLevel 0: 최고 관리자
    // if (this.user.userPermLevel !== 0) {
    //   this.tabData.splice(1, 1)
    // }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    clickTab (item) {
      this.$router.push({ name: item.routeTo })
    }
  },
  data () {
    return {
      tabData: [
        { field: 'iscsi', name: 'iSCSI', routeTo: 'vmware-storage-vsan-iscsi-list' }
      ]
    }
  }
}
</script>
