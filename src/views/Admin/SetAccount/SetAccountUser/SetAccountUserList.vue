<!--
  * 파일명 : SetAccountUserList.vue
  * 파일 기능 : 계정 관리 > 사용자 계정 리스트 노출
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 계정관리 > 사용자계정/운영관리자계정 : 필터링 버그 픽스 및 UI 개선
 -->

<template>
  <div class="set-account-user-list">
    <section class="content-header">
      <filtering-component
        :data="filteringOptions"
        @selected="changeFilter"
        ref="userFilter"
        @reset-data="resetData()"
      >
        <div class="filter-search">
          <!-- 검색 -->
          <span class="filter-name">{{ $t('common.PLACEHOLDER.search') }}</span>
          <div class="filter-options">
            <el-select
              class="search-option"
              :placeholder="$t('common.PLACEHOLDER.search')"
              v-model="searchOpt"
              :popper-append-to-body="false"
              @change="changeSearchCondition"
            >
              <el-option
                v-for="item in textOption"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </el-select>
          </div>
          <div class="text-search">
            <el-input
              v-model="searchText"
              @input="searchData"
              placeholder="검색"
            />

            <i class="search-icon" />
          </div>
        </div>
      </filtering-component>
      <section class="table-top-wrap">
        <total-count
          :total-count="totalResultCnt"
          style="padding-bottom: 0;"
        />
        <div class="button-area -right">
          <button
            class="button"
            @click="routeTo({
              name: 'set-account-create',
              params: { detailField: 'user' }
            })"
            type="is-primary"
          >
            {{ $v('계정 추가') }}
          </button>
        </div>
      </section>
    </section>

    <section
      class="table-area"
      v-loading="loading"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
    >
      <cmp-grid
        :loading="loading"
        :item-source="userListData"
        :columns="columns"
        ref="grid"
        @selectedRow="selectRow"
        selectable
        class="route-detail-grid"
        :column-data-map="columnDataMap"
        :use-excel-download="true"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #_userId="{row}">
          <cmp-status-tag
            v-if="row.userIdx"
            type="mp"
            contents="CMP"
          />&nbsp;{{ row._userId }}
        </template>
        <template #latestLoginTime="props">
          {{ props.row.latestLoginTime | date }}
        </template>
        <template #userStatusStr="props">
          <span
            :class="styleSet(props.row)"
            style="background-color: transparent;"
          >
            <!-- {{ props.row.userStatus }} -->
            {{ props.row.userStatusStr }}
          </span>
        </template>
        <template #loginLock="props">
          <el-checkbox
            v-model="props.row.loginLock"
            disabled
          />
        </template>
      </cmp-grid>
    </section>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

