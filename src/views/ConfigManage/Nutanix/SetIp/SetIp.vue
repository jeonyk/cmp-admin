<!--
  * 파일명 : SetIp.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 ip관리대장 자잘한 수정
 -->

<template>
  <!-- <total-count :total-count="totalCnt" /> -->

  <div class="set-ip-body">
    <dashboard-panel
      class="body-panel -left"
      :title="$v('네트워크 카테고리')"
      :padding-top="0"
    >
      <div
        class="side-tree-area"
        v-loading="isTreeData"
      >
        <g-tree
          :data="treeData"
          class="side-tree"
          @selected="selectTreeItem"
          :view-line="true"
          :selectable-all-item="true"
          :select-object.sync="selectedTreeItem"
          unique-key="cateIdx"
        >
          <template #title="{node}">
            {{ node.cateName }}
          </template>
        </g-tree>
      </div>
    </dashboard-panel>
    <!-- 카테고리 트리 -->

    <router-view
      :ip-category-idx="ipCategoryIdx"
      :selected-cate="selectedTreeItem"
    />
  </div>
</template>
<script>
import API, { GTree, DashboardPanel, treeFindChild } from '@sd-fe/cmp-core'

export default {
  name: 'SetIp',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree
  },
  mounted () {
    this.init()
  },
  methods: {
    async init () {
      await this.getIpCategoryTree()
      if (this.$route.query.ipCategoryIdx !== undefined || this.$route.query.ipCategoryIdx !== null) {
        this.ipCategoryIdx = Number(this.$route.query.ipCategoryIdx)
        this.selectedTreeItem = treeFindChild(this.treeData, 'cateIdx', this.ipCategoryIdx)
      }
    },
    async getIpCategoryTree () {
      try {
        this.isTreeData = true
        const response = await API.network.getNetworkCategoryTree()
        if (!response) return
        this.treeData = response
      } catch (error) {
        this.isTreeData = false
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.treeData = []
        this.$alert(message)

        throw error
      } finally {
        this.isTreeData = false
      }
    },
    rowSelect (selected, field) {
      if (field === 'element') this.selectedRow.element = selected
      else this.selectedRow.vlan = selected
    },
    initGrid (grid) {
      this.grid = grid
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectTreeItem (param) {
      this.selectedTreeItem = param
      this.category = param.cateName
      this.ipCategoryIdx = param.cateIdx
      // console.log('selectedTreeItem : ', this.selectedTreeItem)
      this.routeTo({
        name: 'set-ip-list',
        query: { category: this.selectedTreeItem.cateName, ipCategoryIdx: this.ipCategoryIdx }
      })
    },
    // ======== 네트워크 카테고리 관리 모달 관련 ========
    /**
     * 네트워크 카테고리 모달을 닫을 때 발생 이벤트 입니다.
     */
    async refreshTree () {
      await this.getIpCategoryTree()
    }

  },
  data () {
    return {
      ipCategoryIdx: undefined,
      selectedTreeItem: null,
      isTreeData: false,
      treeData: [],
      tableData: []
    }
  }
}
</script>
<style lang="scss">
  .set-ip {
    &-body {
      display: flex;
      align-items: stretch;
      margin-top: $gap-m;
      > .body-panel {
        &.-right {
          flex: 5 1 auto;
          margin-left: $gap * 2;
          min-width: calc(100% - 480px);

          .network-contents {
            position: relative;
            > .button-area {
              position: absolute;
              top: -10px;
              right: 0;
            }
            & + .network-contents {
              margin-top: $gap-m;
            }

          }
        }
      }
    }
  }
</style>
