<!--
  * 파일명 : FoldCompanyGroup.vue
  * 파일 기능 : 관계사-조직 선택 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2021-08-19
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="fold-company-group tiny-scroll"
    :style="{
      overflowY: 'auto',
      maxHeight: maxHeight
    }"
    ref="scrollContent"
  >
    <fold-panel
      ref="folders"
      v-loading="getGroupLoading"
      v-for="group in treeData"
      :key="group.groupIdx"
      :title="computedTitle(group)"
      :group-idx="group.groupIdx"
      :is-collapsed="!isPanelExpand(group.groupIdx)"
      @clickHeader="clickHeader(group)"
    >
      <g-tree
        v-if="group.children.length > 0"
        class="group-tree"
        :data="group.children"
        unique-key="groupIdx"
        :select-object="selectItem.group"
        @selected="clickGroup"
        view-line
        use-deep-children
      >
        <template #title="{ node }">
          <span
            :class="['flex-wrap', { 'is-delete': node.isDeleted, 'is-select': node.selected }]"
          >
            {{ node.groupName }}<span
              v-if="node.groupUpper > 0"
              class="__num"
            ><span v-html="'&nbsp;'" />({{ getDeepChildren(node.deepChildren, node) }})</span>
          </span>
        </template>
      </g-tree>
      <div
        v-else
        :style="{'color': '#727797'}"
      >
        <!-- 하위 조직이 없습니다. -->
        {{ $t('common.ALERT.PROJECT.062') }}
      </div>
    </fold-panel>
  </div>
</template>

<script>
import FoldPanel from '@/components/FoldPanel/FoldPanel'
import { GTree, treeFindChild } from '@sd-fe/cmp-core'

export default {
  name: 'FoldCompanyGroup',
  components: { FoldPanel, GTree },
  props: {
    treeData: {
      type: Array,
      default: () => []
    },
    selectGroup: {
      type: Object,
      default: undefined
    },
    maxHeight: {
      type: String,
      default: '70vh'
    },
    cloudType: {
      type: String,
      default: 'private'
    },
    moduleType: {
      type: String,
      default: 'nx'
    }
  },
  watch: {
    selectGroup: {
      immediate: true,
      deep: true,
      handler (newGroup) {
        if (newGroup?.company) {
          this.$nextTick(function () {
            this.autoScroll()
          })
        }
        if (newGroup?.group) this.selectItem.group = { ...newGroup.group }
      }
    }
  },
  methods: {
    /**
     * folder title 반환
     */
    computedTitle (group) {
      const length = this.getDeepChildren(group.deepChildren, group)
      return `${group.groupName} (${length})`
    },
    /**
     * panel의 열고 닫힘을 설정합니다.
     */
    isPanelExpand (groupIdx) {
      if (!this.selectGroup?.company) return
      return this.selectGroup?.company?.groupIdx === groupIdx
    },
    /**
     * 펼쳐진 영역으로 자동 스크롤
     */
    autoScroll () {
      const selectEl = this.$el.querySelector('.fold-panel.-expand')
      const scrollTop = selectEl.getBoundingClientRect().top - 115
      this.$el.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    },
    /**
     * folder 모두 닫기
     */
    collapseAll () {
      this.$refs.folders.forEach(folder => {
        folder.collapsed = true
        folder.selected = false
        return folder
      })
    },
    /**
     * folder header 클릭 시 실행
     */
    clickHeader (group) {
      this.$refs.folders.forEach(folder => {
        if (folder.groupIdx !== group.groupIdx) {
          folder.collapsed = true
          folder.selected = false
        }
        return folder
      })
      this.clickGroup(group, true)
    },
    /**
     * 트리에서 그룹 선택시 발생 이벤트
     */
    clickGroup (param, headerClick = false) {
      if (!param) return

      if (!headerClick) {
        this.$refs.folders.forEach(folder => {
          folder.selected = false
          return folder
        })
      }

      this.selectItem = {}
      this.selectItem.group = param
      this.selectItem.company = Object.assign({
        groupName: param.companyName,
        groupIdx: param.companyIdx,
        groupCode: param.companyCode
      }, {})
      console.log('@clickGroup: selectItem:', this.selectItem)
      this.$emit('change', param)
    },
    getDeepChildren (groups, group) {
      let childrenGrpPjs = 0
      if (groups) {
        groups.map(item => {
          if (item.groupProject.length > 0) {
            item.groupProject.map(pj => {
              if (!pj.isDeleted && pj.moduleType?.toLowerCase() === this.moduleType) childrenGrpPjs++
            })
          }
        })
      }
      let groupPjs = 0
      if (group?.groupProject?.length > 0) {
        group.groupProject.map(pj => {
          if (!pj.isDeleted && pj.moduleType?.toLowerCase() === this.moduleType) groupPjs++
        })
      }
      const projectsCnt = childrenGrpPjs + groupPjs
      return this.$t('common.TERMS.count', { n: projectsCnt }) // n개
    },
    /**
     * 선택한 그룹이 있는 panel을 열리게 세팅합니다.
     * @param {Object} selectedGroup 선택한 그룹
     */
    openFoldPanel (selectedGroup) {
      if (!selectedGroup) return

      let idx
      for (let i = 0; i < this.treeData.length; i++) {
        if (this.treeData[i].groupIdx === selectedGroup.groupIdx) {
          idx = i
          break
        } else if (this.treeData[i].children) {
          if (treeFindChild(this.treeData[i].children, 'groupIdx', selectedGroup.groupIdx)) {
            idx = i
            break
          }
        }
      }

      if (idx !== undefined) this.$refs.folders[idx].collapsed = false
    }
  },
  data () {
    return {
      getGroupLoading: false,
      selectItem: { // 트리에서 선택한 관계사/그룹
        company: null,
        group: null
      }
    }
  }
}
</script>

<style lang="scss">
  .fold-company-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    .group-tree {
      .node-title .tree-label-text.-selected::before {
        display: none;
      }
      .flex-wrap {
        display: flex;
        align-items: center;
        .__num {
          // margin-left: 3px;
        }
        // > i.mdi-check {
        //   color: $main-red;
        //   height: 16px;
        //   &::before {
        //     margin: -4px 0 0 10px;
        //     font-size: 15px;
        //   }
        // }
      }
      .tree-wrapper {
        .tree-node {
          > .node-item-label {
            font-weight: normal;
            > .node-title {
              > .title-area {
                .tree-label-text {
                  &.-selected {
                    color: #7681FF;
                    text-decoration: underline;
                    text-underline-offset: 0.3em;
                  }
                }
              }
            }
          }
          > .node-item-child {
            &.-line {
              > .tree-node {
                &::before {
                  border-left: 1px dashed #727797;
                }
                .node-item-label {
                  > .node-title {
                    > .title-area {
                      &::before {
                        border-top: 1px dashed #727797;
                      }
                      .tree-label-text {
                        padding-left: 8px;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
</style>
