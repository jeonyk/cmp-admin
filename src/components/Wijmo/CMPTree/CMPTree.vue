<!--
  * 파일명 : CMPTree.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-18
  * License By Shinsegae I&C
  * 2021-01-18 fix: [관계사 관리] -> 조직 추가 시, 닫히는 에러 수정
 -->

<template>
  <div :class="['cmp-grid-wrapper', 'clickable']">
    <template v-if="!itemSource.length">
      <div class="empty-data">
        {{ $v('데이터가 없습니다.') }}
      </div>
    </template>

    <template v-else>
      <wj-flex-grid
        :initialized="init"
        :items-source="data"
        :item-formatter="itemFormatter"
        :headers-visibility="headerVisibility"
        allow-dragging="None"
        selection-mode="None"
        :child-items-path="childItemsPath"
        class="cmp-grid-tree"
        :style="`max-height: ${height}px`"
      >
        <wj-flex-grid-column
          v-for="column in columns"
          :key="column.field"
          :css-class="column.cssClass ? column.cssClass : ''"
          :header="$t(column.keyPath) || column.header"
          :binding="column.binding"
          :width="column.width ? column.width : '*'"
          :is-read-only="true"
          :allow-sorting="allowSorting"
          :align="column.align ? column.align : 'justify'"
        >
          <wj-flex-grid-cell-template
            v-if="column.field === 'checkable'"
            cell-type="Cell"
            v-slot="cell"
          >
            <el-checkbox
              :disabled="cell.item.disable"
              v-model="cell.item.checked"
              @change="changedCheckbox"
              @click.native="(e) => { e.stopPropagation() }"
            />
          </wj-flex-grid-cell-template>
          <!-- /. checkbox -->

          <!-- 커스텀 html을 사용해야할 경우 -->
          <wj-flex-grid-cell-template
            cell-type="Cell"
            v-if="column.customHtml"
            v-slot="cell"
          >
            <slot
              :row="cell.item"
              :cell="cell.row"
              :name="column.binding"
            >
              {{ cell.item[column.binding] }}
            </slot>
          </wj-flex-grid-cell-template>
          <!-- /. 커스텀 html -->

          <!-- tree에 children이 있을 경우 -->
          <wj-flex-grid-cell-template
            cell-type="Cell"
            v-if="column.foldable"
            v-slot="cell"
          >
            <div class="foldable-item">
              <a
                v-if="cell.item.children && cell.item.children.length > 0 && isFoldArrow"
                class="row-expand-button"
                @click.stop="toggleExpand(cell.row)"
              >
                <i
                  :class="['mdi', cell.row.isCollapsed ? 'mdi-menu-right' : 'mdi-menu-down' ]"
                />
              </a>

              <div class="custom-template">
                <slot
                  :row="cell.item"
                  :name="column.binding"
                  :cell="cell.row"
                >
                  {{ cell.item[column.binding] }}
                </slot>
              </div>
            </div>
          </wj-flex-grid-cell-template>
          <!-- /. tree에 children이 있을 경우 -->
        </wj-flex-grid-column>
      </wj-flex-grid>
      <!-- tree일 경우 -->

      <!-- 전체 접음, 전체 펼침 버튼 -->
      <template v-if="useAllExpand">
        <a
          class="expand-button"
          @click.stop="gridExpand(treeExpanded)"
          v-if="treeExpanded"
        >
          {{ $v('전체 접음') }}
        </a>
        <a
          class="expand-button"
          @click.stop="gridExpand(treeExpanded)"
          v-else
        >
          {{ $v('전체 펼침') }}
        </a>
      </template>
    </template>
    <!-- /. tree -->
  </div>
</template>

<script>
// import * as wjGrid from 'wijmo/wijmo.grid'
import { CollectionView } from '@grapecity/wijmo'
// import * as wjCore from '@grapecity/wijmo'

