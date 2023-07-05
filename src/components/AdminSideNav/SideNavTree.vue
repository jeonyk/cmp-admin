<!--
  * 파일명 : SideNavTree.vue
  * 파일 기능 : [공통컴포넌트] side navigation 전용 tree 입니다. 외부에서 tree data를 받아와 가공합니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 Update: sidenav 선택되지 않은 경우 에러 처리
 -->

<script>
import { mapState } from 'vuex'

export default {
  name: 'SideNavTree',
  created () {
    this.nodes = this.data
  },
  computed: {
    nodes: {
      get () {
        return this.data.map(item => item)
      },
      set (newVal) {
        return newVal
      }
    },
    ...mapState({
      visible: state => state.common.sidenavExpanded
    })
  },
  props: {
    data: { // 트리에 뿌려질 데이터 Array
      type: Array,
      default () {
        return []
      }
    },
    label: { // 트리 이름
      type: String,
      default: ''
    },
    clickable: {
      type: Boolean,
      default: true
    },
    foldIconPosition: { // 토글 버튼 위치
      type: String,
      default: 'left',
      validator (value) {
        return ['left', 'right'].includes(value)
      }
    },
    parentSelectStyle: { // 클릭한 부모 요소에도 스타일을 주고 싶을 때 사용
      type: Boolean,
      default: false
    }
  },
  mounted () {
    this.initNode(this.nodes)
  },
  watch: {
    visible (value) {
      if (value) {
        this.$nextTick(() => {
          const opened = this.nodes.find(node => node.isOpen)

          if (opened?.children && opened?.children.length) {
            this.childTreeHeight = 36 * opened.children.length

            const openedChildren = opened.children.filter(node => node.isOpen)

            if (openedChildren.length) {
              if (openedChildren[0].children) {
                this.thirdTreeHeight = 34 * openedChildren[0].children.length
                this.childTreeHeight += this.thirdTreeHeight
              }
            }
          }
        })
      }
    }
  },
  methods: {
    initNode (nodes) {
      this.setInitData(nodes)
    },
    setInitData (nodes) {
      nodes.forEach(node => {
        this.$set(node, 'selected', false)
      })
    },
    nodeCloseStatus (nodes, status) {
      nodes.map(node => {
        node.isOpen = status
        if (node.children) {
          this.nodeCloseStatus(node.children, status)
        }
      })
    },
    routeTo (to) {
      this.$router.push(to)
    },
    toggleNode (nodes, item, state) {
      if (state) {
        // 닫을 때
        if (item.depth === 'first') {
          this.childTreeHeight = 0
          this.thirdTreeHeight = 0
        } else if (item.depth === 'second') {
          this.childTreeHeight -= this.thirdTreeHeight
          this.thirdTreeHeight = 0
        }
      } else {
        // 열 때
        if (item.depth === 'first') {
          this.childTreeHeight = 36 * item.children.length

          const thirdChildren = item.children.filter(node => node.isOpen)

          if (thirdChildren.length) {
            if (thirdChildren[0].children) {
              this.thirdTreeHeight = 36 * thirdChildren[0].children.length
              this.childTreeHeight += this.thirdTreeHeight
            }
          }
        } else if (item.depth === 'second') {
          if (this.thirdTreeHeight) {
            this.thirdTreeHeight = 0
          }
          this.thirdTreeHeight += 36 * item.children.length
          this.childTreeHeight += this.thirdTreeHeight
        }
      }
      nodes.forEach(node => {
        if (this.treeFindChild(node, item.title)) {
          node.isOpen = !state
        } else {
          if (node.isOpen && item.depth === 'second' && node.children) {
            // 다른 한개가 열린 상태
            this.childTreeHeight -= 36 * node.children.length
          }
          node.isOpen = false
        }
      })
      this.$forceUpdate()
    },
    /**
     * tree 데이터를 순회하며 title을 찾습니다.
     * @param {Object} element 순회 할 tree Data 전체
     * @param {string} matchingId 찾을 ID 값
     */
    treeFindChild (element, matchingId) {
      if (element.title === matchingId) return element
      else if (element.children && element.children.length > 0) {
        let result = null
        for (let i = 0; !result && i < element.children.length; i++) result = this.treeFindChild(element.children[i], matchingId)
        return result
      }
      return null
    },
    setTreeSelectDefault (nodes) {
      nodes.forEach(node => {
        node.selected = false
        if (node.children?.length) this.setTreeSelectDefault(node.children)
      })
    },
    /**
     * tree 아이템을 선택했을 때, 발생하는 이벤트입니다..
     * @param {Array} nodes 선택 아이템이 속한 노드
     * @param {Object} item 선택 아이템
     */
    selectItem (nodes, item) {
      nodes = nodes.map(node => {
        if (node.id === item.id) {
          if (item.children?.length) {
            this.toggleNode(nodes, item, item.isOpen)
          } else {
            this.setTreeSelectDefault(this.nodes)
            item.selected = true
            this.$emit('selected', item)
          }
        }
        return node
      })
      this.$forceUpdate()
    },

    // 모든 노드를 닫습니다.
    closeAllNodes (nodes) {
      nodes = nodes.map(item => {
        item.isOpen = false
        item.selected = false
        if (item.children?.length) {
          this.closeAllNodes(item.children)
        }
      })

      this.$forceUpdate()
      return nodes
    },

    // calcLabelHeight (nodes) {
    //   let ht = 0
    //   nodes.forEach(item => {
    //     ht += 36
    //     if (item.children && item.children.length) {
    //       this.calcLabelHeight(item.children)
    //     }
    //   })
    //   return ht
    // },

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

    childrenHeight (children) {
      const el = document.querySelector('.node-item-child.-opened.first')
      if (!el) return false
      else return el.offsetHeight
      // console.log('>_<', el.offsetHeight)
      // elmenets.forEach(el => {
      //   console.log('ooooo', el.innerHTML)
      // })
    }

  },
  render (h) {
    const renderNode = (node) => {
      return node.map(item => {
        // let expandArea
        const closeNode = item.isOpen ? '-opened' : '-closed' // 노드 열고 닫음
        const selected = item.selected ? '-selected' : '' // 아이템 선택 여부
        const treeDepth = item.depth ? item.depth : (item.GROUP_UPPER ? item.GROUP_UPPER : NaN) // 트리 depth

        // const nodeChildren = (node) => {
        //   if (node.children?.length) {
        //     node.children = node.children.map(item => { item.child = true })
        //     return (
        //       <li
        //         class={['node-item-child', closeNode]}
        //       >
        //         { renderNode(node.children) }
        //       </li>
        //     )
        //   }
        // }

        // const selectedListClass = (node) => {
        //   if (node.children?.length) {
        //     const selectedLists = node.children.filter(innterItem => innterItem.selected)
        //     const selectedClass = (this.parentSelectStyle && selectedLists.length) ? '-selected' : null

        //     return selectedClass
        //   }
        // }

        const toggleButton = ( // tree 열고 닫는 arrow 버튼
          <a
            class={[
              'toggle-button',
              'mdi', 'mdi-',
              item.isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'
            ]}
            // !selectedListClass ? 'unselected' : null
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              this.toggleNode(node, item, item.isOpen)
            } }

          />
        )

        const nodeTitle = ( // 노드 타이틀
          <div class={['node-title']}>
            <div class='title-left'>

              <span
                class={ ['tree-label-text', selected && item.child ? 'dot' : null] } >
                { this.$t(item.keyPath) || item.title }
              </span>
            </div>

            {item.children && item.children.length && toggleButton}
          </div>
        )

        // if (item.projectGroup?.length) {
        //   expandArea = (
        //     <section class="expand-area">
        //       {this.renderNode(item.projectGroup)}
        //     </section>
        //   )
        // }

        if (item.children?.length) {
          item.children.map(innerItem => { innerItem.child = true })
          const nodeChildren = renderNode(item.children)

          const selectedLists = item.children.filter(innterItem => innterItem.selected)
          const selectedListClass = (this.parentSelectStyle && selectedLists.length) ? '-selected' : null

          return (
          // depth가 있는 Nodes
            <ul class={
              ['tree-node',
                !item.depth ? 'first-dpt' : 'inside-dept',
                selectedListClass ? '-selected-tree' : null,
                treeDepth
              ]
            }>
              <li
                class={['node-item-label', selectedListClass]}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  this.selectItem(node, item)
                }}
              >
                { nodeTitle }
              </li>
              <li
                class={['node-item-child', closeNode, treeDepth]}
                style={ item.isOpen
                  ? item.depth
                    ? `height: ${item.depth === 'first'
                  ? this.childTreeHeight
                  : this.thirdTreeHeight}px`
                    : null
                  : null}
              >
                { nodeChildren }
              </li>
            </ul>
          )
        } else {
          // depth가 없는 Nodes
          if (item.child) {
            // 부모 트리가 있는 구조 (마지막 자식 등...)
            return (
              <ul class={['tree-node', treeDepth]}>
                <li
                  class={['node-item-label', selected, '-depths']}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    this.selectItem(node, item)
                  }}
                >
                  { nodeTitle }
                </li>
              </ul>
            )
          } else {
            // 단독 tree 구조
            return (
              <ul class={['tree-node', 'first-dpt', selected ? selected + '-tree' : null, treeDepth]}>
                <li
                  class={['node-item-label', selected]}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    this.selectItem(this.nodes, item)
                  }}
                >
                  { nodeTitle }
                </li>
              </ul>
            )
          }
        }
      })
    }

    return (
      <section class="tree-test">
        <p class="tree-label">{this.label}</p>
        <div class="tree-wrapper">{renderNode(this.nodes)}</div>
      </section>
    )
  },
  data () {
    return {
      // nodes: [],
      childTreeHeight: 0,
      thirdTreeHeight: 0
    }
  }
}
</script>
<style lang="scss" scoped>
  .tree-wrapper {
    ul.tree-node {
      > .node-item-label {
        cursor: pointer;
        padding: $gap-s 0;
        .node-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          > .title-left {
            display: flex;
            align-items: center;
            .toggle-button {
              margin-right: 3px;
            }
          }
        }
        .node-item-child {
          &.-opened {
            padding: 0 0 0 $gap-m;
          }
        }
        .node-title {
          display: flex;
          align-items: center;
        }
      }

      > .node-item-child {
        padding-left: $gap-m;
         &.-closed {
          padding: 0;
        }
      }
    }

  }
</style>
