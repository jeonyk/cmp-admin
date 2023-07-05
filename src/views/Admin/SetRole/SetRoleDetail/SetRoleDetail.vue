<!--
  * 파일명 : SetRoleDetail.vue
  * 파일 기능 : 역할 관리 상세 페이지
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할관리 > 관계사 설정 초기 설정 데이터 세팅
 -->

<template>
  <div
    class="set-role-detail"
    v-loading="loading"
  >
    <!-- <pre>{{ roleItem.company ? roleItem.company : '선택한 관계사가 없습니다.' }}</pre><br> -->
    <!-- <pre>{{ roleItem.manager ? roleItem.manager : '선택한 담당자가 없습니다.' }}</pre> -->
    <section class="detail-contents">
      <register-contents
        :title="$t('admin.ROLE.jobRole')"
      >
        <template>
          <el-select
            v-if="editStatus"
            v-model="roleItem.roleUpperIdx"
            :placeholder="$t('common.PLACEHOLDER.selectName', { name: $t('admin.WF.task') })"
            :popper-append-to-body="false"
            style="width: 300px;"
          >
            <el-option
              v-for="item in taskRoleList"
              :key="item.roleIdx"
              :label="item.roleName"
              :value="item.roleIdx"
            />
          </el-select>
          <!-- <span v-else>{{ Number.isInteger(roleItem.roleUpper) ? setValToLabel(roleItem.roleUpper, taskRoleList) : roleItem.roleUpper }}</span> -->
          <span v-else>{{ roleItem.roleUpperIdx === null ? '' : setValToLabel(roleItem.roleUpperIdx, taskRoleList) }}</span>
        </template>
      </register-contents>
      <!-- /. 업무 역할 -->

      <register-contents
        :title="$t('admin.ROLE.role')"
        required
      >
        <el-input
          v-model="roleItem.roleName"
          :placeholder="$t('common.ALERT.ROLE.006')"
          v-if="editStatus"
        />
        <!-- <span v-else>{{ roleItem.roleName? roleItem.roleName : setValToLabel(roleItem.roleName, subOptions) }}</span> -->
        <span v-else>{{ roleItem.roleName }}</span>
      </register-contents>
      <!-- 하위 역할 -->

      <register-contents
        :title="$t('admin.ROLE.chargeAff')"
      >
        <div class="register-wrap">
          <button
            v-if="editStatus"
            class="button"
            @click.stop="selectButtonAction(roleItem.company, companyList)"
          >
            <!-- @click.stop="setCompModal = true" -->
            {{ $t('admin.ACCOUNT.selectAff') }}
          </button>
          <div
            v-if="roleItem.company"
            class="tag-lists"
          >
            <el-tag
              v-for="tag in roleItem.company"
              :key="tag.label"
              :closable="editStatus"
              @close="closeTag(roleItem.company, tag, 'field')"
            >
              {{ tag.label }}
            </el-tag>
          </div>
        </div>
      </register-contents>
      <!-- 담당 관계사 -->

      <register-contents
        :title="$t('admin.ROLE.contactSimple')"
      >
        <div class="register-wrap">
          <button
            v-if="editStatus"
            class="button"
            @click.stop="managerModal = true"
          >
            {{ $t('common.PLACEHOLDER.selectName', { name: $t('admin.ROLE.contactSimple') }) }}
          </button>
          <div
            v-if="roleItem.manager"
            class="tag-lists"
          >
            <el-tag
              v-for="tag in roleItem.manager"
              :key="tag.tag"
              :closable="editStatus"
              @close="closeTag(roleItem.manager, tag, 'userIdx')"
            >
              {{ tag.tag | clearComma }}
            </el-tag>
          </div>
        </div>
      </register-contents>
      <!-- /.담당자 -->

      <register-contents
        :title="$t('admin.ACCOUNT.perm')"
      >
        <div class="register-wrap">
          <button
            v-if="editStatus"
            class="button"
            @click.stop="setAuthModal = true"
          >
            {{ editStatus ? $t('admin.ROLE.setPerm') : $t('common.BTN.ADMIN.viewPerm') }}
          </button>
          <button
            v-else
            class="button"
            @click.stop="setAuthModal = true"
          >
            {{ editStatus ? $t('admin.ROLE.setPerm') : $t('common.BTN.ADMIN.viewPerm') }}
          </button>
        </div>
      </register-contents>
      <!-- 권한설정 -->
      <register-contents
        :title="$t('admin.ROLE.userVisible')"
        required
      >
        <div class="radio-button-container">
          <el-radio
            v-for="(item,index) in ['Y','N']"
            :label="item==='Y'?true:false"
            :key="index"
            v-model="roleItem.isApply"
            :disabled="!editStatus"
            class="radio"
          >
            {{ item }}
          </el-radio>
        </div>
      </register-contents>
      <!-- 사용자 노출여부 -->
      <register-contents :title="$t('common.GRID.memo')">
        <el-input
          type="textarea"
          v-if="editStatus"
          v-model="roleItem.roleMemo"
          :autosize="{ minRows: 10, maxRows: 10}"
        />
        <el-input
          type="textarea"
          v-else
          v-model="roleItem.roleMemo"
          :autosize="{ minRows: 10, maxRows: 10}"
          readonly
        />
      </register-contents>
      <!-- /.메모 -->
    </section>

    <section class="big-button-area">
      <button
        class="button"
        @click="applyDelete"
        type="is-anti"
      >
        {{ $t('common.BTN.delete') }}
      </button>
      <button
        class="button"
        @click="checkContentsOnEditing"
      >
        {{ $t('common.BTN.list') }}
      </button>
      <button
        class="button"
        @click="applyUpdate"
        type="is-primary"
      >
        {{ editStatus? $t('common.BTN.modified') : $t('common.BTN.modify') }}
      </button>
    </section>

    <!-- 모달 영역 -->
    <!-- 관계사 선택 모달 -->
    <select-list-modal
      :title="$t('admin.ACCOUNT.selectAff')"
      :active.sync="setCompModal"
      @close="setCompModal = false"
      @select="setSelectedRelation"
      :data.sync="companyList"
    />
    <!-- 담당자 선택 모달 -->
    <set-manager-modal
      :active.sync="managerModal"
      @close="managerModal = false"
      @select="setMapping(...arguments, 'manager')"
      :title="$t('common.PLACEHOLDER.selectName', { name: $t('admin.ROLE.contactSimple') })"
      :data="managerList"
      :init-auto-select-row.sync="roleItem.manager"
    />
    <!-- 권한 설정 모달 -->
    <set-auth-modal
      :data="roleItem.rolePermTree"
      :active.sync="setAuthModal"
      @close="authModalCloseHandler"
      @select="setAuthTreeData"
      :checkbox-disabled="!editStatus"
    />
  </div>
