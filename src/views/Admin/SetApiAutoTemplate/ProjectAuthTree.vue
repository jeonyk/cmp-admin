<template>
  <cmp-tree
    :item-source="authTreeData"
    :columns="[{ binding: 'title', header: $t('common.BTN.detail'), customHtml: true }]"
    :height="height"
    :is-fold-arrow="false"
    class="project-auth-tree"
    :class="{'-no-header': noHeader}"
    :init-custom-action="initCustomAction"
    :init-collapsed="false"
  >
    <!-- :use-all-expand="!noHeader" -->
    <template #title="props">
      <div class="tree-title">
        <span class="expand-icon">
          <span
            id="btnCollapse"
            class="tree-is-child-icon -collapse"
            v-if="props.cell.hasChildren && props.cell.isCollapsed"
          >
            <i class="icon-horizon" />
            <i class="icon-verti" />
          </span>
          <span
            class="tree-is-child-icon -expand"
            v-else-if="props.cell.hasChildren && !props.cell.isCollapsed"
          >
            <i class="icon-horizon" />
            <i class="icon-verti" />
          </span>
          <i
            v-else
            class="mdi mdi-chevron-right"
          />
        </span>
        <span style="line-height: 20px;">
          {{ props.row.apiName ? props.row.apiName.toUpperCase() : null }}
          <!-- _depth :: {{ props.row._depth }} -->
          <!-- _grandIdx :: {{ props.row._grandIdx }} -->
        </span>
      </div>
      <!-- /. 타이틀 -->

      <div class="-template">
        <div
          class="-radio"
          v-if="typeof (props.row.optionType) === 'boolean'"
        >
          <el-radio-group
            v-model="props.row.optionType"
            :disabled="readOnly"
            @change="!readOnly ? toggleRadio(props.row) : null"
          >
            <el-radio :label="true">
              All
            </el-radio>
            <el-radio :label="false">
              Own
            </el-radio>
          </el-radio-group>
        </div>

        <div :class="['-checkbox', { 'read-only': readOnly }]">
          <el-checkbox
            v-for="(node, idx) in nodeTypes"
            :key="node.key + idx"
            :disabled="props.row[node.key] === 'disabled'"
            v-model="props.row[node.key]"
            :indeterminate="props.row[node.key] === 'indeterminate'"
            @change="!readOnly ? toggleCheckbox(props.row, node.key, props.row[node.key]) : null"
          >
            {{ node.label }}
            <!-- 🌸 {{ props.row[`${node.key}Cnt`] ? props.row[`${node.key}Cnt`] : null }} -->
          </el-checkbox>
        </div>
      </div>
    </template>
  </cmp-tree>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'ProjectAuthTree',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    height: {
      type: [Number, String],
      default: 470
    },
    checkboxWidth: { // px
      type: Number,
      default: 150
    },
    noHeader: { // 테이블 헤더 노출 유무
      type: Boolean,
      default: false
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    data (data) {
      this.authTreeData = JSON.parse(JSON.stringify(data))

      // 템플릿 데이터 갯수 0 인경우 처리
      if (this.authTreeData.length === 0) return this.$emit('change', [])
      this.setIndex(this.authTreeData, 0)

      // height 설정
      this.setGridHeight()

      this.traverseDeep(this.authTreeData)
      return this.emitSerializeTreeData(this.authTreeData)
    }
  },
  mounted () {
    this.authTreeData = JSON.parse(JSON.stringify(this.data))

    this.setGridHeight() // height 설정
    this.$forceUpdate()

    this.traverseDeep(this.authTreeData)
    return this.emitSerializeTreeData(this.authTreeData)
  },
  methods: {
    /**
     * 데이터의 index 를 설정
     */
    setIndex (data, depth, parentIdx) {
      return data.forEach((node, index) => {
        node._depth = depth // 노드의 깊이
        if (parentIdx !== undefined) node._grandIdx = parentIdx
        else node._grandIdx = index

        if (node.children) {
          return this.setIndex(node.children, depth + 1, node._grandIdx)
        }
      })
    },

    /**
     * Radio 가 체크된 경우 이벤트
     * @param {Object} row
     */
    toggleRadio (row) {
      return this.emitSerializeTreeData(this.authTreeData)
    },

    /**
     * 부모 노드를 선택한경우, 하단 자식노드가 모두 부모 노드의 값을 따르고,
     * 자식 노드르 선택한경우, 부모노드의 상태가 변경됩니다
     *
     * @param {Object} row
     * @param {String} type 'Create', 'Read', 'Update', 'Delete' 중 하나
     * @param {Boolean} status
     */
    toggleCheckbox (row, type, status) {
      this.childrenStatus(row, type, status)
      this.setCount(row, type, status)

      if (type !== 'isRead') {
        row.isReadOnly = false
        this.checkIsReadFromBottom(this.authTreeData) // 상황에 따라 [읽기] 자동 설정
      } else {
        row.isReadOnly = status
        this.uncheckIsRead(row, status)
      }

      return this.emitSerializeTreeData(this.authTreeData)
    },
    /**
     * 클릭한 노드에게 자식이 있으면 모든 자식의 status 를 통일합니다. (하단 노드 모두 클릭하는 기능)
     * @param {Object} item
     * @param {String} type 'Create', 'Read', 'Update', 'Delete' 중 하나
     * @param {Boolean} status
     */
    childrenStatus (item, type, status) {
      item[type] = status
      item[`${type}Cnt`] = status ? 1 : 0 // cnt 정의

      if (item.children !== undefined) {
        item.children.forEach(child => {
          // 자식의 모든 status 를 통일
          if (child[type] !== 'disabled') {
            child[type] = status
            child[`${type}Cnt`] = status ? 1 : 0
            this.childrenStatus(child, type, status)
          }
        })
      }
    },
    /**
     * tree 를 아래(클릭한 노드) => 위(최상단 노드) 로 이동
     * @param {Object} node
     * @param {String} type 'Create', 'Read', 'Update', 'Delete' 중 하나
     * @param {Boolean} status
     */
    setCount (node, type, status) {
      if (status === true) node[`${type}Cnt`] = 1
      if (node.parentNode) this.parentWalker(node.parentNode, type, status)
    },

    /**
     * CUD 를 설정하면 Read는 자동으로 체크되도록 + 변경할 수 없도록 합니다.
     * @param {Array} nodes
     */
    checkIsReadFromBottom (nodes) {
      const cnt = 'isReadCnt'

      /**
       * 처음엔 [부모 => 마지막 depth 의 자식(자식이 없고 + 부모노드만 있는경우)]까지 훑어 isRead 를 설정합니다.
       * 마지막 depth 에서 @function fromBottomToTop 을 실행합니다.
       * @param {Array} data
       */
      const fromTopToBottom = data => {
        data.forEach(node => {
          // 현재 노드의 모든 상태들을 확인하여 isRead 여부를 결정합니다.
          const some = this.getSome(node)
          const isReadOnly = node.isReadOnly // isRead 하나만 선택된 경우 = true

          let isReadStatus = false
          // console.log(`%c${node.apiName} :: `, 'color: yellow', `\nisReadOnly [${isReadOnly ? '⭕️' : '-'}] + some[${some ? '⭕️' : '-'}]`)

          // 현재 상태를 판별한 후 동작하기
          if (isReadOnly === true && some === false) isReadStatus = node.isRead // (isRead 만 체크 true 되어있는경우)
          else if (isReadOnly === false && some === true) isReadStatus = some // (isRead 외에 다른것으로 체크되어있는경우)

          // 현재 보고있는 노드가 기본적으로 disabled 상태라면 특별한 행동을 취하지 않습니다.
          if (node.isRead !== 'disabled') {
            node.isRead = some || isReadStatus
            node[cnt] = node.isRead ? 1 : 0
            if (some === true) node.isReadOnly = false // 하나라도 선택된 다른 경우가 있다면 읽기전용으로 선택한것이 아니므로 통일시켜부림
          }

          if (node.children) {
            // console.log(`%c${node.apiName} :: `, 'color: yellow', `\nisRead[${node.isRead}] + some[${some ? '⭕️' : '-'}] + isReadStatus [${isReadStatus ? '⭕️' : '-'}]`)
            node.children.forEach(child => {
              if (child.isRead !== 'disabled') fromTopToBottom(node.children)
            })
          }

          // 끝까지 내려갔다면 다시 차근차근 올라옵니다.
          if (node.children === undefined && node.parentNode) fromBottomToTop(node.parentNode)
        })
      }

      /**
       * [맨 마지막 자식 => 가장 상단 부모자식]까지 올라가면서 Read Count 및 세팅 시작
       */
      const fromBottomToTop = node => {
        if (node.children !== undefined) {
          let count = 0
          let childrenQuantity = 0 // 체크 가능한 직계자손의 전체 체크박스 count

          node.children.forEach(i => {
            const isChecked = i[cnt] !== undefined && i.isRead !== undefined // 체크되어있는게 한개 이상이고 &&

            if (isChecked) count += i[cnt]
            if (i.isRead !== 'disabled') childrenQuantity += 1 // disabled 상태이면 카운트에서 제외
          })

          if (node.isRead === 'disabled') return

          // 직계자손들이 모두 check 되어있으면 부모도 체크
          if (count > 0 && childrenQuantity === count) {
            node.isRead = true
            node[cnt] = 1
          } else if (count > 0 && childrenQuantity > count) {
            node.isRead = 'indeterminate'
            node[cnt] = 0.5 // ㅋㅋㅋㅋ 애매한 값.. 하지만 이게 최선입니다
          } else {
            node.isRead = false
            node[cnt] = count
          }

          if (node.parentNode) fromBottomToTop(node.parentNode)
        }
      }

      fromTopToBottom(nodes)
    },

    /**
     * [Read] 를 체크 해제하는 경우
     */
    uncheckIsRead (node, status) {
      // 선택된 노드에게 자식들이 있는경우, 자식들과 isReadOnly 여부 통일
      if (node.children) node.children.forEach(child => { child.isReadOnly = status })

      if (status === true) return

      // (문제 :: '-' 표기가 해제가 안됨)
      // 현재 보고있는 노드의 체크상태가 false 인 경우, isRead 에 맞춥니다.
      if (node.children === undefined) {
        const keys = ['isCreate', 'isUpdate', 'isDelete']
        for (const key of keys) {
          if (node[key] !== 'disabled') {
            node[key] = status
            node[`${key}Cnt`] = status ? 1 : 0
          }
        }
      }

      /**
       * 처음엔 [부모 => 마지막 depth 의 자식(자식이 없고 + 부모노드만 있는경우)]까지 훑어 isRead 를 설정합니다.
       * 마지막 depth 에서 @function fromBottomToTop 을 실행합니다.
       * @param {Array} data
       */
      const fromTopToBottom = data => {
        data.forEach(node => {
          if (node.children) {
            node.children.forEach(child => {
              // 자식들에게 동일한 status 값 설정 (isRead 가 false 로 체크 해제된 경우만 전체 false 로 통일하도록 동작합니다.)
              const keys = ['isCreate', 'isUpdate', 'isDelete']
              for (const key of keys) {
                if (child[key] !== 'disabled' && child.isRead === false) {
                  child[key] = false
                  child[`${key}Cnt`] = 0
                }
              }

              if (child.isRead !== 'disabled') fromTopToBottom(node.children)
            })
          }

          // 끝까지 내려갔다면 다시 차근차근 올라옵니다.
          if (node.children === undefined && node.parentNode) fromBottomToTop(node.parentNode)
        })
      }

      /**
       * [맨 마지막 자식 => 가장 상단 부모자식]까지 올라가면서 Read Count 및 세팅 시작
       */
      const fromBottomToTop = node => {
        const keys = ['isCreate', 'isRead', 'isUpdate', 'isDelete']
        for (const type of keys) {
          const cnt = `${type}Cnt`
          // console.log(node.apiName, type, node[type], node[cnt], node)

          if (node.children !== undefined) {
            let count = 0
            let childrenQuantity = 0 // 체크 가능한 직계자손의 전체 체크박스 count

            // 직계자손 체크된 자식들 count 가져오기
            node.children.forEach(item => {
              const isChecked = item[cnt] !== undefined && item[type] !== undefined // 체크되어있는게 한개 이상이고 &&

              if (isChecked) count += (item[cnt] ? item[cnt] : 0)
              if (item[type] !== 'disabled') childrenQuantity += 1
            })

            if (node[type] === 'disabled') count = 0

            // 직계자손들이 모두 check 되어있으면 부모도 체크
            if (count > 0 && childrenQuantity === count) {
              node[type] = true
              node[cnt] = 1
            } else if (count > 0 && childrenQuantity > count) {
              node[type] = 'indeterminate'
              node[cnt] = 0.5 // ㅋㅋㅋㅋ 애매한 값.. 하지만 이게 최선입니다
            } else {
              node[type] = node[type] !== 'disabled' ? false : 'disabled'
              node[cnt] = count
            }

            // console.log(node.apiName, type, node[cnt], count, childrenQuantity, node)

            if (node.parentNode) fromBottomToTop(node.parentNode)
          }
        }
      }

      fromTopToBottom(this.authTreeData)
    },

    /**
     * @function getSome 노드중 하나라도 isRead 외에 Check 되어있는지 확인해서 결과를 반환하는용도
     * @param {Object} node
     */
    getSome (node) {
      let some = false
      const keys = ['isCreate', 'isUpdate', 'isDelete']

      // CUD 의 key 들중 하나라도 true 가 있다면 isRead 는 체크박스가 true 자동 설정 및 변경할 수 없도록 disabled 됩니다.
      // Read 가 아닌 경우 check 되어있으면 그에따라 Read 를 True
      for (const key of keys) {
        const s = node[key]
        if (s === true) some = true
      }

      return some
    },

    /**
     * 부모 / 조부모 가 있는경우에만 부모 순회 (최상단 노드일경우엔 확인 X)
     * 개복잡..^^...ㅎㅎ ⭐️
     * @param {Object} item
     * @param {String} type 'Create', 'Read', 'Update', 'Delete' 중 하나
     */
    parentWalker (node, type) {
      const cnt = `${type}Cnt`
      if (node.children !== undefined) {
        let count = 0
        let childrenQuantity = 0 // 체크 가능한 직계자손의 전체 체크박스 count

        // 어차피 자식이 있는 노드가 disabled 인 경우는 children 확인 필요 X
        if (node[type] === 'disabled') return

        // 직계자손 체크된 자식들 count 가져오기
        node.children.forEach(item => {
          const isChecked = item[cnt] !== undefined && item[type] !== undefined // 체크되어있는게 한개 이상이고 &&

          if (isChecked) count += (item[cnt] ? item[cnt] : 0)
          if (item[type] !== 'disabled') childrenQuantity += 1
        })

        // 체크된 직계자손들이 1개 이상 && childrenQuantity 와 동일할 경우 === 1 (전체 선택됨 (true))
        // 체크된 직계자손들이 1개 이상 && childrenQuantity 미만일 경우 === 1 (일부 선택됨 (indeterminate))
        // 체크된 직계자손들이 0개 (false)

        // 직계자손들이 모두 check 되어있으면 부모도 체크
        if (count > 0 && childrenQuantity === count) {
          node[type] = true
          node[cnt] = 1
        } else if (count > 0 && childrenQuantity > count) {
          node[type] = 'indeterminate'
          node[cnt] = 0.5 // ㅋㅋㅋㅋ 애매한 값.. 하지만 이게 최선입니다
        } else {
          node[type] = false
          node[cnt] = count
        }

        if (node.parentNode) {
          // console.log(`%c 클릭한 노드의 부모 :: [${node.apiName}], cnt [${node[`${type}Cnt`]}]`, 'color: pink', node)
          this.parentWalker(node.parentNode, type)
        } else { // 최상단 노드 확인 (디버깅용)
          // console.log(`%c 최상단 노드 :: [${node.apiName}], cnt [${node[`${type}Cnt`]}]`, 'color: yellow', node)
        }
      }
    },

    /**
     * 화면을 시작할때 트리의 가장 하단부까지 타고 내려갑니다.
     *
     * @param {Array} data
     * @param {String} parentNode
     */
    traverseDeep (data, parentNode) {
      data.forEach(node => {
        if (parentNode !== undefined) node.parentNode = parentNode

        // 제일 하단 노드라면 이제 트리를 타고 부모로 올라가기...! 슈슉
        if (!node.children) return this.setDefaultCheck(node)
        return this.traverseDeep(node.children, node)
      })
    },
    /**
     * 노드를 확인하여 체크여부를 결정합니다. (데이터를 새로고침할 때 한 번만)
     *
     * @param {Object} node
     */
    setDefaultCheck (node) {
      // 노드 내부에 isRead 외에 다른것이 선택된것이 없는 경우 = 읽기전용으로 선택되었다는 의미 (isReadOnly = true)
      if (node.isRead === true && node.isRead !== 'disabled' && !this.getSome(node)) node.isReadOnly = true

      const keys = ['isCreate', 'isRead', 'isUpdate', 'isDelete']
      for (const type of keys) {
        const cnt = `${type}Cnt`

        // 제일 하위 자식이 체크되어있는경우 카운팅을 합니다
        if (node[type] === true) node[cnt] = 1

        // 어차피 자식이 있는 노드가 disabled 인 경우는 children 확인 필요 X
        if (node[type] === 'disabled') continue

        if (node.children) {
          let count = 0
          let childrenQuantity = 0 // 일단 직계 자손들 갯수부터 확인하기

          node.children.forEach(item => {
            const isChecked = item[cnt] !== undefined && item[type] !== undefined // 체크되어있는게 한개 이상이고

            if (isChecked) count += item[cnt]
            if (item[type] !== 'disabled') childrenQuantity += 1
          })

          // 체크된 직계자손들이 1개 이상 && childrenQuantity 와 동일할 경우 === 1 (전체 선택됨 (true))
          // 체크된 직계자손들이 1개 이상 && childrenQuantity 미만일 경우 === 1 (일부 선택됨 (indeterminate))
          // 체크된 직계자손들이 0개 (false)

          // 직계자손들이 모두 check 되어있으면 부모도 체크
          if (count > 0 && childrenQuantity === count) {
            node[type] = true
            node[cnt] = 1
          } else if (count > 0 && childrenQuantity > count) {
            node[type] = 'indeterminate'
            node[cnt] = 0.5
          } else if (count === 0) {
            node[type] = false
            node[cnt] = count
          }
        }
      }

      if (node.parentNode) return this.setDefaultCheck(node.parentNode)
    },

    /**
     * 트리 형식의 데이터를 직렬화하여 emit 합니다
     */
    emitSerializeTreeData (authTreeData = this.authTreeData) {
      const tempResult = []
      const factorial = (data) => {
        return data.forEach(item => {
          const temp = { ...item }
          for (const key in temp) {
            if (item[key] === 'disabled') temp[key] = undefined
            if (item[key] === 'indeterminate') temp[key] = true // 이제는 [-] 표기도 true 로 보내줌
          }
          delete temp.children
          delete temp.parentNode
          tempResult.push(temp)

          if (item.children) return factorial(item.children)
        })
      }

      const treeCopy = cloneDeep(authTreeData)
      factorial(treeCopy)

      // 아래 권한들은 disabled 이지만 무조건 true 로 설정해주어야 합니다.
      const defaultReadIsTrue = ({ apiName }) => {
        const regex = /프로젝트 관리|프로젝트 설정|프로젝트명|프로젝트 소유자|운영담당자|프로젝트 삭제/gi
        return regex.test(apiName)
      }

      const result = tempResult.map(item => {
        const regex = defaultReadIsTrue(item)
        if (regex) item.isRead = true
        return item
      })

      return this.$emit('change', result)
    },
    initCustomAction (grid) {
      this.grid = grid
      if (this.noHeader) grid.headersVisibility = 0 // 헤더 안보이게 세팅
    },
    /**
     * 그리드의 높이 설정
     */
    setGridHeight () {
      this.$nextTick(() => {
        if (this.grid) {
          this.grid.scrollIntoView(0, 0)
          this.grid.rows.forEach(row => {
            if (typeof (row.dataItem.optionType) === 'boolean') row.height = 85
            else row.height = 50
          })
        }
      })
    }
  },
  data () {
    return {
      // 권한 설정 트리 데이터
      grid: null,
      authTreeData: [],
      nodeTypes: [
        { key: 'isCreate', label: 'Create' },
        { key: 'isRead', label: 'Read' },
        { key: 'isUpdate', label: 'Update' },
        { key: 'isDelete', label: 'Delete' }
      ]
    }
  }
}
</script>

