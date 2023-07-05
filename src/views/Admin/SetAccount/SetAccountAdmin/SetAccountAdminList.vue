<!--
  * 파일명 : SetAccountAdminList.vue
  * 파일 기능 : 계정 관리 > 운영 관리자 계정 리스트 노출
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 계정관리 > 사용자계정/운영관리자계정 : 필터링 버그 픽스 및 UI 개선
 -->

<template>
  <div class="set-account-admin-list">
    <section class="content-header">
      <filtering-component
        :data="filteringOptions"
        @selected="changeFilter"
        ref="adminFilter"
        @reset-data="resetData()"
      >
        <div class="filter-search">
          <!-- 검색 -->
          <span class="filter-name">{{ $t("common.PLACEHOLDER.search") }}</span>
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
    </section>

    <section class="table-top-wrap">
      <total-count
        :total-count="totalResultCnt"
      />
      <div class="button-area -right">
        <button
          class="button"
          @click="routeTo({
            name: 'set-account-create',
            params: { detailField: 'admin' }
          })"
          type="is-primary"
        >
          {{ $t('common.BTN.ADMIN.regAcc') }}
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
        :item-source="userListData"
        :columns="columns"
        is-read-only
        ref="grid"
        @selectedRow="selectRow"
        class="set-account-admin-list-table route-detail-grid"
        :selectable="true"
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
        <template #userStatusStr="props">
          <span
            :class="[
              {'is-fail': props.row.userStatus === 4},
              {'is-complete': props.row.userStatus === 3},
              {'is-wait': props.row.userStatus === 1},
              {'is-reject': props.row.userStatus === 2},
              {'is-fail': props.row.userStatus === 0}]"
            style="background-color: transparent;"
          >
            <!-- props.row.userStatus === '활성' ? 'is-complete' : 'is-fail']" -->
            {{ props.row.userStatusStr }}
          </span>
        </template>
        <template #latestLoginTime="props">
          {{ props.row.latestLoginTime|date }}
        </template>
        <template #loginLock="props">
          <el-checkbox
            v-model="props.row.loginLock"
            disabled
          />
          <!-- {{ props.row.loginLock }} -->
        </template>
      </cmp-grid>
    </section>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'