export default {
  name: 'SetAccountUserList',
  components: {
    FilteringComponent
  },
  watch: {
    async 'filterObj.relationCorp' (newVal) {
      if (newVal !== undefined) {
        const groupList = await this.getGroupList({ companyIdx: newVal }) // 조직 목록 세팅

        this.filteringOptions[1].selections = [
          { label: this.$t('main.DASHBOARD.all'), value: undefined },
          ...groupList.filter(group => this.userGroupIdxList.includes(group.value))
        ]
      } else {
        this.filteringOptions[1].selections = [
          { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
        ]
      }
    }
  },
  async mounted () {
    this.setCompanyOption()
  },
  methods: {
    /**
     * 관계사 (company) 필터 옵션 설정
     */
    async setCompanyOption () {
      this.loading = true
      await this.getUserList()

      const companyOptions = await this.getGroupList({ groupUpper: 0 }) // 관계사 목록 세팅
      this.filteringOptions[0].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...companyOptions.filter(company => company.companyCode !== 'common')]

      this.loading = false
    },
    /**
     * 관계사 변경시 하위 조직(group) 세팅
     */

    /**
     * 관계사 : company
     * 조직 : group
     */
    manageLabel (label = 'user') {
      return {
        user: '사용자',
        admin: '관리자',
        taskAdmin: '업무관리자'
      }[label]
    },
    routeTo (to) {
      this.$router.push(to)
    },
    selectRow (param) {
      param = Object.assign(param._data, { detailField: 'user', id: param._data.userId })
      this.routeTo({
        name: 'set-account-detail',
        params: param
      })
    },
    /**
     * 사용자 조회 메소드
     *
     * 1. 일반 사용자 조회 API 호출
     * 2. 계정 상태, 관리 등급 이름 매칭
     * 3. 사용자 조직, 사용자 관계사 이름, 인덱스 매칭
     * 4. 원본 저장, 그리드에 표시
     */
    async getUserList () {
      const payload = { isAdmin: false }
      const res = await API.iam.getUserList(payload)
      const options = (id) => this.$options.filters.maskingName(id)

      const userGroups = []
      const mappedLoginTime = []
      this.userRawData = await res.userList
      this.userRawData = this.userRawData.map(user => {
        user._userId = options(user.userId)
        // if (user.userStatus === 0) {
        //   // 비활성화 상태
        //   user.userStatusStr = this.accountStatus[0]
        // } else if (user.requestStatus === 0 && user.userPermLevel === 4) {
        //   user.userStatusStr = this.accountStatus[1]
        // } else {
        //   user.userStatusStr = this.accountStatus[user.userStatus] || '-'
        // }
        user.userStatusStr = this.userStatus[user.userStatus]
        // user.userStatusStr = user.requestStatus === 0 ? this.accountStatus[1] : this.accountStatus[user.userStatus] // 상태
        user.userPermLevelStr = this.permLevel[user.userPermLevel] // 권한 (한글)
        user.userGroupStr = user.userGroupName
        user.userCompanyStr = user.userCompanyName
        user.userCompanyIdx = user.userCompany
        user.createTime = !user.createTime ? '-' : Dayjs(user.createTime).format('YYYY.MM.DD') || '-'

        // 멀티사용자일 경우, ui 에서는 멀티사용자로 표시함
        if (user.isMultiUser) {
          user.userPermLevelStr = user.userPermLevel !== 2 ? this.$t('admin.ACCOUNT.multiUser') : user.userPermLevelStr
          user.userPermLevel = user.userPermLevel !== 2 ? 7 : user.userPermLevel
        }

        userGroups.push(user.userGroup)
        mappedLoginTime.push({ value: user.latestLoginTime, caption: this.$options.filters.date(user.latestLoginTime) })
        return user
      })

      this.columnDataMap.latestLoginTime = Array.from(new Set(mappedLoginTime)) // 최근 접속 이력 데이터 맵 설정

      this.userListData = JSON.parse(JSON.stringify(this.userRawData))
      this.userGroupIdxList = Array.from(new Set(userGroups)) // 유저의 그룹을
    },

    /**
     * 조직 조회 메소드
     *
     * 1. 조직 조회 API 호출
     * 2. 맵에 인덱스, 데이터 입력
     * 3. 관계사 필터 옵션 설정
     * 4. 부서 필터 옵션 설정
     */
    async getGroupList (payload) {
      const response = await API.iam.getGroupList(payload)
      if (!response) return
      const groupList = response.map(group => {
        return {
          ...group,
          label: group.groupName,
          value: group.groupIdx,
          companyCode: group.companyCode ? group.companyCode : null
        }
      })
      return groupList
    },

    /**
     * 초기화 버튼 클릭시 실행하는 메소드
     *
     * 1. 사용자 원본 데이터 입력
     * 2. 필터 값 초기화 (셀렉트 박스 자체 초기화는 미적용)
     */
    resetData () {
      this.filterObj = {
        relationCorp: undefined,
        group: undefined,
        accountState: undefined,
        level: undefined
      }
      this.searchText = undefined
      this.searchOpt = 'userName'
      this.searchData()
    },
    /**
     * 조회 버튼 클릭시 실행하는 검색 메소드
     * 1. 각 조건별 필터
     */
    searchData () {
      this.userListData = this.userRawData.filter(user => {
        let result = true
        if (this.filterObj.relationCorp && this.filterObj.relationCorp !== undefined) result = result && (user.userCompanyIdx === this.filterObj.relationCorp)
        if (this.filterObj.group && this.filterObj.group !== undefined) result = result && (user.userGroup === this.filterObj.group)
        if (this.filterObj.accountState !== undefined && this.filterObj.accountState !== undefined) result = result && (user.userStatus === this.filterObj.accountState)
        if (this.filterObj.level !== undefined && this.filterObj.level !== undefined) result = result && (user.userPermLevel === this.filterObj.level)

        if (this.searchText) {
          const condition = String(this.searchOpt)
          const regex = new RegExp(this.searchText, 'gi')
          result = result && regex.test(user[condition])
        }
        return result
      })
    },
    /**
     * 필터링 시, 발생 이벤트 입니다.
     * @param {Object} filtering 필터링 전체 선택된 valye
     */
    changeFilter (filtering) {
      for (const key in filtering) {
        this.filterObj[key] = filtering[key]
      }
      this.searchData()
    },
    changeSearchCondition (test) {
      this.searchText = undefined
      this.searchData()
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      userGroupIdxList: [], // 유저 groupIdx 총 모음 array
      searchText: undefined,
      searchOpt: 'userName',
      // 필터링 데이터
      filteringOptions: [
        {
          field: 'relationCorp',
          label: '관계사',
          keyPath: 'common.TERMS.rel',
          placeholder: `${this.$t('common.TERMS.rel')} ${this.$t('common.BTN.select')}`,
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
          ]
        },
        {
          field: 'group',
          label: '조직',
          linked: ['relationCorp'],
          keyPath: 'common.TERMS.group',
          orgTooltip: true,
          placeholder: `${this.$t('common.TERMS.group')} ${this.$t('common.BTN.select')}`,
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
          ]
        },
        {
          field: 'accountState',
          label: '계정상태',
          keyPath: 'admin.ACCOUNT.state',
          placeholder: `${this.$t('admin.ACCOUNT.state')} ${this.$t('common.BTN.select')}`,
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined }, // 전체
            { label: this.$t('admin.ACCOUNT.actived'), value: 3 }, // 활성화
            // { label: this.$t('admin.ACCOUNT.waitApproval'), value: 1 }, // 승인 대기
            { label: this.$t('admin.ACCOUNT.inactived'), value: 0 }, // 비활성화
            { label: this.$t('admin.ACCOUNT.resigned'), value: 4 } // 퇴사
          ]
        },
        {
          field: 'level',
          label: this.$t('admin.ACCOUNT.perm'),
          placeholder: `${this.$t('admin.ACCOUNT.perm')} ${this.$t('common.BTN.select')}`,
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined }, // 전체
            { label: this.$t('admin.ACCOUNT.middleManager'), value: 2 }, // 중간관리자
            // { label: this.$t('admin.ACCOUNT.multiUser'), value: 7 }, // 멀티사용자
            // { label: this.$t('admin.ACCOUNT.customUser'), value: 5 }, // 커스텀 사용자
            // { label: this.$t('admin.ACCOUNT.billingUser'), value: 3 }, // 빌링사용자
            { label: this.$t('admin.ACCOUNT.generalUser'), value: 4 } // 일반사용자
          ]
        }
      ],
      permLevel: [
        this.$t('admin.ACCOUNT.topManagerSimple'), // 최고관리자
        this.$t('admin.ACCOUNT.operationManager'), // 운영관리자
        this.$t('admin.ACCOUNT.middleManager'), // 중간관리자
        this.$t('admin.ACCOUNT.billingUser'), // 빌링사용자
        this.$t('admin.ACCOUNT.generalUser'), // 일반사용자
        this.$t('admin.ACCOUNT.customUser'), // 커스텀 사용자
        this.$t('admin.ACCOUNT.partenrs') // 협력사
        // this.$t('admin.ACCOUNT.billingUser'), // 멀티 사용자
        // 0 최고관리자, 1 운영관리자, 2 중간관리자, 3 빌링사용자, 4, 일반 사용자, 5 커스텀 사용자, 6 협력사
      ],
      userStatus: {
        0: this.$v('비활성화'),
        // 1: this.$v('승인대기'), // 3단계 제거
        // 2: this.$v('승인반려'), // 3단계 제거
        3: this.$v('활성화'),
        4: this.$v('퇴사자')
      },
      accountStatus: [
        this.$t('admin.ACCOUNT.inactived'), // 비활성화
        // this.$t('admin.ACCOUNT.waitApproval'), // 승인 대기
        this.$t('admin.ACCOUNT.rejectApproval'), // 승인 반려
        this.$t('admin.ACCOUNT.actived'), // 활성화
        this.$t('admin.ACCOUNT.resigned') // 퇴사
      ],
      styleSet (user) {
        let status = 0

        if (user.userStatus === 0) status = 0
        else if (user.requestStatus === 0 && user.userPermLevel === 4) status = 1
        else status = user.userStatus

        return {
          0: 'is-fail', // 비활성화
          // 1: 'is-wait', // 승인 대기
          2: 'is-reject', // 승인 반려
          3: 'is-active', // 활성화
          4: 'is-quit' // 퇴사
        }[status]
      },
      // 테이블 데이터
      columns: [
        { header: '사번', binding: '_userId', width: 150, format: 'd*', align: 'left', keyPath: 'common.GRID.pressure', customHtml: true },
        { header: '이름', binding: 'userName', width: 150, align: 'left', keyPath: 'common.REGCON.name' },
        { header: '관계사', binding: 'userCompanyStr', width: 200, align: 'left', keyPath: 'common.TERMS.rel' },
        { header: '조직', binding: 'userGroupName', width: 200, align: 'left', keyPath: 'common.TERMS.group' },
        // { header: '부서', binding: 'userGroupStr',  width: '*', keyPath: 'task.PRIOR.GRID.depart' },
        { header: '직위', binding: 'userPosition', width: 100, keyPath: 'admin.ACCOUNT.position' },
        { header: '이메일', binding: 'userEmail', width: '*', keyPath: 'admin.ACCOUNT.email' },
        // { header: '휴대전화', binding: 'userPhone', width: '*' },
        { header: '계정 상태', binding: 'userStatusStr', width: 150, customHtml: true, keyPath: 'admin.ACCOUNT.state' },
        { header: '권한', binding: 'userPermLevelStr', width: 150, keyPath: 'admin.ACCOUNT.perm' },
        { header: '로그인 잠금', binding: 'loginLock', width: 150, customHtml: true, keyPath: 'admin.ACCOUNT.loginLock' },
        // { header: '최근 접속 이력', binding: 'latestLoginTime', width: 150, customHtml: true, dataType: 'Date', keyPath: 'admin.ACCOUNT.recent' }
        { header: '등록일', binding: 'createTime', width: 150, customHtml: true, keyPath: 'common.REGCON.regDate' }
      ],
      textOption: [
        { label: this.$t('common.REGCON.name'), value: 'userName' },
        { label: this.$t('common.REGCON.userId'), value: 'userId' },
        { label: this.$t('common.REGCON.position'), value: 'userPosition' },
        { label: this.$t('common.REGCON.email'), value: 'userEmail' }
      ],
      userListData: [],
      userRawData: [],
      // groupRawData: [],
      filterObj: {
        relationCorp: undefined,
        department: undefined,
        accountState: undefined,
        level: undefined
      },
      groupMap: new Map(),
      loading: false,
      columnDataMap: {
        latestLoginTime: null
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.set-account-user-list {
  .filter-search {
    position: absolute;
    bottom: 0; right: 0;
    // width: 500px;
    height: 30px;
    display: flex;
    align-items: center;

    .search-option { width: 190px; }

    .text-search {
      width: 210px;
      margin: 0 $gap;
      height: 32px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      top: 5px; right: -$gap;
      width: 15px; height: 15px;
      cursor: pointer;

      &::before,
      &::after {
        content: '';
        position: absolute;
      }
      &::before {
        width: 13px; height: 13px;
        top: 0; right: 0;
        border: 2px solid $input-placeholder;
        border-radius: 50%;
      }
      &::after {
        width: 2px; height: 6px;
        top: 13px; right: 0;
        transform: rotate(-45deg);
        background-color: $input-placeholder;
      }
    }
  }
}

.cmp-text {
  color: $primary;
  font-weight:500;
}

</style>
<style lang="scss">
  .set-account-user-list {
    .filtering-component {
      .filter-wrapper {
        .el-input {
          .el-input__inner { border-bottom: 1px solid $purple-gray; }
        }
        .filtering-list {
          &:first-of-type {
            .filter-options {
              width: 200px;
              .el-select { min-width: 200px; }
            }
          }
          .filter-options {
            width: 140px;
            .el-select { min-width: 140px; }
          }
        }

        .el-select-dropdown__list {
          width:auto;
        }
      }
    }

    .is-fail { color: #666666 }
    .is-wait { color: $main-red }
    // .is-reject { color: $main-red }
    .is-active { color: $primary }
    .is-quit { color: #666666 }

    .el-checkbox.is-disabled {
      .el-checkbox__input.is-checked {
        .el-checkbox__inner {
          background-color: $white;
          opacity: 1;
        }
      }
      }
  }
</style>
