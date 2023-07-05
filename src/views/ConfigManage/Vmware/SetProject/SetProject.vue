<!--
  * 파일명 : SetProject.vue
  * 파일 기능 : 구성관리 > 프로젝트 관리
  * 작성자 : 염창윤
  * 최종 작성일 : 2021-08-23
  * License By Shinsegae I&C
 -->

<template>
  <div class="set-project">
    <g-tab
      :data="shortlyCloud === 'vmw' && user.userPermLevel === 0 ? tabData : publicTabData"
      @click="clickTab"
    >
      <template #manage-project>
        <router-view />
      </template>

      <template #resource-operation>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import { mapState } from 'vuex'

export default {
  name: 'SetProject',
  created () {
    console.log('userPermLevel:', this.user.userPermLevel)
    // userPermLevel 1: 운영 관리자
    // userPermLevel 0: 최고 관리자
    // if (this.user.userPermLevel !== 0) {
    //   this.tabData.splice(1, 1)
    // }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      shortlyCloud: state => state.cloud.shortlyCloud
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
        { field: 'manage-project', name: '프로젝트', keyPath: 'bc.MANAGE.manageProject', routeTo: 'set-project-manage-project-vmw' },
        { field: 'resource-operation', name: '자원 운용', keyPath: 'bc.MANAGE.resourceOperation', routeTo: 'set-project-resource-operation-vmw' }
      ],
      publicTabData: [
        { field: 'manage-project', name: '프로젝트 관리', keyPath: 'main.LAYOUT.mngProj', routeTo: 'set-project-manage-project-vmw' }
      ]
    }
  }
}
</script>
