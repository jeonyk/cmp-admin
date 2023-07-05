<!--
  * 파일명 : SetWorkFlow.vue
  * 파일 기능 : 결재 Work Flow 관리(추가, 삭제, 변경, 초기화 등)
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-05
  * License By Shinsegae I&C
  * 2021-02-05 fix: 그리드 로딩 텍스트 일부 수정
 -->

<template>
  <div class="set-workflow">
    <section
      class="set-workflow-content"
      v-loading="loading"
      :element-loading-text="$t('common.PLACEHOLDER.loadingWait')"
    >
      <dashboard-panel
        class="set-workflow-area -role"
        :title="$t('admin.WF.role')"
      >
        <template #header>
          <div class="button-area -right">
            <button
              type="is-icon"
              :class="['button', '-arrow-button', {'-disable': scrollLeft === 0}]"
              @click="movePanel('prev')"
              :disabled="scrollLeft === 0"
            >
              <i class="arrow-icon -prev" />
            </button>
            <button
              :class="['button', '-arrow-button',
                       {'-disable': sctollHrzEnd === 0}]"
              type="is-icon"
              @click="movePanel('next')"
              :disabled="sctollHrzEnd === 0"
            >
              <i class="arrow-icon -next" />
            </button>
          </div>
        </template>

        <div class="role-set-list role-flow-process">
          <draggable
            :list="roleFlowProcess"
            draggable=".role-sections"
            :group="{name: 'roleGroup', pull: false, put: false}"
            :animation="250"
            handle=".-draggable-icon"
            @end="onDragEnd(...arguments, 'role')"
            @change="roleDragAndDrop"
          >
            <div
              class="role-sections"
              v-for="(flow, index) in roleFlowProcess"
              :key="index"
            >
              <work-flow-fold-panel
                :data="flow"
                fold-state="on"
                @delete="deleteData(index, roleFlowProcess, 'role')"
                @save="flow.edit = false"
                :foldable="false"
                class="role-fold-panel"
              >
                <template #header-prefix>
                  <span class="role-index-tag">
                    {{ index + 1 }}
                  </span>
                </template>
                <article class="work-drop-body -checklist">
                  <h5 class="body-title">
                    {{ $t('admin.WF.priorCheck') }}
                  </h5>
                  <draggable
                    :list="flow.beforeCheckList"
                    draggable=".role-set-item"
                    :group="{name: 'roleChecklistGroup', pull: false, put: true}"
                    data-zone="roleChecklistGroup"
                    handle=".-draggable-icon"
                    :sort="true"
                    :ghost-class="flow.beforeCheckList.length? '' :'ghost'"
                    @end="onDragEnd"
                    @change="dragEvent(...arguments, flow, 'beforeCheckList')"
                  >
                    <li
                      v-if="flow.beforeCheckList && !flow.beforeCheckList.length"
                      class="empty-zone"
                      @dragenter="(e)=>onDragEnter(e)"
                      @dragleave="(e)=>onDragLeave(e)"
                    >
                      {{ $t('admin.WF.dragInfo') }}
                    </li>
                    <li
                      v-else
                      class="role-detail-item -checklist"
                      v-for="(item, idx) in flow.beforeCheckList"
                      :key="idx"
                      ref="checkListZone"
                    >
                      <work-flow-fold-panel
                        class="detail-fold-panel"
                        :data="item"
                        @delete="deleteData(idx, flow.beforeCheckList)"
                        :deletable="item.deletable"
                        :foldable="false"
                        @click="selectLabel('beforeCheckList', flow, item, ...arguments)"
                        :draggable="false"
                      />
                    </li>
                  </draggable>
                </article>
                <article class="work-drop-body -work">
                  <draggable
                    :list="flow.taskList"
                    draggable=".role-set-item"
                    :group="{name: 'roleWorkGroup', pull: false, put: true}"
                    data-zone="roleWorkGroup"
                    :animation="250"
                    handle=".-draggable-icon"
                    :sort="true"
                    @change="dragEvent(...arguments, flow, 'taskList')"
                    :ghost-class="flow.taskList.length? '' :'ghost'"
                    @end="onDragEnd"
                  >
                    <h5 class="body-title">
                      {{ $t('admin.WF.task') }}
                    </h5>
                    <li
                      v-if="flow.taskList && !flow.taskList.length"
                      class="empty-zone"
                      @dragenter="(e)=>onDragEnter(e)"
                      @dragleave="(e)=>onDragLeave(e)"
                    >
                      {{ $t('admin.WF.dragInfoTask') }}
                    </li>
                    <li
                      v-else
                      class="role-detail-item"
                      v-for="(item, idx) in flow.taskList"
                      :key="idx"
                      ref="workListZone"
                    >
                      <work-flow-fold-panel
                        :data="item"
                        @delete="deleteData(idx, flow.taskList)"
                        :deletable="item.deletable"
                        :foldable="false"
                        @click="selectLabel('taskList', flow, item, ...arguments)"
                        class="detail-fold-panel"
                        :draggable="false"
                      >
                        <template #header-prefix>
                          <span
                            class="role-readable-tag"
                            v-if="item.workFlowTaskExecutePerm"
                          >
                            on
                          </span>
                        </template>
                      </work-flow-fold-panel>
                    </li>
                  </draggable>
                </article>
                <article class="work-drop-body -checklist">
                  <h5 class="body-title">
                    {{ $t('admin.WF.postCheck') }}
                  </h5>
                  <draggable
                    :list="flow.afterCheckList"
                    draggable=".role-set-item"
                    :group="{name: 'roleChecklistGroup', pull: false, put: true}"
                    data-zone="roleChecklistGroup"
                    handle=".-draggable-icon"
                    :sort="true"
                    :ghost-class="flow.afterCheckList.length? '' :'ghost'"
                    @end="onDragEnd"
                    @change="dragEvent(...arguments, flow, 'afterCheckList')"
                  >
                    <li
                      v-if="flow.afterCheckList && !flow.afterCheckList.length"
                      class="empty-zone"
                      @dragenter="(e)=>onDragEnter(e)"
                      @dragleave="(e)=>onDragLeave(e)"
                    >
                      {{ $t('admin.WF.dragInfo') }}
                    </li>
                    <li
                      v-else
                      class="role-detail-item -checklist"
                      v-for="(item, idx) in flow.afterCheckList"
                      :key="idx"
                      ref="checkListZone"
                    >
                      <work-flow-fold-panel
                        class="detail-fold-panel"
                        :data="item"
                        @delete="deleteData(idx, flow.afterCheckList)"
                        :deletable="item.deletable"
                        :foldable="false"
                        @click="selectLabel('afterCheckList', flow, item, ...arguments)"
                        :draggable="false"
                      />
                    </li>
                  </draggable>
                </article>
              </work-flow-fold-panel>
            </div>
            <small class="add-area">
              <a
                class="mdi mdi-plus-circle -add-button"
                @click="clickedAddRole"
              />
              <!-- @click="addListPanel(roleFlowProcess ,edit = true)" -->
            </small>
          </draggable>
        </div>
      </dashboard-panel>
      <!-- 역할 -->

      <i class="db-arrow-icon" />

      <dashboard-panel
        class="set-workflow-area -other"
        :title="$t('admin.WF.task')"
      >
        <template #header>
          <a
            class="expand-button"
            @click.stop="expandPanel({
              data: workListData,
              name:'workList',
              state: 'close'})"
            v-if="foldState.workList"
          >
            {{ $t('common.BTN.fold') }}
          </a>
          <a
            class="expand-button"
            @click.stop="expandPanel({
              data: workListData,
              name:'workList',
              state: 'on'})"
            v-else
          >
            {{ $t('common.BTN.expand') }}
          </a>
        </template>
        <draggable
          class="role-set-list"
          :list="workListData"
          draggable=".role-set-item"
          :animation="250"
          :group="roleWorkGroupSetting"
          :clone="clone"
          handle=".-draggable-icon"
          @end="onDragEnd"
          :sort="false"
        >
          <li
            class="role-set-item"
            v-for="(item, index) in workListData"
            :key="index"
          >
            <work-flow-fold-panel
              :data="item"
              :fold-state="item.foldState"
              :use-tag="true"
              :deletable="false"
              @save="item.edit = false"
              @workFlowTaskExecutePerm="setActiveTask(...arguments, item)"
            />
          </li>
        </draggable>
      </dashboard-panel>
      <!-- 업무 -->

      <dashboard-panel
        class="set-workflow-area -other"
        :title="$t('admin.WF.check')"
      >
        <template #header>
          <a
            class="expand-button"
            @click.stop="expandPanel({
              data: checkListData,
              name:'checkList',
              state: 'close'})"
            v-if="foldState.checkList"
          >
            {{ $t('common.BTN.fold') }}
          </a>
          <a
            class="expand-button"
            @click.stop="expandPanel({
              data: checkListData,
              name:'checkList',
              state: 'on'})"
            v-else
          >
            {{ $t('common.BTN.expand') }}
          </a>
        </template>
        <draggable
          class="role-set-list"
          :list.sync="checkListData"
          draggable=".role-set-item"
          :animation="250"
          :group="roleChecklistGroupSetting"
          :clone="clone"
          handle=".-draggable-icon"
          @end="onDragEnd"
          :sort="false"
        >
          <li
            class="role-set-item"
            v-for="(item,index) in checkListData"
            :key="index"
          >
            <work-flow-fold-panel
              :data="item"
              :fold-state="item.foldState"
              @delete="deleteData(index, checkListData, 'checkList')"
              class="checklist-fold-panel"
              :is-check-list="true"
            />
          </li>
        </draggable>
        <div class="add-area">
          <a
            class="mdi mdi-plus-circle"
            @click="activeEditCheckList"
          />
        </div>
      </dashboard-panel>
    </section>

    <section class="button-area -center -form-bottom">
      <!-- <button
        class="button -cancel"
        type="is-anti"
        @click="cancelWorkFlow('cancel')"
        size="is-large"
      >
        {{ $t('common.BTN.reset') }}
      </button> -->
      <button
        class="button -cancel"
        @click="cancelWorkFlow('init')"
        size="is-large"
      >
        <!-- 새 워크플로우 -->
        {{ $t('common.BTN.ADMIN.newWorkflow') }}
      </button>
      <button
        class="button -confirm"
        type="is-primary"
        @click="createWorkFlow"
        size="is-large"
      >
        <!-- 저장 -->
        {{ $t('common.BTN.save') }}
      </button>
    </section>
    <edit-check-list-modal
      :active="editCheckListModal"
      @close="editCheckListModal = false"
      :data="checkListData"
      :origin-role-flow-process="originRoleFlowProcess"
      :loading="chkeckListLoading"
      @save="saveCheckList"
    />

    <el-dialog
      :title="$t('common.BTN.ADMIN.addJobRole')"
      :visible.sync="addRoleModal"
      class="set-work-role-modal"
      top="25vh"
      width="45%"
      @close="addRoleModal = false"
    >
      <section class="modal-body">
        <cmp-grid
          :item-source="addRoleList"
          :columns="workroleColumns"
          is-read-only
          header-checkbox
          @checkedRowsData="setAddRoleCheckedRowsFunc"
          class="content-area"
          :paging-type="list"
          :use-excel-download="false"
        />
      </section>
      <section class="modal-footer">
        <div class="big-button-area">
          <button
            class="button -modal-button -alert"
            type="is-anti"
            @click="addRoleModal = false"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            :disabled="setAddRoleCheckedRows.length === 0"
            @click="addRoles"
          >
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>
    </el-dialog>
  </div>