</template>
<script>
import SelectListModal from '@/components/Modal/SelectListModal/SelectListModal'
import SetManagerModal from '@/components/Modal/SetManagerModal/SetManagerModal'
import SetAuthModal from '@/components/Modal/SetAuthModal/SetAuthModal'
import API from '@sd-fe/cmp-core'
import { groupBy, cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'SetRoleDetail',
  components: {
    'select-list-modal': SelectListModal,
    'set-manager-modal': SetManagerModal,
    'set-auth-modal': SetAuthModal
  },
  async created () {
    try {
      this.loading = true
      this.editStatus = !this.$route.params.idx
      // 업무역할
      await this.getTaskRole()
      // 관계사 리스트
      await this.getGroupList()
      // 담당자 리스트
      await this.getManagerList()
      await this.getRoleInfo()
      this.loading = false
      // this.authData = this.roleItem.rolePermTree
      this.authList = cloneDeep(this.roleItem.rolePermTree)
      this.$forceUpdate()
    } catch (error) {
      throw new Error(error)
    }
  },
  mounted () {
    // const menuList = localStorage.getItem('MenuList')
  },
  computed: {
    ...mapGetters({
      moduleInfo: 'cloud/getModuleInfo'
    })
  },
  methods: {
    authModalCloseHandler () {
      this.roleItem.rolePermTree = cloneDeep(this.authList)
      this.setAuthModal = false
    },
    /** 임시
     * 백엔드에서 삭제된 담당관계사, 담당자를 보내지 않는다면 삭제해도 문제없습니다.
     **/
    deleteNullData () {
      const companyListByLabel = groupBy(this.companyList, 'label')
      const managerListByIdx = groupBy(this.managerList, 'userIdx')
      this.roleItem.company = this.roleItem.company.filter(el => companyListByLabel[el.label] !== undefined)
      this.roleItem.manager = this.roleItem.manager.filter(el => managerListByIdx[el.userIdx] !== undefined)
    },
    // 모달 창 확인 클릭시 모달에서 선택한 데이터 테그에 바인딩
    setAuthTreeData (tableData) {
      let selectedAuth = []
      const result = {}
      const rolePermOnlyRouteToObj = {}
      const servicedCloudList = cloneDeep(this.moduleInfo)
      delete servicedCloudList.network
      selectedAuth = tableData.map((node) => node.children).flat()
      selectedAuth = groupBy(selectedAuth, 'id')
      for (const [key, value] of Object.entries(selectedAuth)) {
        const cloudShortlyLabel = servicedCloudList[key.toLowerCase()].shortlyLabel
        const children = value.flat()[0]
        result[cloudShortlyLabel] = children.children
      }
      this.authList = result // 여기서 모달에 권한 체크박스에 바인딩된 트리를 업데이트 합니다.
      for (const [key, value] of Object.entries(servicedCloudList)) {
        console.log(key, value)
        const cloudShortlyLabel = value.shortlyLabel
        const tempPermList = []
        if (this.authList[cloudShortlyLabel]) {
          this.authList[cloudShortlyLabel].forEach((el) => this.convertOnlyRouteToObj(el, tempPermList))
          rolePermOnlyRouteToObj[cloudShortlyLabel] = tempPermList
        }
      }
      this.roleItem.rolePermTree = this.authList
      this.roleItem.rolePerm = JSON.stringify(rolePermOnlyRouteToObj)
      this.setAuthModal = false
    },
    convertOnlyRouteToObj (node, routeToArr) {
      if (node.read) {
        routeToArr.push(node.routeTo)
      }
      if (node.children) {
        node.children.forEach(node => this.convertOnlyRouteToObj(node, routeToArr))
      }
      return routeToArr
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
    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * 셀렉트 박스에서 선택한 value를 label 값으로 변환합니다.
     * @param {String} idx 찾을 역할의 roleIdx
     * @param {Array} options 셀렉트 박스 options Array
     * @return {String} 각 value에 해당하는 label
     */
    setValToLabel (idx, options) {
      const role = options.find(item => item.roleIdx === idx)
      if (role) return role.roleName
      else return ''
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 데이터를 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    async applyDelete () {
      this.$confirm(this.$t('common.CONFIRM.BASE.035'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        const deleteResponse = await API.iam.deleteRole({ roleIdx: this.$route.params.idx })
        if (deleteResponse) {
          this.$alert(this.$t('common.ALERT.BASE.017'))
          this.routeTo({ name: 'set-role' })
        } else {
          this.$alert(this.$t('common.ALERT.BASE.016'))
        }
      }).catch(() => false)
    },
    /**
     * [수정 완료] 버튼을 눌렀을 때, 선택한 row 데이터를 업데이트 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyUpdate () {
      if (!this.editStatus) this.editStatus = !this.editStatus // '수정'
      else { // '수정 완료'
        if (!this.roleItem.roleName || this.roleItem.roleName === '') {
          this.$alert(this.$t('common.ALERT.ROLE.006'), '', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return false
        }
        let duplicateName = false
        for (const i in this.taskRoleList) {
          if (this.taskRoleList[i].label === this.roleItem.roleName) {
            duplicateName = true
          }
        }
        if (duplicateName) {
          this.$alert(this.$t('common.ALERT.ROLE.002'), '', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return false
        }

        this.$confirm(this.$t('common.CONFIRM.BASE.005'), '수정', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(async () => {
          const param = {
            roleIdx: this.roleItem.roleIdx,
            roleName: this.roleItem.roleName,
            roleUpper: this.roleItem.roleUpperIdx,
            rolePerm: this.roleItem.rolePerm,
            userIdxList: this.roleItem.manager?.map(man => man.userIdx) || [],
            companyIdxList: this.roleItem.company?.map(com => com.field) || [],
            roleMemo: this.roleItem.roleMemo || '',
            isApply: this.roleItem.isApply
          }
          const response = await API.iam.updateRole(param)
          if (response) {
            this.$alert(this.$t('common.ALERT.BASE.047'))
            this.editStatus = !this.editStatus
            this.rawItem = cloneDeep(this.roleItem)
          }
        }).catch((err) => {
          if (err.code === 'IAM041') {
            this.$alert(this.$t('common.ALERT.ROLE.010'))
          }
          return false
        })
      }
    },
    /**
     * roleUpper에 대한 처리 메소드
     * 기존 데이터 : String,
     * update 필요 데이터 : Integer
     * @param role roleUpper 데이터
     */
    getRoleUpper (role) {
      if (Number.isInteger(role)) {
        return role
      }
      return this.taskRoleList.filter(task => task.label === role)[0].field
    },
    /**
     * 데이터를 처음 상태로 세팅합니다. (수정)
     * @param [Array] 모달에서 선택한 관계사들 양식에 맞게 텍스트로 변환합니다.
     */
    setDataInitState () {
      this.roleItem = { ...this.rawItem }
      this.editStatus = false
      this.$forceUpdate()
    },
    /**
     * 모달에서 선택한 관계사 데이터를 가져옵니다.
     * @param [Array] 모달에서 선택한 관계사들 el-tag에 넣을 수 있도록 변환합니다.
     */
    setMapping (parameter, range) {
      let comps = []
      if (range === 'manager') {
        comps = parameter.map(item => {
          const userName = item.userName ? item.userName : ''
          const userPosition = item.userPosition ? item.userPosition : ''
          const userGroup = item.userGroup ? `(${item.userGroup})` : ''
          return {
            ...item,
            // tag: userName + ' ' + userPosition + ' ' + userGroup
            tag: [userName, userPosition, userGroup].join(' ')
          }
        })
      } else {
        comps = parameter
      }
      this.roleItem[range] = comps
    },
    /**
     * [관계사 선택] 클릭 시, 데이터 셀렉트 세팅
     */
    selectButtonAction (tagArr, allArr) {
      allArr.forEach(item => {
        item.selected = false
        tagArr.forEach(tag => {
          if (tag.field === item.field) {
            item.selected = true
          }
        })
      })
      this.companyList = allArr
      this.setCompModal = true
      // return allArr
    },
    /**
     * [목록, 취소]를 눌렀을 때, 편집 상태에서 페이지를 떠날 것인지 알림을 띄웁니다.
     */
    checkContentsOnEditing () {
      if (this.editStatus) {
        this.$confirm(this.$t('common.CONFIRM.BASE.014'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel'),
          dangerouslyUseHTMLString: true
        }).then(() => {
          this.setDataInitState()
          this.$router.go(-1)
        }).catch(() => false)
      } else this.$router.go(-1)
    },
    closeTag (arr, tag, id) {
      let removeIdx
      arr.forEach((item, idx) => {
        if ((tag[id] && item[id] === tag[id])) {
          // if (item.selected)item.selected = false
          // if (item.checked)item.checked = false
          removeIdx = idx
        }
      })
      arr.splice(removeIdx, 1)

      // 권한 태그 클릭시 권한 모달 데이터 바인딩 재귀 돌면서 취소
      if (id === 'id') {
        const array = []
        this.authList.forEach(tag => array.push(tag.routeTo))
        this.roleItem.rolePermTree.forEach(auth => {
          if (array.includes(auth.routeTo)) auth.read = true
          else this.uncheckTree(auth)
        })
      }
    },
    uncheckTree (node) {
      if (node.children?.length > 0) {
        node.read = false
        node.children.forEach(child => {
          this.uncheckTree(child)
        })
      } else {
        node.read = false
      }
    },
    setSelectedRelation (parameter) {
      // this.relationCorpList = parameter
      this.setMapping(parameter, 'company')
    },
    /**
     * 역할 정보 조회 메소드
     */
    async getRoleInfo () {
      if (this.$route?.params?.idx === undefined) return
      const response = await API.iam.getRoleManageList({ roleIdx: this.$route.params.idx })

      if (response?.length > 0) {
        const data = { ...response[0] }
        const settedData = this.setRoleData(data)

        this.rawItem = JSON.parse(JSON.stringify(settedData))
        this.roleItem = JSON.parse(JSON.stringify(settedData))
        this.deleteNullData()
      } else {
        this.$alert(this.$t('common.ALERT.ROLE.009'))
        this.$router.push({ name: 'set-role' })
      }

      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.roleItem.roleName ? this.roleItem.roleName : this.$t('bc.ADMIN.roleDetail'),
        path: ''
      })
    },
    /**
     *
     */
    setRoleData (data) {
      if (data.company?.length > 0) {
        data.company = data.company?.map(com => {
          const getData = this.getCompanyData(com)
          return {
            isActive: true,
            field: getData?.field,
            label: com,
            selected: true
          }
        })
      }
      if (data.manager?.length > 0) {
        data.manager = data.manager?.map(man => {
          return {
            tag: this.getManagerString(man),
            userIdx: man.userIdx
          }
        })
      }
      if (!this.map(this.taskRoleList, 'roleIdx').includes(data.roleUpperIdx)) {
        data.roleUpperIdx = null
        data.roleUpper = ''
      }
      data.rolePermTree = this.convertPerm(data.rolePerm)

      return data
    },
    /**
     * Manager Object를 String으로 변환
     */
    getManagerString (manager) {
      return manager.userName + ' ' + manager.userPosition + ', (' + manager.groupName + ')'
    },
    /**
     * 권한 String 데이터를 Tree로 변환
     */
    convertPerm (perm) {
      const permArr = JSON.parse(perm) || []
      const result = cloneDeep(this.authData)
      const servicedCloudList = cloneDeep(this.moduleInfo)
      delete servicedCloudList.network
      for (const [key, value] of Object.entries(servicedCloudList)) {
        const cloudShortlyLabel = value.shortlyLabel
        console.log(key)
        result[cloudShortlyLabel].map((el, index) => this.deleteParentDFS(el, permArr[cloudShortlyLabel]))
      }
      return result
    },
    /**
     * 재귀로 Menu Read 체크
     */
    recurCheckPerm (data, permData) {
      const authRoots = ['dashboard', 'task', 'service-catalogue', 'config-manage', 'metering', 'billing', 'monitoring', 'set']
      if (permData.includes(data.routeTo)) {
        data.read = true
      }

      // 테크에 루트 데이터 바인딩
      if (authRoots.includes(data.routeTo) && data.read) {
        this.authList.push(data)
      }
      if (data.children?.length > 0) {
        for (const i in data.children) {
          this.recurCheckPerm(data.children[i], permData)
        }
      }
    },
    /**
     * 업무역할 조회 메소드
     */
    async getTaskRole () {
      const response = await API.iam.getTaskRole()
      if (!response) this.taskRoleList = []
      else this.taskRoleList = [{ roleIdx: null, roleName: '미할당' }, ...response]
    },
    /**
     * 조직 조회 메소드
     */
    async getGroupList () {
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
      const groupMap = new Map()
      for (const group of groupList) {
        if (group.groupUpper !== 0) {
          groupMap.set(group.groupIdx, group.groupName)
        }
      }
      this.groupMap = groupMap
    },
    /**
     * 담당자 조회 메소드
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
    /**
     * 관계사명으로 전체 데이터 조회
     * @param company 관계사명
     */
    getCompanyData (company) {
      return this.companyList.filter(com => com.label === company)[0]
    },
    map (arr, key) {
      const data = arr.map(item => { return item[key] })
      return data
    }
  },
  data () {
    return {
      editStatus: false,
      groupMap: undefined,
      roleItem: {
        roleUpper: '',
        roleName: '',
        company: [],
        manager: [],
        isApply: null,
        roleMemo: '',
        rolePerm: localStorage.getItem('MenuList'),
        rolePermTree: JSON.parse(localStorage.getItem('MenuList'))
      },
      rawItem: {
        roleUpper: '',
        roleName: '',
        company: [],
        manager: [],
        isApply: null,
        roleMemo: '',
        rolePerm: localStorage.getItem('MenuList'),
        rolePermTree: JSON.parse(localStorage.getItem('MenuList'))
      },
      // 모달
      setCompModal: false,
      managerModal: false,
      setAuthModal: false,

      // 업무역할, 하위역할 옵션
      subOptions: [],
      taskRoleList: [
        { roleIdx: null, roleName: '미할당' }
      ],
      managerList: [],

      // 모달 관계사 목록
      companyList: [],
      authList: [],
      authData: JSON.parse(localStorage.getItem('MenuList')),
      loading: false
    }
  }
}
</script>
<style lang="scss" scoped>
.set-role-detail {
  .detail-contents {
    border-top: 1px solid $border-color;
    border-bottom:1px solid $border-color;
  }
  .register-wrap {
    display: flex;
    align-items: center;
    > button {
      margin-right: $gap-s;
    }
    > .tag-lists {
      flex: 0 0 80%;
    }

  }
}
.radio-button-container {
  .el-radio {
    display: inline-block;
    &:nth-of-type(2){
      margin-left: 20px;
    }
  }
}
.divided {
  display: flex;
  > * {
    flex: 0 0 50%;
  }
}

</style>

<style lang="scss">
.set-role-detail {
  .el-textarea {
    textarea:read-only{
      border:none;
      &:focus { // readonly 상태에서 클릭시 transparent 방지;
        background-color:#1F1E32 !important;
        color:#e1e1e1;
      }
    }
  }
}
</style>
