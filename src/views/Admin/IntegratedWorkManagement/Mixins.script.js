export default {
  inject: ['getTreeData'],
  computed: {
    /**
     * [서비스 정보] TreeData inject
     * Vue 2 에선 이렇게 가져와야 하는듯 ...
     */
    treeData () {
      return this.getTreeData()
    }
  }
}
