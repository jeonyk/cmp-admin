<template>
  <section class="integrated-work-management">
    <g-tab
      :data="tabs"
      @click="moveTab"
    >
      <template
        v-for="tab in tabs"
        v-slot:[tab.field]
      >
        <router-view
          :key="tab.field"
        />
      </template>
    </g-tab>
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'IntegratedWorkManagement',
  provide () {
    return { getTreeData: () => this.treeData }
  },
  created () {
    this.setTreeData()
  },
  methods: {
    /**
     * [서비스 정보] 트리데이터 가공
     * @return {null}
     */
    async setTreeData () {
      const roles = await API.iam.getRoleList({ upperRoleIdxList: 0 })

      this.treeData = this.treeData.map(item1 => {
        item1.children.forEach(item2 => {
          item2.children = roles.map(({ roleIdx, roleName }) => ({ field: roleIdx, title: roleName }))
        })
        return item1
      })
    },
    moveTab (tab) {
      this.$router.push({ name: tab.routeTo })
    }
  },
  data: () => ({
    tabs: [
      { field: 'set-workflow', name: '워크플로우 설정', routeTo: 'integrated-set-workflow' },
      { field: 'set-template', name: '보고서 템플릿', routeTo: 'integrated-set-template' }
    ],
    treeData: [ // [서비스 정보] 트리 데이터 (고정 값 - 하드코딩)
      {
        field: 'private',
        title: 'Private',
        children: [
          { field: 'new', title: '신규' },
          { field: 'change', title: '변경' },
          { field: 'delete', title: '삭제' },
          { field: 'urgent', title: '긴급' }
        ]
      },

      {
        field: 'public',
        title: 'Public',
        children: [
          { field: 'new', title: '신규' },
          { field: 'change', title: '변경' },
          { field: 'delete', title: '삭제' },
          { field: 'urgent', title: '긴급' }
        ]
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.integrated-work-management {

}
</style>
