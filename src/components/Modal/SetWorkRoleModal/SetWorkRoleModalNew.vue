<template>
  <div
    id="setWorkRoleModalNew"
  >
    <div class="modal-body">
      <section class="section section-left">
        <dashboard-panel>
          <template #title>
            <div class="section-left__header">
              <div class="section-left__label">
                <span class="section-left__label-title">{{ $v('업무 역할') }}</span>
                <span class="section-left__label-sub">({{ $v('역할 수') }})</span>
              </div>
            </div>
          </template>
          <template #header>
            <button
              class="button"
              type="is-primary"
              :disabled="isEditMode"
              @click="handleClickRoleCreate"
            >
              {{ $v('업무 역할 생성') }}
            </button>
          </template>
          <div
            class="section-left__body tiny-scroll"
            ref="dashboardBody"
          >
            <ul class="card-list-container">
              <li
                v-for="(item,index) in workRoleList"
                class="card-list"
                :key="index"
                :class="{'card-list--selected': selectedWorkRole ? item.roleIdx === selectedWorkRole.roleIdx: false}"
                @click="isEditMode ? false : handleClickWrole(item)"
              >
                <div class="card-list__header">
                  <span class="card-list__header__title">
                    {{ item.roleName }}
                  </span>
                  <span class="card-list__header__sub">
                    ({{ countRoleUpperMatch(roleList, item.roleIdx) }})
                  </span>
                </div>
                <div class="card-list__cnt">
                  <!-- 보기 권한 수 -->
                  <span class="card-list__cnt--txt">{{ $v('보기 권한 수') }}</span>
                  <span class="card-list__cnt--num">{{ setRoleCnt('readPermission',item) }}</span>

                  <!-- 실행 권한 수 -->
                  <span class="card-list__cnt--txt">{{ $v('실행 권한 수') }}</span>
                  <span class="card-list__cnt--num">{{ setRoleCnt('executePermission', item) }}</span>
                </div>
              </li>
              <li
                v-if="isEditMode && !selectedWorkRole.roleIdx"
                class="card-list before-create-card"
                :class="{'card-list--selected': true}"
              >
                <div class="card-list__header">
                  <span class="card-list__header__title">
                    {{ selectedWorkRole.roleName }}
                  </span>
                  <span class="card-list__header__sub">
                    ({{ 4 }})
                  </span>
                </div>
                <div class="card-list__cnt">
                  <!-- 보기 권한 수 -->
                  <span class="card-list__cnt--txt">{{ $v('보기 권한 수') }}</span>
                  <span class="card-list__cnt--num">{{ setRoleCnt('readPermission',selectedWorkRole) }}</span>

                  <!-- 실행 권한 수 -->
                  <span class="card-list__cnt--txt">{{ $v('실행 권한 수') }}</span>
                  <span class="card-list__cnt--num">{{ setRoleCnt('executePermission', selectedWorkRole) }}</span>
                </div>
              </li>
            </ul>
          </div>
        </dashboard-panel>
      </section>

      <section class="section section-right">
        <dashboard-panel>
          <template #header>
            <article class="header-button">
              <button
                :disabled="(selectedWorkRole === null) || isEditMode && (selectedWorkRole !== null)"
                class="button --modify"
                type="is-black"
                @click="handleClickWroleModify"
              >
                {{ $v('수정') }}
              </button>
              <button
                class="button"
                :disabled="(selectedWorkRole === null) || isEditMode && (selectedWorkRole !== null)"
                type="is-anti"
                @click="handleClickWroleDelete(selectedWorkRole.roleIdx)"
              >
                {{ $v('삭제') }}
              </button>
            </article>
          </template>
          <template #empty>
            <div class="section-right--empty-custom">
              {{ $v('업무 역할을 선택해주세요') }}
            </div>
          </template>
          <div
            v-if="selectedWorkRole !== null"
            class="section-right__body"
          >
            <register-contents
              :title="$v('업무 역할명')"
              required
              type="input"
            >
              <el-input
                v-model="selectedWorkRole.roleName"
                :disabled="!isEditMode"
                :placeholder="$v('업무 역할명 입력')"
              />
            </register-contents>
            <register-contents
              class="regist--manage-rsc"
              :title="$v('담당 자원')"
              type="input"
            />
            <set-manage-resource
              :selected-role-idx="selectedWorkRole.roleIdx"
              :service-list="selectedWorkRole.serviceList"
              :checkbox-disabled="!isEditMode"
              :handle-confirm="isBeforeConfirm"
              :handle-init="isInitServiceList"
              @confirm="handleConfirm"
              @init="handleInitServiceList"
            />
          </div>
        </dashboard-panel>
      </section>
    </div>
    <section class="modal-footer big-button-area">
      <button
        v-if="isEditMode"
        class="button"
        type="is-anti"
        @click="handleClickModalClose"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        @click="isEditMode ? handleClickModalConfirm() : $emit('close')"
      >
        {{ isEditMode ? $v('저장') : $v('확인') }}
      </button>
    </section>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import SetManageResource from './Components/SetManageResource.vue'
