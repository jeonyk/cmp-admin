<script>

import TreeTransition from './TreeTransition'

export default {
  name: 'TransitionTeamTree',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    },
    defaultSelected: {
      type: Array,
      default: () => []
    },
    group: {
      type: String,
      default: undefined
    },
    includedGroupInfo: { // 외부에서 상단에 선택된 관계사/조직
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      copyData: [],
      selectedGroups: []
    }
  },
  watch: {
    visible (status) {
      if (!status) this.copyData = []
    },
    data (data) {
      this.copyData = []
      this.copyData = JSON.parse(JSON.stringify(data))
      this.eachNodeIsChecked()
    },
    defaultSelected (group) {
      this.selectedGroups = [...group]
      this.eachNodeIsChecked()
    }
  },
  created () {
    this.copyData = JSON.parse(JSON.stringify(this.data))

    // 시작시 루프돌면서 자동선택
    this.selectedGroups = [...this.defaultSelected]
    this.eachNodeIsChecked()
  },
  methods: {
    /**
     * 🟢  모든 트리노드를 순회할때 사용합니다 (탬플릿이므로 복붙해서 쓰기)
     */
    eachNodes (callback) {
      const factorial = (nodes) => {
        nodes.forEach(node => {
          if (node.children && node.children.length) factorial(node.children)
          else callback(node)
        })
      }

      this.$forceUpdate()
      factorial(this.copyData)
    },
    /**
     * 체크박스가 체크된 노드를 확인합니다
     * 자신이 속한 조직에 대한 정보는 disabled 처리로 선택하지 못하게 해둡니다
     */
    eachNodeIsChecked (selectedGroups = this.selectedGroups) {
      const groupIndexs = selectedGroups.map(g => g.groupIdx) // 선택된 groupIndex 모음

      const factorial = (nodes) => {
        nodes.forEach(node => {
          const index = groupIndexs.findIndex(i => i === node.groupIdx)
          if (index >= 0) node._checked = true
          else node._checked = false
          if (node.children && node.children.length) factorial(node.children)
        })
      }

      this.$forceUpdate()
      factorial(this.copyData)
    },
    /**
     * 노드를 열고 닫아요~
     */
    toggleNode (node, nodes) {
      // 열린 노드 빼고 모든 노드를 닫기
      if (!node._open) {
        this.closeAllChildrenNodes(nodes)
        node._open = !node._open
      } else node._open = false

      this.$forceUpdate()
    },
    /**
     * 모든 트리노드를 순회하여 노드들을 닫습니다.
     * 자식이 있는 노드에만 적용되어야 하는경우 사용합니다.
     */
    closeAllChildrenNodes (nodes) {
      nodes.forEach(node => {
        if (node.children && node.children.length) {
          node._open = false
          this.closeAllChildrenNodes(node.children)
        }
      })
    },
    /**
     * mdi 아이콘 방향 (open - up, closed - down)
     */
    toggleIcon (node) {
      const rotate = node._open ? '-open' : null
      const icon = <i class={['mdi', 'mdi-chevron-down', rotate]} />

      if (node.children && node.children.length) return icon
      else return null
    },
    setOpendIndex (item) {
      const result = []

      function factorial (nodes) {
        nodes.forEach(node => {
          if (node.children && node.children.length && node._open) {
            result.push(node.groupIdx)
            factorial(node.children)
          }
        })
      }

      if (item._open) {
        result.push(item.groupIdx)
        factorial(item.children)

        return result
      }
    },
    /**
     * 체크박스 변경 이벤트
     */
    changeEvent (status, item) {
      const { companyIdx, groupName, groupIdx } = item
      item._checked = status
      const data = { companyIdx, group: this.group, groupName, groupIdx }
      const idx = this.selectedGroups.findIndex(d => d.groupIdx === data.groupIdx)

      if (idx < 0 && status) this.selectedGroups.push(data)
      else {
        if (!status) this.selectedGroups.splice(idx, 1)
      }

      this.$forceUpdate()
      this.$emit('selectedGroups', this.selectedGroups)
      return null
    },
    renderChildren (items, depth, test) {
      return items.map(item => {
        item._depth = depth // 데이터에 depth 를 설정합니다
        const includedGroupIdx = this.includedGroupInfo.group // 외부에서 선택된 조직을 중복선택할 수 없도록 disabled 처리

        return (
          <div class={['inner-group', `-d${item._depth}`]}>
            <div
              class="depth-team"
              key={item.groupIdx}
              onClick={e => item.children ? this.toggleNode(item, items) : null}
            >
              <div class="-name">
                <div class="-check" onClick={ e => e.stopPropagation() }>
                  <el-checkbox
                    class="-check"
                    disabled={item.groupIdx === includedGroupIdx}
                    onChange={e => this.changeEvent(e, item)}
                    value={item._checked}
                  />
                </div>

                {/* `-d${item._depth} :: ` */}
                { item.groupName }

                {/* item._checked ? '✅' : null  */}
              </div>
              { this.toggleIcon(item) }
            </div>

            { this.treeTransition(item, item._depth + 1) }
          </div>
        )
      })
    },
    treeTransition (node, depth) {
      const test = node._open ? this.childrenCount(node) : node.children.length
      node._openNodesIdx = this.setOpendIndex(node) // 열린 부모, 자식들의 index 모음

      const showChild = (item) => {
        const hasChildren = item.children && item.children.length
        if (hasChildren) {
          // console.log(test, `🌸 depth:: ${depth}`)
          return (
            <div class={['depth-wrapper', `-dw${depth}`]}>
              { /* depth === 1 ? `${test}개, height: ${test * 41}` : undefined */ }
              { /* `🌸 열린 노드 :: ${node._openNodesIdx.join(', ')}` */ }
              { this.renderChildren(item.children, depth, test) }
            </div>
          )
        } else return null
      }

      return (
        <TreeTransition name="slide-fade" height={ test * 41 }>
          { node._open ? showChild(node) : null }
        </TreeTransition>
      )
    },
    /**
     * 자식 내부에 열린(_open) 노드의 갯수를 구합니다
     */
    childrenCount (node) {
      let test = 0
      if (node.children) factorial(node.children)

      function factorial (nodes) {
        nodes.map(node => {
          if (node.children) {
            test += node._open ? node.children.length : 0
            factorial(node.children)
          }
        })
      }

      return test + node.children.length
    }
  },
  render (h) {
    /**
     * @param {Array} item
     */

    const renderNodes = (nodes) => (
      nodes.map(node => {
        const hasChild = node.children && node.children.length
        const openClass = node._open ? '-open' : null
        const includedGroupIdx = this.includedGroupInfo.group // 외부에서 선택된 조직을 중복선택할 수 없도록 disabled 처리

        return (
          <li class="group-item">
            <div
              class={['first-group', openClass]}
              onClick={ e => hasChild ? this.toggleNode(node, nodes) : null }
            >
              <div class="-name">
                <div class="-check" onClick={ e => e.stopPropagation() }>
                  <el-checkbox
                    disabled={node.groupIdx === includedGroupIdx}
                    onChange={e => this.changeEvent(e, node)}
                    value={node._checked}
                  />
                </div>

                { node.groupName }
                { /* node._open ? ' ⭐️' : null */ }

                { /* node._checked ? '✅' : null */ }
                {/* ` - ${node.groupIdx} 🌸 ` */}
              </div>

              { this.toggleIcon(node) }
            </div>
            { this.treeTransition(node, 1) }
          </li>
        )
      })
    )

    return (
      <ul class="transition-team-tree">
        { renderNodes(this.copyData) }
      </ul>
    )
  }
}
</script>

