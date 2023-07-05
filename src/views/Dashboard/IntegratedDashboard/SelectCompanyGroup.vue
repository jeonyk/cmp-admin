<!--
  * 파일명 : SelectCompanyGroup.vue
  * 파일 기능 : 관계사-조직 선택 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2021-08-19
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="select-company-group tiny-scroll"
    :style="{
      overflowY: 'auto',
      maxHeight: maxHeight
    }"
    ref="scrollContent"
  >
    <fold-panel
      v-loading="getGroupLoading"
      v-for="group in treeData"
      :key="group.groupIdx"
      :custom-id="group.groupIdx"
      :title="group.groupName"
      :data="group"
      :is-collapsed="expandUppers?false:!isPanelExpand(group.groupIdx)"
      use-selection
      @selected="groupSelection"
      :init-selection="initPanel"
    >
      <g-tree
        class="group-tree"
        :data="group.children ? group.children : []"
        unique-key="groupIdx"
        :select-object="selectItem.group"
        @selected="clickGroup(...arguments, group)"
        view-line
        :init-open="expandChilds"
        :init-selection="initTree"
      >
        <template #title="{ node }">
          <el-tooltip
            v-if="orgTooltip && node.groupUpperName"
            effect="light"
            placement="left"
            :content="node.groupUpperName"
          >
            <span
              v-if="node.selected"
              class="flex-wrap"
            >
              {{ node.groupName }}
              <i class="mdi mdi-check" />
            </span>
            <span v-else>
              {{ node.groupName }}
            </span>
          </el-tooltip>
          <template v-else>
            <span
              v-if="node.selected"
              class="flex-wrap"
            >
              {{ node.groupName }}
              <i class="mdi mdi-check" />
            </span>
            <span v-else>
              {{ node.groupName }}
            </span>
          </template>
        </template>
      </g-tree>
    </fold-panel>
  </div>
</template>

<script>
import FoldPanel from '@/components/FoldPanel/FoldPanel'
import { GTree } from '@sd-fe/cmp-core'

export default {
  name: 'SelectCompanyGroup',
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
    orgTooltip: {
      type: Boolean,
      default: false
    },
    expandUppers: {
      type: Boolean,
      default: false
    },
    expandChilds: {
      type: Boolean,
      default: false
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
            if (newGroup?.group) this.selectItem.group = { ...newGroup.group }
          })
        }
      }
    }
  },
  methods: {
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
      const scrollTop = selectEl?.getBoundingClientRect().top - 115
      this.$el.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    },
    /**
     * 트리에서 그룹 선택시 발생 이벤트
     */
    clickGroup (param, company) {
      if (param) {
        this.initPanel = true
        this.selectItem.group = param
        this.selectItem.company = Object.assign({
          groupName: company.groupName,
          groupIdx: company.groupIdx,
          groupCode: company.companyCode
        }, {})
        this.$emit('change', this.selectItem)
      } else this.initPanel = false
    },
    groupSelection (selection) {
      if (selection) {
        this.initTree = true
        this.selectItem.group = selection
        this.selectItem.company = {}
        this.$emit('change', this.selectItem)
      } else this.initTree = false
    }

  },
  data () {
    return {
      getGroupLoading: false,
      selectItem: { // 트리에서 선택한 관계사/그룹
        company: null,
        group: null
      },
      initPanel: false,
      initTree: false
    }
  }
}
</script>

<style lang="scss">
  .select-company-group {
    display: flex;
    flex-direction: column;
    gap: $gap;
    .group-tree {
      .node-title .tree-label-text.-selected::before {
        display: none;
      }
      .flex-wrap {
        display: flex;
        align-items: center;
        > i.mdi-check {
          color: $main-red;
          margin: -12px 0 0 5px;
          height: 16px;
          &::before {
            font-size: 15px;
          }
        }
      }
    }
  }
</style>
