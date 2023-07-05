<template>
  <div class="user-receiver">
    <dashboard-panel
      v-loading="isLoadingTreeData"
      title="조직"
      :padding-top="0"
      class="group"
    >
      <div class="group-filter flex-between">
        <div>관계사</div>
        <div class="select-wrapper">
          <searchable-select
            v-model="filterSelectedGroup"
            placeholder="관계사 선택"
            :options="parentGroups"
            disabled-change-text
          />
          <refresh-icon
            :width="14"
            :height="14"
            is-button
            @click="onResetTreeFilter"
          />
        </div>
      </div>
      <div
        class="area-body"
        ref="groupTreeWrapper"
      >
        <g-tree
          :data="treeData"
          :select-object="selectGroup"
          :root-parent="rootParent"
          auto-check-children
          view-line
          unique-key="groupIdx"
          use-checkbox
          ref="tree"
          @selected="onSelectGroup"
          @check="onCheckGroup"
          @loaded="onLoadedTree"
        />
      </div>
    </dashboard-panel>
    <dashboard-panel
      v-loading="isLoadingUserData"
      title="구성원"
      :padding-top="0"
      class="user-group"
    >
      <div class="flex-between">
        <div>수신자명</div>
        <div class="input-area">
          <el-input
            v-model="searchReceiverName"
            placeholder="수신자명을 입력하세요."
          />
          <search-icon
            :width="18"
            :height="18"
            is-button
          />
          <refresh-icon
            :width="18"
            :height="18"
            is-button
            @click="() => (searchReceiverName = '')"
          />
        </div>
      </div>
      <div
        class="area-body"
        :class="{
          'flex-center':
            isLoadingUserData ||
            (selectGroup &&
              (isFilterUser ? !filteredUserData.length : !userData.length)) ||
            !selectGroup
        }"
      >
        <template v-if="isLoadingUserData">
          <div class="empty-data group-user-placeholder">
            <span>데이터 로딩중입니다. 잠시만 기다려주세요.</span>
          </div>
        </template>
        <template v-else-if="selectGroup">
          <template
            v-if="isFilterUser ? filteredUserData.length : userData.length"
          >
            <div
              v-for="user in isFilterUser ? filteredUserData : userData"
              :key="user.userIdx"
              @click="onSelectUser(user)"
              class="group-user-item"
            >
              <approver-info-component
                :use-checkbox="false"
                :is-checked="user.checked"
                :name="user.userName + ' ' + user.userPosition"
                :company="user.userCompanyName"
                :group="user.userGroupName"
                :duty="user.userDuty || null"
                @change="() => onSelectUser(user)"
              />
            </div>
          </template>
          <template
            v-else-if="
              isFilterUser ? !filteredUserData.length : !userData.length
            "
          >
            <div class="empty-data">
              <span>선택된 조직에 사용자가 없습니다.</span>
            </div>
          </template>
        </template>
        <template v-else>
          <div class="empty-data">
            <span>조직을 선택해주세요.</span>
          </div>
        </template>
      </div>
    </dashboard-panel>
    <double-right-arrow class="director" />
    <dashboard-panel
      title="수신 대상"
      :padding-top="0"
      class="target"
    >
      <div
        class="area-body"
        :class="{ 'flex-center': !checkedGroupData.length }"
      >
        <div
          v-if="checkedGroupData && checkedGroupData.length"
          class="checked-list"
        >
          <clearable-tag
            v-for="receiver in checkedGroupData"
            :key="
              receiver.itemType === 'user'
                ? 'user-' + receiver.userIdx
                : 'group-' + receiver.groupIdx
            "
            :content="getUserClearableTagName(receiver)"
            :content-raw="receiver"
            :unique-key="
              receiver.itemType === 'user'
                ? receiver.userIdx
                : receiver.groupIdx
            "
            split-string=">"
            @clear-raw="onToggleClear"
          />
        </div>
        <div
          v-else
          class="empty-data"
        >
          선택된 수신 대상이 없습니다.
        </div>
      </div>
    </dashboard-panel>
  </div>
</template>

<script>
/**
 * @typedef {{ type: "user" | "group", idx: number, data: any }} InitSelectData
 * @typedef {{ groupName: string, groupUpperName: string }} GroupSelectData
 */

