<!--
  * 파일명 : EditCheckListModal.vue
  * 파일 기능 : 결재 Work Flow 확인 사항 추가 및 편집 모달
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-01-29
  * License By Shinsegae I&C
  * 2021-01-29 fix: 모달 오픈시, body 스크롤 제거 ... 공통 적용, 이에 따른 불필요 코드 제거
 -->

<template>
  <el-dialog
    :title="$t('admin.WF.editCheck')"
    :visible.sync="isActive"
    class="edit-check-list-modal"
    @close="close"
    width="1200px"
    v-loading="saveLoading || loading"
  >
    <!-- v-cloak -->
    <section
      class="modal-contents modal-inner-scroll"
      ref="editCheckList"
    >
      <draggable
        v-if="copyData.length"
        class="role-set-list"
        :list="copyData"
        draggable=".role-set-item"
        :options="{animation: 250}"
        :group="{name: 'role', pull: 'clone', put: false}"
        handle=".-draggable-icon"
        :sort="false"
      >
        <li
          class="role-set-item"
          v-for="(item,index) in copyData"
          :key="index"
        >
          <!-- @click="(!item.edit) ? toggleListEdit(item, true) : null" -->
          <div
            @click="toggleListEdit(item, !item.edit)"
            style="cursor: pointer;"
          >
            <work-flow-fold-panel
              :data="item"
              fold-state="on"
              @delete="deleteData(index, copyData)"
              ref="foldPanel"
              :foldable="false"
              :class="['checklist-fold-panel', {'-active': item.edit}]"
              :custom-id="item.id"
              :is-check-list="true"
              :deletable="!item.edit"
            >
            <!-- setDefaultTitle(copyData) -->
            <!-- <template #header-suffix>
              <el-checkbox
                v-model="item.required"
                v-if="item.type !== 'dropdown' && item.type !== 'inputbox'"
              >
                필수
              </el-checkbox>
            </template> -->
            </work-flow-fold-panel>
          </div>
        </li>
      </draggable>

      <div
        v-else
        class="empty-data"
      >
        {{ $t('common.PLACEHOLDER.noData') }}
      </div>

      <div class="add-area">
        <el-dropdown
          trigger="click"
          @command="setNewCheckListType"
          placement="bottom"
        >
          <a class="mdi mdi-plus-circle add-button" />

          <el-dropdown-menu
            slot="dropdown"
          >
            <el-dropdown-item command="text">
              {{ $t('admin.WF.text') }}
            </el-dropdown-item>
            <el-dropdown-item command="radio">
              {{ $t('admin.WF.radio') }}
            </el-dropdown-item>
            <el-dropdown-item command="checkbox">
              {{ $t('admin.WF.checkBox') }}
            </el-dropdown-item>
            <el-dropdown-item command="dropdown">
              {{ $t('admin.WF.dropdown') }}
            </el-dropdown-item>
            <el-dropdown-item command="inputbox">
              {{ $t('admin.WF.input') }}
            </el-dropdown-item>
            <!-- <el-dropdown-item command="file">
              파일업로드
            </el-dropdown-item> -->
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </section>

    <section class="modal-footer">
      <div class="big-button-area">
        <button
          class="button -modal-button -alert"
          type="is-anti"
          @click="cancel"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          type="is-primary"
          @click="confirm"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </section>
  </el-dialog>
