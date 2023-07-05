<!--
  * 파일명 : g-tree.vue
  * 파일 기능 : [공통컴포넌트] tree 컴포넌트
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 1. g-tree: Dropdown chevron 아이콘 위아래 표시 변경 2. 빌링과금모델:트리 메뉴 fold-icon 유형 변경
 -->

<script>
export default {
  name: 'GTree',
  props: {
    data: { // 트리에 뿌려질 데이터 Array
      type: Array,
      default () {
        return []
      }
    },
    multiFoldable: { // 펼쳐진 노드가 여러개가 가능하면 true, 아니면 false
      type: Boolean,
      default: true
    },
    clickable: {
      type: Boolean,
      default: true
    },
    useCheckbox: {
      type: Boolean,
      default: false
    },
    foldIcon: { // 토글 버튼 아이콘
      type: String,
      default: 'menu',
      validator (value) {
        return ['menu', 'chevron'].includes(value)
      }
    },
    parentSelectStyle: { // 클릭한 부모 요소에도 스타일을 주고 싶을 때 사용
      type: Boolean,
      default: false
    },
    viewLine: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'tree',
      validator (value) {
        return ['tree', 'menu'].includes(value)
      }
    },
    selectable: { // 단순 조회성 트리에서는 false (선택 기능 무)
      type: Boolean,
      default: true
    },
    selectableAllItem: { // (관계사 제외)전체 데이터를 선택할 수 있는지? false면 가장 마지막 children 만 선택 가능합니다.
      type: Boolean,
      default: true
    },
    selectableCompany: { // 관계사도 선택 가능한지...
      type: Boolean,
      default: false
    },
    selectObject: {
      type: Object,
      default: () => {}
    },
    uniqueKey: {
      type: String,
      default: 'idx'
    },
    initOpen: {
      type: Boolean,
      default: false
    },
    rootParent: { // 최상단 부모를 추가할 때 사용합니다.
      type: Object,
      default: undefined
    },
    useDeepChildren: {
      type: Boolean,
      default: false
    },
    noRootToggle: { // 루트 아이템도 토글되지 않도록 설정 > 미터링 > 서버 현황
      type: Boolean,
      required: false,
      default: false
    }
  },
  watch: {
    data (newVal) {
      this.copyNodeData(newVal)
    },
    selectObject: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          if (Object.keys(newVal).length && this.nodes) this.setInitSelectItem(newVal)
        }
      }
    }
  },
  created () {
    this.copyNodeData(this.data)
  },
  methods: {
    copyNodeData (nodes) {
      const setInitNode = (init) => {
        const copyData = JSON.parse(JSON.stringify(init))
        if (this.rootParent === undefined) return copyData
        else {
          const rootParent = JSON.parse(JSON.stringify(this.rootParent))
          rootParent.children = copyData
          return [{ ...rootParent }]
        }
      }
      this.nodes = setInitNode(nodes)

      this.setAddProperties(this.nodes)
      // this.setTreeLevel(this.nodes)
      this.$forceUpdate()

      if (this.initOpen) this.closeAllNodes(this.nodes, true)
      else this.closeAllNodes(this.nodes, false)
    },
    /**
     * 트리 데이터에 추가 프로퍼티를 세팅합니다.
     */
    setAddProperties (nodes, parentNode = null) {
      nodes = nodes.map(node => {
        node.parentNode = parentNode
        this.$set(node, 'selected', false)
        this.$set(node, 'detail', false)
        if (this.useCheckbox) this.$set(node, 'isChecked', false)

        if (node.children?.length) this.setAddProperties(node.children, node)

        return node
      })
    },
    /**
     * 초기에 이미 선택된 아이템이 있다면, 트리에서 그 아이템을 찾은 후 상위 트리를 모두 Open 해줍니다.
     */
    setInitSelectItem (initItem) {
      let selectItem
      for (let i = 0; i < this.nodes.length; i++) {
        if (this.treeFindChild(this.nodes[i], initItem[this.uniqueKey], this.uniqueKey)) {
          selectItem = this.treeFindChild(this.nodes[i], initItem[this.uniqueKey], this.uniqueKey)
          break
        }
      }

      if (selectItem) {
        this.nodeParentsOpen(selectItem)
        selectItem.selected = true
      }
      this.$forceUpdate()
    },
    /**
     * 노드의 부모 트리의 열기
     */
    nodeParentsOpen (node) {
      if (node.parentNode) {
        node.parentNode.isOpen = true
        this.nodeParentsOpen(node.parentNode)
      } else return false
    },
    /**
     * 트리가 세팅될 때, depth에 따라 level값을 붙여줍니다. (level: 0 ~)
     */
    setTreeLevel (nodes) {
      nodes.forEach(node => {
        const treeLevel = node.level ? node.level : 0
        node.level = treeLevel + 1
        if (node.children?.length) this.setTreeLevel(node.children)
      })
    },
    routeTo (to) {
      this.$router.push(to)
    },
    toggleNode (nodes, item, state) {
      if (this.multiFoldable) {
        item.isOpen = !item.isOpen
      } else {
        nodes.forEach(node => {
          if (this.treeFindChild(node, item.id)) node.isOpen = !state
          else node.isOpen = false
        })
      }
      this.$forceUpdate()
    },
    /**
     * tree 데이터를 순회하며 동일 id를 가진 tree를 찾습니다.
     * @param {Object} element 검사 할 객체
     * @param {string} matchingId 찾을 ID 값
     * @param {string} key 찾을 ID의 key 값
     */
    treeFindChild (element, matchingId, key = 'id') {
      if (element[key] === matchingId) return element
      else if (element.children && element.children.length > 0) {
        let result = null
        for (let i = 0; !result && i < element.children.length; i++) result = this.treeFindChild(element.children[i], matchingId, key)
        return result
      }
      return null
    },
    /**
     * 잔체 트리의 selected = false로 세팅
     */
    setTreeSelectDefault (nodes) {
      nodes.forEach(node => {
        node.selected = false
        if (node.children?.length) this.setTreeSelectDefault(node.children)
      })
    },
    /**
     * tree 아이템을 선택했을 때, 발생하는 이벤트입니다..
     * @param {Object} item 선택 아이템
     */
    selectItem (nodes, item) {
      if (item.isRootParent && !this.noRootToggle) return this.toggleNode(nodes, item, item.isOpen)

      if (!this.selectable) return this.toggleNode(nodes, item, item.isOpen)

      if (this.selectableAllItem) { // 전체 depth 다 선택 가능 하면...
        if (item.children?.length && item.groupUpper === 0 && !this.selectableCompany) this.toggleNode(nodes, item, item.isOpen)
        else {
          this.setTreeSelectDefault(this.nodes)
          item.selected = true
          this.$emit('selected', item)
        }
      } else {
        if (item.children?.length) this.toggleNode(nodes, item, item.isOpen)
        else {
          this.setTreeSelectDefault(this.nodes)
          item.selected = true
          this.$emit('selected', item)
        }
      }
      this.$forceUpdate()
    },

    // 모든 노드 상태 설정합니다.
    closeAllNodes (nodes, status) {
      nodes = nodes.map(item => {
        if (!item.isRootParent) {
          item.isOpen = status
          item.selected = false
        } else item.isOpen = true // root-parent의 경우, tree가 열리는게 기본
        if (item.children?.length) {
          this.closeAllNodes(item.children)
        }
      })

      this.$forceUpdate()
      return nodes
    },

    toggleCheckbox (item, state) {
      if (Array.isArray(item)) {
        item.forEach(child => {
          child.isChecked = !state
          if (child.children?.length) this.toggleCheckbox(child.children, state)
        })
      } else {
        item.isChecked = !state
        if (item.children) this.toggleCheckbox(item.children, state)
      }
      this.$forceUpdate()
    },

    toggleNodedetail (node) {
      this.nodes = this.nodes.map(node => {
        return {
          ...node,
          detail: false
        }
      })
    },
    /**
     * 내부에 children 프로퍼티는 모두 제거하고 모든 내부 조직을 각 부모에게 할당합니다.
     * @param {Array} nodes
     * @param {String} groupName 현재 어떤 node를 보고있는지 확인하기 위해 씁니다. 필수는 아니에요.
     * @return {Array} 해당 모든 children을 가진 배열을 return 합니다.
     */
    getAllChildrenData (nodes, groupName) {
      const result = []
      if (nodes.children) factorial(nodes.children)

      function factorial (item) {
        return item.map(node => {
          if (node.children) {
            const nodeCopy = { ...node }
            delete nodeCopy.children
            result.push(nodeCopy)

            return factorial(node.children)
          } else {
            result.push(node)
          }
        })
      }

      // console.log(result, groupName)
      return result
    }
  },

  render (h) {
    const renderNode = (node, parent = null) => {
      return node.map(item => {
        if (this.useDeepChildren && !item.deepChildren) {
          // deepchidren 이라는 key 가 없을때만 실행합니다 > 아니면 계속 무한루프 돌아요..!!!!
          const getAllchildrenData = this.getAllChildrenData(item, item.groupName)
          item.deepChildren = getAllchildrenData // 내부에 몇개의 children이 있는지 알려줍니다.
        }

        item.parentNode = parent
        // let expandArea
        const nodeExpandState = item.isOpen ? '-opened' : '-closed' // 노드 열고 닫음
        const selected = !this.useCheckbox ? (
          (
            item && this.selectObject &&
            this.selectObject[this.uniqueKey] !== undefined &&
            this.selectObject[this.uniqueKey] === item[this.uniqueKey]
          ) ? '-selected' : (item && !this.selectObject && item.selected ? '-selected' : '')
        ) : '' // 아이템 선택 여부

        const isChecked = item.isChecked // 체크박스 사용시, 체크 여부

        const treeLine = this.viewLine && item.children?.length ? '-line' : ''

        const nodeChildren = (node) => {
          return (
            <li
              class={['node-item-child', nodeExpandState, treeLine]}
            >
              { renderNode(node.children, node) }
            </li>
          )
        }

        const nodeCheckbox = ( // 체크박스
          <input
            class="node-checkbox"
            type="checkbox"
            checked={ isChecked }
            onChange={ () => { this.toggleCheckbox(item, isChecked) } }
            onClick={ e => e.stopPropagation() }
          />
        )

        const toggleButton = ( // tree 열고 닫는 arrow 버튼
          <a
            class={[
              'toggle-button',
              'mdi',
              this.foldIcon === 'menu'
                ? (item.isOpen ? 'mdi-menu-down' : 'mdi-menu-right')
                : (item.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down')
            ]}
            // !selectedListClass ? 'unselected' : null
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              this.toggleNode(node, item, item.isOpen)
            } }
          />
        )

        const nodeDetail = (node) => { // 노드 상세 (프로젝트 정보 등)
          if (this.$scopedSlots.nodeDetail) {
            return (
              <li class="node-detail tree-node">
                {
                  this.$scopedSlots.nodeDetail({
                    node: node
                  })
                }
              </li>
            )
          } else return null
        }

        const nodeTitle = ( // 노드 타이틀
          <div class={['node-title', item.groupUpper === 0 && '-relation-comp', selected, `-${this.type}`, treeLine]}>
            <div class='title-area'>
              {this.useCheckbox && nodeCheckbox}

              {((item.children && item.children.length) || (this.$scopedSlots.nodeDetail && item.groupProject && item.groupProject.length)) ? toggleButton : null}

              <span
                class={ ['tree-label-text', selected] }>
                {
                  this.$scopedSlots.title ? this.$scopedSlots.title({ node: item }) : item.title
                }
              </span>
            </div>

            { nodeDetail(item) || null }
          </div>
        )

        return (
          <ul class={
            ['tree-node', treeLine]
          }>
            <li
              class={['node-item-label', treeLine]}
              style={{
                cursor: !this.selectable && !item.children?.length ? 'default' : 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                this.selectItem(node, item)
              }}
            >
              { nodeTitle }

            </li>
            { item.isOpen ? nodeDetail(item) : null }

            { item.isOpen && item.children?.length ? nodeChildren(item) : null }
          </ul>
        )
      })
    }

    return (
      <section class="g-tree">
        <div class="tree-wrapper">{renderNode(this.nodes)}</div>
      </section>
    )
  },
  data () {
    return {
    }
  }
}
</script>
<style lang="scss" scoped>
  .tree-wrapper {
    ul.tree-node {
      > .node-item-label {
          display: inline-block;
          position: relative;
          padding: $gap-s 0;
          cursor: pointer;
          font-weight: 500;

        .node-title {
          display: flex;
          flex-direction: column;
          width: 100%;
          &.-relation-comp {
            font-size: 14px;
            font-weight: 400;
            color: $tree-relation-color;
          }
          .toggle-button {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: -8px;
            margin-right: 5px;
            height: 16px;
            z-index: 1;
            // margin-right: 3px;
          }
          > .title-area {
            display: flex;
            align-items: center;
          }
          .tree-label-text {
            position: relative;
            transition: .2 ease;
            white-space: nowrap;
            &.-selected {
              color: $primary;
              &::before {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 2%;
                right: 2%;
                height: 1px;
                background-color: $primary;
              }
            }
          }
          &.-selected {
            &.-menu {
              .tree-label-text {
                &.-selected {
                  color: $main-blue;
                  &::before {
                    display: none;
                  }
                }
              }
            }
          }
        }

        .node-item-child {
          &.-opened {
            display: block;
            padding: 0 0 0 $gap;
          }
        }
      }

      > .node-item-child {
        display: none;
        padding-left: $gap;
        font-size: 13px;
        font-weight: normal !important;
        color: $tree-child-color;
        &.-closed {
          height: 0;
          padding: 0;
          > ul.tree-node {
            margin: 0;
            visibility: hidden;
            opacity: 0;
          }
        }
        &.-opened {
          display: block;
          height: auto;
          > .tree-node {
            visibility: visible;
            opacity: 1;
          }
        }
        &.-line {
          > .tree-node {
            position: relative;
            // padding-left: 15px;
            &::before {
              content: '';
              position: absolute;
              top: -20px;
              bottom: -20px;
              left: -18px;
              height: 100%;
              border-left: 1px dotted $tree-line-color;
            }
            &:last-child {
              &::before {
                height: 38px;
              }
            }
            .node-item-label {
              > .node-title {
                > .title-area {
                  position: relative;
                  &::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: -17px;
                    width: 16px;
                    height: 1px;
                    border-top: 1px dotted $tree-line-color;
                    transform: translate(0 -2px);
                  }
                }
              }
            }
          }
        }
      }
    }

    .node-checkbox {
      margin-right: $gap-s;
      appearance: none;
      border: 1px solid $tree-checkbox-border;
      width: 20px; height: 20px;
      border-radius: $radius-s;
      position: relative;
      transition: opacity .5s ease;
      cursor: pointer;
      margin-left: $gap-s;

      &::before,
      &::after {
        content: '';
        position: absolute;
        background-color: #444;
        opacity: 0;
      }
      &::before {
        transform: rotate(45deg);
        top: 9px;left: 3px;
        width: 6px; height: 2px;
      }
      &::after {
        transform: rotate(-135deg);
        top: 4px; left: 10px;
        width: 2px; height: 9px;
      }

      &:focus {
        outline: 0;
      }

      &:checked {
        background-color: $white;
        border: 1px solid $main-red;
        &::before,
        &::after {
          opacity: 1;
        }
      }
    }

    .node-detail:not(:last-child) { //노드 상세
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: -15px;
        bottom: 0;
        left: 2px;
        height: 100%;
        border-left: 1px dotted #9D9D9D;
      }
    }
  }
</style>
