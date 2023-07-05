<!--
  * 파일명 : AppTaskManager.vue
  * 파일 기능 : App 업무담당자 선택 컴포넌트
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: APP 운영팀, APP 업무담당자 초기 셀렉트 -> 내가 속한 조직으로 변경
 -->

<template>
  <section
    class="app-task-manager-component"
    v-loading="loading"
  >
    <!-- v-loading="manageLoading || isGetManageTree || initLoading" -->
    <div
      v-if="useHeader"
      class="-header"
    >
      <a @click="close">
        <close-icon
          class="close-button"
          icon-color="white"
          :width="16"
          :height="16"
        />
      </a>
      <h6 class="-title">
        <!-- 업무담당자 -->
        {{ $t('admin.PREF.taskManager') }}
      </h6>
    </div>

    <div class="search-wrapper -selector">
      <!-- 업무담당자를 검색하세요. -->
      <search-component
        :placeholder="$t('admin.PREF.searchTaskManager')"
        v-model="searchManagerName"
        @search="search()"
        :use-reset-btn="false"
      />
      <!-- :use-reset-btn="false" -->
      <!-- <el-input
        :placeholder="$t('admin.PREF.searchTaskManager')"
        v-model="searchManagerName"
        @keypress.native.enter="search()"
      />
      <i
        v-show="searchManagerName"
        class="mdi mdi-close-circle-outline"
        @click="e => {
          searchManagerName = ''
          search()
        }"
      />

      <i
        class="-magnify-icon"
        @click="search()"
      /> -->
    </div>

    <div class="contents-wrap">
      <section class="department-tree">
        <g-tree
          class="-tree"
          @selected="selectedDep"
          :data="treeData"
          :view-line="true"
          selectable-company
          unique-key="groupIdx"
          :select-object.sync="userTeam"
          ref="tree"
          :root-parent="hasRootGroup"
        >
          <template #title="{ node }">
            <span>
              {{ node.groupName }}
            </span>
          </template>
        </g-tree>
      </section>

      <section
        class="allocated-people"
        v-loading="manageLoading"
      >
        <ul class="approver-list">
          <li
            class="approver-item"
            v-for="(item, userIdx) in manager.list"
            :key="userIdx"
            @click.stop="() =>toggleSelect(item, item.isChecked)"
          >
            <approver-info
              mini
              :use-checkbox="false"
              :is-checked="item.isChecked"
              :name="item.userName + ' ' + item.userPosition"
              :company="item.userCompanyName"
              :group="item.userGroupName"
              :duty="item.userDuty || null"
              @change="() => toggleSelect(item, item.isChecked)"
            />
          </li>

          <li
            class="empty-data"
            v-if="!manager || !manager.list.length"
          >
            <!-- 데이터가 없습니다. -->
            {{ $t('common.PLACEHOLDER.noData') }}
          </li>
        </ul>

        <div
          class="pagination-wrap"
          v-if="manager.list && manager.list.length"
        >
          <el-pagination
            layout="prev, pager, next"
            :total="manager.total"
            :current-page="manager.current"
            :pager-count="managersPageCount"
            :page-size="managersPerCount"
            @current-change="(crrPg) => search(crrPg)"
          />
        </div>
      </section>
    </div>

    <div class="button-area -center modal-button-area apply-wrap">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </div>
  </section>
</template>

<script>
import API, { GTree, treeFindChild } from '@sd-fe/cmp-core'
import ApproverInfo from './ApproverInfoComponent'
import CloseIcon from '@/components/Icons/CloseIcon.vue'
import { cloneDeep, uniqBy } from 'lodash'
import { mapState } from 'vuex'

