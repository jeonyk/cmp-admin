<template>
  <div class="dashboard-options">
    <h2>{{ $v('관계사 ・ 조직') }}</h2>
    <div
      class="dashboard-tags"
    >
      <span
        class="tag"
        v-for="group in displayedGroup"
        :key="`group-${group.company.groupIdx}`"
      >
        <span>{{ group.company.groupName }}</span>
        <template v-if="group.group">
          <i class="el-icon-arrow-right" />
          <span>{{ group.group.groupName }}</span>
        </template>
        <i
          class="el-icon-close"
          @click="e=> removeGroup(group)"
        />
      </span>
      <!-- /. 관계사, 조직 목록 -->
      <button
        class="button"
        type="is-primary"
        @click="e=> {
          changedGroup = null
          selectCompanyGroupModal = true
        }"
        :disabled="isLoading"
      >
        {{ $v('관계사-조직 선택') }} +
        <!-- <i class="el-icon-plus" /> -->
      </button>
      <el-checkbox
        v-model="checkboxStates.filtering"
        label="ONLYMY"
        @change="changeCheckState"
        ref="onlyMyData"
        :checked="true"
        hidden
      >
        {{ $v('내 조직 데이터만 보기') }}
      </el-checkbox>
    </div>

    <!-- 관계사-조직 선택 모달 -->
    <el-dialog
      :visible.sync="selectCompanyGroupModal"
      :title="$v('관계사-조직 선택')"
      top="5vh"
      width="500px"
      @close="selectCompanyGroupModal = false"
    >
      <template v-if="groupTree===null && groupTree.length < 1">
        등록된 관계사 또는 조직이 없습니다
      </template>
      <template v-else>
        <select-company-group
          v-if="selectCompanyGroupModal"
          v-loading="false"
          :tree-data="groupTree"
          :select-group="selectGroup"
          org-tooltip
          @change="param => changedGroup = param"
          non-expand-uppers
          expand-childs
        />
      </template>
      <div class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="selectCompanyGroupModal = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="registGroup"
          :disabled="groupTree.length<1"
        >
          {{ $v('등록') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'
import SelectCompanyGroup from './SelectCompanyGroup'
// import ManageProjectMixins from '../../SetProject/ManageProject.mixins.js'
// import VMUpdateMixins from '@/components/Utils/VMUpdate.mixins.js'

export default {
  name: 'IntegratedCompanyOptions',
  components: {
    'select-company-group': SelectCompanyGroup
  },
  // mixins: [ManageProjectMixins, VMUpdateMixins],
  async mounted () {
    this.user = this.$store.getters.user
    let permission = this.user?.userPermLevel
    permission = 2
    if (permission === 2) { // 중간관리자
      await this.getAllGroupByTree()
    } else if (permission !== 2) { // 빌링(3), 일반(4), 커스텀(5)
      await this.getUserGroupByTree()
    }
  },
  computed: {
    ...mapState({
    }),
    ...mapGetters({
    })
  },
  methods: {
    changeCheckState (isChecked, e) {
      // console.log('changeCheckState:', e.target._value, isChecked, this.checkboxStates.filtering)
      this.$emit('filtering', isChecked)
      this.$emit('selectGroup', [...this.displayedGroup])
    },
    async getAllGroupByTree () {
      try {
        this.isLoading = true
        this.allGroupTree = []
        const param = {
          project: false,
          user: false
        }
        const data = await API.iam.getGroupManageTree({
          ...param
        })
        if (data) {
          // const groupData = data.find(group => group.groupIdx === this.user.userResDto.userCompany)
          // this.setTreeData(groupData)
          // this.allTreeData = this.setOrgPrjNumber(data)
        } else return

        this.allGroupTree = this.mappedTreeData(data)
        this.groupTree = this.mappedTreeData(data)
      // } catch (error) {
      //  console.error(error)
      //  const message = (error.response && error.response.data) ? error.response.data.message : error.message
      //  this.$alert(message)
      // } finally {
      } finally {
        this.isLoading = false
      }
      this.$emit('isLoading', this.isLoading)
    },
    async getUserGroupByTree () {
      try {
        this.isLoading = true
        this.groupTree = []
        if (!this.user) return
        const userIdx = this.user?.userIdx
        const data = await API.iam.getGroupTreeByUser({ userIdx })
        // console.log('getUserGroupByTree:', userIdx, data)
        if (!data) return

        this.groupTree = this.mappedTreeData(data)
      } finally {
        this.isLoading = false
      }
      this.$emit('isLoading', this.isLoading)
    },
    mappedTreeData (data) {
      const userCompanies = data.filter(group => group.groupUpper === 0 && group.companyCode !== 'common')
      /*
      const isMulti = this.user.userResDto.isMultiUser
      const isCustom = this.user.userResDto.userPermLevel === 5 // 커스텀 사용자
      const isMiddleAdmin = this.user.userResDto.userPermLevel === 2 // 중간 관리자

      const filtered = userCompanies.filter(comp => comp.groupIdx === this.user.userResDto.userCompany)
      // console.log('mappedTreeData:', isMulti, isCustom, isMiddleAdmin, userCompanies, filtered)
      if (isMulti) return userCompanies
      if (isCustom || isMiddleAdmin) return filtered */
      return userCompanies
    },
    async registGroup () {
      if (!this.changedGroup) {
        this.selectCompanyGroupModal = false
      } else {
        this.$confirm(this.$v('해당 관계사-조직을 선택하시겠습니까?')).then(async () => {
          if (this.changedGroup) {
            this.displayedGroup = []
            this.displayedGroup.push(this.changedGroup)
            // console.log('registGroup:', this.displayedGroup)

            this.$refs.onlyMyData.$el.click()
            this.$emit('selectGroup', this.displayedGroup)

            /*
            // this.selectGroup = { ...this.changedGroup }
            this.selectGroup = {
              groupName: this.changedGroup?.company?.groupName + ' > ' + this.changedGroup?.group?.groupName,
              companyIdx: this.changedGroup?.company.groupIdx,
              groupIdx: this.changedGroup?.group.groupIdx
            }
            // await this.saveGroup(this.selectGroup) */
          }
          this.selectCompanyGroupModal = false
        }).catch(() => false)
      }
    },
    async saveGroup (targetGroup) {
      // 등록 API 적용부
      // console.log('saveGroup:', targetGroup)
    },
    async removeGroup (targetGroup) {
      // console.log('removeGroup:', targetGroup)
      this.$confirm(this.$v('해당 관계사-조직 선택을 취소하시겠습니까?')).then(async () => {
        this.displayedGroup = []
        this.$emit('selectGroup', null)
        // 삭제 API 적용부
      }).catch(() => false)
    }
  },
  data: () => ({
    // 관계사 조직 선택 모달 start
    selectCompanyGroupModal: false,
    selectGroup: null, // 공통
    displayedGroup: [],
    groupTree: [], // 관계사-조직 트리 데이터
    allGroupTree: [],
    allCompanyOptions: [],
    loading: {
      userTree: false, // 유저 관계사, 조직 트리 조회 로딩
      allGroupTree: false, // 전체 관계사, 조직 트리 조회 로딩
      createProject: false // 프로젝트 생성 로딩
    },
    isLoading: true,
    checkboxStates: {
      filtering: false
    }
  })
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-options {
    // border: 1px solid blue;
    // border: 1px solid $purple-gray;
    padding: 15px;
    // margin-bottom: 40px;

    h2 {
      font-size: 18px;
      margin-bottom: $gap-s;
    }
  }

  &-tags {
    display: flex;
    align-items: center;
    margin-bottom: 40px;

    .tag {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $main-gray;
      padding: 0 15px;
      line-height: 28px;
      border-radius: 25px;
      margin-right: 5px;
      color: $light-gray;

      .el-icon-arrow-right {
        display: block;
        font-size: 12px;
        color: $input-placeholder;
        margin: 0 3px;
      }

      .el-icon-close {
        cursor: pointer;
        display: block;
        width: 13px;
        height: 13px;
        font-size: 13px;
        position: relative;
        margin-left: $gap-s;
      }
    }

    button {
      border-radius: $radius-r;
      padding: 0 15px;
    }

    .el-checkbox {
      color: $text-lighter-gray;
      font-weight: normal;
      margin-left: $gap-s;
    }
  }
}
</style>