</template>
<script>
import draggable from 'vuedraggable'
import WorkFlowFoldPanel from '@/components/WorkFlowFoldPanel/WorkFlowFoldPanel'
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  name: 'EditChecklistModal',
  components: {
    draggable,
    'work-flow-fold-panel': WorkFlowFoldPanel
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    },
    originRoleFlowProcess: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  // computed: {
  //   copyData () {
  //     return this.copyData
  //   }
  // },
  watch: {
    data (newValue) {
      this.setCopyData(newValue)
    },
    active (newVal) {
      this.isActive = newVal

      // this.setCopyData(this.data)
    },
    isActive (newVal) {
      this.active = newVal
    }
    // data (newVal) {
    //   this.copyData = newVal
    // }
  },
  mounted () {
    this.setCopyData(this.data)
  },
  methods: {
    /** *
     *
     */
    setCopyData (param) {
      const data = cloneDeep(param)
      this.copyData = data.map(item => {
        return {
          ...item,
          foldState: 'on',
          required: false,
          isCheckList: true
        }
      })
    },
    close (title) {
      this.$emit('close')
      // this.toggleListEdit(this.copyData, false)
      this.copyData = JSON.parse(JSON.stringify(this.data))
    },
    /**
     * [취소] 버튼 눌렀을 때, 편집 취소..
     */
    cancel () {
      this.$confirm(this.$t('common.CONFIRM.PROJECT.010'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => {
        this.close()
      }).catch(() => {
        return false
      })
    },
    /**
     * [확인] 버튼 클릭
     */
    confirm () {
      if (this.isEditingCheckList()) return this.$alert('편집 중인 항목이 있습니다.')// 편집 중인 항목이 있습니다.

      const toNameMap = {}
      for (const i in this.copyData) {
        if (toNameMap[this.copyData[i].title]) {
          this.$alert(this.$t('common.ALERT.APPROVAL.010', { message: '확인 사항' }))
          return
        } else {
          toNameMap[this.copyData[i].title] = true
        }
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.016'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        try {
          this.saveLoading = true
          const payload = this.copyData.map(item => {
            return {
              ...item,
              setList: JSON.stringify(item.setList),
              workFlowCheckSetList: JSON.stringify(item.setList)
            }
          //   item.foldState = 'close'
          //   item.edit = false
          //   item.isCheckList = true
            // item.setList = JSON.stringify(item.setList)
            // item.workFlowCheckSetList = JSON.stringify(item.setList)
          //   // if (item.type === 'radio') item
          })
          const upsertWorkFlowCheckRes = await API.work.upsertWorkFlowCheckList(payload)
          if (upsertWorkFlowCheckRes) {
            this.$emit('save', true)
          } else this.$alert(this.$t('common.ALERT.APPROVAL.003'))
        } catch (error) {
          console.error(error)
          this.$aler('확인사항 저장 에러: ', error)
        } finally {
          this.saveLoading = false
        }
      }).catch(() => {
        return false
      })
    },
    /**
     * 배열에서 오브젝트를 삭제합니다.
     * @param {Object} item 삭제 할 오브젝트
     * @param {Array} list 전체 데이터
     */
    deleteData (index, list) {
      if (list[index].workFlowCheckIdx) {
        for (const i in this.originRoleFlowProcess) {
          for (const j in this.originRoleFlowProcess[i].beforeCheckList) {
            if (this.originRoleFlowProcess[i].beforeCheckList[j].workFlowCheckIdx === list[index].workFlowCheckIdx) {
              this.$alert(this.$t('common.ALERT.APPROVAL.005'), '', {
                dangerouslyUseHTMLString: true
              })
              return
            }
          }
          for (const j in this.originRoleFlowProcess[i].afterCheckList) {
            if (this.originRoleFlowProcess[i].afterCheckList[j].workFlowCheckIdx === list[index].workFlowCheckIdx) {
              this.$alert(this.$t('common.ALERT.APPROVAL.005'), '', {
                dangerouslyUseHTMLString: true
              })
              return
            }
          }
        }
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.008'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        list.splice(index, 1)
      }).catch(() => { return false })
    },
    /**
     * 추가 할 체크리스트의 타입을 결정하면 모든 편집 상태를 false로, copyData에 리스트를 추가합니다..
     * @param {Object} item 삭제 할 오브젝트
     * @param {Array} list 전체 데이터
     */
    setNewCheckListType (command) {
      // if (this.isEditingCheckList()) return this.$alert(this.$t('common.ALERT.BASE.011'))

      // this.toggleListEdit(this.copyData, false)
      this.addListPanel({
        list: this.copyData,
        edit: true,
        type: command
      })
    },
    isEditingCheckList () {
      return this.copyData.some(item => !!item.edit)
    },
    /**
     * 편집 상태를 설정합니다.
     * @param {Array, Object} list 편집 상태 토글 할 대상
     * @param {Boolean} state 편집 상태
     */
    toggleListEdit (list, state) {
      // if (Array.isArray(list)) {
      //   list.forEach(item => {
      //     item.edit = state
      //   })
      // } else {
      //   // this.setDefaultTitle(this.copyData)
      //   list.edit = state
      // }
      console.log('@@@@@@', list)
      if (list.edit) {
        if (this.isEmptyData(list)) return this.$alert(this.$t('common.ALERT.BASE.037')) // 빈 칸을 채워주세요.
      }
      if (typeof state === 'boolean') list.edit = state
      else list.edit = !list.edit
    },
    /**
     * 편집 완료 전, 빈 값이 있는지 확인합니다.
     * @return {Boolean} true: 빈 값이 있음
     */
    isEmptyData (data) {
      if (!data.title) return true

      for (let i = 0; i < data.setList.length; i++) {
        if (data.type === 'text') continue

        if (data.type !== 'radio' && !data.setList[i].title) return true

        if (!['text', 'checkbox', 'dropdown', 'inputbox'].includes(data.type) && !data.setList[i].value) return true

        if (data.setList[i].children?.length &&
          !data.setList[i].children.every(item => item.title)) return true
      }

      return false
    },
    /**
     * 확인사항을 추가합니다.
     * @param {Array} list 추가 되는 곳의 배열
     * @param {Boolean} edit 추가되는 패널의 편집 상태
     * @param {String} type 추가되는 패널의 타입(dropdown, checkbox ...)
     */
    addListPanel (
      {
        list = null,
        edit = false,
        type = ''
      }) {
      let setList = []
      if (type) {
        if (type === 'dropdown') {
          setList = [{
            value: '',
            title: '',
            children: [{ title: '' }]
          }]
        } else if (type === 'radio') {
          setList = [{ title: '', value: '' }, { title: '', value: '' }]
        } else setList = [{ value: '', title: '' }]
      }

      const listObj = {
        id: `moreList_${Math.random().toString(36).substr(2, 9)}`,
        isCheckList: true,
        title: '',
        setList,
        radioVal: '',
        edit,
        type,
        foldState: 'on'
      }
      list.push(listObj)
    }
    /**
     * 기본 값 입력
     */
    // setDefaultTitle (list, defaultText = '제목') {
    //   list.forEach(item => {
    //     if (!item.title) item.title = defaultText
    //     if (list === this.copyData && item.setList && item.setList.length > 0) this.setDefaultTitle(item.setList, '옵션')
    //   })
    // }

  },
  data () {
    return {
      test: [],
      isActive: this.active || false,
      copyData: [],
      saveLoading: false
    }
  }
}
</script>
<style lang="scss">
  .edit-check-list-modal {
    margin-top: -80px;
    .modal-contents {
      position: relative;
      overflow-y: auto;
      max-height: 65vh;
      .role-set-list {
        display: inline-flex;
        flex-wrap: wrap;
        margin: -$gap 0 0 calc(-1 * #{$gap});
        width: calc(100% + #{$gap});
        > .role-set-item {
          margin: $gap 0 0 $gap;
          width: calc((100% - #{$gap * 3}) / 3);
          min-width: 300px;
          .workflow-fold-panel.checklist-fold-panel {
            color: $white;
            background:$ticket-back-color;
            border-color: $dark-slate;
            > .fold-body {
               &::before {
                background-color: $dark-slate;
              }
              .el-input__inner, .el-textarea__inner {
                color: inherit;
                border-color: #444;
                 &::placeholder {
                  color: #aaa;
                }
              }
            }

            &.-active {
              color: $color-grey;
              background-color: $white;
              .el-input__inner, .el-textarea__inner {
                  border-color: #aaa;
                }
              > .fold-body {
                &::before {
                  background-color: $lighter-gray;
                }

              }
            }
            &:not(.-active) {
              .el-checkbox {
                & + .el-checkbox__label { color: inherit; }
                .el-checkbox__input {
                  &.is-checked + .el-checkbox__label { color: $color-lightgrey ; }
                }
              }
              .el-radio {
                & + .el-radio__label { color: inherit; }
                .el-radio__input {
                  &.is-checked + .el-radio__label { color: $color-lightgrey ; }
                }
              }
              .el-select {
                .el-input {
                  .el-input__inner:focus { color: #888; }
                }
              }
            }
          }
        }
      }

      .add-area {
        position: relative;
        margin: $gap;
        display: flex;
        align-items: center;
        justify-content: center;
        > .mdi {
          height: 20px;
          -webkit-filter: invert(50%);
          filter: invert(50%);
          &:hover {color: $main-red;}
        }
      }
    }
  }
</style>