export default {
  name: 'SetAccountAdminList',
  components: {
    FilteringComponent
  },
  watch: {
    async 'filterObj.relationCorp' (newVal) {
      if (newVal !== undefined) {
        const groupList = await this.getGroupList({ companyIdx: newVal }) // 부서 목록 세팅

        this.filteringOptions[1].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...groupList.filter(group => this.userGroupIdxList.includes(group.value))]
      } else {
        this.filteringOptions[1].selections = [
          { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
        ]
      }
    }
  },
  async mounted () {
    this.loading = true
    await this.getUserList()
    // this.getGroupList()
    const companyOptions = await this.getGroupList({ groupUpper: 0 }) // 관계사 목록 세팅
    this.filteringOptions[0].selections = [{ label: this.$t('main.DASHBOARD.all'), value: undefined }, ...companyOptions.filter(company => company.companyCode !== 'common')]

    this.loading = false
  },
  methods: {
    manageLabel (label = 'admin') {
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
      param = Object.assign(param._data, { detailField: 'admin', id: param._data.userId })
      this.routeTo({
        name: 'set-account-detail',
        params: param
        // query: { field: 'admin' }
      })
    },

    /**
     * 사용자 조회 메소드
     *
     * 1. 관리자 조회 API 호출
     * 2. 계정 상태, 관리 등급 이름 매칭
     * 3. 사용자 조직, 사용자 관계사 이름, 인덱스 매칭
     * 4. 원본 저장, 그리드에 표시
     */
    async getUserList () {
      const payload = { isAdmin: true }
      const res = await API.iam.getUserList(payload)
      const options = (id) => this.$options.filters.maskingName(id)

      const userGroups = []
      const mappedLoginTime = []
      this.userRawData = await res.userList
      this.userRawData = this.userRawData.map(user => {
        user._userId = options(user.userId)
        user.userStatusStr = this.accountStatus[user.userStatus] || '-'
        user.userPermLevelStr = this.permLevel[user.userPermLevel] || '-'
        user.userGroupStr = user.userGroupName
        user.userCompanyStr = user.userCompanyName
        user.userCompanyIdx = user.userCompany

        userGroups.push(user.userGroup)
        mappedLoginTime.push({ value: user.latestLoginTime, caption: this.$options.filters.date(user.latestLoginTime) })
        return user
      })
      this.columnDataMap.latestLoginTime = Array.from(new Set(mappedLoginTime)) // 최근 접속 이력 데이터 맵 설정
      // this.userListData = this.userRawData
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
      // // for (const data of this.groupRawData) {

      // // }
      // this.filteringOptions[0].selections = [{ label: '전체', value: 'all' }]
      // this.groupRawData.forEach(group => {
      //   this.groupMap.set(group.groupIdx, group)
      //   if (group.groupUpper === 0 && group.companyCode !== 'common') {
      //     this.filteringOptions[0].selections.push({ label: group.groupName, value: group.groupIdx })
      //   }
      // })
      // // this.groupRawData.filter(group => group.groupUpper === 0 && group.companyCode !== 'common').map(group => {
      // //   return {
      // //     label: group.groupName,
      // //     value: group.groupIdx
      // //   }
      // // }).forEach(data => this.filteringOptions[0].selections.push(data))
      // // console.log(this.groupRawData)
      // // this.departmentInit()
      if (!response) return
      const groupList = response.map(group => {
        return {
          label: group.groupName,
          value: group.groupIdx,
          companyCode: group.companyCode ? group.companyCode : null
        }
      })
      return groupList
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
    },

    /**
     * 조회 버튼 클릭시 실행하는 검색 메소드
     *
     * 1. 각 조건별 필터
     */
    searchData () {
      // this.userListData = this.userRawData.filter(user => {
      //   let result = true
      //   if (this.filterObj.relationCorp && this.filterObj.relationCorp !== 'all') result = result && (user.userCompanyIdx === this.filterObj.relationCorp)
      //   if (this.filterObj.department && this.filterObj.department !== 'all') result = result && (user.userGroup === this.filterObj.department)
      //   if (this.filterObj.accountState !== undefined && this.filterObj.accountState !== 'all') result = result && (user.userStatus === this.filterObj.accountState)
      //   if (this.filterObj.level !== undefined && this.filterObj.level !== 'all') result = result && (user.userPermLevel === this.filterObj.level)
      //   return result
      // })
      let userData = [...this.userRawData]

      if (this.filterObj.relationCorp) {
        userData = userData.filter(
          user => user.userCompanyIdx === this.filterObj.relationCorp
        )
      }

      if (this.filterObj.department) {
        userData = userData.filter(
          user => user.userGroup === this.filterObj.department
        )
      }

      if (this.filterObj.accountState !== undefined) {
        userData = userData.filter(
          user => user.userStatus === this.filterObj.accountState
        )
      }

      if (this.filterObj.level !== undefined) {
        userData = userData.filter(
          user => user.userPermLevel === this.filterObj.level
        )
      }

      if (this.searchText) { // 이름, 사번, 직위, 이메일 검색 추가
        const condition = String(this.searchOpt)
        const regex = new RegExp(this.searchText, 'gi')
        userData = userData.filter(
          user => regex.test(user[condition])
        )
      }

      this.userListData = userData
    },
    /**
     * 초기화 버튼 클릭시 실행하는 메소드
     *
     * 1. 사용자 원본 데이터 입력
     * 2. 필터 값 초기화 (셀렉트 박스 자체 초기화는 미적용)
     */
    resetData () {
      // this.userListData = this.userRawData
      this.filterObj = {
        relationCorp: undefined,
        department: undefined,
        accountState: undefined,
        level: undefined
      }
      this.searchText = undefined
      this.searchOpt = 'userName'
      this.searchData()
      // this.departmentInit()
    }

    /**
     * 필터 셀렉트 박스 선택 시 처리하는 메소드
     *
     * 1. 관계사 선택 시 부서 필터링
     */
    // selectFilter (selectedArr) {
    //   if (this.filterObj === undefined || selectedArr.relationCorp !== this.filterObj.relationCorp) {
    //     this.$refs.adminFilter.filterTotalData[this.filteringOptions[1].field] = 'all'
    //     this.filteringOptions[1].selections = [{ label: '전체', value: 'all' }]
    //     this.groupRawData.forEach(group => {
    //       if (group.companyIdx === selectedArr.relationCorp) {
    //         this.filteringOptions[1].selections.push({
    //           label: group.groupName,
    //           value: group.groupIdx
    //         })
    //       }
    //     })
    //     // this.groupRawData.filter(group => group.companyIdx === selectedArr.relationCorp)
    //     //   // .sort((group1, group2) => group1.groupIdx - group2.groupIdx)
    //     //   .map(group => {
    //     //     return {
    //     //       label: group.groupName,
    //     //       value: group.groupIdx
    //     //     }
    //     //   }).forEach(data => this.filteringOptions[1].selections.push(data))
    //   }
    //   // else {
    //   //   this.departmentInit()
    //   // }
    //   this.filterObj = JSON.parse(JSON.stringify(selectedArr))
    //   this.searchData()
    // },
    // /**
    //  * 부서 선택 초기화
    //  */
    // departmentInit () {
    //   this.filteringOptions[1].selections = [{ label: '전체', value: 'all' }]
    //   this.groupRawData.filter(group => group.groupUpper !== 0).map(group => {
    //     return {
    //       label: this.groupMap.get(group.companyIdx).groupName + ' > ' + group.groupName,
    //       value: group.groupIdx
    //     }
    //   }).forEach(data => this.filteringOptions[1].selections.push(data))
    // }
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
          selections: []
        },
        {
          field: 'department',
          label: '조직',
          linked: ['relationCorp'],
          keyPath: 'common.TERMS.group',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
          ]
        },
        {
          field: 'accountState',
          label: '계정상태',
          keyPath: 'admin.ACCOUNT.state',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined }, // 전체
            { label: this.$t('admin.ACCOUNT.inactive'), value: 0 }, // 비활성
            // { label: this.$t('admin.ACCOUNT.waitApproval'), value: 1 }, // 승인 대기
            // { label: this.$t('admin.ACCOUNT.rejectApproval'), value: 2 }, // 승인 반려
            { label: this.$t('admin.ACCOUNT.active'), value: 3 } // 활성
          ]
        },
        {
          field: 'level',
          label: '등급',
          keyPath: 'admin.ACCOUNT.grade',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined }, // 전체
            { label: this.$t('admin.ACCOUNT.topManagerSimple'), value: 0 }, // 최고 관리자
            { label: this.$t('admin.ACCOUNT.managerSimple'), value: 1 } // 운영 관리자
          ]
        }
      ],
      textOption: [ // 이름, 사번, 직위, 이메일 검색 옵션 추가
        { label: this.$t('common.REGCON.name'), value: 'userName' },
        { label: this.$t('common.REGCON.userId'), value: 'userId' },
        { label: this.$t('common.REGCON.position'), value: 'userPosition' },
        { label: this.$t('common.REGCON.email'), value: 'userEmail' }
      ],
      permLevel: [
        this.$t('admin.ACCOUNT.topManagerSimple'), // 최고 관리자
        this.$t('admin.ACCOUNT.managerSimple') // 운영 관리자
      ],
      accountStatus: [
        this.$t('admin.ACCOUNT.inactive'), // 비활성
        this.$t('admin.ACCOUNT.waitApproval'), // 승인 대기
        this.$t('admin.ACCOUNT.rejectApproval'), // 승인 반려
        this.$t('admin.ACCOUNT.active'), // 활성
        this.$t('admin.ACCOUNT.resigned') // 퇴사
      ],
      // 테이블 데이터
      columns: [
        { header: '사번', binding: '_userId', width: 150, format: 'd*', align: 'left', keyPath: 'common.GRID.pressure', customHtml: true },
        { header: '이름', binding: 'userName', width: 150, align: 'left', keyPath: 'common.REGCON.name' },
        { header: '관계사', binding: 'userCompanyStr', width: 200, align: 'left', keyPath: 'common.TERMS.rel' },
        { header: '조직', binding: 'userGroupStr', width: '*', keyPath: 'common.TERMS.group', align: 'left' },
        { header: '직위', binding: 'userPosition', width: 100, keyPath: 'admin.ACCOUNT.position' },
        { header: '이메일', binding: 'userEmail', width: '*', keyPath: 'admin.ACCOUNT.email' },
        // { header: '휴대전화', binding: 'userPhone', width: '*' },
        { header: '관리 등급', binding: 'userPermLevelStr', width: 150, customHtml: true, keyPath: 'admin.ACCOUNT.manageGrade' },
        { header: '계정 상태', binding: 'userStatusStr', width: 100, customHtml: true, keyPath: 'admin.ACCOUNT.state' },
        { header: '로그인 잠금', binding: 'loginLock', width: 150, customHtml: true, keyPath: 'admin.ACCOUNT.loginLock' },
        { header: '최근 접속 이력', binding: 'latestLoginTime', width: 150, customHtml: true, dataType: 'Date', keyPath: 'admin.ACCOUNT.recent' }
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
.set-account-admin-list {
  .filter-search {
    position: absolute;
    bottom: 0;
    right: 0;
    // width: 500px;
    height: 30px;
    display: flex;
    align-items: center;

    .search-option {
      width: 200px;
    }

    .text-search {
      width: 210px;
      margin: 0 $gap;
      height: 32px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      top: 5px;
      right: -$gap;
      width: 15px;
      height: 15px;
      cursor: pointer;

      &::before,
      &::after {
        content: "";
        position: absolute;
      }
      &::before {
        width: 13px;
        height: 13px;
        top: 0;
        right: 0;
        border: 2px solid $input-placeholder;
        border-radius: 50%;
      }
      &::after {
        width: 2px;
        height: 6px;
        top: 13px;
        right: 0;
        transform: rotate(-45deg);
        background-color: $input-placeholder;
      }
    }
  }
}

.cmp-text {
  color: $primary;
  font-weight: 500;
}
</style>
<style lang="scss">
  .set-account-admin-list {
    &-table {margin-top: $gap;}
    .filter-button-area {
      display: flex;
      justify-content: flex-end;
      > button {margin-left: $gap-s;}
    }
  }
</style>
