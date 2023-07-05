<!--
  * 파일명 : ChangeOpManager.vue
  * 파일 기능 : 프로젝트 관리 > 운영 관리자 변경 폼
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-22
  * License By Shinsegae I&C
  * 2021-02-01 fix: 프로젝트명 중복처리 => API 처리로 변경
 -->
<template>
  <section class="change-opmanager-form">
    <cmp-grid
      v-loading="loading.roleList"
      :item-source="afterManagerList"
      :columns="columns"
      :use-column-filter="false"
    >
      <template #roleIdx="props">
        <el-select
          :popper-append-to-body="false"
          v-model="props.row.roleIdx"
          :placeholder="$t('admin.ACCOUNT.selectRole')"
          @change="val => {
            const selectedRole = allRoleList.find(item => item.roleIdx === props.row.roleIdx)
            props.row.roleName = selectedRole ? selectedRole.roleName : ''
          }"
        >
          <el-option
            v-for="(role, index) in getOperationManagerOption(props.row.upperRoleIdx)"
            :key="index"
            :label="role.roleName"
            :value="role.roleIdx"
          >
            {{ role.roleName }}
          </el-option>
        </el-select>
      </template>
    </cmp-grid>
    <div class="modal-button-area button-area -center page-bottom">
      <button
        class="button -modal-button"
        type="is-anti"
        @click.stop="$emit('close')"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        @click.stop="save"
      >
        <!-- 완료 -->
        {{ $t('common.BTN.change') }}
      </button>
    </div>
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'ChangeOpManager',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  async created () {
    await this.getRoleList()
    await this.getOperatingManagerList(this.data[0].groupIdx)
  },
  mounted () {
    // this.afterManagerList = JSON.parse(JSON.stringify(this.data))
    const originData = JSON.parse(JSON.stringify(this.data))
    const allRolesIdx = this.allRoleList.map(role => role.roleIdx)
    this.afterManagerList = originData.map(role => {
      const isExistRole = allRolesIdx.includes(role.roleIdx)
      return {
        ...role,
        roleName: isExistRole ? role.roleName : null,
        roleIdx: isExistRole ? role.roleIdx : null
      }
    })
    // this.afterManagerList = JSON.parse(JSON.stringify(this.data))
  },
  methods: {
    getOperationManagerOption (roleUpperIdx) {
      const result = this.operatingManagerList.filter(role => role.roleUpperIdx === roleUpperIdx)
      return result
    },
    async getOperatingManagerList (companyIdx) {
      try {
        const companyRoleRes = await API.iam.getGroupRoleList({ companyIdx: companyIdx })
        if (companyRoleRes) this.operatingManagerList = companyRoleRes
      } catch (err) {
        console.log(err)
      }
    },
    /**
     * API : 역할 목록 조회 (flat한 데이터)
     */
    async getRoleList () {
      try {
        this.loading.roleList = true
        const roles = await API.iam.getRoleList()
        if (!roles) return

        const roleTree = roles.filter(async (rl) => {
          if (!rl.roleUpper) {
            rl.children = []
            return rl
          }
        })
        roles.forEach(item => {
          const parent = roleTree.find(root => root.roleIdx === item.roleUpper)
          if (parent) parent.children.push(item)
        })

        this.allRoleList = roles
        this.roleTreeData = roleTree
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.roleList = false
      }
    },
    /**
     * roleTree 데이터에서 upperRoleIdx에 따라 하위 역할(children)을 리턴
     */
    findRoleChildren (upperRoleIdx) {
      let result = []
      if (upperRoleIdx) {
        const root = this.roleTreeData.find(role => role.roleIdx === upperRoleIdx)
        if (root) result = root.children
      }
      return result
    },
    save () {
      const isEmptyData = !this.afterManagerList.every(role => role.roleIdx)
      if (isEmptyData) return this.$alert('담당 역할을 모두 선택해주세요.', () => false)

      this.$emit('save', this.afterManagerList)
    }
  },
  data () {
    return {
      operatingManagerList: [],
      operatingManagerServers: [],
      operatingManagerNetworks: [],
      operatingManagerSecurity: [],
      allRoleList: [], // flat 형태의 original role List 데이터
      roleTreeData: [], // tree 형태의 role (children...)
      afterManagerList: [], // emit 데이터
      loading: {
        roleList: false // 역할 정보 조회
      },
      columns: [
        { binding: 'upperRoleName', header: this.$t('admin.ROLE.jobRole'), width: 100 }, // 업무 역할
        { binding: 'roleIdx', header: this.$t('admin.ROLE.chargeRole'), customHtml: true } // 담당 역할
      ]
    }
  }
}
</script>

 <style lang="scss" scoped>

 </style>