<style lang="scss" scoped>
.transition-team-tree {
  .group-item{
    &:not(:last-child) {
      margin-bottom: $gap-s;
    }

    .first-group {
      border: 1px solid $purple-gray;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-right: 0;
      border-radius: 6px;
      padding: 0 $gap;
      cursor: pointer;

      &.-open {
        border-radius: 6px 6px 0 0;
        background-color: #353951;
        border: none;
        border-bottom: 1px solid $dark-slate;
      }

      .-name { line-height: 50px; }
    }

    .-name {
      box-sizing: border-box;
      display: flex;
      align-items: center;

      .-check { margin-right: $gap-s; }
    }
    .mdi {
      transition: .5s ease transform;
      &.-open { transform: rotate(180deg); }
    }
    .depth-wrapper {
      // border: 1px solid slateblue;
      box-sizing: border-box;
      overflow: hidden;

      &.-dw1 {
        border-radius: 0 0 6px 6px;
        margin-right: 0;
        background-color: #353951;
      }
    }

    .inner-group {
      // border: 1px solid skyblue;
      padding-left: $gap;

      // 내부
      .depth-team {
        overflow: hidden;
        line-height: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
      }

      &.-d1 {
        margin: 0 $gap;
        border-bottom: 1px solid $dark-slate;

        .depth-team { line-height: 40px; }
      }
      &.-d2 {
        border-bottom: 1px dotted $dark-slate;
        &:last-child { border: none }
      }
    }

  }

}
</style>
