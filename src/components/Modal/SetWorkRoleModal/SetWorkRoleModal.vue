<!--
  * 파일명 : SetWorkRoleModal.vue
  * 파일 기능 : 업무 역할 관리(추가, 수정, 삭제) 모달
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 계정 관리 > 로그인 잠금 칼럼 체크박스 el-checkbox로 대체
 -->

<template>
  <el-dialog
    :title="$v('업무 역할 및 담당 자원 편집')"
    :visible.sync="isActive"
    class="set-work-role-modal"
    top="25vh"
    width="45%"
    @close="close"
  >
    <section class="modal-body">
      <cmp-grid
        :item-source.sync="tableData"
        :columns="workroleColumns"
        :init-custom-action="init"
        header-checkbox
        @checkedRowsData="setCheckedRows"
        class="content-area"
        :use-excel-download="false"
        :init-auto-select-row="checkedRows"
        init-auto-select-row-key="idx"
        :changing-page-reset="false"
      >
        <!-- paging-type="list" -->
        <!-- :height="442" -->
        <template #name="props">
          <el-input
            v-model="props.row.name"
            :placeholder="props.row.name? props.row.name : $t('common.ALERT.ROLE.003')"
            v-if="editStatus && props.cell._data.edit"
            @keypress.native.enter="applyUpdate"
          />
          <span v-else>{{ `${props.row.name} (${props.row.children.length})` }} </span>
        </template>
        <!-- /.전체 업무 역할 이름 -->
      </cmp-grid>

      <div class="button-area -vertical">
        <button
          class="button"
          type="is-primary"
          @click="addNewRole"
          :disabled="editStatus || (packageType === 'PL' && tableData.length > 1)"
        >
          {{ $t('common.BTN.ADMIN.createJobRole') }}
        </button>
        <button
          class="button"
          @click="editColumn"
          :disabled="checkedRows.length !== 1 || checkedRows[0].edit"
          v-if="!editStatus"
        >
          {{ $t('common.BTN.modify') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="applyUpdate"
          v-if="editStatus || (checkedRows.length === 1 && checkedRows[0].edit)"
        >
          {{ $t('common.BTN.complete') }}
        </button>
        <button
          class="button"
          type="is-anti"
          @click="updateCancel"
          v-if="editStatus || (checkedRows.length === 1 && checkedRows[0].edit)"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-anti"
          :disabled="!checkedRows.length || editStatus"
          @click="applyDelete"
        >
          {{ $t('common.BTN.delete') }}
        </button>
        <!-- <button
          class="button -modal-button"
          @click="confirm"
          type="is-primary"
        >
          적용
        </button> -->
      </div>
    </section>
  </el-dialog>
</template>
<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'

export default {
  name: 'SetWorkRoleModal',
  components: {
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    roleData: {
      type: Array,
      default: () => []
    }
  },
  created () {
    this.getTableData()
    this.getWorkFlow()
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
    },
    roleData (newVal) {
      this.getTableData(newVal)
    },
    editStatus (isEditingItem) {
      if (isEditingItem) this.tableData.forEach(row => { row.disable = true })
      else this.tableData.forEach(row => { row.disable = false })
    }
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    })
  },
  methods: {
    getTableData (roleData = this.roleData) {
      // this.tableData = [...roleData]
      console.log('@getTableData')
      this.tableData = JSON.parse(JSON.stringify(roleData))
      this.beforeData = this.tableData.map(data => {
        return {
          ...data,
          edit: false,
          disable: false
        }
      })
    },
    close () {
      this.setInitStatus()
      this.$emit('close')
    },
    init (grid) {
      this.grid = grid
    },
    setCheckedRows (params) {
      this.checkedRows = params
    },
    setInitStatus () {
      this.editStatus = false
      this.checkedRows = []
      this.tableData.forEach(item => {
        item.edit = false
        item.checked = false
      })
      this.tableData = cloneDeep(this.beforeData)
    },

    /**
     * [업무 역할 생성] 눌렀을 때, 최상위에 새로운 로우를 추가합니다.
     */
    addNewRole () {
      const isNewTask = this.tableData.filter(code => code.crud === 'create' && code.edit)
      if (isNewTask.length) return
      this.editStatus = true

      // const newRow = new wjGrid.Row()
      const newObj = {
        checked: true,
        name: this.newObj.name,
        children: this.newObj.children,
        edit: true,
        crud: 'create'
      }
      // newRow._data = newObj
      // this.grid.rows.insert(0, newRow)
      if (this.tableData?.length) this.tableData.unshift(newObj)
      else this.tableData.push(newObj)

      this.checkedRows = [this.tableData[0]]
    },
    /**
     * [완료] 눌렀을 때, 같은 역할 명이 있는지 검사 후, 변경사항을 저장 할 것인지 물어봅니다.
     */
    applyUpdate (e) {
      if (this.editing) return
      this.editing = true
      const rowData = this.tableData.filter(item => item.edit)[0]
      const beforeData = this.beforeData.filter(item => item.idx === rowData.idx)[0]
      if (rowData.name?.length === 0) {
        this.$alert(this.$t('common.ALERT.ROLE.003'))
        this.editing = false
        return
      }

      if (this.checkedRows[0]?.beforeName && this.checkedRows[0]?.beforeName === rowData.name) {
        this.tableData.forEach(data => { data.edit = false })
        // if (this.checkedRows.length && this.checkedRows[0].prevName === rowData.name) {
        // this.tableData.forEach(data => {
        //   data.disabled = false
        //   data.edit = false
        // })
        this.editing = false
        this.editStatus = false
        return
      }

      const existsRoleName = this.beforeData.filter(item => item.name === rowData.name)[0]

      if (existsRoleName) {
        this.$alert(this.$t('common.ALERT.ROLE.001'))
        this.editing = false
        return
      }

      this.$confirm(this.$t('common.CONFIRM.BASE.005'), '수정', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        let response
        try {
          if (rowData.crud === 'create') {
            response = await API.iam.createRole({
              roleName: rowData.name,
              roleUpper: 0
            })
          } else {
            response = await API.iam.updateRole({
              roleIdx: rowData.idx,
              roleName: rowData.name,
              roleUpper: 0
            })
          }
        } catch (e) {
          if (e.code === 'IAM041') {
            return this.$alert(this.$t('common.CONFIRM.ROLE.006'))
          }
          return console.log('@e :', e)
        }

        if (response) {
          this.$alert(this.$t('common.ALERT.BASE.022'))
          this.tableData.forEach(data => {
            data.checked = false
            data.edit = false
          })
          this.beforeData = cloneDeep(this.tableData)
          this.checkedRows = []
          this.editStatus = false
          if (rowData.crud === 'update' && beforeData) {
            this.$emit('confirm', beforeData, rowData)
          } else {
            this.$emit('confirm', beforeData, rowData)
          }
        } else {
          this.$alert(this.$t('common.ALERT.ROLE.002'))
        }
      }).catch(() => {
      }).finally(() => {
        setTimeout(() => {
          console.log(this.beforeData)
        }, 2000)
        this.editing = false
      })
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 데이터를 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    async applyDelete () {
      let isChidrenHasNames = ''
      await this.getWorkFlow()
      for (const i in this.checkedRows) {
        for (const j in this.activeWorkFlow) {
          if (this.activeWorkFlow[j].roleIdx === this.checkedRows[i].idx) {
            this.$alert(this.$t('common.ALERT.APPROVAL.006', { name: this.checkedRows[i].name }), {
              confirmButtonText: this.$t('common.BTN.confirm'),
              dangerouslyUseHTMLString: true
            })
            return false
          }
        }
        if (this.checkedRows[i].children?.length) {
          if (isChidrenHasNames !== '') {
            isChidrenHasNames += ', ' + this.checkedRows[i].name
          } else {
            isChidrenHasNames += this.checkedRows[i].name
          }
        }
      }

      let message
      if (isChidrenHasNames !== '') {
        // message = '선택한 업무역할 "' + isChidrenHasNames + '"은(는) 하위 역할이 존재합니다.<br>그래도 삭제하시겠습니까?'
        message = this.$t('common.CONFIRM.ROLE.005', { isChidrenHasNames })
      } else {
        // message = '선택한 업무 역할들을 삭제하시겠습니까?'
        message = this.$t('common.CONFIRM.ROLE.004')
      }

      this.$confirm(message, '', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        this.editStatus = false

        for (const i in this.checkedRows) {
          await API.iam.deleteRole({ roleIdx: this.checkedRows[i].idx })
          this.removeItems(this.checkedRows[i])
        }
        this.checkedRows = []
        this.$emit('confirm')
        this.$alert(this.$t('common.ALERT.BASE.017'))
      }).catch(() => false)
    },
    removeItems (removeObj) {
      let removeIdx
      this.tableData.forEach((data, index) => {
        if (data.name === removeObj.name) removeIdx = index
      })
      this.tableData.splice(removeIdx, 1)
      this.grid.rows.remove(this.grid.rows[removeIdx])
    },
    /**
     * [수정] 버튼을 눌렀을 때 동작하는 함수 입니다.
     */
    editColumn () {
      // this.workroleColumns[0].checkbox = false

      this.editStatus = true
      this.checkedRows[0].edit = true
      this.checkedRows[0].crud = 'update'
      this.$set(this.checkedRows[0], 'beforeName', this.checkedRows[0].name)
      // this.checkedRows[0].name = cloneDeep(this.checkedRows[0].name)
    },
    /**
     * [취소] '생성'일 때, 해당 로우 없앰, > '수정'일 때, 이전 설정되었던 이름(beforeName)으로 되돌아감
     */
    updateCancel () {
      // const rowData = this.tableData.filter(item => item.edit)[0]
      const rowData = this.checkedRows[0]

      if (rowData.crud === 'create') {
        this.tableData = cloneDeep(this.beforeData)
        this.checkedRows = []
      } else {
        rowData.edit = false
        rowData.name = rowData.beforeName
        // for (const i in this.tableData) {
        //   if (this.tableData[i].edit) {
        //     this.tableData[i].edit = false
        //     this.tableData[i].name = cloneDeep(this.tableData[i].name)
        //     delete this.tableData[i].crud
        //     break
        //   }
        // }
      }
      this.editStatus = false
    },
    async getWorkFlow () {
      const activeWorkFlow = await API.work.getWorkFlow({ active: true })

      if (activeWorkFlow?.length) {
        this.activeWorkFlow = JSON.parse(activeWorkFlow[0].workFlowJson)
      }
    }
  },
  data () {
    return {
      editing: false,
      isActive: this.active || false,
      tableData: [],
      beforeData: [],
      editStatus: false,
      checkedRows: [], // 다중 선택 로우 (체크박스)
      newObj: {
        checked: false,
        name: '',
        children: [],
        edit: true,
        disable: false
      },
      // 업무역할 생성 테이블 데이터
      workroleColumns: [
        // { header: true, binding: 'checked', width: 80, checkbox: true },
        { header: '전체 업무 (역할 갯수)', binding: 'name', width: '*', customHtml: true, keyPath: 'admin.ROLE.totalWork' }
      ],
      activeWorkFlow: undefined
    }
  }
}
</script>
<style lang="scss">
  .set-work-role-modal {
    margin-top: -100px;
    .modal-body {
      display: flex;
      width: 100%;
      > .content-area {
        height: 500px;
        width: calc(100% - 145px);
      }
        >.button-area { margin-left: $gap; }
    }
  }
</style>
