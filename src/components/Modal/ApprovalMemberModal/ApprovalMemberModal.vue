<!--
  * 파일명 : ApprovalMemberModal.vue
  * 파일 기능 : 조직도 결재 팝업
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-23
  * License By Shinsegae I&C
  * 2021-02-23 [업무 > 보안그룹] : 출발지/목적지 IP 정보가 없을 경우, 경유지 조회하지 않게 설정
 -->

<template>
  <!-- 조직도 -->
  <el-dialog
    :title="$t('task.PRIOR.MEM.title')"
    :visible.sync="isActive"
    width="1260px"
    @close="close"
    top="5vh"
  >
    <div
      class="blossom-organization"
      v-loading="isInit"
    >
      <section>
        <article class="blossom-section-group">
          <h4 class="group-title">
            <!-- 최근 사용한 결재자 -->
            {{ $t('task.PRIOR.MEM.tit1') }}
          </h4>

          <div class="group-contents">
            <ul class="recent-user-list">
              <li
                class="recent-user-item"
                v-for="(item, idx) in recentUserList"
                :key="idx"
              >
                <el-checkbox
                  v-model="item.isChecked"
                  :label="item.userName +' '+ (item.userPosition ? item.userPosition : '')"
                  @change="recentToggleSelect(item,idx,item.isChecked)"
                />
              </li>
            </ul>
          </div>
        </article>
        <!-- 최근 사용한 결재자 -->

        <div class="blossom-organization-body">
          <section
            class="blossom-organization-setting -left"
            v-loading="loading"
          >
            <article class="select-department-section">
              <div class="-header">
                <h5 :class="['-title', { 'en': language === 'en' }]">
                  <!-- 부서명 -->
                  {{ $t('task.PRIOR.MEM.tit2') }}
                </h5>
                <el-select
                  v-model="selectedPart"
                  :popper-append-to-body="false"
                  placeholder="선택"
                  popper-class="blossom-department"
                  @change="changeSelectPart"
                  class="blossom-depart-selector"
                >
                  <el-option
                    v-for="item in departmentList"
                    :key="item.groupIdx"
                    :label="item.groupName"
                    :value="item.groupIdx"
                  />
                </el-select>
              </div>

              <!--  tiny-scroll -->
              <div class="department-tree">
                <g-tree
                  :data="computedTreeData"
                  :view-line="true"
                  @selected="selectedDep"
                  :select-object="selectDepartment"
                  unique-key="groupIdx"
                  ref="tree"
                  :root-parent="hasRootGroup"
                />
                <!-- :use-checkbox="true" -->
              </div>
            </article>
            <!-- /. 부서명 tree -->

            <article class="select-approver-section">
              <div class="-header">
                <h5 :class="['-title', { 'en': language === 'en' }]">
                  <!-- 결재자명 -->
                  {{ $t('task.PRIOR.MEM.tit3') }}
                </h5>
                <div
                  style="margin-left: 10px"
                  class="search-wrapper"
                >
                  <el-input
                    :placeholder="$t('task.PRIOR.DETAIL.searchApproval')"
                    v-model="searchApprover"
                    @keypress.native.enter="search"
                  />
                  <i
                    class="-magnify-icon"
                    @click="search"
                  />
                </div>
              </div>

              <ul
                class="approver-list"
                v-if="manager.list.length"
              >
                <li
                  class="approver-member-item"
                  v-for="(item, idx) in manager.list"
                  :key="idx"
                  @click.stop="() =>toggleSelect(item, idx, item.isChecked)"
                >
                  <approver-info
                    :use-checkbox="false"
                    :is-checked="item.isChecked"
                    :name="item.userName + ' ' +item.userPosition"
                    :company="item.userCompanyName"
                    :group="item.userGroupName"
                    :duty="item.userDuty || null"
                    @change="toggleSelect(item, idx, item.isChecked)"
                    :condition="condition(item, idx, item.isChecked)"
                  />
                  <!-- :true-condition="trueCondition(item)" -->
                </li>
              </ul>
              <div
                class="pagination-wrap"
                v-if="manager.list.length"
              >
                <el-pagination
                  layout="prev, pager, next"
                  :total="manager.total"
                  :current-page="manager.current"
                  :pager-count="managersPaperCount"
                  :page-size="managersPerCount"
                  @current-change="currentPageChange"
                />
              </div>

              <div
                v-else
                class="approver-list -empty"
                style="padding: 20px;"
              >
                <span class="empty-data">
                  <!-- 데이터가 없습니다. -->
                  {{ $t('common.PLACEHOLDER.noData') }}
                </span>
              </div>
            </article>
            <!-- /. 결재자명 -->
          </section>

          <div class="rightside-icon">
            <i class="-icon" />
          </div>

          <section class="blossom-organization-setting -right">
            <div class="-header">
              <h5 class="-title">
                <!-- 결재목록 -->
                {{ $t('task.PRIOR.MEM.tit4') }}
              </h5>
            </div>

            <div class="organization-setting-wrap">
              <cmp-grid
                :item-source="listData"
                :columns="listColumns"
                :paging-size="20"
              >
                <template #userName="props">
                  {{ props.row.userName }} {{ props.row.userPosition }}
                </template>
                <template #type="props">
                  <el-radio-group
                    class="radio-switch-group"
                    v-model="props.row.type"
                  >
                    <el-radio-button
                      v-for="item in typeOptions"
                      :key="item.key"
                      :label="item.key"
                    >
                      {{ item.label }}
                    </el-radio-button>
                  </el-radio-group>
                </template>

                <template #remove="props">
                  <div
                    class="cell-flex-wrap"
                  >
                    <button
                      class="button"
                      type="is-icon"
                    >
                      <i
                        class="delete-icon"
                        @click="removeData(props.row,listData)"
                      />
                    </button>
                  </div>
                </template>

                <template #status="props">
                  <div class="cell-flex-wrap">
                    <cmp-status-tag
                      :type="`is-${props.row.status}`"
                      :contents="stateDesc(props.row.state)"
                    />
                  </div>
                </template>
              </cmp-grid>
            </div>

            <div
              v-if="false"
              class="organization-setting-wrap"
            >
              <div class="button-area -vertical">
                <button
                  class="button"
                  type="is-primary"
                >
                  <!-- 참조 -->
                  {{ $t('task.PRIOR.MEM.ref') }}
                </button>
              </div>
              <dashboard-panel
                class="attach-list-section"
                title="참조목록"
              >
                <template #header>
                  <button
                    class="button"
                    type="is-anti"
                  >
                    <!-- 삭제 -->
                    {{ $t('common.BTN.delete') }}
                  </button>
                </template>
                <g-table-basic />
              </dashboard-panel>
            </div>
          </section>
        </div>
      </section>
    </div>

    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button "
        type="is-primary"
        @click="confirm"
        :disabled="loading || isInit"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>