</template>
<script>
import draggable from 'vuedraggable'
import { mapState } from 'vuex'
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import WorkFlowFoldPanel from '@/components/WorkFlowFoldPanel/WorkFlowFoldPanel'
import EditCheckListModal from '@/components/Modal/EditCheckListModal/EditCheckListModal'
import { cloneDeep, filter, keys } from 'lodash'

export default {
  name: 'SetWorkFlow',
  components: {
    draggable,
    'dashboard-panel': DashboardPanel,
    'work-flow-fold-panel': WorkFlowFoldPanel,
    'edit-check-list-modal': EditCheckListModal
  },
  created () {
    if (typeof window !== 'undefined') {
      // document.addEventListener('keyup', this.keyPress)
      // document.removeEventListener('dragover', this.OnDragOver)
      // document.removeEventListener('dragleave', this.OnDraLeave)
    }

    this.initSetList()
  },
  mounted () {
    this.scrollContainer = document.querySelector('.role-flow-process')
    if (this.scrollContainer) {
      setTimeout(() => {
        this.scrollContainer.addEventListener('scroll', this.scrollHandler)
      }, 1000)
    }
  },
  beforeDestroy () {
    if (typeof window !== 'undefined') {
      // document.removeEventListener('click', this.clickedOutside)
      // document.removeEventListener('keyup', this.keyPress)
      // document.removeEventListener('dragover', this.OnDragOver)
      // document.removeEventListener('dragleave', this.OnDraLeave)
    }
    if (this.scrollContainer) this.scrollContainer.removeEventListener('scroll', this.scrollHandler)
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    })
  },
  watch: {

  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    async initSetList () {
      this.loading = true
      await this.getRoleList()
      await this.getWorkFlowTaskList()
      await this.getWorkFlowCheckList()
      await this.getWorkFlow()
      this.loading = false
    },
    scrollHandler (e) {
      if (!this.scrollThrottle) {
        this.scrollThrottle = setTimeout(() => {
          this.scrollThrottle = null
          this.scrollLeft = e.target.scrollLeft
          this.sctollHrzEnd = (e.target.scrollWidth - this.scrollContainer.offsetWidth) - this.scrollLeft
        }, 50)
      }
    },
    /**
     * 상단의 [전체 펼침], [전체 접음]을 설정합니다.
     * @param {Object} obj {data, name, state}
     */
    expandPanel (obj) {
      obj.data.forEach(item => {
        item.foldState = obj.state
      })
      this.foldState[obj.name] = !this.foldState[obj.name]
    },
    /**
     * 패널 펼침/닫힘을 토글합니다.
     * @param {Object} item 토글 할 객체
     * @param {String} 토글 상태 ('on', 'close')
     */
    toggleFoldPanel (data, state) {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          item.foldState = state
        })
      } else {
        data.foldState = state
      }

      // if (state === 'on') state = 'close'
      // else state = 'on'
    },
    /**
     * 배열에서 오브젝트를 삭제합니다.
     * @param {Object} item 삭제 할 오브젝트
     * @param {Array} list 전체 데이터
     */
    deleteData (index, list, type) {
      if (type === 'role') {
        if (list.length < 2) {
          this.$alert(this.$t('common.ALERT.ROLE.008'))
          return
        }
        // this.$confirm('"' + list[index].roleName + '" 업무 역할을 제거 하시겠습니까?<br><br>*제거 후 아래 저장을 클릭하여 적용이 필요합니다.', '알림', {
        this.$confirm(this.$t('common.CONFIRM.ROLE.001', { roleName: list[index].roleName }), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel'),
          dangerouslyUseHTMLString: true
        }).then(() => {
          for (const i in list[index].taskList) {
            if (list[index].taskList[i].workFlowTaskExecutePerm) {
              this.setActiveTaskRoleName(list[index].taskList[i].workFlowTaskCode, { roleName: '', index: 0, roleIdx: 0 })
            }
          }
          list.splice(index, 1)
          this.$forceUpdate()
        }).catch(() => { return false })
      } else if (type === 'checkList') {
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
              // this.$alert('현재 워크플로우에서 사용중인<br>확인 사항은 삭제할 수 없습니다.', '', {
              this.$alert(this.$t('common.ALERT.APPROVAL.005'), '', {
                dangerouslyUseHTMLString: true
              })
              return
            }
          }
        }
        // this.$confirm('"' + list[index].title + '" 확인 사항을 삭제 하시겠습니까?', '알림', {
        this.$confirm(this.$t('common.CONFIRM.CONF.001', { title: list[index].title }), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel'),
          dangerouslyUseHTMLString: true
        }).then(async () => {
          await API.work.deleteWorkFlowCheck(list[index].workFlowCheckIdx)
          list.splice(index, 1)
          this.$forceUpdate()
        }).catch(() => { return false })
      } else {
        if (this.clickedData) {
          if (this.clickedData.type === 'taskList') {
            if (this.clickedData.item.workFlowTaskExecutePerm) {
              this.setActiveTaskRoleName(this.clickedData.item.workFlowTaskCode, { roleName: '', index: 0, roleIdx: 0 })
            }
            for (const i in this.workListData) {
              if (this.workListData[i].workFlowTaskCode === this.clickedData.item.workFlowTaskCode) {
                this.workListData[i] = cloneDeep(filter(this.originWorkListData, obj => {
                  return obj.workFlowTaskCode === this.clickedData.item.workFlowTaskCode
                })[0])
              }
            }
          } else {
            for (const i in this.checkListData) {
              if (this.checkListData[i].id === this.clickedData.item.id) {
                this.checkListData[i] = cloneDeep(filter(this.originCheckListData, obj => {
                  return obj.title === this.clickedData.item.title
                })[0])
              }
            }
          }
        }
        list.splice(index, 1)
      }
    },
    /**
     * 역할을 추가합니다.
     * @param {Array} list 추가 되는 곳의 배열
     */
    addListPanel (list, edit = false, type = '') {
      const checkList = type ? [{ value: '', title: '' }] : []
      const listObj = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        title: '',
        setList: [],
        checkList: checkList,
        edit: edit,
        type: type,
        foldState: 'on'
      }
      this.$nextTick(() => { list.push(listObj) })
    },
    /**
     * 업무를 역할로 드래그 할 때 발생하는 이벤트입니다.
     * 상세 : 업무 리스트에 roleName 태그가 붙습니다.
     * @param {Object} parameter parameter.added.element = 드래그 되는 데이터 오브젝트
     * @param {Object} list 드래그의 목적지인 해당 업무 오브젝트
     */
    dragEvent (parameter, list, type) {
      let parameterName = 'title'
      let messageType = '확인 사항이'
      if (type === 'taskList') {
        parameterName = 'workFlowTaskCode'
        messageType = '업무가'
      }
      const toMap = {}
      let removeId = ''
      for (let i = 0; i < list[type].length; i++) {
        if (list[type][i][parameterName] === parameter.added.element[parameterName]) {
          toMap[list[type][i].id] = i
          if (list[type][i].id === parameter.added.element.id) {
            removeId = list[type][i].id
          }
        }
      }
      if (keys(toMap).length > 1 && removeId !== '') {
        // this.$alert('동일한 ' + messageType + ' 이미 존재합니다.')
        this.$alert(this.$t('common.ALERT.APPROVAL.010', { message: messageType }))
        list[type].splice(toMap[removeId], 1)
        return
      }
      if (type === 'taskList') {
        if (parameter.added.element.workFlowTaskExecutePerm) {
          if (!this.checkTaskLevel(parameter.added.element, list)) {
            if (this.removeId !== '') {
              list[type].splice(toMap[removeId], 1)
            }
            return
          }
          for (const i in this.roleFlowProcess) {
            if (this.roleFlowProcess[i].roleIdx !== list.roleIdx) {
              for (const j in this.roleFlowProcess[i][type]) {
                if (parameter.added.element[parameterName] === this.roleFlowProcess[i][type][j][parameterName]) {
                  this.roleFlowProcess[i][type][j].workFlowTaskExecutePerm = false
                }
              }
            } else {
              this.setActiveTaskRoleName(parameter.added.element[parameterName], this.roleFlowProcess[i])
            }
          }
        }
        list.taskList.sort((a, b) => {
          return this.activeWorkFlowTaskRoleNameMap[a.workFlowTaskCode].order - this.activeWorkFlowTaskRoleNameMap[b.workFlowTaskCode].order
        })
      }
    },
    setActiveTaskRoleName (workFlowTaskCode, role) {
      this.activeWorkFlowTaskRoleNameMap[workFlowTaskCode].roleIdx = role.roleIdx
      this.activeWorkFlowTaskRoleNameMap[workFlowTaskCode].roleName = role.roleName
      this.activeWorkFlowTaskRoleNameMap[workFlowTaskCode].index = role.index
      for (const i in this.workListData) {
        if (this.workListData[i].workFlowTaskCode === workFlowTaskCode) {
          this.workListData[i].roleName = role.roleName
        }
      }
      for (const i in this.originWorkListData) {
        if (this.originWorkListData[i].workFlowTaskCode === workFlowTaskCode) {
          this.originWorkListData[i].roleName = role.roleName
        }
      }
    },
    setActiveTask (params, state) {
      if (this.clickedData && params.id === this.clickedData.item.id) {
        if (state) {
          if (!this.checkTaskLevel(this.clickedData.item, this.clickedData.role)) {
            this.$nextTick(() => {
              this.clickedData.item.workFlowTaskExecutePerm = false
            })

            // this.$forceUpdate()
            return
          }
          for (const i in this.roleFlowProcess) {
            for (const j in this.roleFlowProcess[i].taskList) {
              if (this.roleFlowProcess[i].taskList[j].workFlowTaskCode === params.workFlowTaskCode && this.roleFlowProcess[i].taskList[j].id !== this.clickedData.item.id) {
                this.roleFlowProcess[i].taskList[j].workFlowTaskExecutePerm = false
                this.roleFlowProcess[i].taskList[j].roleName = ''
              }
            }
          }

          this.setActiveTaskRoleName(this.clickedData.item.workFlowTaskCode, this.clickedData.role)
        } else {
          this.setActiveTaskRoleName(this.clickedData.item.workFlowTaskCode, { roleName: '', index: 0, roleIdx: 0 })
        }
      }
    },
    /**
     * workflow-fold-panel이 foldable 상태가 아닌, select 가능한 상태일 때, select 할 때 발생하는 이벤트.
     * @param {String} type 어느 영역인지? ('beforeCheckList', 'taskList', 'afterCheckList')
     * @param {Object} role 선택한 역할
     * @param {Object} item select 토글 할 Object
     * @param {Boolean} state select 상태
     */
    selectLabel (type, role, item, state) {
      const listNames = ['beforeCheckList', 'taskList', 'afterCheckList']
      // this.workListData.forEach(work => {
      //   work.foldState = 'close'
      //   work.isActive = false
      // })
      // this.checkListData.forEach(work => {
      //   work.foldState = 'close'
      //   work.isActive = false
      // })

      this.roleFlowProcess.forEach(parentObj => {
        listNames.forEach(typeName => {
          parentObj[typeName].forEach(node => {
            if (node.id === item.id) {
              // item = { ...node }
              // item.roleName = parentObj.title
              item.isActive = state
              item.deletable = state
              item.foldState = state ? 'on' : 'close'

              this.setSelectData(type, role, item, state)
            } else {
              node.isActive = false
              node.deletable = false
              node.foldState = 'close'
            }
          })
        })
      })
      this.$forceUpdate()
    },
    /** 클릭에 따라 업무, 확인사항의 오리지널 그룹의 데이터를 설정합니다.
     * @param {String} type 어느 영역인지? ('beforeCheckList', 'taskList', 'afterCheckList')
     * @param {Object} role 선택된 아이템이 속한 역할
     * @param {Object} item 세팅 되는 아이템 정보
     * @param {Boolean} state select 상태
    */
    setSelectData (type, role, item, state) {
      if (state) { // 선택되어 있을 때,
        if (this.clickedData) {
          if (this.clickedData.type === 'taskList' && (item.workFlowTaskCode !== this.clickedData.item.workFlowTaskCode)) {
            for (const i in this.workListData) {
              if (this.workListData[i].id === this.clickedData.item.id) {
                this.workListData[i] = cloneDeep(filter(this.originWorkListData, obj => {
                  return obj.workFlowTaskCode === this.clickedData.item.workFlowTaskCode
                })[0])
              }
            }
          } else if (this.clickedData.type.indexOf('CheckList') > 0 && (item.id !== this.clickedData.item.id)) {
            for (const i in this.checkListData) {
              if (this.checkListData[i].id === this.clickedData.item.id) {
                this.checkListData[i] = cloneDeep(filter(this.originCheckListData, obj => {
                  return obj.title === this.clickedData.item.title
                })[0])
              }
            }
          }
        }

        let orgGroup
        if (type === 'taskList') orgGroup = this.workListData
        else orgGroup = this.checkListData
        item.roleName = this.activeWorkFlowTaskRoleNameMap[item.workFlowTaskCode]?.roleName

        for (let i = 0; i < orgGroup.length; i++) {
          if (orgGroup[i].title === item.title) {
            orgGroup[i] = item

            this.clickedData = {
              type,
              item,
              role
            }
            break
          }
        }
      } else { // 선택 해제 되었을 때
        if (type === 'taskList') {
          for (const i in this.workListData) {
            if (this.workListData[i].id === this.clickedData.item.id) {
              this.workListData[i] = cloneDeep(filter(this.originWorkListData, obj => {
                return obj.workFlowTaskCode === this.clickedData.item.workFlowTaskCode
              })[0])
            }
          }
        } else {
          for (const i in this.checkListData) {
            if (this.checkListData[i].id === this.clickedData.item.id) {
              this.checkListData[i] = cloneDeep(filter(this.originCheckListData, obj => {
                return obj.title === this.clickedData.item.title
              })[0])
            }
          }
        }
        this.clickedData = undefined
      }
    },
    // setNewCheckListType (command) {
    //   // this.newCheckListType = command
    //   // debugger
    //   this.addListPanel(this.checkListData, true, command)
    // },

    /**
     * 체크리스트 외부 영역을 누르면 편집 상태를 false로 전환합니다..
     * @param {event.target} el 클릭 이벤트 타켓
     */
    isInArea (el) {
      if (el === this.$refs.foldPanel) return true
      if (this.$refs.foldPanel !== undefined) {
        const children = this.$refs.foldPanel.querySelectorAll('*')
        for (const child of children) {
          if (el === child) return true
        }
      }
      return false
    },
    clickedOutside (e) {
      e.stopPropagation()
      if (!this.isInArea(e.target)) {
        this.checkListData.forEach(item => {
          item.isCheckList = true
          item.edit = false
        })
        this.roleFlowProcess.forEach(item => {
          item.edit = false
        })
      }
    },
    keyPress (e) {
      if (e.keyCode === 27) {
        this.checkListData.forEach(item => {
          item.isCheckList = true
          item.edit = false
        })
      }
    },
    /**
     * [역할]패널에서 스크롤 좌-우 움직임을 상단 arrow 버튼과 바인딩 합니다.
     * @param {String} direction 버튼 방향 ('prev' / 'next')
     */
    movePanel (direction) {
      const roleList = document.querySelector('.role-flow-process')

      let gap
      if (direction === 'prev') gap = -270
      else if (direction === 'next') gap = 270

      roleList.scrollLeft += gap
      this.scrollLeft = roleList.scrollLeft
      // }
    },

    // 드래그 이벤트
    onDragEnter (e) {
      e.preventDefault()
      e.target.classList.add('-drag-over')
    },
    onDragLeave (e) {
      e.preventDefault()
      e.target.classList.remove('-drag-over')
    },
    /**
     * 드래그가 끝났을 때, 모든 .empty-zone 의 '-drag-over' 클래스를 제거합니다.
     * @param {event} e 드래그 끝났을 때, 커스텀 event
     */
    onDragEnd (e) {
      const emptyNodes = document.querySelectorAll('.empty-zone')

      emptyNodes.forEach(node => {
        node.classList.remove('-drag-over')
      })
    },
    /**
     * item 드래그 시, deep clone을 합니다.
     */
    clone (original) {
      var element = {}
      for (var key in original) {
        element[key] = original[key]
        element.id = original.id + '_copy' + Math.random().toString(36).substr(2, 9)
      }
      return element
    },

    /**
     * 편집 체크리스트 저장
     * @param {Array} checkList emit으로 전달받은 업데이트 데이터, 없을 떄 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    async saveCheckList (isConfirm) {
      if (isConfirm) {
        this.editCheckListModal = false
        this.getWorkFlowCheckList()
      }
    },
    /**
     * 체크리스트 추가
     * 이전 체크리스트를 저장, 체크리스트 편집 모달을 띄웁니다.
     */
    activeEditCheckList () {
      // this.beforeCheckList = JSON.parse(JSON.stringify(this.checkListData))
      this.beforeCheckList = cloneDeep(this.checkListData)
      this.editCheckListModal = true
    },
    async getWorkFlowCheckList () {
      try {
        this.chkeckListLoading = true
        const workFlowCheckList = await API.work.getWorkFlowCheckList()
        this.checkListData = workFlowCheckList.map(item => {
          // item.setList = JSON.parse(item.workFlowCheckSetList)
          item.setList = JSON.parse(item.setList)
          item.id = item.title
          return {
            ...item,
            edit: false,
            deletable: false,
            foldState: item.foldState ? item.foldState : 'close'
          }
        })
        this.originCheckListData = cloneDeep(this.checkListData)
      } catch (error) {
        console.error(error)
        this.$alert(error)
      } finally {
        this.chkeckListLoading = false
      }
    },
    /**
     * 업무 목록 조회
     */
    async getWorkFlowTaskList () {
      const workFlowTaskList = await API.work.getWorkFlowTaskList()

      // BASIC 버전 테스트 용
      // const data = this.packageType === 'ENT'
      //   ? workFlowTaskList
      //   : workFlowTaskList.filter(task => task.workFlowTaskCode !== 'DATABASE' && task.workFlowTaskCode !== 'MARKET')

      this.workListData = workFlowTaskList.map(item => {
        item.title = item.workFlowTaskName
        item.id = item.workFlowTaskCode
        item.workType = item.workFlowTaskCode
        item.setList = []
        item.isActive = false
        item.isCheckList = false
        item.setList = this.setListMap[item.workFlowTaskCode]
        return {
          ...item,
          deletable: false,
          roleName: '',
          foldState: item.foldState ? item.foldState : 'close'
        }
      })
      this.originWorkListData = cloneDeep(this.workListData)
    },
    async getRoleList () {
      const roleList = await API.iam.getTaskRoleList()
      let index = 1
      this.roleList = roleList.map(item => {
        item.index = index
        item.id = item.roleIdx
        item.title = item.roleName
        item.taskList = []
        item.beforeCheckList = []
        item.afterCheckList = []
        index++
        return item
      })
    },
    async getWorkFlow () {
      this.activeWorkFlow = await API.work.getWorkFlow({ active: true })
      if (this.activeWorkFlow?.length) {
        const roleFlowProcess = JSON.parse(this.activeWorkFlow[0].workFlowJson)
        this.roleFlowProcess = roleFlowProcess.filter(role => role.id > 0) // 공통/AWS 아닌경우만 화면에 표기합니다.

        let index = 1
        for (const i in this.roleFlowProcess) {
          this.roleFlowProcess[i].index = index
          for (const j in this.roleFlowProcess[i].taskList) {
            if (this.roleFlowProcess[i].taskList[j].workFlowTaskExecutePerm) {
              this.setActiveTaskRoleName(this.roleFlowProcess[i].taskList[j].workFlowTaskCode, this.roleFlowProcess[i])
            }
            this.roleFlowProcess[i].taskList[j].deletable = false
          }
          index++
        }
      } else {
        this.roleFlowProcess = cloneDeep(this.roleList)
      }
      this.originRoleFlowProcess = cloneDeep(this.roleFlowProcess)
    },
    async createWorkFlow () {
      for (const i in this.activeWorkFlowTaskRoleNameMap) {
        const nameKeys = this.workListData.map(task => task.workType)
        if (!nameKeys.includes(i)) continue // ENT 밑 버전에서는 DATABASE & MARKET 검사 안 함.

        if (this.activeWorkFlowTaskRoleNameMap[i].roleIdx === 0) {
          this.$alert(this.$t('common.ALERT.ROLE.005'), '', {
            dangerouslyUseHTMLString: true
          })
          return
        }
      }

      this.$confirm(this.$t('common.CONFIRM.APPROVAL.002'), '알림', { // Work Flow를 저장 하시겠습니까?
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const workFlowJson = JSON.stringify([...this.roleFlowProcess, ...this.workFlowJsonForCommonAWSProject])
        const payload = { workFlowJson }

        const res = await API.work.createWorkFlow(payload)
        if (res) {
          this.$alert(this.$t('common.ALERT.BASE.022'))
          this.getWorkFlow()
        } else {
          this.$alert(this.$t('common.ALERT.APPROVAL.003'))
        }
      }).catch((err) => console.error('워크플로우 저장 에러', err))
    },
    /**
     * [새 워크플로우]
     */
    cancelWorkFlow (type) {
      if (type === 'init' || !this.activeWorkFlow?.length) {
        this.roleFlowProcess = cloneDeep(this.roleList)
        // const nameKeys = keys(this.activeWorkFlowTaskRoleNameMap)
        const nameKeys = this.workListData.map(task => task.workType)
        for (const i in nameKeys) {
          this.setActiveTaskRoleName(nameKeys[i], { roleName: '', index: 0, roleIdx: 0 })
        }
      } else {
        this.roleFlowProcess = JSON.parse(this.activeWorkFlow[0].workFlowJson)
        for (const i in this.roleFlowProcess) {
          for (const j in this.roleFlowProcess[i].taskList) {
            if (this.roleFlowProcess[i].taskList[j].workFlowTaskExecutePerm) {
              this.setActiveTaskRoleName(this.roleFlowProcess[i].taskList[j].workFlowTaskCode, this.roleFlowProcess[i])
            }
            this.roleFlowProcess[i].taskList[j].deletable = false
          }
        }
      }
    },
    clickedRightPanel (item, type) {
      item.foldState = item.foldState === 'on' ? 'close' : 'on'
    },
    checkTaskLevel (task, role) {
      // const level1 = this.packageType === 'ENT' ? ['COMPUTE', 'DATABASE', 'MARKET'] : ['COMPUTE']
      const nameKeys = this.workListData.map(task => task.workType)
      const level1Origin = ['COMPUTE', 'DATABASE', 'MARKET']
      const level1 = level1Origin.filter(name => nameKeys.includes(name))

      const level2 = ['STORAGE', 'NETWORK_L4', 'NETWORK_L7']
      const level3 = ['SECURITY']
      const taskRoleNameMap = this.activeWorkFlowTaskRoleNameMap
      if (task.workFlowTaskCode === 'COMPUTE') {
        for (const i in taskRoleNameMap) {
          if (taskRoleNameMap[i].roleIdx !== 0 && taskRoleNameMap[i].index < role.index) {
            this.$alert(this.$t('common.ALERT.APPROVAL.014'), '', {
              dangerouslyUseHTMLString: true
            })
            return false
          }
        }
      } else if (task.workFlowTaskCode === 'DATABASE' || task.workFlowTaskCode === 'MARKET') {
        if (taskRoleNameMap.COMPUTE.roleIdx !== 0 && taskRoleNameMap.COMPUTE.index > role.index) {
          // this.$alert(task.workFlowTaskCode + ' 은(는)<br> COMPUTE보다<br>뒤에 위치해야 합니다.', '', {
          //   dangerouslyUseHTMLString: true
          // })
          if (task.workFlowTaskCode === 'DATABASE') {
            this.$alert(this.$t('common.ALERT.APPROVAL.015'), '', { dangerouslyUseHTMLString: true })
          } else {
            this.$alert(this.$t('common.ALERT.APPROVAL.016'), '', { dangerouslyUseHTMLString: true })
          }
          return false
        }
        const level23 = level2.concat(level3)
        for (const i in taskRoleNameMap) {
          if (level23.indexOf(i) > -1 && taskRoleNameMap[i].roleIdx !== 0 && taskRoleNameMap[i].index < role.index) {
            // this.$alert(task.workFlowTaskCode + ' 은(는)<br> ' + level23.join(', ') + '<br>앞에 위치해야 합니다.', '', {
            //   dangerouslyUseHTMLString: true
            // })
            this.$alert(this.$t('common.ALERT.APPROVAL.008', { name: task.workFlowTaskCode, name2: level23.join(', ') }), '', {
              dangerouslyUseHTMLString: true
            })
            return false
          }
        }
      } else if (level2.indexOf(task.workFlowTaskCode) > -1) {
        for (const i in level1) {
          if (taskRoleNameMap[level1[i]].roleIdx !== 0 && taskRoleNameMap[level1[i]].index > role.index) {
            // this.$alert(task.workFlowTaskCode + ' 은(는)<br> ' + level1.join(', ') + '<br>뒤에 위치해야 합니다.', '', {
            //   dangerouslyUseHTMLString: true
            // })
            this.$alert(this.$t('common.ALERT.APPROVAL.007', { name: task.workFlowTaskCode, name2: level1.join(', ') }), '', {
              dangerouslyUseHTMLString: true
            })
            return false
          }
        }
        for (const i in level3) {
          if (taskRoleNameMap[level3[i]].roleIdx !== 0 && taskRoleNameMap[level3[i]].index < role.index) {
            // this.$alert(task.workFlowTaskCode + ' 은(는)<br> ' + level3.join(', ') + '<br>앞에 위치해야 합니다.', '', {
            //   dangerouslyUseHTMLString: true
            // })
            this.$alert(this.$t('common.ALERT.APPROVAL.008', { name: task.workFlowTaskCode, name2: level3.join(', ') }), '', {
              dangerouslyUseHTMLString: true
            })
            return false
          }
        }
      } else if (level3.indexOf(task.workFlowTaskCode) > -1) {
        const level12 = level1.concat(level2)
        for (const i in level12) {
          if (taskRoleNameMap[level12[i]].roleIdx !== 0 && taskRoleNameMap[level12[i]].index > role.index) {
            // this.$alert(task.workFlowTaskCode + ' 은(는)<br> ' + level12.join(', ') + '<br>뒤에 위치해야 합니다.', '', {
            //   dangerouslyUseHTMLString: true
            // })
            this.$alert(this.$t('common.ALERT.APPROVAL.007', { name: task.workFlowTaskCode, name2: level12.join(', ') }), '', {
              dangerouslyUseHTMLString: true
            })
            return false
          }
        }
      }
      return true
    },
    roleDragAndDrop (argu) {
      // console.group(argu.moved)

      if (argu.moved) {
        for (const i in this.roleFlowProcess) {
          this.roleFlowProcess[i].index = Number(i)
          for (const j in this.activeWorkFlowTaskRoleNameMap) {
            if (this.activeWorkFlowTaskRoleNameMap[j].roleIdx === this.roleFlowProcess[i].roleIdx) {
              this.activeWorkFlowTaskRoleNameMap[j].index = Number(i) + 1
            }
          }
        }
        for (const i in argu.moved.element.taskList) {
          if (!this.checkTaskLevel(argu.moved.element.taskList[i], argu.moved.element)) {
            const tempObj = this.roleFlowProcess.splice(argu.moved.newIndex, 1)
            this.roleFlowProcess.splice(argu.moved.oldIndex, 0, tempObj[0])
            break
          }
        }
      }
      // console.groupEnd()
    },
    clickedAddRole () {
      this.addRoleList = []
      this.setAddRoleCheckedRows = []
      this.addRoleModal = true
      for (const i in this.roleList) {
        let isExists = false
        for (const j in this.roleFlowProcess) {
          if (this.roleList[i].roleIdx === this.roleFlowProcess[j].roleIdx) {
            isExists = true
          }
        }
        if (!isExists) {
          this.addRoleList.push(cloneDeep(this.roleList[i]))
        }
      }
    },
    setAddRoleCheckedRowsFunc (checkedList) {
      this.setAddRoleCheckedRows = checkedList
    },
    addRoles () {
      for (const i in this.setAddRoleCheckedRows) {
        this.roleFlowProcess.push(this.setAddRoleCheckedRows[i])
      }
      this.addRoleList = []
      this.setAddRoleCheckedRows = []
      this.addRoleModal = false
    }
  },
  data () {
    return {
      list: null,
      beforeCheckList: [], // 편집 전 체크리스트를 담아줌
      editCheckListModal: false, // 필요한 데이터인지 .. 일단 보류
      foldState: { // 전체 펼침, 전체 접음을 위한 flag
        workList: false,
        checkList: false
      },
      isEmpty: false, // 비어있는 title 여부 flag
      scrollContainer: undefined, // 스크롤 되는 영역 (해당 페이지에서는 created 될 때, 역할 패널로 지정)
      scrollLeft: 0, // [역할]패널의 scrollLeft
      sctollHrzEnd: undefined, // [역할]패널의 남은 scroll 거리
      clickedData: undefined,
      originRoleFlowProcess: [],
      loading: false,
      chkeckListLoading: false,

      // 그룹 세팅 - 업무 리스트
      roleWorkGroupSetting: {
        name: 'roleWorkGroup',
        put: false,
        pull: (to) => {
          const zone = to.el.dataset.zone
          if (zone === 'roleWorkGroup') return 'clone'
          else return false
        }
      },
      // 그룹 세팅 - 확인 사항
      roleChecklistGroupSetting: {
        name: 'roleChecklistGroup',
        put: false,
        pull: (to) => {
          const zone = to.el.dataset.zone
          if (zone === 'roleChecklistGroup') return 'clone'
          else return false
        }
      },
      workroleColumns: [
        { header: true, binding: 'checked', width: 80, checkbox: true },
        { header: '업무 이름', keyPath: 'common.TERMS.taskName', binding: 'roleName', width: '*', customHtml: true }
      ],
      addRoleList: [],
      setAddRoleCheckedRows: [],
      addRoleModal: false,

      // 데이터
      roleFlowProcess: [],
      workListData: [],
      originWorkListData: [],
      checkListData: [],
      originCheckListData: [],
      roleList: [],
      activeWorkFlow: undefined,
      activeWorkFlowTaskRoleNameMap: {
        COMPUTE: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 0
        },
        DATABASE: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 1
        },
        MARKET: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 2
        },
        STORAGE: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 3
        },
        NETWORK_L4: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 4
        },
        NETWORK_L7: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 5
        },
        SECURITY: {
          roleIdx: 0,
          roleName: '',
          index: 0,
          order: 6
        }
      },
      setListMap: {
        COMPUTE: [
          // this.$t('common.BTN.confirm')
          { title: this.$t('common.TERMS.name'), readable: true },
          { title: 'Hostname', readable: true },
          { title: this.$t('common.TERMS.cluster'), readable: true },
          { title: this.$t('common.GRID.COMPUTE.osVersion'), readable: true },
          { title: 'IP', readable: true },
          { title: 'VCPU', readable: true },
          { title: 'Memory', readable: true },
          { title: 'RootDisk', readable: true },
          { title: 'ExternalDist', readable: true },
          { title: this.$t('common.GRID.COMPUTE.install'), readable: true },
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ],
        DATABASE: [
          { title: this.$t('common.TERMS.cluster'), readable: true },
          { title: 'IP', readable: true },
          { title: 'Port', readable: true },
          { title: 'ENGINE', readable: true },
          { title: 'Version', readable: true },
          { title: 'TYPE', readable: true },
          { title: this.$t('common.TERMS.connectHostInfo'), readable: true },
          { title: 'VCPU', readable: true },
          { title: 'Memory', readable: true },
          { title: 'ExternalDist', readable: true },
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ],
        MARKET: [
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ],
        STORAGE: [
          {
            title: `::${this.$t('common.TERMS.connectInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.COMPUTE.computeName'), readable: true },
              { title: 'Hostname', readable: true }
            ]
          },
          { title: this.$t('common.GRID.STORAGE.size'), readable: true },
          { title: this.$t('common.GRID.type'), readable: true },
          { title: this.$t('common.TERMS.cluster'), readable: true },
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ],
        NETWORK_L4: [
          {
            // title: '::설정 정보::',
            title: `::${this.$t('common.GRID.NETWORK.setInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.TERMS.name'), readable: true },
              { title: this.$t('common.GRID.type'), readable: true },
              { title: this.$t('common.GRID.NETWORK.virtualIp'), readable: true },
              { title: this.$t('common.GRID.NETWORK.port'), readable: true },
              { title: this.$t('common.GRID.NETWORK.protocol'), readable: true },
              { title: this.$t('common.GRID.NETWORK.system'), readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          {
            title: `::${this.$t('admin.ORG.projectInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.projectName'), readable: true },
              { title: this.$t('common.GRID.NETWORK.port'), readable: true },
              { title: this.$t('common.GRID.NETWORK.protocol'), readable: true },
              { title: this.$t('common.GRID.NETWORK.serverName'), readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          {
            title: `::${this.$t('common.GRID.NETWORK.serverInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.NETWORK.serverName'), readable: true },
              { title: this.$t('common.GRID.type'), readable: true },
              { title: this.$t('common.GRID.addr'), readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ],
        NETWORK_L7: [
          {
            title: `::${this.$t('common.TERMS.connectInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.COMPUTE.computeName'), readable: true },
              { title: 'Hostname', readable: true }
            ]
          },
          { title: this.$t('common.GRID.STORAGE.size'), readable: true },
          { title: this.$t('common.GRID.type'), readable: true },
          { title: this.$t('common.TERMS.cluster'), readable: true },
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ],
        SECURITY: [
          {
            title: `::${this.$t('common.GRID.NETWORK.setInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.TERMS.name'), readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          {
            // 출발지 정보
            title: `::${this.$t('common.GRID.NETWORK.originInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.addr'), readable: true },
              { title: this.$t('common.GRID.type'), readable: true },
              { title: 'IP', readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          {
            // 목적지 정보
            title: `::${this.$t('common.GRID.NETWORK.destInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.addr'), readable: true },
              { title: this.$t('common.GRID.type'), readable: true },
              { title: 'IP', readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          {
            title: `::${this.$t('admin.ORG.projectInfo')}::`,
            readable: true,
            children: [
              { title: this.$t('common.GRID.projectName'), readable: true },
              { title: this.$t('common.GRID.NETWORK.port'), readable: true },
              { title: this.$t('common.GRID.NETWORK.portType'), readable: true },
              { title: this.$t('common.GRID.NETWORK.protocol'), readable: true },
              { title: this.$t('common.GRID.explain'), readable: true }
            ]
          },
          { title: this.$t('bill.count'), readable: true },
          { title: this.$t('bill.monthlyCharged'), readable: true }
        ]
      },
      workFlowJsonForCommonAWSProject: [ // 공통프로젝트 + AWS 를 위한 하드코딩 데이터 (백엔드에서 필요하다고 합니다)
        {
          roleIdx: -10,
          roleName: '공통프로젝트',
          roleMemo: '공통프로젝트',
          roleUpper: 0,
          index: 0,
          id: -10,
          title: '공통프로젝트',
          taskList: [
            {
              workFlowTaskIdx: 8,
              id: 'COMMON_PROJECT',
              workFlowTaskName: 'Common_Project',
              workFlowTaskCode: 'COMMON_PROJECT',
              workFlowTaskExecutePerm: true,
              packageSupportType: null,
              isDelete: false,
              title: 'Common_Project',
              workType: 'COMMON_PROJECT',
              isActive: false,
              isCheckList: false,
              deletable: false,
              foldState: 'close'
            }
          ],
          isActive: false
        },
        {
          roleIdx: -11,
          roleName: 'AWS프로젝트',
          roleMemo: 'AWS프로젝트',
          roleUpper: 0,
          index: 0,
          id: -11,
          title: 'AWS프로젝트',
          taskList: [
            {
              workFlowTaskIdx: 9,
              id: 'AWS_PROJECT',
              workFlowTaskName: 'Aws_Project',
              workFlowTaskCode: 'AWS_PROJECT',
              workFlowTaskExecutePerm: true,
              packageSupportType: null,
              isDelete: false,
              title: 'Aws_Project',
              workType: 'AWS_PROJECT',
              isActive: false,
              isCheckList: false,
              deletable: false,
              foldState: 'close'
            }
          ],
          isActive: false
        }
      ]
    }
  }
}
</script>
<style lang="scss" src="./SetWorkFlow.scss" />
