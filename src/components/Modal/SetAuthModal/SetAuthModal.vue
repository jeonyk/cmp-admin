<!--
  * 파일명 : SetAuthModal.vue
  * 파일 기능 : 역할 관리 권한 설정 모달
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2022-04-22
  * License By Shinsegae I&C serverAuthList.title !== selectedGroup
  * 2022-04-22 fix: 모든 서비스플렛폼 메뉴 보이게 수정
 -->

<template>
  <el-dialog
    v-loading="false"
    :title="$t('admin.ROLE.setPerm')"
    :visible.sync="isActive"
    class="set-auth-modal"
    width="50%"
    @close="close"
  >
    <section class="modal-body">
      <fold-panel-auth
        v-for="(serverAuthList) of authTableData"
        :key="serverAuthList.title"
        :title="serverAuthList.title"
        :is-collapsed="false"
      >
        <cmp-tree
          :item-source="serverAuthList.children"
          :columns="authColumns"
          header-visibility="None"
          :init-custom-action="init"
          @updateGrid="updateTree"
          @selectedRow="handleEmitSelectedRow"
          ref="tree"
          :use-all-expand="false"
          max-height="48vh"
          :init-collapsed="true"
        >
          <template #title="props">
            <div class="cell-wrap">
              {{ props.row.title }}
            </div>
          </template>

          <template #read="props">
            <div v-if="props.row.groupName === 'server'">
              <div class="fold-icon">
                <a
                  class="mdi fold-icon-up"
                  :class="[props.cell.isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up']"
                />
              </div>
            </div>
            <div
              v-else
              class="checkbox-wrap"
            >
              <el-checkbox
                v-model="props.row.read"
                @change="toggleCheckbox(props.row, 'read', props.row.read)"
                :disabled="checkboxDisabled"
                :indeterminate="props.row.indeterminate"
                ref="treeCheckbox"
                class="auth-tree-checkbox"
              />
            </div>
          </template>
        </cmp-tree>
      </fold-panel-auth>
    </section>

    <section class="modal-footer">
      <div class="modal-button-area">
        <button
          v-if="!checkboxDisabled"
          class="button -modal-button"
          type="is-anti"
          @click="e => {
            close()
          }"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="confirm"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </section>
  </el-dialog>
</template>