export default {
  components: {
    DashboardPanel,
    SetManageResource
  },
  created () {
    this.setInit()
  },
  methods: {
    handleInitServiceList () {
      this.isInitServiceList = false
    },
    async handleClickWroleDelete (roleIdx) {
      try {
        const isConfirmed = await this.$confirm(this.$v('정말 삭제하시겠습니까? <br /> <span style="color: red;"> 업무 역할 삭제 시 신중하게 삭제해주세요!</span>'), { dangerouslyUseHTMLString: true })
          .then(() => true).catch(() => false)
        const payload = { roleIdx }
        if (isConfirmed) {
          await this.deleteWorkRole(payload)
          this.setInit()
        }
      } catch (error) {
        console.log(error)
      }
    },
    async updateWorkRole (payload) {
      try {
        await API.iam.updateRole(payload)
        this.$alert(this.$v('업무 역할 수정을 성공하였습니다.'))
        return true
      } catch (error) {
        let errMsg = ''
        switch (error?.response?.data?.code) {
          case 'IAM041' : errMsg = '중복된 업무 역할명입니다.'; break
          default : errMsg = '업무 역할 수정을 실패하였습니다. <br/> 관리자에게 문의해주세요.'
        }
        this.$alert(this.$v(errMsg), { dangerouslyUseHTMLString: true })
        throw error
      }
    },
    scrollToBottom () {
    // 스크롤 대상 요소를 찾습니다.
      const dashboardBody = this.$refs.dashboardBody
      console.log('🚀 ~ file: SetWorkRoleModalNew.vue:211 ~ scrollToBottom ~ dashboardBody:', dashboardBody)

      // 마지막 리스트 아이템을 찾습니다.
      const lastListItem = dashboardBody.querySelector('.section-left__body li:last-child')
      console.log('🚀 ~ file: SetWorkRoleModalNew.vue:215 ~ scrollToBottom ~ lastListItem:', lastListItem)

      // 스크롤 대상 요소의 높이를 구합니다.
      const dashboardBodyHeight = dashboardBody.clientHeight

      // 마지막 리스트 아이템의 위치를 구합니다.
      const lastListItemOffsetTop = lastListItem.offsetTop
      const lastListItemHeight = lastListItem.offsetHeight
      const lastListItemPosition = lastListItemOffsetTop + lastListItemHeight

      // 스크롤 대상 요소를 스크롤합니다.
      dashboardBody.scrollTo({
        top: lastListItemPosition - dashboardBodyHeight,
        behavior: 'smooth'
      })
    },
    async createWorkRole (selectedWorkRole) {
      try {
        const { roleName, serviceList } = selectedWorkRole
        const payload = {
          roleName,
          serviceList,
          isApply: true,
          roleMemo: roleName,
          roleUpper: 0
        }
        await API.iam.createRole(payload) // 사이드 이펙트
        this.$alert(this.$v('업무 역할 생성을 성공하였습니다.'))

        setTimeout(() => {
          const lastIndex = this.workRoleList.length
          this.selectedWorkRole = this.workRoleList[lastIndex - 1]
        }, 200)

        return true
      } catch (error) {
        let errMsg = ''
        switch (error?.response?.data?.code) {
          case 'IAM041' : errMsg = '중복된 업무 역할명입니다.'; break
          default : errMsg = '업무 역할 삭제를 실패하였습니다. <br/> 관리자에게 문의해주세요.'
        }
        this.$alert(this.$v(errMsg), { dangerouslyUseHTMLString: true })
        throw error
      }
    },
    async deleteWorkRole (payload) {
      try {
        await API.iam.deleteRole(payload)
        this.$alert(this.$v('업무 역할 삭제를 성공하였습니다.'))
        return true
      } catch (error) {
        let errMsg = ''
        switch (error?.response?.data?.code) {
          case 'IAM041' : errMsg = '중복된 업무 역할명입니다.'; break
          default : errMsg = '업무 역할 삭제을 실패하였습니다. <br/> 관리자에게 문의해주세요.'
        }
        this.$alert(this.$v(errMsg), { dangerouslyUseHTMLString: true })
        throw error
      }
    },
    async handleConfirm (val) {
      try {
        const isConfirmed = await this.$confirm(this.$v('저장하시겠습니까?')).then(() => true).catch(() => false)
        if (isConfirmed) {
          this.selectedWorkRole.serviceList = cloneDeep(val.serviceList)
          if (this.selectedWorkRole.roleIdx) await this.updateWorkRole(this.selectedWorkRole)
          else await this.createWorkRole(this.selectedWorkRole)

          this.workRoleList = await this.getWorkRoleList()
          this.isEditMode = false
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.isBeforeConfirm = false
      }
    },
    handleClickModalConfirm () {
      this.isBeforeConfirm = true
    },
    handleClickWroleModify () {
      this.isEditMode = true
    },
    handleClickWrole (workRole) {
      console.log('handleClickWrole')
      this.selectedWorkRole = cloneDeep(workRole)
    },
    handleClickRoleCreate () {
      this.isEditMode = true
      this.selectedWorkRole = cloneDeep(this.initialValue)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    countRoleUpperMatch (arr, roleIdx) {
      let count = 0
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].roleUpper === roleIdx) {
          count++
        }
      }
      return count
    },
    async setInit () {
      this.workRoleList = await this.getWorkRoleList()
      this.roleList = await this.getRoleList()
      this.selectedWorkRole = null
      this.isEditMode = false
    },
    setRoleCnt (key, workRole) {
      let cnt = 0
      if (workRole.serviceList) {
        workRole.serviceList
          .forEach((service) => {
            if (service[key]) { cnt += service[key] ? 1 : 0 }
          })
      }
      return cnt
    },
    async getWorkRoleList () {
      try {
        const request = await API.iam.getTaskRole()
        console.log('getTaskRole', request)
        return request
      } catch (error) {
        this.$alert('업무 역활을 조회하지 못하였습니다. </br> 관리자에게 문의해주세요.')
      }
    },
    async getRoleList () {
      try {
        const request = await API.iam.getRoleList()
        console.log('getRoleList', request)
        return request
      } catch (error) {
        this.$alert('역활을 조회하지 못하였습니다. </br> 관리자에게 문의해주세요.')
      }
    },
    async handleClickModalClose () {
      const isConfirmed = await this.$confirm('편집을 취소하시겠습니까?').then(() => true).catch(() => false)
      if (isConfirmed) {
        this.isInitServiceList = true
        this.isEditMode = false
        if (!this.selectedWorkRole.roleIdx) {
          this.selectedWorkRole = null
        }
      }
    }
  },

  data () {
    return {
      workRoleList: [], // 업무 역할
      roleList: [], // 역할 (업무 역할명 우측에 갯수 노출을 위해 조회)
      selectedWorkRole: null,
      initialValue: {
        roleName: '',
        serviceList: []
      },
      isEditMode: false,
      isBeforeConfirm: false,
      isInitServiceList: false
    }
  }
}
</script>

