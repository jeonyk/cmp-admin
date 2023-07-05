<!--
  * 파일명 : SetRoleList.vue
  * 파일 기능 : 역할 리스트 노출 및 관리(추가, 수정, 삭제) 기능
  * 작성자 : 염창윤 외 4명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="set-role-list">
    <filtering-component
      :data="filteringOptions"
      @selected="selectFilter"
      @reset-data="selectFilter"
    />

    <section
      class="table-top-wrap"
    >
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />

      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="routeTo({ name: 'set-role-create'})"
        >
          {{ $t('common.BTN.ADMIN.createRole') }}
        </button>
        <button
          class="button"
          @click="isOpenSetWorkRole = true"
        >
          {{ $v('업무 역할 및 담당 자원 편집') }}
        </button>
      </div>
    </section>

    <section
      class="table-area"
      v-loading="loading"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
    >
      <cmp-grid
        :loading="loading"
        class="route-detail-grid"
        :class="{'dont-click': excelLoading}"
        :item-source="roleTableData"
        :columns="roleColumns"
        selectable
        :init-custom-action="init"
        @selectedRow="selectRow"
        :column-data-map="columnDataMap"
        :use-excel-download="true"
        @set-now-exporting="setNowExporting"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #roleUpper="props">
          <span>{{ setValToLabel(props.row.roleUpper, filteringOptions[0].selections) }}</span>
        </template>
        <!-- 업무 역할 -->

        <template #company="props">
          <span v-if="props.row.company.length === 1">{{ props.row.company[0].label }}</span>
          <el-popover
            placement="top"
            trigger="hover"
            popper-class="-scroll"
            v-else
          >
            <ul class="more-info-list">
              <li
                class="more-info-item"
                v-for="(item, idx) in JSON.parse(JSON.stringify( props.row.company)).splice(1, props.row.company.length)"
                :key="idx"
              >
                {{ item.label }}
              </li>
            </ul>

            <div slot="reference">
              <span v-if="props.row.company.length === 1">
                {{ props.row.company[0].label }}
              </span>
              <span
                v-else-if="props.row.company.length > 1"
              >
                {{ props.row.company[0].label }} 외 <a class="-link">{{ props.row.company.length - 1 }}</a>
              </span>
              <span v-else />
            </div>
          </el-popover>
        </template>
        <!-- <span
            v-html="ArrToHtmlReplace(props.row.company, 'label')"
          /> -->
        <!-- 담당 관계사 -->

        <template #manager="props">
          <span v-if="props.row.manager.length === 1">{{ props.row.manager[0].tag }}</span>
          <el-popover
            placement="top-start"
            trigger="hover"
            popper-class="-scroll"
            v-else
          >
            <ul class="more-info-list">
              <li
                class="more-info-item"
                v-for="(item, idx) in JSON.parse(JSON.stringify(props.row.manager)).splice(1, props.row.manager.length)"
                :key="idx"
              >
                {{ item.tag }}
              </li>
            </ul>

            <div slot="reference">
              <span v-if="props.row.manager.length === 1">
                {{ props.row.manager[0].tag }}
              </span>
              <span v-else-if="props.row.manager.length > 1">
                {{ props.row.manager[0].tag }} 외 <a class="-link">{{ props.row.manager.length - 1 }}</a>
              </span>
              <span v-else />
            </div>
          </el-popover>
        </template>
        <!-- 담당자 -->
        <!-- <span v-html="ArrToHtmlReplace(props.row.manager , 'tag')"/> -->

        <template #isApply="props">
          <el-checkbox
            :value="props.row.isApply"
            disabled
          />
        </template>
        <!--사용자 노출-->
        <template #rolePermTree="props">
          <button
            class="button"
            @click.stop="e => {
              seePermButton(props)
            }"
          >
            <!-- selectedRow = props.cell -->
            {{ $t('common.BTN.ADMIN.viewPerm') }}
          </button>
        </template>
        <!-- 메뉴 권한 설정 -->

        <template #updateTime="props">
          <span>{{ props.row.updateTime | date }}</span>
        </template>
        <!-- 마지막 수정 일자 -->
      </cmp-grid>
    </section>

    <!-- 모달 영역 -->
    <!-- 권한 설정 모달 -->
    <set-auth-modal
      :data="permData"
      :active.sync="setAuthModal"
      @close="setAuthModal = false"
      @select="setAuthModal = false"
      :checkbox-disabled="true"
    />

    <!-- 업무 역할 편집 모달 -->
    <set-work-role-modal
      :role-data="workroleTableData"
      :active.sync="setWorkRoleModal"
      @close="setWorkRoleModal = false"
      @confirm="refreshTaskAndRoleList"
    />
    <el-dialog
      :title="$v('업무 역할 및 담당 자원 편집')"
      :visible="isOpenSetWorkRole"
      width="1100px"
      @close="isOpenSetWorkRole=false"
    >
      <set-work-role-modal-new @close="isOpenSetWorkRole=false" />
    </el-dialog>
  </div>
