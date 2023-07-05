<!--
  * 파일명 : TaskLists.vue
  * 파일 기능 : [업무] 전체를 감싸는 페이지
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-10-28
  * License By Shinsegae I&C
  * 2020-10-28 fix: 사전협의, 한 일, 결재함 구조 수정 및 사용하지 않는 파일 제거
 -->

<template>
  <div class="admin-task">
    <g-tab
      :data="taskTabData"
      @click="clickTabAction"
    >
      <template #status>
        <router-view />
      </template>
      <template #conference>
        <router-view />
      </template>
      <template #done>
        <router-view />
      </template>
      <template #todo>
        <router-view />
      </template>
      <template #approved>
        <router-view />
      </template>
    </g-tab>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'TaskLists',
  async created () {
    // await this.getApprovalStatus() // ❌
    await this.getFilteredData()
    await this.setTabActive()
  },
  watch: {
    '$route' (to, from) {
      if (to !== from) {
        this.setTabActive()
      }
    }
  },
  methods: {
    async getApprovalStatus () {
      try {
        const response = await API.work.getApprovalSetting()
        if (response) this.approvalStatus = response.useYn
        // this.approvalStatus = false // 결재 미결재 false 사용 테스트
      } catch (error) {
        console.log(error)
      }
    },
    getFilteredData () {
      if (!this.approvalStatus) this.taskTabData = this.taskTabData.filter(data => data.field !== 'approved')
    },
    routeTo (to) {
      this.$router.push(to)
    },
    setTabActive () {
      this.taskTabData = this.taskTabData.map(item => {
        item.isActive = false
        return item
      })

      const routepath = this.$route.path

      for (let i = 0; i < this.taskTabData.length; i++) {
        const field = this.taskTabData[i].field.toLowerCase()

        if (routepath.includes(field)) {
          this.taskTabData[i].isActive = true
          return
        }
      }
    },
    clickTabAction (item) {
      this.routeTo({ name: item.routeTo, query: { type: 'ticket', page: 1 } })
    }
  },
  data () {
    return {
      approvalStatus: true,
      taskTabData: [
        { field: 'status', name: this.$v('업무 현황판'), routeTo: 'task-status', isActive: true },
        { field: 'conference', name: this.$v('사전협의'), routeTo: 'task-conference' },
        { field: 'todo', name: this.$v('할 일'), routeTo: 'task-todo' },
        { field: 'done', name: this.$v('한 일'), routeTo: 'task-done' },
        { field: 'approved', name: this.$v('결재함'), routeTo: 'task-approved' }
      ]
    }
  }
}
</script>
