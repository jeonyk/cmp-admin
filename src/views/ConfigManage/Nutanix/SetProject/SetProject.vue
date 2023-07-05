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
      :data="user.userPermLevel === 0 && selectedTabByCsp"
      @click="clickTab"
    >
      <template #name="{ row }">
        {{ row.name }}
      </template>
      <template #manage-project>
        <router-view />
      </template>

      <template #list>
        <router-view />
      </template>

      <template #aws-list>
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
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetProject',
  created () {
    console.log('userPermLevel:', this.user.userPermLevel)
    // userPermLevel 1: 운영 관리자
    // userPermLevel 0: 최고 관리자
    // if (this.user.userPermLevel !== 0) {
    //   this.tabData.splice(1, 1)
    // }
    this.getWaitingProjectCount()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      shortlyCloud: state => state.cloud.shortlyCloud
    }),
    selectedTabByCsp () {
      return {
        nx: [
          { field: 'manage-project', name: this.$v('프로젝트'), routeTo: 'set-project-manage-project' },
          { field: 'list', name: this.$v('승인대기') + this.waitingProjectCount, routeTo: 'set-project-list' },
          { field: 'resource-operation', name: this.$v('자원 운용'), routeTo: 'set-project-resource-operation' }
        ],
        vmw: [
          { field: 'manage-project', name: this.$v('프로젝트 관리'), routeTo: 'set-project-manage-project-vmw' },
          { field: 'list', name: this.$v('승인대기') + this.waitingProjectCount, routeTo: 'set-project-list-vmw' },
          { field: 'resource-operation', name: '자원 운용', keyPath: 'bc.MANAGE.resourceOperation', routeTo: 'set-project-resource-operation-vmw' }
        ],
        aws: [
          { field: 'manage-project', name: this.$v('프로젝트 관리'), routeTo: 'set-project-manage-project' },
          { field: 'aws-list', name: this.$v('승인대기') + this.waitingProjectCount, keyPath: '승인대기', routeTo: 'set-aws-project-list' }
        ]
      }[this.shortlyCloud]
    }
  },
  methods: {
    async getWaitingProjectCount () {
      const count = await API.iam.getWaitingProjectCount({
        moduleType: this.projectCsp[this.shortlyCloud]
      })

      this.waitingProjectCount = `(${count || 0})`
    },
    clickTab (item) {
      this.$router.push({ name: item.routeTo })
    }
  },
  data () {
    return {
      projectCsp: {
        nx: 'NX',
        vmw: 'VMWARE',
        aws: 'AWS'
      },
      waitingProjectCount: '(0)'
    }
  }
}
</script>