</template>
<script>
import { cloneDeep, result, find, groupBy } from 'lodash'
import SetAuthModal from '@/components/Modal/SetAuthModal/SetAuthModal'
import SetWorkRoleModal from '@/components/Modal/SetWorkRoleModal/SetWorkRoleModal'

import API from '@sd-fe/cmp-core'
import { mapState, mapGetters } from 'vuex'
import SetWorkRoleModalNew from '@/components/Modal/SetWorkRoleModal/SetWorkRoleModalNew.vue'

export default {
  name: 'SetRoleList',
  components: {
    'set-auth-modal': SetAuthModal,
    'set-work-role-modal': SetWorkRoleModal,
    SetWorkRoleModalNew
  },
  mounted () {
    const menuList = localStorage.getItem('MenuList')
    this.authData = JSON.parse(menuList)
    if (this.$route.params?.setWorkRoleModal) {
      this.setWorkRoleModal = true
    }
  },
  computed: {
    workroleTableData () {
      const roleUpperList = this.filteringOptions.filter(option => option.field === 'roleUpper')[0]
      let tableData = []
      roleUpperList.selections.forEach(item => {
        const obj = {}
        obj.idx = item.idx
        obj.name = item.label
        obj.checked = false
        obj.disable = false
        obj.children = item.children
        tableData.push(obj)
      })
      tableData = tableData.filter(data => data.idx) // name === "전체"(idx 존재하지 않음)를 제외
      return tableData
    },
    ...mapState({
      menuList: state => state.common.menuList
    }),
    ...mapGetters({
      moduleInfo: 'cloud/getModuleInfo'
    })
  },
  watch: {
    roleUpper (newVal) {
      this.filteredData.roleName = ''
      this.filteringOptions[1].selections = newVal.children
    }
  },
  async created () {
    try {
      await this.getGroupList()
      await this.getManagerList()
      await this.getRoleList()
    } catch (error) {
      throw new Error(error)
    }
  },
  methods: {
    setNowExporting (bool) {
      const authDataLength = Object.keys(this.authData).length
      const servicedCloudList = cloneDeep(this.moduleInfo)
      delete servicedCloudList.network
      const replacementColumn = Array.from({ length: authDataLength }, (el, index) => {
        const authDataKey = Object.values(servicedCloudList)[index]
        return {
          binding: `${authDataKey.shortlyLabel}RolePermTree`,
          roleTreeService: `${authDataKey.shortlyLabel}`,
          header: `${authDataKey.displayLabel} 권한`,
          width: 150,
          customHtml: true,
          sorting: false,
          keyPath: `admin.ROLE.${authDataKey.shortlyLabel}Perm`
        }
      })
      if (bool) {
        this.excelLoading = true
        if (this.roleColumns.length === 7) {
          this.TempRoleColumns = cloneDeep(this.roleColumns)
          this.tempTableData = cloneDeep(this.roleTableData)
          this.roleColumns.splice(this.roleColumns.findIndex(el => el.binding === 'rolePermTree'), 1, ...replacementColumn)
          this.changeTableDataForExport(replacementColumn)
        }
      }

      if (!bool) {
        this.roleColumns =
          [
            { binding: 'roleUpper', header: '업무 역할', width: 200, customHtml: true, keyPath: 'admin.ROLE.jobRole' },
            { binding: 'roleName', header: '역할', width: '*', keyPath: 'admin.ROLE.role' },
            { binding: 'company', header: '담당 관계사', width: '*', customHtml: true, keyPath: 'admin.ROLE.chargeAff', filtable: false },
            { binding: 'manager', header: '담당자(이름 / 조직)', width: '*', customHtml: true, keyPath: 'admin.ROLE.contact', filtable: false },
            { binding: 'rolePermTree', header: '권한', width: 150, customHtml: true, sorting: false, keyPath: 'admin.ROLE.perm' },
            { binding: 'isApply', header: '사용자 노출', width: 110, customHtml: true },
            { binding: 'updateTime', header: '마지막 수정 일자', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.ROLE.lastModDate' }
          ]
        this.$nextTick(() => {
          this.roleTableData = this.tempTableData
          this.excelLoading = false
        })
      }
    },
    changeTableDataForExport (newColum) {
      newColum.forEach(el => {
        this.roleTableData.forEach(rowData => {
          const roleTreeRowToService = rowData.rolePermTree[el.roleTreeService]
          // eslint-disable-next-line no-unused-vars
          for (const [key, value] of Object.entries(roleTreeRowToService)) {
            if (value.read) {
              const rolePermLength = JSON.parse(rowData.rolePerm)[el.roleTreeService].length
              rowData[el.binding] = `${value.title} 외 ${rolePermLength > 0 ? rolePermLength - 1 : rolePermLength}`
            }
          }
        })
      })
    },
    seePermButton (props) {
      console.log('@권한보기:', props)
      this.permData = cloneDeep(props.row.rolePermTree)
      this.setAuthModal = true
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (param) {
      this.routeTo({
        name: 'set-role-detail',
        params: { idx: param._data.roleIdx }
        // query: { field: 'admin' }
      })
    },
    /**
     *  페이지 마운트 될 때, 추가로 데이터를 세팅합니다..(edit, index, disable)
     * @param [Array]
     */
    setData (data) {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (item.roleUpper === 'server' || item.roleUpper === 'network' || item.roleUpper === 'security') this.$set(item, 'disable', 'disable')
        })
      }
    },
    init (grid) {
      this.grid = grid
    },
    /**
     * 셀렉트 박스에서 선택한 value를 label 값으로 변환합니다.
     * @param {String} field 선택한 value(field)
     * @param {Array} options 셀렉트 박스 options Array
     * @return {String} 각 value에 해당하는 label
     */
    setValToLabel (field, options) {
      const label = result(find(options, item => {
        return item.value === field
      }), 'label')
      return label
    },
    ArrToHtmlReplace (comps, field) {
      const comp = comps.map(item => item[field])
      const cellStr = comp.join('<br>')
      return cellStr
    },

    /**
     * 조직 조회 메소드
     */
    async getGroupList () {
      this.loading = true
      const groupList = await API.iam.getGroupList()
      this.companyList = groupList
        .filter(com => com.groupUpper === 0)
        .filter(com => !['common', 'infra', 'unknown'].includes(com.companyCode))
        .map(com => {
          return {
            field: com.groupIdx,
            label: com.groupName,
            acitve: false
          }
        })

      this.companyList = groupList.filter(com => com.groupUpper === 0)
        .filter(com => !['common', 'infra', 'unknown'].includes(com.companyCode))
        .map(com => {
          return {
            field: com.groupIdx,
            label: com.groupName
          }
        })
      const groupMap = new Map()
      for (const group of groupList) {
        if (group.groupUpper !== 0) {
          groupMap.set(group.groupIdx, group.groupName)
        }
      }
      this.groupMap = groupMap
    },

    /**
     * 역할 리스트 조회 메소드
     */

    async getManagerList () {
      const managerList = await API.iam.getUserList({ userPermLevel: 1, isAdmin: true })

      this.managerList = managerList.userList.map(man => {
        return {
          userIdx: man.userIdx,
          userId: man.userId,
          userName: man.userName,
          userPosition: man.userPosition,
          userGroup: this.groupMap.get(man.userGroup)
        }
      })
    },
    async getRoleList () {
      const roleManageList = await API.iam.getRoleManageList({ roleIdx: 0 })
      const mappedCreateTime = []

      this.roleRawData = roleManageList.map(role => {
        const roleObj = { ...role }
        roleObj.company = roleObj.company.map(com => {
          return { label: com }
        })

        const companyListByLabel = groupBy(this.companyList, 'label')
        const managerGroup = groupBy(this.managerList, 'userIdx')
        roleObj.company = roleObj.company.filter(el => companyListByLabel[el.label] !== undefined)
        roleObj.manager = roleObj.manager.filter(el => managerGroup[el.userIdx] !== undefined)

        roleObj.manager = roleObj.manager
          .filter(manager => manager)
          .map(manager => {
            if (manager) {
              return { tag: this.getManagerString(manager) }
            }
          })

        roleObj.rolePermTree = this.convertPerm(role.rolePerm)

        if (roleObj.updateTime) mappedCreateTime.push({ value: roleObj.updateTime, caption: this.$options.filters.date(roleObj.updateTime) })
        // roleObj.roleUpper = this.setValToLabel(roleObj.roleUpper, this.filteringOptions[0].selections)
        return roleObj
      })

      this.setFilteringOptions(roleManageList)
      this.roleTableData = cloneDeep(this.roleRawData)
      this.columnDataMap.updateTime = Array.from(new Set(mappedCreateTime))
      this.loading = false
    },
    /**
     * Filtering Options 설정
     * 업무역할, 관계사, 담당자
     */
    async setFilteringOptions (roleList) {
      const companySet = new Set()
      const managerSet = new Set()
      roleList.forEach(role => {
        if (role.company?.length > 0) role.company.forEach(com => companySet.add(com))
        if (role.manager?.length > 0) {
          role.manager.forEach(man => {
            if (man) {
              managerSet.add(this.getManagerString(man))
            }
          })
        }
      })
      await this.refreshTaskRole()
      this.filteringOptions[1].selections = [...[...companySet].map(com => {
        return {
          label: com,
          value: com
        }
      })]
      this.filteringOptions[2].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...[...managerSet].map(man => {
        return {
          label: man,
          value: man
        }
      })]
    },
    async refreshTaskAndRoleList (beforeData, newData) {
      await this.getRoleList()
      // const taskRoleList = await API.iam.getTaskRoleList()
      // this.filteringOptions[0].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...taskRoleList.map((role, index) => {
      //   return {
      //     idx: role.roleIdx,
      //     label: role.roleName,
      //     value: role.roleName,
      //     children: this.getChildrenRole(role.roleName)
      //   }
      // })]

      // if (beforeData) {
      //   for (const i in this.roleTableData) {
      //     if (beforeData.name === this.roleTableData[i].roleUpper) {
      //       this.roleTableData[i].roleUpper = newData.name
      //     }
      //   }
      //   this.$forceUpdate()
      // }
    },
    async refreshTaskRole () {
      const taskRoleList = await API.iam.getTaskRoleList()
      this.filteringOptions[0].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...taskRoleList.map(role => {
        return {
          idx: role.roleIdx,
          label: role.roleName,
          value: role.roleName,
          children: this.getChildrenRole(role.roleName)
        }
      })]
    },
    /**
     * Manager Object를 String으로 변환
     */
    getManagerString (manager) {
      return manager.userName + ' ' + manager.userPosition + ' (' + manager.groupName + ')'
    },
    /**
     * 필터 선택시 별도 필드에 저장
     */
    selectFilter (select) {
      this.filterObj = select
      this.searchData()
    },
    /**
     * 적용 버튼 클릭 시 필터링 조회
     */
    searchData () {
      this.roleTableData = this.roleRawData.filter(role => {
        let result = true
        if (this.filterObj?.roleUpper) result = result && (role.roleUpper === this.filterObj.roleUpper)
        if (this.filterObj?.company) result = result && (role.company.map(com => com.label).includes(this.filterObj.company))
        if (this.filterObj?.manager) result = result && (role.manager.map(man => man.tag).includes(this.filterObj.manager))
        return result
      })
    },
    /**
     * 업무역할 편집에 사용되는 업무역할별 하위 역할 입력
     */
    getChildrenRole (role) {
      const result = this.roleRawData.filter(roleItem => roleItem.roleUpper === role)
      return result.map(roleItem => { return { role: roleItem.roleName } })
    },
    convertPerm (perm) {
      const permArr = JSON.parse(perm) || []
      const result = cloneDeep(this.authData)
      const servicedCloudList = cloneDeep(this.moduleInfo)
      delete servicedCloudList.network
      for (const [, value] of Object.entries(servicedCloudList)) {
        const cloudShortlyLabel = value.shortlyLabel
        result[cloudShortlyLabel].map((el, index) => this.deleteParentDFS(el, permArr[cloudShortlyLabel]))
      }
      return result
    },

    deleteParentDFS (node, permData) {
      const newNode =
        {
          accessible: node.accessible,
          depth: node.depth,
          id: node.id,
          read: node.read || false,
          routeTo: node.routeTo,
          title: node.title
        }
      if (permData?.includes(node.routeTo)) node.read = true
      if (node.children) newNode.children = node.children.map(node => this.deleteParentDFS(node, permData))

      return newNode
    },

    recurCheckPerm (data, permData) {
      if (permData?.includes(data.routeTo)) {
        data.read = true
      }
      if (data.children?.length > 0) {
        for (const i in data.children) {
          this.recurCheckPerm(data.children[i], Object.entries(permData)[i][1])
        }
      }
    }
  },
  data () {
    return {
      isOpenSetWorkRole: false, // 업무 역할 및 담당 자원 설정
      totalResultCnt: 0,
      // 필터링 데이터
      filteringOptions: [
        {
          field: 'roleUpper',
          label: '업무 역할',
          keyPath: 'admin.ROLE.jobRole',
          selections: []
        },
        {
          field: 'company',
          label: '담당 관계사',
          keyPath: 'admin.ROLE.chargeAff',
          selections: []
        },
        {
          field: 'manager',
          label: '담당자',
          keyPath: 'admin.ROLE.contact',
          selections: []
        }
      ],

      // 테이블 데이터
      roleColumns: [
        { binding: 'roleUpper', header: '업무 역할', width: 200, customHtml: true, keyPath: 'admin.ROLE.jobRole' },
        { binding: 'roleName', header: '역할', width: '*', keyPath: 'admin.ROLE.role' },
        { binding: 'company', header: '담당 관계사', width: '*', customHtml: true, keyPath: 'admin.ROLE.chargeAff', filtable: false },
        { binding: 'manager', header: '담당자(이름 / 조직)', width: '*', customHtml: true, keyPath: 'admin.ROLE.contact', filtable: false },
        { binding: 'rolePermTree', header: '권한', width: 180, customHtml: true, sorting: false, keyPath: 'admin.ROLE.perm' },
        { binding: 'isApply', header: '사용자 노출', width: 110, customHtml: true },
        { binding: 'updateTime', header: '마지막 수정 일자', width: 200, customHtml: true, dataType: 'Date', keyPath: 'admin.ROLE.lastModDate' }
      ],
      tempColumns: [],
      tempTableData: [],
      roleTableData: [],
      companyList: [],
      companyListByLabel: [],
      managerList: [],
      subOptions: [],
      editStatus: false,
      selectedRow: undefined, // 선택한 로우
      newTableItem: {
        roleUpper: '',
        roleName: '',
        manager: '',
        isVisible: true,
        updateTime: new Date()
      },
      roleUpper: '',
      filteredData: undefined,
      roleName: '',
      isVisible: true,
      setWorkRoleModal: false,
      setAuthModal: false,
      filterObj: undefined,
      roleRawData: [],
      permData: JSON.parse(localStorage.getItem('MenuList')),
      authData: [],
      groupMap: undefined,
      loading: false,
      excelLoading: false,
      columnDataMap: {
        updateTime: null
      }
    }
  }
}
</script>
<style lang="scss">
  .set-role-list {
    .wj-cell {
      overflow: visible;
      justify-content: flex-start;
      padding: 0 $gap * 2;
      cursor: pointer;
    }
  }
  .dont-click {
    pointer-events: none;
  }
</style>