export default {
  name: 'AppTaskManager',
  components: {
    'approver-info': ApproverInfo,
    'g-tree': GTree,
    CloseIcon
  },
  props: {
    useHeader: { // el-dialog를 사용할 때는 false로 설정해주세요
      type: Boolean,
      default: true
    },
    data: {
      type: Array, // 선택되어있는 업무담당자가 있을 경우 받아옵니다
      default: undefined
    },
    triggerBtn: { // 외부에 정의된 trigger 버튼 > 모달안에 모달을 띄울 경우 사용합니다...!!!
      // 부모 컴포넌트의 trigger 버튼에 ref="taskManTrigger"라고 정의해주세요
      type: Object,
      default: undefined
    },
    managersPerCount: { // 담당자 페이지당 몇 명 보여줄지?
      type: Number,
      default () {
        return 5
      }
    },
    managersPageCount: {
      type: Number,
      default () {
        return 5
      }
    },
    groupTreeData: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState({
      rootGroup: state => state.common.rootGroup
    }),
    hasRootGroup () {
      return this.rootGroup ? { groupName: this.rootGroup, groupUpper: 0, isRootParent: true } : undefined
    }

  },
  watch: {
    groupTreeData: {
      immediate: true,
      handler (newVal) {
        this.treeData = newVal
      }
    },
    data: {
      immediate: true,
      handler (newVal) {
        this.initSelectedManagers = cloneDeep(newVal)
        console.log('@@initSelectedMAnagers: ', this.initSelectedManagers)
      }
    }
  },
  async mounted () {
    this.addAllNodeToTree()

    this.setUserGroup()

    this.$nextTick(function () {
      if (this.userTeam) {
        this.treeAutoScroll()
      }
    })

    await this.getManagersList()

    if (this.triggerBtn?.taskManTrigger) document.addEventListener('click', this.clickTarget)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.clickTarget)
  },
  methods: {
    /**
     * tree 데이터에 '전체' 항목을 추가합니다.
     */
    addAllNodeToTree () {
      const allObj = { groupName: '전체', title: '전체', groupIdx: 'isAll', children: [] }
      if (this.treeData[0].groupIdx !== 'isAll') {
        if (this.treeData.length) this.treeData.unshift(allObj)
        else this.treeData.unshift(allObj)
      }
    },
    /**
     * 로그인 한 유저가 속한 그룹을 선택한 팀으로 설정합니다.
     */
    setUserGroup () {
      this.manageLoading = true
      const userGroupIdx = this.$store.state.auth.user.userGroup
      const userGroupInfo = treeFindChild(this.treeData, 'groupIdx', userGroupIdx)

      this.userTeam = userGroupInfo ? { ...userGroupInfo } : undefined
      this.selectedDep(this.userTeam)
      this.manageLoading = false
    },
    /**
     * 선택된 영역으로 자동 스크롤
     */
    treeAutoScroll () {
      const tree = this.$refs.tree.$el
      const selectEl = tree.querySelector('.tree-label-text.-selected')
      const scrollTop = selectEl.getBoundingClientRect().top >= 400 ? selectEl.getBoundingClientRect().top - 400 : 0

      this.$el.querySelector('.department-tree').scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    },
    /**
     * 업무담당자 검색 이벤트
     */
    async search (currPage = 1) {
      this.manager.current = currPage
      await this.getManagersList()
    },
    /**
     * 부서 선택
     */
    async selectedDep (node) {
      this.userTeam = node
      this.groupIdx = this.userTeam?.groupIdx === 'isAll' ? null : this.userTeam.groupIdx
      this.manager.current = 1
      await this.getManagersList()
    },
    /**
     * 담당자 조회
     */
    async getManagersList () {
      try {
        if (this.manageLoading) return
        this.manageLoading = true
        const hr = await API.config.getHrJdbc(0)
        let res = []
        if (hr && hr.length > 0) {
          // jdbc 정보 있으면 AD 사용자 목록 가져옴
          res = await API.iam.getUserPage({
            perPage: this.managersPerCount,
            nowPage: this.manager.current,
            userKeyword: this.searchManagerName,
            groupIdx: this.groupIdx
          })
        } else {
          // jdbc 정보 없으면 사이트 전체 사용자 목록 가져옴
          res = await API.iam.getUserList({
            perPage: this.managersPerCount,
            nowPage: this.manager.current,
            userKeyword: this.searchManagerName,
            userGroup: this.groupIdx
          })
        }
        this.manager.list = this.settingCheckedManager(res.userList, this.initSelectedManagers)
        this.manager.total = res.totalCount
      } catch (error) {
        this.manageLoading = false
        console.error(error)
      } finally {
        this.manageLoading = false
      }
    },
    /**
     * 초기 선택된 매니저 세팅
     * @param {Array} userList 매니저 1페이지의 전체 목록 (5개)
     * @params {Array} selectedArr 선택 되어있는 매니저 리스트
     */
    settingCheckedManager (userList, selectedArr = this.initSelectedManagers) {
      // console.log('@@ userList : ', userList)
      if (!selectedArr?.length) return userList
      console.log(this.initSelectedManagers)

      const map = (arr, key) => {
        const data = arr.map(item => { return item[key] })
        return data
      }

      const selectedUsersIdx = map(selectedArr, 'userId') // userId 모음

      userList = userList.map(user => {
        return {
          ...user,
          isChecked: !!selectedUsersIdx.includes(user.userId)
        }
      })

      return userList
    },
    /**
     * 담당자 선택 toggle
     */
    toggleSelect (item, status) {
      item.isChecked = !status
      this.$forceUpdate()

      const allCheckedItems = this.initSelectedManagers ? cloneDeep(this.initSelectedManagers) : []

      if (!item.isChecked) {
        for (let i = 0; i < allCheckedItems.length; i++) {
          if (allCheckedItems[i].userId === item.userId) {
            allCheckedItems.splice(i, 1)
            break
          }
        }
      } else {
        allCheckedItems.push({
          userIdx: item.userIdx,
          userId: item.userId,
          userName: item.userName,
          userGroup: item.userGroup,
          userGroupName: item.userGroupName,
          userGroupCode: item.userGroupCode,
          userGroupIdx: this.groupIdx,
          userCompany: item.userCompany,
          userCompanyName: item.userCompanyName,
          userDuty: item.userDuty
        })
      }

      this.initSelectedManagers = uniqBy(allCheckedItems, 'userId')
    },
    /**
     * [적용] 버튼 클릭시 emit 이벤트
     */
    save () {
      if (!this.initSelectedManagers?.length) this.$alert(this.$t('common.ALERT.APPROVAL.002')) // 담당자를 선택해주세요
      else {
        this.$confirm(this.$t('common.CONFIRM.ROLE.002'), '', { // 선택된 담당자로 적용하시겠습니까?
        }).then(() => {
          this.$emit('task-managers', this.initSelectedManagers)
          this.$emit('close')
        }).catch(() => false)
      }
    },
    /**
     * close 버튼 클릭시 발생 이벤트
     */
    close () {
      this.initSelectedManagers = this.data ? [...this.data] : []
      this.$emit('close')
    },
    /**
     * 영역 외부 클릭시 (alert창 제외) 모달 닫히게 합니다.
     */
    clickTarget (e) {
      if (e.target !== this.triggerBtn.taskManTrigger) {
        const elements = Array.from(this.$el.querySelectorAll('*'))
        const validator = elements.some(element => element === e.target) || e.target === this.$el

        const alert = document.querySelector('.el-message-box__wrapper')
        if (alert) {
          const alertInner = Array.from(alert.querySelectorAll('*'))
          const isAlert = alertInner.some(element => element === e.target) || e.target === alert
          if (isAlert) return false
        }

        if (!validator) return this.close()
      }
    }
  },
  data () {
    return {
      userTeam: undefined, // 유저가 속한 group
      isGetManageTree: false,
      manageLoading: false,
      treeData: [], // 그룹 트리 데이터
      groupIdx: null, // 트리에서 선택된 조직의 groupIdx
      initSelectedManagers: [], // 초기 선택 되어있는 담당자 정보
      searchNameText: '', // 검색 결재자명
      searchManagerName: '', // 검색할 담당자 이름
      manager: { // 담당자 정보
        list: [],
        total: 0,
        current: 1
      },
      selectedManageInfo: [] // 선택된 담당자 정보
    }
  }
}
</script>