<script>
import FoldPanelAuth from '@/components/FoldPanel/FoldPanelAuth.vue'
// import { cloneDeep, filter, findIndex } from 'lodash'
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'SetAuthModal',
  components: {
    FoldPanelAuth
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: [Array, Object],
      default: () => []
    },
    checkboxDisabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      moduleInfo: 'cloud/getModuleInfo'
    })
  },
  created () {
    const servicedCloudList = cloneDeep(this.moduleInfo)
    delete servicedCloudList.network
    // 추후 서비스가 추가되었을때 여기 조건문에도 클라우드타입을 넣어주세요.
    this.$nextTick(() => {
      if (Object.values(servicedCloudList).some(el => el.type === 'private')) this.accessModifier.push('Private')
      if (Object.values(servicedCloudList).some(el => el.type === 'public')) this.accessModifier.push('Public')
    })
  },
  watch: {
    active (newVal) {
      if (newVal === false) {
        this.$refs.tree.forEach(({ grid }) => {
          grid.collapseGroupsToLevel(0)

          // 처음에 열면 모든 service(ex.AWS, NX)가 닫혀있는 상태로 만듭니다.
          grid.cells.rows[0].isCollapsed = true
        })
      }
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
    },
    data: {
      deep: true,
      handler (newVal) {
        if (newVal) {
          this.authTableData = cloneDeep(newVal)
          const tempPrivateObj = {}
          const tempPublicObj = {}
          // 모니터링 메뉴의 하위 요소는 보이지 않아야합니다.
          Object.values(this.authTableData).forEach((el, index, array) => {
            const thisObjectKey = Object.keys(this.authTableData)[index]
            el.forEach((el) => {
              if (el.routeTo === 'monitoring') {
                el.children = []
              }
            })
            // 어드만관리자는 최고관리자만 볼 수 있는 메뉴이기 때문에 권한설정에서 볼 수 없습니다.
            this.authTableData[thisObjectKey] = el.filter(el => el.routeTo !== 'set')
          })
          // 접근자에 따라 나눕니다.
          const servicedCloudList = cloneDeep(this.moduleInfo)
          delete servicedCloudList.network
          Object.values(servicedCloudList).forEach((el, index) => {
            this.authTableData[el.shortlyLabel].forEach((el) => {
              this.setIndeterminatedCheckDFS(el, 'read', el.read)
            })
            if (el.type === 'public') {
              tempPublicObj[el.displayLabel] = this.authTableData[el.shortlyLabel]
            } else if (el.type === 'private') tempPrivateObj[el.displayLabel] = this.authTableData[el.shortlyLabel]
            else console.log('vuex/moduleInfo에 type(private,public)이 없는 서비스가 존재합니다. type을 추가해주세요.')
          })

          this.accessPublicPlatforms = this.bindTreeToServer(tempPublicObj)
          this.accessPrivatePlatforms = this.bindTreeToServer(tempPrivateObj)
          this.authTableData = this.bindTreeToAccess(this.accessPrivatePlatforms, this.accessPublicPlatforms)

        // commonMenuList 에 하드코딩으로 등록한 메뉴의 모든 자식메뉴를 가져옵니다.
        // 모든 자식 메뉴를 commonMenuList에 등록할 필요 없습니다.
        // this.commonMenuList.forEach((commonMenu) => {
        //   const temp = filter(this.authTableData[0].children[0].children, { routeTo: commonMenu })[0]
        //   this.getFlattingCommonMenu(temp)
        // })
        }
      }
    }
  },
  methods: {
    close (e) {
      this.$emit('close')
    },
    confirm () {
      this.$emit('select', this.authTableData)
    },

    init (grid) {
      this.grid = grid

      this.updateTree(this.grid)
    },
    updateTree (grid) {
      console.log('update발생')
      this.grid = grid
      grid.cells.rows.forEach((el, index) => {
        if (el._data.groupName === 'server') {
          grid.cells.rows[index].cssClass = 'tree-row-server'
        }
      })
      // this.asyncCommonMenu()
      console.log(grid)
    },
    handleEmitSelectedRow (val) {
      // group 은 cloud service 를 의미합니다.(ex. Nutanix, AWS)
      // group을 선택했을 때 해당 service가 아닌 service는 닫는다.
      if (val._data.depth === 'group') {
        this.$refs.tree.forEach((el) => {
          const elGrid = el.grid
          if (elGrid.rows[0]._data.title !== val._data.title) {
            elGrid.cells.rows[0].isCollapsed = true
          }
        })
      }
    },
    /**
     * 체크박스를 토글 합니다. 자식 배열(children)이 있으면 자식 배열의 체크박스도 험께 토글합니다.
     * @param {Object, Array} item row 데이터
     * @param {String} key 토글 할 항목이 'read'인지, 'write'인지
     * @param {Boolean} state 체크박스의 상태
     */
    toggleCheckbox (item, key, state) {
      const node = item || undefined
      node.indeterminate = false
      // 부모요소가 true 이면 자식요소를 모두 true
      // false 면 false로 바꿔줍니다.

      if (item.children) {
        this.checkAllChildrenDFS(node, state)
      }
      if (item.parentNode && item.depth !== 'first') {
        this.checkAllParentDFS(node, state)
      }
    },
    /** 자식요소의 부모요소를 돌면서 처리합니다.
     * state 가 true 인경우 무조건 부모요소를 true로 줍니다.
     * state 가 false 인 경우 그 부모의 자식요소가 전부 false인 경우 부모요소를 false로 바꿔줍니다.
     */
    mounted () {
    },
    checkAllParentDFS (node, state) {
      if (!node.parentNode && node.parentNode === 'first') {
        return false
      } else {
        if (node.parentNode?.children) {
          const checkList = Array.from({ length: node.parentNode.children.length }, () => false)
          console.log(node.parentNode.children)
          node.parentNode.children.forEach((chNode, index) => {
            checkList[index] = chNode.read || false
          })
          console.log('state', state, checkList)
          if (state === false && checkList.every((el) => el === state)) {
            node.parentNode.read = state
          } else if (state === true) {
            node.parentNode.read = state
          }

          if ((checkList.some(el => el === true) && checkList.some((el) => el === false)) || node.parentNode.children.some((el) => el.indeterminate)) {
            this.$refs.treeCheckbox.forEach((el) => {
              if (el.$parent.context.row._data.title === node.parentNode.title) {
                node.parentNode.indeterminate = true
                node.parentNode.read = false
              }
            })
          } else {
            node.parentNode.indeterminate = false
          }
          this.checkAllParentDFS(node.parentNode, state)
        }
      }
    },
    // // 초기에 모든 메뉴의 트리를 돌면서 indeterminate를 설정해줍니다. (수정일: 2022.08.17)
    // // 초기에 indeterminate가 보이지 않는 현상이 있었습니다.
    setIndeterminatedCheckDFS (node, key, nodeRead) {
      const hasChildren = node?.children
      if (node.read || !hasChildren) {
        return node.read || false
      } else {
        const checkList = Array.from({ length: node.children?.length }, () => false)
        node.children.forEach((elNode, index) => {
          checkList[index] = this.setIndeterminatedCheckDFS(elNode, 'read', elNode.read)
        })
        if ((checkList.some(el => el === true) && checkList.some((el) => el === false)) || node.children.some((el) => el.indeterminate)) {
          node.indeterminate = true
          node.read = false
        }
      }
    },
    /** 부모요소(node)의 자식요소를 모두 체크힙니다. */
    checkAllChildrenDFS (node, state) {
      if (!node.children) return false // node에 자식이 없을때 빠져나온다.
      else {
        node.children.forEach(n => {
          n.read = state
          n.indeterminate = false
          this.checkAllChildrenDFS(n, state)
        })
      }
    },
    /** 어드민관리와 같은 공통메뉴가 추가 되면 반드시
     * commonMenuList에 메뉴의 routeTo 값을 추가해야합니다.
     * 아래 함수에(asyncCommonMenu)는 모든 클라우드 서비스의 commonMenuList에 추가된 공통메뉴를 동기화합니다.
     * ex) AWS 어드민 관리 true -> NX 어드민 관리 true 로 동기화
     **/
    // asyncCommonMenu () {
    //   this.commonMenuAllDepth.forEach((name) => {
    //     this.commonMenuGrid = { ...filter(this.grid._rows, { _data: { routeTo: name } })[0] }._data
    //     this.$refs.tree.forEach(({ grid }, index) => {
    //       if (grid) {
    //         const findedIndex = findIndex(grid?._rows, filter(grid?._rows, { _data: { routeTo: name } })[0])
    //         grid.rows[findedIndex]._data = this.commonMenuGrid
    //       }
    //     })
    //   })
    // },

    /**
     * 현재 트리 접근제한자로 한번 묶습니다.
     */
    bindTreeToAccess (privateData, publicData) {
      console.log('접근제한자로 한번묶고')
      let result = []
      result = this.accessModifier.map((access, index) => {
        return {
          accessible: ['PL', 'BS', 'STD', 'ENT'],
          depth: 'group',
          id: access,
          groupName: 'access',
          read: false,
          selected: false,
          title: access,
          icon: access,
          children: access === 'Private' ? privateData : publicData
        }
      })
      return result
    },
    /**
     * 현재 트리를 서버로으로 한번 묶습니다.
     */
    bindTreeToServer (nowData) {
      console.log('nowData:', nowData)
      let result = []
      result = Object.entries(nowData).map((el) => {
        console.log('@accessPublicPlatforms:', el)
        const serviceName = el[0]
        const value = el[1]
        return {
          accessible: ['PL', 'BS', 'STD', 'ENT'],
          depth: 'group',
          id: serviceName,
          groupName: 'server',
          read: false,
          selected: false,
          title: serviceName,
          icon: serviceName,
          children: value
        }
      })
      return result
    }

    /** commonMenuList 에 공통메뉴를 넣어주면 해당 함수에서
     ** commonMenuAllDepth에 해당 공통메뉴의 자식요소들이 모두 들어갑니다.
     ** commonMenuAllDepth가 공통메뉴를 동기화 하기위해서 사용됩니다.
     **/
    // getFlattingCommonMenu (items) {
    //   if (!items?.children) {
    //     this.commonMenuAllDepth.push(items.routeTo)
    //     return false
    //   } else {
    //     this.commonMenuAllDepth.push(items.routeTo)
    //     items.children.forEach(e => {
    //       this.getFlattingCommonMenu(e)
    //     })
    //   }
    // }
  },
  data () {
    return {
      isActive: this.active || false,
      getGroupLoading: true,
      loading: true,
      authColumns: [
        { binding: 'title', header: '메뉴', width: '*', foldable: true, keyPath: 'admin.ROLE.menu' },
        { binding: 'read', header: ' ', width: 150, customHtml: true }
      ],
      authTableData: [],
      accessModifier: [], // Private or Public
      accessPublicPlatforms: [],
      accessPrivatePlatforms: [],
      selectedGroup: '',
      // sleectedService: '',
      tempSelected: [],
      indeterminateData: false

      /** routeTo 만 등록해준다면
       * commonMenuRouteList: [] 에 create 훅에서 해당 요소의 자식요소를 등록
       * 공통메뉴의 동시 체크를 위해서 사용됩니다.
       **/
      // commonMenuList: ['set'],
      // commonMenuAllDepth: [],
      // commonMenuGrid: {}
    }
  }
}
</script>
<style lang="scss">
  .set-auth-modal {
    // margin-top: -100px;
    .modal-body {
      margin-bottom: $gap-m;
      height: 64vh;
      overflow: hidden;
      .wj-cell {
        justify-content: flex-start;
        padding-left:$gap * 3;
        &:first-of-type.tree-row-server{
          font-weight: 600;
          >div:first-of-type {
            margin-left: -40px;
          }
          & .row-expand-button {
            display: none;
          }
        }
         &.tree-row-server {
           & .row-expand-button {
            display: none;
          }
         }
        .checkbox-wrap {
          width: 72px;
          .is-indeterminate {
            .el-checkbox__inner {
              background-color: white;
              &:before{
                background-color: black;
                height: 4px;
              }
            }
          }
        }
        .fold-icon {
          position: absolute;
          width: 26px;
          min-width: 26px;
          height: 26px;
          line-height: 26px;
          right: 0px;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 6px;
          .fold-icon-up {
            width: 100%;
            height: 100%;
            font-size: 43px;
            font-weight: 300;
          }
        }
         .cell-wrap {
          position: relative;
          display: flex;
          align-items: center;
          padding-left: 5px;
          height: 28px;
          .row-expand-button {
            position: absolute;
            top: 3px;
            left: 15px;
            &:hover {
              > * { color: $main-red; }
            }
          }
        }
      }
    }
  }
</style>
<style lang="scss">
.set-auth-modal {
  div[wj-part="root"] {
    overflow:hidden;
    div[wj-part="cells"] {
      overflow:hidden;
    }
  }
}
</style>
