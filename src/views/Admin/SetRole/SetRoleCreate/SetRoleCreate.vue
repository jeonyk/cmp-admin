<!--
  * 파일명 : SetRoleCreate.vue
  * 파일 기능 : 역할 생성 Form
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할관리 > 관계사 설정 초기 설정 데이터 세팅
 -->

<template>
  <div class="set-role-create">
    <section class="detail-contents">
      <register-contents
        :title="$t('admin.ROLE.jobRole')"
      >
        <el-select
          v-model="newRole.roleUpper"
          :placeholder="$t('common.PLACEHOLDER.selectName', { name: $t('admin.WF.task') })"
          :popper-append-to-body="false"
          style="width: 300px;"
        >
          <el-option
            v-for="item in taskRoleList"
            :key="item.field"
            :label="item.label"
            :value="item.field"
          />
        </el-select>
      </register-contents>
      <!-- /. 업무 역할 -->

      <register-contents
        :title="$t('admin.ROLE.role')"
        required
      >
        <el-input
          v-model="newRole.roleName"
          :placeholder="$t('common.ALERT.ROLE.006')"
        />
      </register-contents>
      <!-- 하위 역할 -->

      <register-contents :title="$t('admin.ROLE.chargeAff')">
        <div class="register-wrap">
          <button
            class="button"
            @click="selectButtonAction(newRole.company, companyList)"
          >
            {{ $t('admin.ACCOUNT.selectAff') }}
          </button>
          <div
            v-if="newRole.company"
            class="tag-lists"
          >
            <el-tag
              v-for="(tag, idx) in newRole.company"
              :key="tag.label"
              closable
              @close="closeTag(newRole.company, idx)"
            >
              {{ tag.label }}
            </el-tag>
          </div>
        </div>
      </register-contents>
      <!-- 담당 관계사 -->

      <register-contents :title="$t('admin.ROLE.contactSimple')">
        <div class="register-wrap">
          <button
            class="button"
            @click="managerModal = true"
          >
            {{ $t('common.PLACEHOLDER.selectName', { name: $t('admin.ROLE.contactSimple') }) }}
          </button>
          <div
            class="tag-lists"
            v-if="newRole.manager"
          >
            <el-tag
              v-for="(tag, idx) in newRole.manager"
              :key="tag.tag"
              closable
              @close="closeTag(newRole.manager, idx)"
            >
              {{ tag.tag }}
            </el-tag>
          </div>
        </div>
      </register-contents>
      <!-- /.담당자 -->

      <register-contents
        :title="$t('admin.ACCOUNT.perm')"
      >
        <template>
          <div class="register-wrap">
            <button
              class="button"
              @click.stop="setAuthModal = true"
            >
              {{ $t('admin.ROLE.setPerm') }}
            </button>
          </div>
        </template>
      </register-contents>
      <!-- 권한 설정 -->
      <register-contents
        :title="$t('admin.ROLE.userVisible')"
        required
      >
        <div class="radio-button-container">
          <el-radio
            v-for="(item,index) in ['Y','N']"
            :label="item==='Y'?true:false"
            :key="index"
            v-model="newRole.isApply"
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
          v-model="newRole.roleMemo"
          :autosize="{ minRows: 10, maxRows: 10}"
        />
      </register-contents>
      <!-- /.메모 -->
    </section>

    <section class="big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$router.go(-1)"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        @click="applyCreate"
        type="is-primary"
      >
        {{ $t('common.BTN.enroll') }}
      </button>
    </section>

    <!-- 모달 영역 -->
    <!-- 관계사 선택 모달 -->
    <select-list-modal
      :title="$t('admin.ACCOUNT.selectAff')"
      :active.sync="setCompModal"
      @close="setCompModal = false"
      @select="setMapping(...arguments, 'company')"
      :data="companyList"
    />
    <!-- 담당자 선택 모달 -->
    <set-manager-modal
      :active.sync="managerModal"
      @close="managerModal = false"
      @select="setMapping(...arguments, 'manager')"
      :title="$t('common.PLACEHOLDER.selectName', { name: $t('admin.ROLE.contactSimple') })"
      :data="managerList"
      :init-auto-select-row="newRole.manager"
    />
    <!-- 권한 설정 모달 -->
    <set-auth-modal
      :active.sync="setAuthModal"
      :data="authData"
      @close="authModalCloseHandler"
      @select="setAuthTreeData"
      :checkbox-disabled="false"
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
  name: 'SetRoleCreate',
  components: {
    'select-list-modal': SelectListModal,
    'set-manager-modal': SetManagerModal,
    'set-auth-modal': SetAuthModal
  },
  computed: {
    ...mapGetters({
      moduleInfo: 'cloud/getModuleInfo'
    })
  },
  async created () {
    this.$store.commit('common/ADD_PARAMETERS', {
      label: this.$t('common.BTN.ADMIN.createRole'),
      path: ''
    })
    await this.getTaskRole()
    await this.getGroupList()
    await this.getManagerList()
    const menuList = localStorage.getItem('MenuList')
    this.authData = JSON.parse(menuList)
    this.initAuthCheck(this.authData)
    this.authList = cloneDeep(this.authData)
  },
  methods: {
    authModalCloseHandler () {
      // const menuList = localStorage.getItem('MenuList')
      this.authData = cloneDeep(this.authList)
      this.setAuthModal = false
    },
    // 모달 창 확인 클릭시 모달에서 선택한 데이터 테그에 바인딩
    setAuthTreeData (tableData) {
      let selectedAuth = []
      const result = {}
      const rolePermOnlyRouteToObj = {}
      selectedAuth = tableData.map((node) => node.children).flat()
      selectedAuth = groupBy(selectedAuth, 'id')
      const servicedCloudList = cloneDeep(this.moduleInfo)
      delete servicedCloudList.network
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
      // this.roleItem.rolePermTree = this.authList
      this.rolePerm = JSON.stringify(rolePermOnlyRouteToObj)
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
    initAuthCheck (authList) {
      for (const key in this.authData) {
        const value = this.authData[key]
        const node = { children: value }
        this.changeCheckFalse(node)
      }
      this.$forceUpdate()
    },
    /**
     * 체크를 초기에 모두 True로 바꿔줍니다.
     * (역할의 생성 시 권한설정 모달의 초기 값은 전체 True 입니다.)
     */
    changeCheckFalse (node) {
      if (!node.children) return false
      else {
        node.children.forEach((child) => {
          child.read = true
          this.changeCheckFalse(child)
        })
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * [등록] 버튼을 눌렀을 때, 선택한 row 데이터를 생성 여부를 리턴합니다.
     * @return {Boolean} 생성 성공 여부
     */

    async applyCreate () {
      try {
        const nullVeridation = !this.newRole.roleName ||
       (this.newRole.roleName && !this.newRole.roleName.trim())

        if (nullVeridation) {
          this.$alert(this.$t('common.ALERT.ROLE.006'), '', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return
        }

        let duplicateName = false
        for (const i in this.taskRoleList) {
          if (this.taskRoleList[i].label === this.newRole.roleName) {
            console.log('중복되는값이 있습니다.')
            duplicateName = true
          }
        }
        if (duplicateName) {
          this.$alert(this.$t('common.ALERT.ROLE.002'), '', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            dangerouslyUseHTMLString: true
          })
          return
        }
        this.$confirm(this.$t('common.CONFIRM.BASE.027'), '등록', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(async () => {
          try {
            const param = {
              roleName: this.newRole.roleName,
              roleUpper: this.newRole.roleUpper,
              rolePerm: this.rolePerm,
              userIdxList: this.newRole.manager.map(man => man.userIdx),
              companyIdxList: this.newRole.company.map(com => com.field),
              roleMemo: this.newRole.roleMemo,
              isApply: this.newRole.isApply
            }
            await API.iam.createRole(param)

            this.$alert(this.$t('common.ALERT.BASE.034'))
            this.routeTo({ name: 'set-role' })
          } catch (error) {
            throw error.data
          }
        }).catch((err) => {
          if (err.code === 'IAM041') {
            this.$alert(this.$t('common.ALERT.ROLE.010'))
            return false
          }
        })
      } catch (error) {
        console.log(error)
        throw new Error(error)
      }
    },
    /**
     * 권한 트리 Json String으로 변경 메소드
     */
    getStringFromPermTree () {
      const resultArr = []
      for (const i in this.authData) {
        if (this.authData[i].read) resultArr.push(this.authData[i].routeTo)
        if (this.authData[i].children?.length > 0) this.recurPermCheck(this.authData[i].children, resultArr)
      }
      return JSON.stringify(resultArr)
    },
    /**
     * 권한 트리 children에 대한 read 확인 메소드
     */
    recurPermCheck (data, resultArr) {
      if (data.length === 0) return
      for (const i in data) {
        if (data[i].read) resultArr.push(data[i].routeTo)
        if (data[i].children?.length > 0) this.recurPermCheck(data[i].children, resultArr)
      }
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
      this.newRole[range] = comps
    },
    closeTag (arr, idx, id) {
      arr.splice(idx, 1)

      // Modal Checked Mapping
      if (id === 'auth') {
        const array = []
        this.authList.forEach(tag => array.push(tag.routeTo))
        this.authData.forEach(auth => {
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
    /**
     * 업무역할 조회 메소드
     */
    async getTaskRole () {
      const taskRoleList = await API.iam.getTaskRole()
      const mappedRoles = taskRoleList.map(task => {
        return {
          field: task.roleIdx,
          label: task.roleName
        }
      })
      this.taskRoleList = [{ field: null, label: '미할당' }, ...mappedRoles]
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
      if (!managerList) return

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
    }
  },
  data () {
    return {
      newRole: {
        roleUpper: null,
        roleName: '',
        company: [],
        manager: [],
        roleMemo: '',
        isApply: true
      },

      selectedAuth: null,
      // 모달
      setCompModal: false,
      managerModal: false,
      setAuthModal: false,

      // 업무역할, 하위역할 옵션
      subOptions: [],
      taskRoleList: [],
      managerList: [],
      // 모달 관계사 목록
      companyList: [],
      authList: [],
      rolePerm: JSON.stringify({ nx: [], aws: [] }),
      authData: JSON.parse(localStorage.getItem('MenuList'))
    }
  }
}
</script>
<style lang="scss" scoped>
.set-role-create {
  .detail-contents {
    border-top: 1px solid $border-color;
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
  .radio-button-container {
  .el-radio {
    display: inline-block;
    &:nth-of-type(2){
      margin-left: 20px;
    }
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