<style lang="scss">
  .tree-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    .expand-icon { margin-right: $gap-s; }
  }
  .tree-is-child-icon { // 트리 expand 아이콘
    position: relative;
    display: block;
    width: 20px;
    height: 20px;
    border-radius: $radius-s;
    transition: all .25s;
    > i {
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 2px;
      transform: translate(-50%, -50%);
      background-color: $light-gray;
      transition: all .25s;
    }
    &.-expand {
      background-color: rgba(114, 119, 151, 0.5);
      border: 1px solid rgba(114, 119, 151, 0.5);;
    }
    &.-collapse {
      border: 1px solid rgba(114, 119, 151, 0.5);
      * { background-color: rgba(114, 119, 151, 0.5); }
      > i.icon-verti {
        transform: translate(-50%, -50%) rotate(90deg);
      }
    }
  }

  .project-auth-tree{
    &.cmp-grid-wrapper {
      width: 960px;

      .-template {
        margin-right: 80px;
        flex: 0 0 500px;
        // border: 1px solid red;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }

      .-radio {
        margin-bottom: 15px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        .el-radio-group {
          display: flex;
          width: 100%;
          text-align: left;
          .el-radio {
            margin-right: $gap;
            flex: 0 0 25%;
            .el-radio__label {
              padding-left: $gap-s;
            }
          }
        }
      }

      .-checkbox {
        display: flex;
        justify-content: space-between;
        position: relative;

        &.read-only {
          &::before,
          &::after {
            content: '';
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: transparent;
            z-index: 5;
            cursor: auto;
          }
        }

        .el-checkbox{
          > .el-checkbox__input {
            > .el-checkbox__inner {
              width: 20px;
              height: 20px;
              border: 1px solid #CACED0;
            }
          }
        }

        .el-checkbox__label {
          padding-left: $gap-s;
        }
      }
    }

    &.-no-padding.cmp-grid-wrapper {
      .-template {
        margin-right: 30px;
        flex: 0 0 350px;
        // border: 1px solid skyblue;
      }

      .-radio {
        .el-radio-group {
          .el-radio { flex: 0 0 75px; }
        }
      }

      .cmp-grid-tree {
        .wj-cell {
          padding-left: 30px;
        }
      }
    }
  }
</style>