<style lang="scss" scoped>
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
      border: 2px solid  $white;
      border-radius: 50%;
    }
    &::after {
      bottom: 1px;
      right: -2px;
      width: 7px;
      height: 2px;
      background-color:  $white;
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

  .app-task-manager-component {
    .-header {
      .close-button {
        position: absolute;
        top: 15px; right: 15px;
        cursor: pointer;
      }
      .-title {
        font-size: 16px;
        margin-bottom: $gap;
      }
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $gap;
      position: relative;
      width: 250px;
      .-magnify-icon { margin-left: $gap; }
      .mdi-close-circle-outline {
        position: absolute;
        right: 40px; top: 10px;
        color: $input-placeholder;
        cursor: pointer;
        &:before { font-size: 15px; }
      }
    }

    .contents-wrap {
      display: flex;
      .department-tree {
        flex: 1 1 auto;
        margin-right: $gap;
        overflow-y: auto;
        height: 430px;
        background-color: transparent;
        border: 1px solid $border-color;
        border-radius: 6px;
        .-selector {
          margin-bottom: $gap-s;
          width: 100%;
        }
        .-tree {
          padding-left: $gap;
          box-sizing: border-box;
        }
      }

      .allocated-people {
        flex: 0 0 308px;
        border: 1px solid $border-color;
        border-radius: 6px;
        .approver-list {
          margin-bottom: $gap;
          // overflow-y: hidden;
          // height: 335px;
          background-color: transparent;
          > .approver-item {
            position: relative;
            cursor: pointer;
            // padding: 0 $gap;
            &::after {
              content: '';
              position: absolute;
              top: 100%;
              left: $gap;
              right: $gap;
              height: 1px;
              background-color: $border2A;
              z-index: 1;
            }
            // border-bottom: 1px solid $border2A;
            // &:last-child {
            //   border: none;
            // }
          }
          > .-empty {
            line-height: 40px;
            text-align: center;
            color: $input-placeholder;
          }
        }
      }
    }
    .apply-wrap {
      text-align: center;
      margin-top: $gap;
      width: 100%;
    }
    .pagination-wrap {
      margin-top: 0;
    }
  }
</style>