import API, { DashboardPanel, ClearableTag } from '@sd-fe/cmp-core'
import DoubleRightArrow from './DoubleRightArrow.vue'
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import { debounce, omit } from 'lodash'
import ApproverInfoComponent from '@/components/Modal/ApprovalMemberModal/ApproverInfoComponent.vue'
import Fuse from 'fuse.js'
import ReceiverBus from './ReceiverBus'

export default {
  name: 'UserReceiver',
  props: {
    /**
     * 부모 컴포넌트의 모달 상태
     */
    modalActive: {
      type: Boolean,
      required: true
    },
    userType: {
      type: String,
      required: true,
      validator (value) {
        return ['user', 'admin'].includes(value)
      }
    },
    /**
     * 컴포넌트 초기화시 기본적으로 선택되어 있는 그룹 및 유저
     * 데이터를 받는다.
     * @type {InitSelectData[]}
     */
    initSelect: {
      type: Object,
      required: false,
      default: () => null
    }
  },
  components: {
    DashboardPanel,
    DoubleRightArrow,
    SearchIcon,
    RefreshIcon,
    ClearableTag,
    'approver-info-component': ApproverInfoComponent
  },
  created () {
    this.getTree()

    ReceiverBus.$on('expose-data', this.getCheckedItems)
  },
  computed: {
    isLoadedTreeData () {
      return this.treeData && this.treeData.length
    }
  },
  watch: {
    searchReceiverName: {
      handler: debounce(function (value) {
        if (!value) {
          this.isFilterUser = false
          this.filteredUserData = []
          return
        }

        const fuse = new Fuse(this.userData, {
          keys: ['userName', 'userPosition'],
          threshold: 0.1
        })

        this.isFilterUser = true
        this.filteredUserData = fuse.search(value).map(node => node.item)
      }, 500)
    },
    /**
     * 관계사 Select Box의 아이템이 변경되면
     * 트리에서 해당 관계사를 바로 확인할 수 있도록
     * 스크롤을 변경한다.
     */
    filterSelectedGroup: {
      handler (group) {
        /** 해당 관계사만 필터링 */
        if (group && this.$refs.tree) {
          const findNode = this.$refs.tree.treeFindChild(
            this.$refs.tree.nodes[0],
            group,
            'groupIdx'
          )
          if (findNode) this.$refs.tree.selectItem(findNode.children, findNode)
        }
      }
    }
  },
  methods: {
    getUserClearableTagName (receiver) {
      if (!receiver) return ''
      return receiver.itemType === 'user'
        ? `${receiver.groupName} ${receiver.userName}${receiver.userId ? `(${this.$options.filters.maskingName(receiver.userId)})` : ''}`
        : receiver.groupUpperName
    },
    /**
     * 트리가 렌더링된 이후 이벤트
     */
    onLoadedTree () {
      this.setInitSelect()
    },
    /**
     * 체크된 아이템을 가공해서 반환한다.
     */
    getCheckedItems () {
      const componentType = this.userType
      const users = []
      const groups = []

      this.checkedGroupData.forEach(item => {
        if (item.itemType === 'user') users.push(item)
        else groups.push(item)
      })

      const convertGroup = (group) => ({
        idx: group.groupIdx,
        data: {
          groupName: group.groupName,
          groupUpperName: group.groupUpperName,
          ...omit(group, ['children'])
        },
        __UI_USER_TYPE__: this.userType
      })

      const convertUser = (user) => ({
        ...user,
        idx: user.userIdx,
        data: {
          ...user
          // userName: user.userName,
          // userId: user.userId,
          // groupUpperName: user.groupUpperName
        },
        __UI_USER_TYPE__: this.userType
      })

      const expose = {
        receiverType: 'user',
        componentType,
        groups: groups.map(convertGroup),
        users: users.map(convertUser)
      }

      this.$emit('expose', expose)
    },
    /**
     * 그룹을 기본 체크 처리한다.
     */
    setInitSelectGroup (groups) {
      if (!groups || !groups.length) return

      // 모든 조직의 idx를 가져온다.
      let allGroupIdx = groups.map(group => group.idx)
      // 트리 컴포넌트에 사용중인 조직 데이터를 넣는다.
      const selects = []

      // 트리 순회
      const traverse = (item) => {
        // 찾는 조직이 없을 경우 메서드 실행을 종료하여 시간 복잡도를 최소화한다.
        if (!allGroupIdx.length) return

        // 하위 조직이 있을 경우 하위 조직도 순회한다.
        if (item.children && item.children.length) {
          item.children.forEach(child => traverse(child))
        }

        // 현재 조직이 찾는 조직에 포함될 경우
        if (allGroupIdx.includes(item.groupIdx)) {
          // 찾아야될 조직을 찾았으므로 찾은 조직을 제외해서
          // idx 배열을 다시 할당한다.
          allGroupIdx = allGroupIdx.filter(idx => idx !== item.groupIdx)
          // 트리 컴포넌트의 toggleCheckbox 메서드를 그대로 활용하기 위해
          // 트리 컴포넌트에서 사용중인 조직 데이터를 그대로 배열에 넣는다.
          selects.push(item)
        }
      }

      // 최상위 조직부터 트리 순회를 시작한다.
      traverse(this.$refs.tree.nodes[0])

      // 찾은 조직이 있을 경우
      if (selects && selects.length) {
        selects.forEach(select => {
          // 트리 컴포넌트의 toggleCheckbox 메서드를 그대로 호출하여
          // 데이터 흐름을 자연스럽게 한다.
          this.$refs.tree.toggleCheckbox(select, false, false)
        })
      }
    },
    /**
     * 사용자를 기본 체크 처리한다.
     */
    setInitSelectUser (users) {
      if (!users || !users.length) return

      users.forEach(user => {
        // 형식이 안맞으면 컨버팅할 수 없음
        if (!user.data) return

        const convert = {
          userIdx: user.idx,
          userName: user.data.userName,
          userId: user.data.userId,
          groupName: user.data.groupName,
          groupIdx: user.data.groupIdx,
          companyIdx: user.data.companyIdx,
          companyName: user.data.companyName,
          groupUpperName: user.data.groupUpperName,
          itemType: 'user',
          checked: false,
          init: true // 컨버팅 식별자
        }

        this.allUsers.push(convert)
        this.onSelectUser(convert)
      })
    },
    /**
     * 렌더링시 체크되어 있어야 하는 요소를 체크 처리한다.
     * 아래 2 메서드를 제어한다.
     * - @function setInitSelectGroup - 그룹을 체크 처리한다.
     * - @function setInitSelectUser - 사용자를 체크 처리한다.
     */
    setInitSelect () {
      // 대상이 없는 경우 아무런 동작하지 않는다.
      if (!this.initSelect || (!this.initSelect.groups && !this.initSelect.users)) return

      // this.setInitSelectGroup(checkedItems.filter(select => select.type === 'group'))
      // this.setInitSelectUser(checkedItems.filter(select => select.type === 'user'))
      this.setInitSelectGroup(this.initSelect.groups)
      this.setInitSelectUser(this.initSelect.users)
    },
    /**
     * 조직 필터링 초기화
     */
    onResetTreeFilter () {
      this.$refs.tree.setTreeSelectDefault(this.$refs.tree.nodes)
      this.filterSelectedGroup = null
    },
    getFilteredTreeData (treeData, groupIdx) {
      return treeData.filter(tree => tree.groupIdx === groupIdx)
    },
    /**
     * 수신 대상에서 대상을 지웠을 때 이벤트
     */
    onToggleClear (key, raw) {
      if (raw.itemType === 'user') {
        this.onSelectUser(raw)
        return
      }
      this.$refs.tree.toggleCheckbox(raw, true, raw.isRootParent)
      // if (raw.children && raw.children.length) raw.children.forEach(child => this.onToggleClear(child.groupIdx, child))
    },
    /**
     * groupUpperName을 찾아서 지정한다.
     */
    setGroupUpperName () {
      const getGroupUpper = (node, groupUppers = []) => {
        groupUppers.unshift(node.groupName)

        if (node.groupUpper) {
          getGroupUpper(this.treeMap.get(node.groupUpper), groupUppers)
        }

        return groupUppers.join(' > ')
      }

      const setGroupUpper = (node) => {
        const groupUuperArr = []
        const groupUpperName = getGroupUpper(node, groupUuperArr)

        this.$set(node, 'groupUpperName', groupUpperName)
      }

      const traverse = (nodes) => {
        if (!nodes || !nodes.length) return

        nodes.forEach(node => {
          setGroupUpper(node)
          if (node.children && node.children.length) {
            traverse(node.children)
          }
        })
      }

      traverse(this.treeData)
    },
    /**
     * 수신자 체크 이벤트 (그룹) - 조직 단위
     */
    onCheckGroup ({ node, state }, isRoot) {
      if (!node) return

      const item = Array.isArray(node) ? [...node] : [node]

      /**
       * 루트 엘리먼트 처리 필요 (현재는 disabled)
       * 따로 처리해야 하는가?
       */
      // if (isRoot) {
      //   if (state && item.length === 1 && item[0].isRootParent) this.checkedGroupData.push(node)
      //   return
      // }

      if (state) {
        // 체크시
        // 하위 항목
        item.forEach(group => {
          if (
            !this.checkedGroupData.find(
              checkedGroup => checkedGroup.groupIdx === group.groupIdx
            )
          ) {
            this.checkedGroupData.push(group)
          }
        })
      } else {
        // 체크 해제시
        // 배열에서 항목 제거
        const removingIndex = item.map(group => group.groupIdx)
        const removingParents = []
        this.checkedGroupData = this.checkedGroupData.filter(group => {
          // 유저 타입 예외처리
          if (group.itemType === 'user') return true
          if (removingIndex.includes(group.groupIdx)) {
            // removingIndex = removingIndex.filter(idx => idx !== group.groupIdx)
            // if (group.parentNode && group.parentNode.children && group.parentNode.children.some(child => !child.isChecked)) removingParents.push(group.parentNode.groupIdx)
            return false
          }
          return true
        })

        this.checkedGroupData = this.checkedGroupData.filter(
          group =>
            group.itemType === 'user' ||
            !removingParents.includes(group.groupIdx)
        )
      }
    },
    /**
     * 수신자 체크 이벤트 (유저)
     */
    onSelectUser (user) {
      user.checked = !user.checked

      if (user.checked) {
        this.checkedGroupData.push(user)
      } else {
        this.checkedGroupData = this.checkedGroupData.filter(groupOrUser => {
          if (groupOrUser.itemType !== 'user') return true
          return groupOrUser.userIdx !== user.userIdx
        })
      }
    },
    /**
     * 선택된 그룹 내 존재하는 유저를 검색한다.
     */
    async getTargetUsersBySelectGroup (group) {
      const isAdmin = this.userType === 'admin'

      if (this.isLoadingTreeData || this.isLoadingUserData) return

      const raf = requestAnimationFrame(() => {
        this.isLoadingTreeData = true
        this.isLoadingUserData = true
      })

      try {
        const res = await API.iam.getUserList({
          userGroup: group.groupIdx,
          isAdmin,
          isAllView: true,
          merge: false,
          includeDeleted: false
        })

        this.userData = res.userList.map(user => {
          const findUser = this.allUsers.findIndex(
            fu => fu.userIdx === user.userIdx
          )

          let convertUser = null

          if (findUser !== -1) {
            if (this.allUsers[findUser].init) {
              // 외부에 의해서 기본적으로 선택되어야 하는 경우
              convertUser = { ...user, ...this.allUsers[findUser] }
              // 현재 유저 데이터에 변환한 유저 데이터를 덮어 씌운다.
              this.allUsers[findUser] = convertUser
              // 기체크된 리스트에도 유저 데이터를 업데이트한다.
              const findUserFromChecked = this.checkedGroupData.findIndex(u => {
                if (u.itemType !== 'user') return false
                return u.userIdx === user.userIdx
              })
              if (findUserFromChecked !== -1) this.checkedGroupData[findUserFromChecked] = convertUser
            } else {
              // 폼 내부에서 선택된 경우
              convertUser = this.allUsers[findUser]
            }
          } else {
            convertUser = {
              ...user,
              groupName: `${user.userCompanyName} > ${user.userGroupName}`,
              companyName: user.userCompanyName,
              groupIdx: user.userGroup,
              companyIdx: user.userCompany,
              checked: false,
              itemType: 'user',
              groupUpperName: `${user.userCompanyName} > ${user.userGroupName} ${user.userName}(${user.userId})`
            }
            this.allUsers.push(convertUser)
          }

          return convertUser
        })
      } catch (error) {
        console.log(error)
        this.$alert('유저 정보 조회에 실패하였습니다.')
      } finally {
        this.isLoadingTreeData = false
        this.isLoadingUserData = false
        cancelAnimationFrame(raf)
      }
    },
    /**
     * 부서명 필터링에 노출시킬 상위 그룹을 지정한다.
     */
    setParentGroups (groups) {
      this.parentGroups = groups
        .filter(group => group.groupUpper === 0)
        .map(group => ({ label: group.groupName, value: group.groupIdx }))
    },
    /**
     * 그룹 선택 이벤트
     */
    onSelectGroup (group) {
      this.selectGroup = group
      this.selectGroupIdx = group.groupIdx
      this.getTargetUsersBySelectGroup(this.selectGroup)
    },
    /**
     * 자식 순회하면서 그룹 이름 지정
     */
    setTreeTitle (res) {
      if (!res) return

      res.forEach(group => {
        group.title = group.groupName
        group.isChecked = false
        this.treeMap.set(group.groupIdx, group)
        if (group.children && group.children.length) {
          this.setTreeTitle(group.children)
        }
      })

      this.treeData = res
    },
    /**
     * 관계사/조직 트리 조회
     */
    async getTree () {
      if (this.isLoadingTreeData) return

      const raf = requestAnimationFrame(() => {
        this.isLoadingTreeData = true
      })

      try {
        const res = await API.iam.getGroupManageTree()

        this.treeMap = new Map()

        this.setTreeTitle(res)
        this.setParentGroups(res)
        this.setGroupUpperName()
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingTreeData = false
        cancelAnimationFrame(raf)
      }
    }
  },
  data: () => ({
    searchReceiverName: '',
    treeData: [],
    isLoadingTreeData: false,
    isLoadingUserData: false,
    selectGroup: null,
    selectGroupIdx: null,
    parentGroups: [],
    filterSelectedGroup: null,
    userData: [],
    filteredUserData: [],
    isFilterUser: false,
    // checkedUserData: [], // 체크된 구성원 데이터
    checkedGroupData: [], // 체크된 수신 대상 데이터
    allUsers: [],
    rootParent: {
      title: '신세계 그룹',
      groupUpper: 0,
      groupIdx: 0,
      isRootParent: true,
      groupUpperName: '신세계 그룹'
    },
    treeMap: null
  })
}
</script>

