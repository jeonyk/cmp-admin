<!--
  * 파일명 : SetAccount.vue
  * 파일 기능 : 어드민 관리 - 계정 관리 Wrapper
  * 작성자 : 김예담
  * 최종 작성일 : 2020-08-24
  * License By Shinsegae I&C
  * 2020-08-24 fix: g-tab : 라우터에 따른 active 활성화 컴포넌트에 설정
 -->

<template>
  <div class="set-account">
    <g-tab
      :data="tabData"
      @click="clickTabAction"
    >
      <template #user>
        <router-view />
      </template>

      <template #admin>
        <router-view />
      </template>
      <template #ad>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'SetAccount',
  created () {
    if (this.packageType === 'PL') {
      this.tabData.shift()
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
    }
  },
  data () {
    return {
      tabData: [
        { field: 'user', name: '사용자 계정', routeTo: 'set-account-user', keyPath: 'admin.ACCOUNT.user' },
        { field: 'admin', name: '운영 관리자 계정', routeTo: 'set-account-admin', keyPath: 'admin.ACCOUNT.manager' },
        { field: 'ad', name: 'AD 사용자 계정', routeTo: 'set-account-ad', keyPath: 'AD 계정' }
      ]
    }
  }
}
</script>
