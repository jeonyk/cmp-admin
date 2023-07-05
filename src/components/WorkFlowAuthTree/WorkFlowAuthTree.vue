<!--
  * 파일명 : WorkFlowAuthTree.vue
  * 파일 기능 : 워크플로우 실행 권한 관련 트리
  * 작성자 : 전경열 외 1명
  * 최종 작성일 : 2020-11-25
  * License By Shinsegae I&C
  * 2020-11-25 실행 권한 파라미터 변경
 -->

<script>
export default {
  name: 'WorkFlowAuthTree',
  props: {
    data: { // 트리에 뿌려질 데이터 Array
      type: Array,
      default () {
        return []
      }
    },
    workFlowTaskExecutePerm: {
      type: Boolean,
      default (a) {
        return true
      }
    },
    isClicked: {
      type: Boolean,
      default (a) {
        return true
      }
    },
    isCheckList: {
      type: Boolean,
      default (a) {
        return true
      }
    }
  },
  watch: {
    auth (newVal, oldVal) {
      // el-switch 의 change 로 위임, 중복실행 때문
    },
    workFlowTaskExecutePerm (newVal) {
      this.auth = newVal
    }
  },
  created () {
    // this.setData(this.data)
  },
  methods: {
    setData (data) {
      if (Array.isArray(data)) {
        this.$set(data, 'workFlowTaskExecutePerm', true)
        this.$emit('workFlowTaskExecutePerm', true)
        data.forEach(item => {
          this.$set(item, 'writable', true)
          this.$set(item, 'readable', true)
          if (item.children && item.children.length > 0) this.setData(item.children)
        })
      }
    },
    /**
     * '읽기, 쓰기' 설정을 토글합니다.
     * @param {Object} 토글 할 item
     * @param {Boolean} 토글 할 key의 현재 상태
     * @param {String} 토글 할 key ('writable' / 'readable')
     */
    toggleState (item, state, property) {
      if (Array.isArray(item)) {
        item.forEach(child => {
          child[property] = !state
          if (child.children && child.children.length > 0) this.toggleState(child.children, state, property)
        })
      } else {
        item[property] = !state
        if (item.children) this.toggleState(item.children, state, property)
      }
      this.$forceUpdate()
    },
    /**
     * 트리를 렌더링 합니다.
     * @param {Array} node 렌더링 할 트리 데이터
     */
    renderNode (node) {
      return node.map(item => {
        // const closeNode = item.isOpen ? '-opend' : '-closed'
        // const selected = item.selected ? '-selected' : ''
        if (item.children && item.children.length > 0) {
          const nodeChildren = this.renderNode(item.children)
          return (
            <ul class="node-list">
              <li class="node-item node-item-label">
                <span class="tree-label-text">{ item.title }</span>
              </li>
              <li class="node-item node-item-child">
                { nodeChildren }
              </li>
            </ul>
          )
        } else {
          return (
            <ul class="node-list">
              <li class='node-item node-item-label'>
                <span class="tree-label-text">{ item.title }</span>
              </li>
            </ul>
          )
        }
      })
    }
  },

  // <div class="action-icon">
  //   <a
  //     class={['mdi', item.readable ? 'mdi-eye-outline' : 'mdi-eye-off-outline']}
  //     onClick={(e) => {
  //       this.toggleState(item, item.readable, 'readable')
  //     }}
  //   />
  // </div>

  // <div class="action-icon">
  //   <a
  //     class={['mdi', item.readable ? 'mdi-eye-outline' : 'mdi-eye-off-outline']}
  //     onClick={(e) => {
  //       this.toggleState(item, item.readable, 'readable')
  //     }}
  //   />
  // </div>
  render (h) {
    return (
      <section class="work-flow-auth-tree">
        <div class="auth-tree-top" v-show={!this.isCheckList}>
          <b class="top-title" >{this.execAuth}</b>
          <el-switch v-model={this.auth} onChange={(e) => {
            this.$emit('workFlowTaskExecutePerm', e, 'notClicked')
          }} />
        </div>

        {this.renderNode(this.data)}
      </section>
    )
  },
  data () {
    return {
      execAuth: this.$t('common.TERMS.execAuth'),
      auth: this.workFlowTaskExecutePerm || true
    }
  }
}
</script>
<style lang="scss" scoped>
  .work-flow-auth-tree {
    margin-top: -$gap-s;
    width: 100%;
    .auth-tree-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid #d9d9d9;
      > .top-title {
        font-weight: bold;
        color: $color-black;
      }
    }

    ul.node-list {
      li.node-item {
        list-style: none;
        &.node-item-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: inherit;
          cursor: pointer;
          > .tree-label-text {
            display: inline-block;
            line-height: 26px;
            margin-left: $gap-s;
            white-space: nowrap;
          }
          > .action-icon {
            > .mdi {
              margin-left: $gap-s;
              &:before {font-size: 16px;}
              &:hover {color: $main-blue;}
              &.mdi-eye-off-outline {
                opacity: .5;
              }
            }
            // > .eye-icon {
            //   display: inline-block;
            //   width: 16px;
            //   background-position: center;
            //   background-size: contain;
            //   background-repeat: no-repeat;
            //   &.-on {
            //     height: 10px;
            //     background-image: url('../../assets/images/icon-eye@3x.png');
            //   }
            //   &.-off {
            //     height: 13px;
            //     background-image: url('../../assets/images/icon-eye-off@3x.png');
            //   }
            // }
          }
        }
        &.node-item-child {
          margin-left: $gap;
        }
      }
    }
  }
</style>