<script>
import API, { GTree, DashboardPanel } from '@sd-fe/cmp-core'
import ApproverInfo from './ApproverInfoComponent'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'

export default {
  name: 'ApprovalMemberModal',
  components: {
    'g-tree': GTree,
    'approver-info': ApproverInfo,
    'dashboard-panel': DashboardPanel
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: { // 이미 저장한 데이터
      type: Array,
      default: () => []
    },
    managersPerCount: {
      type: Number,
      default () {
        return 10
      }
    },
    managersPaperCount: {
      type: Number,
      default () {
        return 5
      }
    }
  },
  computed: {
    computedTreeData () {
      return this.treeData.filter(data => {
        if (this.selectedPart === 0 || this.selectedPart === data.groupIdx) {
          data.isChecked = true
          return data
        }
      })
    },
    ...mapState({
      language: state => state.auth.language,
      rootGroup: state => state.common.rootGroup
    }),
    hasRootGroup () {
      return this.rootGroup ? { groupName: this.rootGroup, groupUpper: 0, isRootParent: true } : undefined
    }

  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    async init () {
      try {
        this.isInit = true
        this.listData = this.setDefaultData(this.data)

        await this.getManageTree()
        await this.getManagersList()
        await this.getRecentAdminUser()

        this.setInitSelectGroup()

        this.isInit = false
      } catch (error) {
        console.error(error)
        this.isInit = false
      }
    },

    /**
     * 외부에서 이미 저장된 데이터를 내부에서 저장 및 바인딩합니다.
     * @param {Array} data 이미 저장된 데이터 (외부에서 props 로 저장)
     */
    setDefaultData (data = this.data) {
      // console.log(this.listData, this.data)
      const listData = data.map(({ approver, company, userGroup, no, type }) => {
        return {
          userId: approver.id,
          userName: approver.name,
          userPosition: approver.position,
          companyName: company.name,
          groupName: userGroup.name,
          no,
          type
        }
      })

      return cloneDeep([...this.listData, ...listData])
    },

    /**
     * 트리에서 처음 선택되어있는 팀 오브젝트 세팅
     */
    setInitSelectGroup () {
      this.setUserGroup()

      this.$nextTick(function () {
        if (this.selectDepartment) {
          const tree = this.$refs.tree?.$el
          if (!tree) return
          const selectEl = tree?.querySelector('.tree-label-text.-selected')
          if (!selectEl) return
          const scrollTop = selectEl.getBoundingClientRect().top >= 400 ? selectEl.getBoundingClientRect().top - 400 : 0

          this.$el.querySelector('.department-tree').scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
        }
      })
    },
    setUserGroup () {
      const userGroupIdx = this.$store.state.auth.user.userGroup
      let userGroupInfo
      for (let i = 0; i < this.treeData.length; i++) {
        if (this.treeFindGroup(this.treeData[i], userGroupIdx)) {
          userGroupInfo = this.treeFindGroup(this.treeData[i], userGroupIdx)
          break
        }
      }
      this.selectDepartment = userGroupInfo ? { ...userGroupInfo } : undefined

      this.selectedDep(this.selectDepartment)
    },
    /**
     * tree 데이터를 순회하며 동일 id를 가진 tree를 찾습니다.
     * @param {Object} element 검사 할 객체
     * @param {string} matchingId 찾을 groupIdx
     */
    treeFindGroup (element, matchingId) {
      if (element.groupIdx === matchingId) return element
      else if (element.children && element.children.length > 0) {
        let result = null
        for (let i = 0; !result && i < element.children.length; i++) result = this.treeFindGroup(element.children[i], matchingId)
        return result
      }
      return null
    },
    async search () {
      this.manager.current = 1
      this.getManagersList()
    },
    async currentPageChange (current) {
      this.manager.current = current
      await this.getManagersList()
    },
    async clear () {
      this.searchApprover = ''
      this.manager.current = 1
      this.getManagersList()
    },
    changeSelectPart (idx) {
      const group = this.departmentList.find(dep => dep.groupIdx === idx)
      this.selectedDep(group)
    },
    async selectedDep (node) {
      this.groupIdx = node.groupIdx
      this.selectDepartment = node
      await this.getManagersList()
      // this.manager.list = this.managersList.filter(item => item.userGroup === groupIdx)
    },
    async getManageTree () {
      let response = await API.iam.getGroupManageTree()
      response = response.map(item => {
        const result = { ...item }
        result.title = item.groupName
        return result
      })
      response.unshift({ title: this.$t('main.DASHBOARD.all'), groupIdx: null, children: [] }) // 전체
      this.setTreeTitle(response)
      this.treeData = response
      this.departmentList = response?.filter(item => item.groupUpper === 0)
      this.departmentList.unshift({ groupName: this.$t('main.DASHBOARD.all'), groupIdx: 0 }) // 전체
    },
    async getRecentAdminUser () {
      const approveeId = this.$store.state?.auth?.user?.userId
      try {
        const userList = await API.work_v3.getRecentApprovalUser(approveeId)

        this.recentUserList = userList
      } catch (error) {
        console.error(error)
      }
    },
    async getManagersList () {
      try {
        if (this.loading) return
        this.loading = true
        const hr = await API.config.getHrJdbc(0)
        let res = []
        if (hr && hr.length > 0) {
          // jdbc 정보 있으면 AD 사용자 목록 가져옴
          res = await API.iam.getUserPage({
            perPage: this.managersPerCount,
            nowPage: this.manager.current,
            userKeyword: this.searchApprover,
            groupIdx: this.groupIdx
          })
        } else {
          // jdbc 정보 없으면 사이트 전체 사용자 목록 가져옴
          res = await API.iam.getUserList({
            perPage: this.managersPerCount,
            nowPage: this.manager.current,
            userKeyword: this.searchApprover,
            userGroup: this.groupIdx,
            isAdmin: true
          })
        }

        this.manager.list = this.settingSelectedManager(res.userList)
        this.manager.total = res.totalCount
      } catch (error) {
        this.loading = false
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    settingSelectedManager (userList) {
      for (let j = 0; j < userList.length; j++) {
        for (let i = 0; i < this.listData.length; i++) {
          if (userList[j].userId === this.listData[i].userId) {
            userList[j].isChecked = true
            userList[j].no = this.listData[i].no
          }
        }
      }

      return userList
    },
    setTreeTitle (list) {
      if (list.length === 0) return
      for (const data of list) {
        if (data.children?.length === 0) continue
        data.children = data.children.map(item => {
          const result = { ...item }
          result.title = item.groupName
          return result
        })
        this.setTreeTitle(data.children)
      }
    },

    confirm () {
      if (!this.listData.length) {
        return this.$alert('결재자는 1명 이상이어야 합니다')
      }
      this.$emit('confirm', this.listData)
      this.close()
    },

    close () {
      this.listData = []
      this.$emit('close')
    },
    setRecentUser () {
      this.recentUserList = [...this.approverList].splice(6)
    },
    recentToggleSelect (item, idx, status) {
      if (status && this.listData.length === 10) {
        item.isChecked = !status
        // 최대 10 명 까지 선택 가능합니다.
        this.$alert(this.$t('common.ALERT.APPROVAL.004'))
        return
      }
      this.toggleSelectDataSetting(item, idx, status, this.manager.list)
    },
    toggleSelect (item, idx, status) {
      status = !status
      // if (item.no === 1) {
      //   // 기안자는 제거 할 수 없습니다.
      //   this.$alert(this.$t('common.ALERT.ORG.002'))
      //   return
      // }
      if (status && this.listData.length === 10) {
        // 담당자를 선택해주세요
        this.$alert(this.$t('common.ALERT.APPROVAL.004'))
        return
      }

      this.toggleSelectDataSetting(item, idx, status, this.recentUserList)
    },
    toggleSelectDataSetting (item, idx, status, list) {
      list.forEach(approve => {
        if (item.userId === approve.userId) approve.isChecked = true
      })
      item.isChecked = status
      if (item.isChecked) {
        const obj = {
          userIdx: item.userIdx,
          userId: item.userId,
          userDuty: item.userDuty,
          userName: item.userName,
          userGroup: item.userGroup || item.groupIdx,
          groupName: item.userGroupName || item.groupName,
          groupCode: item.userGroupCode || item.groupCode,
          userCompany: item.userCompany || item.companyIdx,
          companyName: item.userCompanyName || item.companyName,
          companyCode: item.userCompanyCode || item.companyCode,
          userPosition: item.userPosition
        }
        this.addData(obj, this.listData)
      } else {
        this.removeData(item, this.listData)
      }
      this.$forceUpdate()
    },
    condition (item, idx, status) {
      return !status && this.listData.length === 10
    },
    trueCondition (item) {
      return item.no === 1
    },
    addData (item, list) {
      let existFlag
      let no = 0
      list.forEach(row => {
        if (no < row.no) no = row.no
        if (row.userId === item.userId) {
          list.isChecked = true
          existFlag = true
        } else existFlag = false
      })
      item.no = no + 1
      item.type = 'S'
      if (!existFlag) list.push(item)
    },
    removeData (item, list) {
      if (Array.isArray(item)) {
        for (let i = 0; i < item.length; i++) {
          this.removeData(item[i], list)
          if (list === this.listData) {
            this.manager.list.forEach(approve => {
              if (item[i].userId === approve.userId) approve.isChecked = false
            })
          }
        }
      } else {
        for (let i = 0; i < list.length; i++) {
          if (list[i].userId === item.userId) {
            list.splice(i, 1)
            break
          }
        }
        this.manager.list.forEach(approve => {
          if (item.userId === approve.userId) approve.isChecked = false
        })
        this.recentUserList.forEach(approve => {
          if (item.userId === approve.userId) approve.isChecked = false
        })
        let idx = 1
        for (let i = 0; i < list.length; i++) {
          list[i].no = idx++
        }
      }
    },
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.008'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.removeData(this.selectedRow.dataItem, this.listData)
        this.$alert(this.$t('common.ALERT.BASE.013'))
      }).catch(() => { return false })
    },
    setSelectedRow (param) {
      this.selectedRow = param
    },

    upDownRow (direction) {
      if (!this.selectedRow.length > 0) return false
      const table = this.$refs.approveListTable.$el.getElementsByTagName('table')[0]
      const rows = table.rows
      let rowIndex
      const selectedRow = this.selectedRow[0]
      rows.forEach((row, idx) => {
        if (row.field === selectedRow.fied) rowIndex = idx
      })
      // while (rows !== null) {
      //   if (rows.nodeName === 'TR') {
      //     break
      //   }
      //   rows = rows.parentNode
      // }
      // table = rows.parentNode
      if (direction === 'down') {
        table.insertBefore(selectedRow, rows[rowIndex + 1])
      }
    },

    setSearchString (text, list) {
      if (list.length === 0) return false

      if (!text) {
        this.manager.list = list
      } else {
        const str = text.replace(/(\s*)/g, '')
        const string = new RegExp(str, 'i')
        const newData = []
        for (let i = 0; i < list.length; i++) {
          const valueArr = Object.values(list[i])
          if (valueArr.join('').replace(/(\s*)g/, '').match(string)) {
            newData.push(list[i])
          }
        }
        this.manager.list = newData
      }
    },

    stateDesc (state = undefined) {
      return {
        wait: this.$t('task.STATE.wait'),
        ing: this.$t('task.STATE.progress'),
        delay: this.$t('task.STATE.delay'),
        complete: this.$t('task.STATE.complete'),
        reject: this.$t('task.STATE.reject'),
        confirm: this.$t('task.STATE.confirm'),
        undefined: this.$t('task.STATE.unde')
      }[state]
    },

    searchInput (text) {
      this.searchNameText = text
      this.setSearchString(this.searchNameText, this.approverList)
    }
  },
  data () {
    return {
      isInit: false,
      loading: false,
      manager: {
        list: [],
        total: 0,
        current: 1
      },
      selectDepartment: {},
      searchNameText: '', // 검색 결재자명
      isActive: this.active || false,
      typeOptions: [{ key: 'S', label: this.$t('task.PAY.title') }, { key: 'M', label: this.$t('task.PAY.agree') }], // 결재/합의
      selectedPart: 0,
      searchApprover: '',
      selectedRow: [],
      tableCnt: 1,
      recentUserList: [],
      approverList: [
        { field: 'member00', name: '손정현 대표이사', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member01', name: '현윤섭 팀장', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member02', name: '고정욱 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member03', name: '곽선대 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member04', name: '김대균 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member05', name: '김우승 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member06', name: '김종현 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member07', name: '민현기 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member08', name: '박종민 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member09', name: '서용인 팀장', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        { field: 'member10', name: '정아름 총괄담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false }
        // { field: 'member11', name: '현윤섭 팀장', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member12', name: '고정욱 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member13', name: '곽선대 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member14', name: '김대균 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member15', name: '김우승 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member16', name: '김종현 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member17', name: '민현기 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member18', name: '박종민 담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member19', name: '서용인 팀장', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false },
        // { field: 'member20', name: '정아름 총괄담당', belong: '(주)신세계아이앤씨', department: 'IDC사업팀', isChecked: false }
      ],
      departmentList: [
        { field: 'ssgInc', label: '(주)신세계아이앤씨' }
      ],
      listColumns: [
        { binding: 'type', header: '결재/합의', width: this.$i18n.locale === 'en' ? 220 : 150, customHtml: true, keyPath: 'admin.PREF.approAgree' },
        { binding: 'no', header: '순번', width: 50, keyPath: 'task.PRIOR.GRID.order' },
        { binding: 'userName', header: '이름', customHtml: true, keyPath: 'common.MODAL.name' },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group' },
        { binding: 'remove', header: '삭제', width: 60, customHtml: true, keyPath: 'common.BTN.delete' }
      ],
      listData: [],
      treeData: [
        {
          title: '(주)신세계아이앤씨',
          children: [
            { title: 'CSR팀' },
            {
              title: 'IT사업부',
              children: [
                {
                  title: 'IT사업기획팀',
                  children: [
                    { title: '부서1' },
                    { title: '부서2' },
                    { title: '부서3' }
                  ]
                },
                { title: '디지털혁신팀' },
                {
                  title: 'IT1담당',
                  children: [
                    { title: '품질관리팀' },
                    { title: '정보보안팀' },
                    { title: '시스템개발팀' },
                    { title: 'IDC사업팀', children: [{ title: '인프라관제' }] },
                    { title: 'IDC운영팀' },
                    { title: '블라섬팀' },
                    { title: '인사재무팀' },
                    { title: '정보서비스사업팀' },
                    { title: '협력회사' }
                  ]
                },
                { title: 'IT2담당' },
                { title: '운영1총괄팀' },
                { title: '운영2총괄팀' }
              ]
            }
          ]
        }
      ]
    }
  }
}
</script>
<style lang="scss">
  .blossom-organization {
    height: 70vh;
    width: 1200px;
    overflow-y: auto;
    margin-bottom: $gap-m;

    .blossom-section-group {
      font-size: 16px;
      margin-bottom: $gap-m;
      .group-title {
        height: 16px;
        font-weight: normal;
        margin-bottom: $gap;
      }
      .group-contents {
        // border: 1px solid darkkhaki;
        overflow: hidden;
      }
    }

    .recent-user-list {
      background: $dark-navy;
      border-radius: 2px;
      height: 70px;
      width: 100%;
      display: flex;
      padding: 0 $gap;
      align-items: center;
      > .recent-user-item {
        display: inline-block;
        margin-right: $gap-m;
      }
    }

    .blossom-organization-body {
      display: flex;
      justify-content: space-between;
      // padding-top: $gap-s;
      height: 48vh;

      > .rightside-icon {
        width: 30px;
        display: flex;
        align-items: center;
        > .-icon {
          width: 27px; height: 27px;
          position: relative;

          &::before { left: -5px; }
          &::after { left: 5px }
          &::before,
          &::after {
            content: '';
            top: 2px;
            border-right: 1px solid #9596a0;
            border-top: 1px solid #9596a0;
            position: absolute;
            width: 20px; height: 20px;
            transform: rotate(45deg);
          }
        }
      }

      .blossom-organization-setting {
        display: flex;

        &.-left {
          width: 550px;
          // height: 380px;

          > .select-department-section {
            width: 250px;
            .blossom-depart-selector {
              margin-right: $gap;
              .el-input {
                .el-input__inner {
                  border: none;
                }
              }
            }
            .department-tree {
              border-right: 1px solid $main-black;
              background-color: transparent;
              border: 1px solid $border-color;
              border-radius: 6px;
              height: calc(100% - 42px);
              padding-left: $gap;
              overflow: auto;
            }
          }
        }

        &.-right {
          flex-direction: column;
          width: 563px;

          .organization-setting-wrap {
            padding: $gap;
            height: 100%;
            background: transparent;
            border: 1px solid $border-color;
            border-radius: 6px;
          }
        }

        .-header {
          display: flex;
          margin-bottom: $gap-s;
          .-title {
            font-size: 16px;
            min-width: 60px;
            line-height: 32px;
            &.en {
              min-width: 90px;
            }
          }
        }

        .select-approver-section {
          flex: 2 1 auto;
          min-width: 300px;
          margin-left: $gap-s;
          .search-wrapper {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            .el-input {
              // width: 150px;
              .el-input__inner {
                border: none;

              }
            }
          }
          .approver-list {
            overflow-y: auto;
            height: calc(100% - 42px);
            background-color: transparent;
            border: 1px solid $border-color;
            border-radius: 6px;
            &.-empty {height: calc(100% - 82px);}
            > .approver-member-item {
              cursor: pointer;
              //  padding: 0 $gap;

              // margin: 0 $gap;
              // border-bottom: 1px solid $border2A;
              // &:last-child {
              //   border: none;
              // }
            }
          }
          .pagination-wrap {
            margin-top: 10px;
          }
        }

        .approve-list-section {
          flex: 5 1 auto;
          overflow-y: auto;
          height: 230px;
           > .panel-body {
            padding: 0;
            border-top: 0;
          }
        }

        .attach-list-section {
          flex: 5 1 auto;
          overflow-y: auto;
          height: 230px;
           > .panel-body {
            padding: 0;
            border-top: 0;
          }
        }
      }

    }

    .radio-switch-group {
      .el-radio-button {
        min-width: 50px;
        .el-radio-button__inner { padding: 0 15px; }
      }
    }

    .button-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 $gap-m;
      &.-bottom {
        flex-direction: row;
        > .button {
          border-radius: $radius;
          margin: 0 5px;
          width: 120px;
        }
      }
      > .button {margin-bottom: $gap-s;}
    }
    .header-button-area {
      display: flex;
      align-items: center;
      > .button:not(.-order) {margin-right: $gap-s;}
    }
    .button {
      margin: 0;
      padding: 0;
      border-radius: $radius-s;
      &.-order {
        padding: 0;
        min-width: auto;
      }
    }
  }

  .-magnify-icon {
    position: relative;
    cursor: pointer;
    display: inline-block;
    width: 16px;
    height: 16px;
    transition: all .3s;
    &::before,
    &::after {
      content: '';
      position: absolute;
    }
    &::before {
      top: 0;
      left: 0;
      width: 10px;
      height: 10px;
      border: 2px solid $white;
      border-radius: 50%;
    }
    &::after {
      bottom: 1px;
      right: -1px;
      width: 7px;
      height: 2px;
      background-color: $white;
      border-radius: 2px;
      transform: rotate(45deg);
    }

    &:hover {
      &::before {
        border-color: $primary;
      }
      &::after {
        background-color: $primary;
      }
    }
  }
</style>