export default {
  name: 'CMPTree', // ✅ comment 0820: CMPTree ' ㅈ')!
  props: {
    columns: { // table의 컬럼을 입력합니다.
      type: Array,
      default: () => []
    },
    itemSource: { // table의 데이터를 입력합니다.
      type: Array,
      default: () => []
    },
    initCustomAction: { // 각 컴포넌트에서 개별로 필요한 기능을 사용할 수 있습니다.
      type: Function,
      default: () => {}
    },
    draggable: { // 드래그하여 동작이 가능하다면 true
      type: Boolean,
      default: false
    },
    allRowSelectable: { // 자식 요소 있어도 선택 가능하면 true ... 로우 선택 시 어떻게 할지 결정하기 위해서 입니다.
      type: Boolean,
      default: false
    },
    allowSorting: {
      type: Boolean,
      default: false
    },
    useAllExpand: { // 전체 펼침, 전체 접음[default] 버튼을 사용하면 true
      type: Boolean,
      default: true
    },
    childItemsPath: { // 트리의 자식으로 key..
      type: [String, Array],
      default: 'children'
    },
    height: { // max-height (px)
      type: [Number, String],
      default: undefined
    },
    initCollapsed: { // 초기에 트리가 모두 닫혀있는지?
      type: Boolean,
      default: true
    },
    isFoldArrow: { // tree fold arrow 노출 유무
      type: Boolean,
      default: true
    },
    headerVisibility: {
      type: String,
      default: 'Column'
    }
  },
  watch: {
    itemSource () {
      this.initDataSetting()
    }
  },
  beforeMount () {
    this.treeExpanded = !this.initCollapsed
    this.initDataSetting()
  },
  methods: {
    /**
     * @function - 초기 "데이터"를 설정 해줍니다.
     */
    initDataSetting () {
      this.setTreeData()

      this.$nextTick(function () {
        if (this.initCollapsed && this.grid) this.grid.collapseGroupsToLevel(0)
        this.$emit('updateGrid', this.grid)
      })
      // this.setTreeAdditionalData(this.data.items)
    },
    setTreeData () {
      // const copyData = JSON.parse(JSON.stringify(this.itemSource))
      this.data = new CollectionView(this.itemSource, {
        collectionChanged: (s) => {
          this.$nextTick(() => {
            this.selectedRow = null
            if (this.grid) {
              this.grid.select(-1, -1)
            }
          })
        }
      })

      return this.data
    },
    /**
     * @function - grid inintialize 입력
     */
    init (grid) {
      this.grid = grid

      grid.columnHeaders.rows.defaultSize = 42
      grid.rows.defaultSize = 40

      this.rowClickEventHandler(grid)
      this.initCustomAction(grid)
      this.setRelationCompSty(grid)

      if (this.initCollapsed) grid.collapseGroupsToLevel(0)
    },
    /**
     * @function - header에 전체선택 체크박스 추가
     */
    itemFormatter (panel, r, c, cell) {
      // 드래그가 가능할 경우 attr를 설정
      // if (!panel.grid.rows[r]) return
      const parentStructure = this.getParentNode(panel.grid.rows[r])
      if (parentStructure) panel.grid.rows[r].dataItem.parentNode = parentStructure.dataItem

      // panel.grid.rows[r].dataItem.parentNode = this.getParentNode(panel.grid.rows[r]) // parentNode데이터 가져옴
      if (this.draggable) {
        // if (panel.cellType === wjGrid.CellType.RowHeader) cell.setAttribute('draggable', true)
        cell.setAttribute('draggable', true)
        this.draggingHandler(panel, r, c, cell)
      }
    },

    /**
     * @function - row의 collapse를 토글합니다.
     */
    toggleExpand (item) {
      item.isCollapsed = !item.isCollapsed
      this.$forceUpdate()
    },
    /**
     * @function - row를 클릭할 때 발생하는 이벤트를 다룹니다. 편집 가능한 모드가 아니면 클릭 시 expand, 편집 가능한 모드면 해당 로우 클릭
     */
    rowClickEventHandler (grid) {
      grid.addEventListener(grid.hostElement, 'click', (e) => {
        e.stopPropagation()
        // e.preventDefault()

        const ht = grid.hitTest(e) // HitTestInfo
        const selRow = grid.cells.rows // 클릭한 rows의 data
        selRow.forEach(row => {
          row.cssClassAll = undefined
          row.isSelected = false
        })

        // cell을 클릭했을 때만 발생하는 이벤트를 다룹니다. - thead의 cellType은 2입니다.
        if (ht.cellType === 1) {
          // tree row를 클릭할 때 'selected-row' class를 추가합니다.
          if (ht.panel === grid.cells) {
            const isFoldableRow = (row, allRowSelectable) => {
              if (allRowSelectable) return false
              if (row[ht.row]._data.groupUpper) {
                if (!row[ht.row]._data.groupUpper || !row[ht.row]._data.children?.length) return false
              }
              return true
            }
            if (isFoldableRow(selRow, this.allRowSelectable)) {
              // 모든 로우 선택 가능 모드(allRowSelectable)가 아니고[default], 데이터에 children이 있으면 또는, 해당 아이템이 관계사면(groupUpper: 0) 단순히 folding 합니다.
              this.toggleExpand(selRow[ht.row])

              // 추가(2022.07.12) allRowSelectable Prop과 관계업이
              // selectedRow 를 emit 합니다. (기존엔 allRowSelectable 시에만 selectedRow 를 Emit 했습니다.)
              this.selectedRow = selRow[ht.row]
              this.$emit('selectedRow', this.selectedRow)
            } else {
              // selRow[ht.row].cssClassAll = 'selected-row'
              selRow[ht.row].isSelected = true
              this.selectedRow = selRow[ht.row]

              const upperNode = {
                parenNode: this.getParentNode(this.selectedRow) ? this.getParentNode(this.selectedRow) : null,
                relationCompNode: this.getRelationCompInfo(this.selectedRow) ? this.getRelationCompInfo(this.selectedRow) : null
              }
              this.$emit('selectedRow', this.selectedRow, upperNode)
            }
          }
        }
      })
    },
    /**
     * 로우의 부모 노드를 가져옵니다.
     */
    getParentNode (row) {
      // const startLevel = row instanceof wjGrid.GroupRow ? row.level : -1
      const startLevel = row.level
      const startIndex = row.index

      for (let i = startIndex - 1; i >= 0; i--) {
        const thisRow = row.grid.rows[i]
        // const thisLevel = thisRow instanceof (wjGrid.GroupRow) ? thisRow.level : -1
        const thisLevel = thisRow.level
        if (thisLevel > -1) {
          if (startLevel === -1 || (startLevel > -1 && thisLevel < startLevel)) {
            return thisRow
          }
        }
      }
      return null
    },
    /**
     * 선택 로우의 부모 노드들을 탐색하며 관계사가 있으면(groupUpper === 0) 관계사 GroupRow를 리턴합니다.
     * @return {relationCompInfo} 선택 로우가 조직이면, 조직의 관계사 정보를 리턴합니다.
     */
    getRelationCompInfo (row) {
      const parentNode = this.getParentNode(row)
      // console.log(parentNode)
      if (parentNode) {
        if (parentNode._data.groupUpper && parentNode._data.groupUpper > 0) {
          return this.getRelationCompInfo(parentNode)
        } else {
          return parentNode
        }
      }
    },
    /**
     * @function - 드래그가 가능할 경우 실행합니다.
     */
    draggingHandler (panel, r, c, cell) {
      this.dragStartEvent(panel.grid)
      this.dragEnter(panel.grid)
      this.dragLeave(panel.grid)
      this.dropEvent(panel.grid)
    },
    dragStartEvent (grid) {
      grid.hostElement.addEventListener('dragstart', (e) => {
        e.stopPropagation()
        const ht = grid.hitTest(e)

        const dragItem = grid.rows[ht.row].dataItem
        if (!dragItem.groupUpper) return

        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('treeData', this._getDataHierarchy(grid, ht.row))
        this.$emit('drag-start')
      }, true)
    },
    dragEnter (grid) {
      grid.hostElement.addEventListener('dragenter', (e) => {
        var ht = grid.hitTest(e)
        if (ht) {
          ht.target.parentNode.classList.add('-drag-over')

          e.dataTransfer.dropEffect = 'move'
          e.preventDefault()
        }
      })
    },
    dragLeave (grid) {
      grid.hostElement.addEventListener('dragleave', (e) => {
        var ht = grid.hitTest(e)
        if (ht) {
          ht.target.parentNode.classList.remove('-drag-over')
          e.dataTransfer.dropEffect = 'move'
          e.preventDefault()
        }
      })
    },
    dropEvent (grid) {
      grid.hostElement.addEventListener('drop', (e) => {
        var srcItems = JSON.parse(e.dataTransfer.getData('treeData')) // 움직이는 아이템
        var ht = grid.hitTest(e)
        var cv = grid.collectionView
        var trgtItem = grid.rows[ht.row].dataItem // 목적지 아이템

        // if (!trgtItem.groupUpper) return// 목적지가 관계사일 경우 방지
        ht.target.parentNode.classList.remove('-drag-over')
        // if (this.treeFindChild(srcItems, trgtItem.id)) return // 자식 요소로 드래그 할 경우를 고려(드래그 불가능)

        if (srcItems && trgtItem && (srcItems.id !== trgtItem.id)) { // 목적지 === 이관 아이템이 같지 않을 때만..
          console.log('drop!: ', srcItems, trgtItem)
          this.removeItems(cv.sourceCollection, srcItems, 'all')
          this.addItems(cv.sourceCollection, trgtItem, srcItems)
        }

        cv.refresh()

        this.$emit('drop')

        // console.log(map(cv.sourceCollection, 'title'))
      })
    },
    findParentNodeWjCell (el) {
      if (el.classList.contains('wj-cell')) return el
      else {
        this.findParentNodeWjCell(el.parentNode)
      }
    },

    /**
     * 드래그 하는 로우의 data를 JSON 형태로 변환. 만약, 자식 요소가 있다면 자식 요소도 함께 변환합니다.
     * @param {FlexGrid} grid 그리드
     * @param {Number} rowIndex 드래그가 발생한 row의 index
     */
    _getDataHierarchy (grid, rowIndex) {
      var _lvl = grid.rows[rowIndex].level
      if (grid.rows[rowIndex].hasChildren) {
        for (var i = rowIndex + 1; i < grid.rows.length - 1; i++) {
          if (grid.rows[i].level === _lvl) {
            break
          }
        }
      }
      return JSON.stringify(grid.rows[rowIndex].dataItem)
    },
    /**
     * tree 데이터를 순회하며 id를 찾습니다. (d&d에서 필요 ... 자식과 함께 이동하기 위함.)
     * @param {Object} element 순회 할 tree Data 전체
     * @param {string} matchingId 찾을 ID 값
     */
    treeFindChild (element, matchingId) {
      if (element.id === matchingId) return element
      else if (element.children && element.children.length > 0) {
        let result = null
        for (let i = 0; !result && i < element.children.length; i++) result = this.treeFindChild(element.children[i], matchingId)
        return result
      }
      return null
    },
    // comment 0820
    // ' ')b
    // 추가로 코멘트 달면, 만약 이 treeFindChild가 자주 이용되는 친구라면,
    // grid에 데이터 주입 이후,
    // cellIds = { id: element, ..... } 형태로 Hashmap을 만드는 async method를 하나 돌리면 더 좋을수도 있을것 같지만, 뭐 막 그리드 아이템이 수천개가 되면 효과가 있을텐데, 그렇지 않으면 전혀 의미 없죵

    /**
     * 전체 데이터에서 item을 삭제합니다.(d&d에서 필요... 해당 요소만 삭제할 것인지, 하위 모두 삭제할 것인지)
     * @param {Array} all 전체 데이터
     * @param {Object} itm 삭제 할 객체
     * @param {String} range 삭제 할 범위 (해당 아이템[default]: 'only' / 하위 모두: 'all')
     */
    removeItems (all, itm, range = 'all') {
      all.find((item, index) => {
        if (item.id === itm.id) {
          if (range === 'all') { // 전체 삭제 => children요소가 있을 경우, 같이 삭제
            all.splice(index, 1)
            return all
          } else { // 선택된 row만 삭제 => children요소가 있을 경우, 부모와 같은 depth로
            const beforeArr = [...all].splice(0, index)
            const afterArr = [...all].splice(index + 1)
            return item.children.length > 0 ? beforeArr.concat(item.children, afterArr) : beforeArr.concat(afterArr)
            // comment 0820 ✅: 요 행은 필요 없거나, 아래와 같은 형태가 되는게 맞을것 같아요
            // const found = all.find(...)
            // 함수 내에서 외부 값(all)을 변형시키는것은 가능하면 지양해보아요 ^^
          }
        } else {
          if (item.children && item.children.length > 0) {
            item.children = this.removeItems(item.children, itm, range)
          }
        }
      })

      // this.grid.collectionView.refresh()
      return all
    },
    /**
     * 드래그 이벤트에서 item을 추가합니다.
     * @param {Array} all 전체 데이터
     * @param {object} dest 추가 될 목적지 객체
     * @param {object} itm 추가 되는 객체 데이터
     */
    addItems (all, dest, itm) {
      all.find((item, index) => {
        if ((item.id === dest.id) && !dest.groupUpper) item.children.push(itm)
        else if ((item.id === dest.id) && dest.groupUpper) {
          // var _idx = index === 0 ? 0 : index
          all.splice(index, 0, itm)
          return all
        } else if (item.children && Array.isArray(item.children)) {
          item.children = this.addItems(item.children, dest, itm)
        }
      })
      return all
    },
    /**
      * 그리드 상단의 [전체 펼침], [전체 접음]을 설정합니다.
      */
    gridExpand (state) {
      this.grid.rows.forEach(row => { row.isCollapsed = state })
      this.treeExpanded = !this.treeExpanded

      this.$forceUpdate()
    },
    /**
     * 해당 로우가 관계사면 font-weight: bold 적용
     */
    setRelationCompSty (grid) {
      grid.rows.forEach(rowGroup => {
        if (rowGroup._data.groupUpper === 0) rowGroup.cssClass = '-tree-bold-text'
      })
    }

  },
  data () {
    return {
      data: null,
      grid: null,
      treeExpanded: true, // 트리 전체 펼침 상태
      selectedRow: undefined // 선택한 로우
    }
  }
}
</script>
<style lang="scss">
.cmp-grid-wrapper {
  position: relative;
  .cmp-grid-tree {
    .wj-header.wj-cell {
      z-index: 10;
    }
    .wj-cell {
      overflow: visible;
      cursor: pointer;
      justify-content: flex-start;
      padding-left: $gap * 2;
      > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
    }
    .foldable-item {
      position: relative;
      display: flex;
      align-items: center;
      height: 40px;
      > .row-expand-button {
        position: absolute;
        top: 10px;
        left: -20px;
      }
    }
    .-tree-bold-text {
      font-weight: bold;
    }
  }

  .expand-button {
    position: absolute;
    top: 15px;
    right: 15px;
    color: $white;
    font-size: 12px;
    z-index: 10;
    display: block;
    &:hover {
      color: $pink;
    }
  }
}
</style>
