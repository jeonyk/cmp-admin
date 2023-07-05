<template>
  <div class="network-cate-tree">
    <g-tree
      v-if="true"
      :data="treeData"
      class="cate-tree"
      :view-line="true"
      :selectable-all-item="true"
      :select-object.sync="selectedTreeItem"
      unique-key="cateIdx"
      @selected="handleSelectTree"
    >
      <template #title="{node}">
        {{ node.cateName }}
      </template>
    </g-tree>
    <div
      v-else
      class="tree_is-empty"
    >
      <span class="text-tree_is-empty">데이터 센터를 등록해 주세요.</span>
    </div>
  </div>
</template>

<script>
import API, { GTree } from '@sd-fe/cmp-core'
export default {
  async created () {
    this.treeData = await this.getIpCategoryTree()
  },
  components: {
    GTree
  },
  props: {
    initCateList: {
      type: [Object, null],
      default () {
        return null
      }
    }
  },
  watch: {
    // 만약 업데이트가 되면 true
    initCateList: {
      deep: true,
      async handler (val) {
        if (val === null) { return }

        if (val.isDeleted && val.isDeleted === true) {
          const isSuccessReFresh = await this.refreshTree()
          if (isSuccessReFresh) {
            const parentIdx = this.selectedTreeItem.upperCategoryIdx
            if (parentIdx !== 0) {
              this.selectedTreeItem = this.findArrToSctNode(parentIdx)
            } else this.selectedTreeItem = {}

            this.$emit('select', this.selectedTreeItem)
          }
        } else if (val.isAdded && val.isAdded === true) {
          const isSuccessReFresh = await this.refreshTree()
          if (isSuccessReFresh) {
            if (val?.isDatacenter) {
              this.selectedTreeItem = this.treeData.filter(el => val.codeValue === el.cateName)[0]
            } else {
              const selectedCateIdx = this.selectedTreeItem.cateIdx
              const resultNode = this.findArrToSctNode(selectedCateIdx)
              this.selectedTreeItem = this.findTreeChild(resultNode, val.codeValue)
            }
            this.$emit('select', this.selectedTreeItem)
          }
        } else if (val.isUpdated && val.isUpdated === true) {
          const isSuccessReFresh = await this.refreshTree()
          if (isSuccessReFresh) {
            const selectedCateIdx = this.selectedTreeItem.cateIdx
            this.selectedTreeItem = this.findArrToSctNode(selectedCateIdx)
            this.$emit('select', this.selectedTreeItem)
          }
        }
      }
    }
  },
  methods: {
    /** EVENT_HANDLER 트리에 아이템을 선택 */
    handleSelectTree (item) {
      this.selectedTreeItem = item
      this.$emit('select', item)
    },
    findArrToSctNode (selectedCateIdx) {
      this.selectedTreeItem = null
      let fNode = {}
      for (const item of this.treeData) {
        const result = this.findTreeChildByIdx(item, selectedCateIdx)
        if (result) {
          fNode = result
          break
        }
      }
      return fNode
    },
    findTreeChild (node, name) {
      if (node.cateName === name) {
        console.log(node)
        return node
      }
      if (node?.children) {
        for (const item of node?.children) {
          console.log(item)
          const result = this.findTreeChild(item, name)
          if (result !== null) {
            return result
          }
        }
      }
      return null
    },

    findTreeChildByIdx (node, idx) {
      if (node.cateIdx === idx) {
        return node
      }
      if (node?.children) {
        for (const item of node?.children) {
          const result = this.findTreeChildByIdx(item, idx)
          if (result !== null) {
            return result
          }
        }
      }
      return null
    },
    async getIpCategoryTree () {
      try {
        this.isLoadingTree = true
        const response = await API.network.getNetworkCategoryTree()
        // const response = []

        return response || []
      } catch (error) {
        this.isLoadingTree = false
        console.error(error)
        const message =
          error.response && error.response.data
            ? error.response.data.message
            : error.message
        this.treeData = []
        this.$alert(message)

        throw error
      } finally {
        this.isLoadingTree = false
      }
    },
    /**
     * 네트워크 카테고리 모달을 닫을 때 발생 이벤트 입니다.
     */
    async refreshTree () {
      this.treeData = await this.getIpCategoryTree()
      return true
    }
  },
  data () {
    return {
      treeData: [],
      isLoadingTree: false,
      selectedTreeItem: {}
    }
  }
}
</script>
<style lang="scss" scoped>
.network-cate-tree {
  display: flex;
  width:100%;
  height: 100%;
  font-size: 16px;
  .cate-tree {
    display: inline;
  }
  .tree_is-empty {
    display: flex;
    width: 100%;
    color: $gray;
    text-align: center;
    justify-self: center;
    align-items: center;
    .text-tree_is-empty {
      width:100%;
    }
  }
}
</style>