<style lang="scss" scoped>
.cmp-clickable-button {
  color: darken(#ffffff, 60);
}

.user-receiver {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  flex-direction: row;
  justify-content: center;

  > *:not(.director) {
    min-height: 700px;
    max-height: 700px;
  }

  > .group {
    flex: 0 1 25%;
    overflow-y: hidden;
    overflow-x: auto;

    .area-body {
      padding: $gap-s $gap;
    }

    .group-filter {
      .select-wrapper {
        display: flex;
        align-items: center;

        svg {
          margin-left: $gap-s;
        }
      }
    }
  }

  > .user-group {
    flex: 1 1 25%;

    .area-body {
      padding: 0;
    }
  }

  > .target {
    flex: 1 1 50%;
    min-height: 637px;
    max-height: 637px;
  }

  > *:not(.director) + *:not(.director) {
    margin-left: $gap;
  }

  .flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .el-select {
      max-width: 200px;
    }

    .el-input {
      max-width: 220px;

      &::v-deep .el-input__inner {
        &:not(:focus) {
          border-left: none;
          border-top: none;
          border-right: none;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
      }
    }
  }

  .area-body {
    overflow-y: auto;
    overflow-x: auto;
    min-height: 600px;
    max-height: 600px;
    margin-top: $gap-s;
    padding: $gap;
    border-radius: $radius;
    box-sizing: border-box;
    border: 1px solid $purple-gray;

    &.flex-center {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .empty-data {
        margin: 0;
      }
    }

    .checked-list {
      display: flex;
      flex-wrap: wrap;
    }

    .group-user-item {
      cursor: pointer;
    }

    .group-user-placeholder {
      height: 500px;
    }
  }

  .input-area {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;

    svg {
      margin-left: $gap-s;
    }
  }
}
</style>