<style lang="scss" scoped>
#setWorkRoleModalNew {
  & * {
    box-sizing: content-box;
  }
  & .modal-body {
    display: flex;
    flex-direction: row;
    height: 700px;
    gap: 20px;
  }
  .section-left {
    min-width: 300px;
    .section-left__label-sub {
      color: $gray;
      font-weight: 400;
      font-size: 14px;
    }
    .section-left__body {
      overflow-y: scroll;
      height:  620px;
    }
  }
  .section-right {
    min-width: 720px;
    .header-button {
      .button {
        min-width: 40px;
      }
      .--modify {
        margin-right: 6px;
      }
    }
    .section-right__body {
      .regist--manage-rsc {
        margin-top: 20px;
      }
    }
    .section-right--empty-custom {
      border: $gray;
      height: 580px;
      line-height: 580px;
    }
  }
}
.card-list-container {
  .card-list {
    border-radius: $radius;
    background: #0A0C20;
    padding: 20px;
    margin-bottom: 10px;
    color: $gray;
    cursor: pointer;
    &.before-create-card {
      border: 1px dashed white;
      outline-offset: 2px;
    }
    &.card-list--selected {
        background: #353951;
        color: white;
    }
    .card-list__header {
      font-size: 14px;
    }
    .card-list__cnt {
      margin-top: 10px;
      font-size: 12px;
      color: $gray;
      .card-list__cnt--num {

        &:nth-of-type(2) {
          margin-right:10px;
        }
      }
    }
  }
}
.big-button-area {
  margin: 0 auto;
  margin-top: $gap;
  display: flex;
  justify-content: center;

  > button {
    margin: 0 5px;
    height: 38px;
    min-width: 80px;
    font-size: 14px;
  }
}
</style>
