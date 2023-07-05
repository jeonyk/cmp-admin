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
      <!--
      <total-count
        :total-count="totalResultCnt"
      /> -->
    </section>

    <section class="table-top-wrap">
      <total-count :total-count=" totalCount" />
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="
            () => {
              this.isViewModal = true
            }
          "
        >
          <!-- @click="routeTo({
            name: 'set-account-create',
            params: { detailField: 'admin' }
          })" -->
          {{ $t("common.BTN.ADMIN.regAcc") }}
        </button>
      </div>
    </section>

    <!-- <total-count
      :total-count="userListData.length"
      style="padding-bottom: 0;"
    /> -->

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
        :total-page-size="totalCount"
        :server-side-now-page="currPage"
        server-side-paging
        @changingPage="onChangePage"
      >
        <template #_userId="{ row }">
          <cmp-status-tag
            v-if="row.userIdx"
            type="mp"
            contents="CMP"
          />&nbsp;{{
            row._userId
          }}
        </template>
        <template #latestLoginTime="props">
          {{ props.row.latestLoginTime | date }}
        </template>
        <template #userStatusStr="props">
          <span
            :class="styleSet(props.row)"
            style="background-color: transparent"
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

    <!-- *** modal-section *** -->
    <el-dialog
      :title="$v('계정 등록')"
      :visible.sync="isViewModal"
      width="480px"
      class="create-user-modal"
      @close="closeCreateUserModal"
    >
      <ul
        v-loading="modalLoading"
        class="create-user-list"
      >
        <li
          v-for="(user, key) in newUser"
          :key="key"
          class="create-user-item"
        >
          <div>
            <span
              class="__label"
              :class="{ '--required': user.required === undefined }"
            >
              {{ `${user.title}` }}
            </span>
          </div>
          <!-- <el-select
            v-if="key === 'company'"
            class="__select"
            :popper-append-to-body="false"
            v-model="user.value"
            :placeholder="$v('조직 선택')"
          >
            <template v-for="item in user.options">
              <el-tooltip
                :key="item.value"
                placement="left"
                effect="light"
                :content="item.groupUpperName"
              >
                <el-option
                  :label="item.label"
                  :value="item.value"
                />
              </el-tooltip>
            </template>
          </el-select> -->

          <!-- <el-select
            v-if="key === 'company'"
            class="__select"
            :popper-append-to-body="false"
            v-model="user.value"
            :placeholder="$v('관계사 선택')"
          >
            <el-option
              v-for="company in relationList"
              :key="company.groupName + 'company'"
              :label="company.groupName"
              :value="company.groupIdx"
            />
          </el-select>
          <el-select
            v-else-if="key === 'group' && testList"
            :popper-append-to-body="false"
            class="__select"
            v-model="user.value"
            :placeholder="$v('조직 선택')"
          >
            <template>
              <el-tooltip
                v-for="company in testList"
                :key="company.value"
                placement="left"
                effect="light"
                :content="company.groupUpperName"
              >
                <el-option
                  :key="company.groupName + 'company'"
                  :label="company.groupName"
                  :value="company.groupIdx"
                />
              </el-tooltip>
            </template>
          </el-select> -->

          <!-- 관계사 선택 option 검색 컴포넌트 추가 -->
          <select-group-dropdown
            v-if="key === 'company'"
            ref="companyDropdown"
            class="__select"
            trigger-mode="click"
            placement="bottom"
            :popper-offset="0"
            @select-item="selectGroup(...arguments, 'GROUP')"
            :data-source="relationList"
            :placeholder-prefix="$v('관계사 선택')"
          />
          <!-- 조직 선택 option 검색 컴포넌트 추가 -->
          <select-group-dropdown
            v-else-if="key === 'group' && testList"
            ref="orgDropdown"
            class="__select"
            trigger-mode="click"
            placement="bottom"
            :popper-offset="0"
            @select-item="selectOrg(...arguments, 'ORG')"
            :data-source="testList"
            :placeholder-prefix="$v('조직')"
          />

          <template v-else>
            <!-- :style="key === 'company' && 'border:2px solid red;'" -->
            <el-input
              class="__input"
              :placeholder="
                $v('{name}을(를) 입력하세요.', { name: user.title })
              "
              v-model="user.value"
              :disabled="key === 'company'"
              @input="debounceCheck(...arguments, key)"
            />
            <!-- @blur="blurInput(key)" -->
          </template>
          <p v-if="['employeeNum', 'email'].includes(key)" />
          <template
            v-if="key === 'employeeNum' && employeeNumValidationMsg !== ''"
          >
            <p class="validation-msg">
              {{ employeeNumValidationMsg }}
            </p>
          </template>
          <template v-if="key === 'email' && emailValidationMsg !== ''">
            <p class="validation-msg">
              {{ emailValidationMsg }}
            </p>
          </template>
        </li>
      </ul>
      <div class="modal-button-area">
        <button
          class="button _cancel"
          @click.stop="isViewModal = false"
          :disabled="isLoadingCreateUser"
        >
          {{ $v("취소") }}
        </button>
        <button
          class="button _confirm"
          type="is-primary"
          @click.stop="createUser"
          :disabled="!canClick || isLoadingCreateUser"
          v-loading="isLoadingCreateUser"
        >
          {{ $t("확인") }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { debounce } from 'lodash'
// import { validatorUserId } from '@/components/AccountMixins/AccountMixins'
import { validatorUserId, validatorUserName } from '@/components/AccountMixins/AccountMixins'
export default {
  name: 'SetAccountUserList',
  components: {
  },
  computed: {
    canClick () {
      return (
        this.newUser.group.value &&
        this.newUser.employeeNum.value &&
        this.newUser.name.value &&
        this.newUser.position.value &&
        (this.newUser.email.value ? (this.newUser.email.value && this.emailChecked) : true) &&
        this.employeeNumChecked
      )
    }
  },
  watch: {
    async 'filterObj.relationCorp' (newVal) {
      if (newVal !== undefined) {
        const groupList = await this.getGroupList({ companyIdx: newVal }) // 조직 목록 세팅
        this.groupOptions = groupList
        this.filteringOptions[1].selections = [
          { label: this.$t('main.DASHBOARD.all'), value: undefined },
          ...groupList]
      } else {
        this.filteringOptions[1].selections = [
          { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
        ]
      }
    },
    'newUser.company': {
      deep: true,
      handler (newVal) {
        this.newUser.group.value = '' // 관계사 변경 시 조직 초기화
        this.newUser.email.value = '' // 메일 비교를 위해 초기화
        this.getGroupList({ companyIdx: newVal.value }, 'GROUP') // 조직 목록 세팅
        this.setDomain(newVal)
        this.selectedCompanyIdx = newVal.value
      }
    }
  },
  async mounted () {
    this.setCompanyOption()
  },
  methods: {
    async onChangePage (page) {
      this.currPage = page
      await this.getUserList()
    },
    async adGroupTestApi (payload) {
      const response = await API.iam.getGroupList(payload)
      if (!response) return
      const groupList = response.map((group) => {
        return {
          ...group,
          label: group.groupName,
          value: group.groupIdx,
          companyCode: group.companyCode ? group.companyCode : null
        }
      })
      this.testList = groupList
      this.newUser.group.options = groupList
      return groupList
    },
    /**
     * 관계사 (company) 필터 옵션 설정
     */
    async setCompanyOption () {
      this.loading = true
      await this.getUserList()

      const companyOptions = await this.getGroupList({ groupUpper: 0 }) // 관계사 목록 세팅
      this.relationList = companyOptions.filter(c => c.companyCode !== 'common') // ad계정 등록 시 관계사 출력 리스트
      this.filteringOptions[0].selections = [
        { label: this.$t('main.DASHBOARD.all'), value: undefined },
        ...companyOptions.filter((company) => company.companyCode !== 'common')
      ]

      this.loading = false
    },
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
      param = Object.assign(param._data, {
        detailField: 'ad',
        id: param._data.userId
      })
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
      const parmas = {
        nowPage: this.currPage,
        perPage: this.perPage,
        ...(this.companyCode && { companyCode: this.companyCode }),
        ...(this.groupCode && { groupCode: this.groupCode }),
        ...(this.userKeyword && { userKeyword: this.userKeyword })
      }
      const { userList, totalCount } = await API.iam.getUserMergedList(parmas)
      const options = (id) => this.$options.filters.maskingName(id)
      this.totalCount = totalCount
      const userGroups = []
      const mappedLoginTime = []
      this.userRawData = userList
      this.userRawData = this.userRawData.map((user) => {
        user._userId = options(user.userId)
        if (user.userStatus === 0) {
          // 비활성화 상태
          user.userStatusStr = this.accountStatus[0]
        } else if (user.requestStatus === 0 && user.userPermLevel === 4) {
          user.userStatusStr = this.accountStatus[1]
        } else {
          user.userStatusStr = this.accountStatus[user.userStatus] || '-'
        }
        // user.userStatusStr = user.requestStatus === 0 ? this.accountStatus[1] : this.accountStatus[user.userStatus] // 상태
        user.userPermLevelStr = this.permLevel[user.userPermLevel] // 권한 (한글)
        user.userGroupStr = user.userGroupName
        user.userCompanyStr = user.userCompanyName
        user.userCompanyIdx = user.userCompany
        user.createTime = !user.createTime
          ? '-'
          : Dayjs(user.createTime).format('YYYY.MM.DD') || '-'

        // 멀티사용자일 경우, ui 에서는 멀티사용자로 표시함
        if (user.isMultiUser) {
          user.userPermLevelStr =
            user.userPermLevel !== 2
              ? this.$t('admin.ACCOUNT.multiUser')
              : user.userPermLevelStr
          user.userPermLevel =
            user.userPermLevel !== 2 ? 7 : user.userPermLevel
        }

        userGroups.push(user.userGroup)
        mappedLoginTime.push({
          value: user.latestLoginTime,
          caption: this.$options.filters.date(user.latestLoginTime)
        })
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
    async getGroupList (payload, type) {
      const response = await API.iam.getGroupList(payload)
      if (!response) return
      const groupList = response.map((group) => {
        return {
          ...group,
          label: group.groupName,
          value: group.groupIdx,
          companyCode: group.companyCode ? group.companyCode : null
        }
      })

      if (type === 'GROUP') {
        this.testList = groupList
        this.newUser.group.options = groupList
      }

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
        group: undefined
      }
      this.searchText = undefined
      this.searchOpt = 'userName'
      this.searchData()
    },
    /**
     * 조회 버튼 클릭시 실행하는 검색 메소드
     * 1. 각 조건별 필터
     */
    searchData: debounce(async function (e) {
      this.userKeyword = e
      this.currPage = 1
      await this.getUserList()
    }, 500),
    /**
     * 필터링 시, 발생 이벤트 입니다.
     * @param {Object} filtering 필터링 전체 선택된 valye
     */
    changeFilter (filtering) {
      for (const key in filtering) {
        this.filterObj[key] = filtering[key]
      }
      if (!this.filterObj.relationCorp) {
        this.companyCode = ''
      } else {
        const matchedCompany = this.relationList.find(g => g.value === filtering.relationCorp)
        this.companyCode = matchedCompany?.companyCode
      }

      if (!this.filterObj.group) {
        this.groupCode = ''
      } else {
        const matchedGroup = this.groupOptions.find(g => g.value === filtering.group)
        this.groupCode = matchedGroup?.groupCode
      }
      this.getUserList()
    },
    changeSearchCondition (test) {
      this.searchText = undefined
      this.searchData()
    },
    /**
     * 관계사, 조직 선택 시 실행
     */
    selectGroup (param, mode) {
      this.getGroupList({ companyIdx: param.value }, mode) // 조직 목록 세팅
      this.resetSelectedOrg()
    },
    selectOrg (param, mode) {
      this.newUser.group.value = param.groupIdx
    },
    /**
     * 관계사 선택 시 조직 초기화
     */
    resetSelectedOrg () {
      this.$refs.orgDropdown[0].init()
      this.newUser.group.value = null
    },
    /**
     * AD 계정 등록 실행
     */
    async createUser () {
      const {
        companyCode,
        label: groupName,
        groupCode
      } = this.newUser.group.options.find(group => group.value === this.newUser.group.value)

      const userName = this.newUser.name.value
      const checkNameValid = validatorUserName(userName)
      if (!checkNameValid) return this.$alert(this.$v('이름은 2자 이상,<br>50자 이하로 설정해주세요.'), { dangerouslyUseHTMLString: true })

      const reqObj = {
        companyCode,
        groupCode, // 조직
        groupName,
        userId: this.newUser.employeeNum.value, // 사번
        userName: this.newUser.name.value, // 이름
        userPosition: this.newUser.position.value, // 직위
        userEmail: this.newUser.email.value // 이메일
      }

      if (!reqObj.userEmail) delete reqObj.userEmail

      try {
        this.isLoadingCreateUser = true
        await API.iam.createADUser(reqObj)
        // if (reqObj.userPermLevel === 4) {
        this.$alert(this.$v('가입이 완료되었습니다.'))
        this.isViewModal = false
        this.setCompanyOption()
        // }
      } catch (error) {
        //
        console.log('#사용자 생성 에러')
        console.log(error)
        console.log(error.response)
        const errorCode = error?.response?.data?.code
        if (errorCode && errorCode === 'IAM205') {
          return this.$alert(this.$v('동일한 이메일이 존재합니다.'))
        } else if (errorCode && errorCode === 'IAM208') {
          // return this.$alert(this.$t('USER.JOIN.ALERT.024'))
          return this.$alert(this.$v('이미 등록된 사번(AD 계정)입니다.'))
        }
        this.$alert(this.$t('USER.JOIN.ALERT.006'))
      } finally {
        this.isLoadingCreateUser = false
      }
    },
    /**
     * 계정등록 validation
     */
    debounceCheck (arg, key) {
      if (key === 'employeeNum') {
        this.employeeNumValidationMsg = ''
        this.employeeNumChecked = false
        if (this.checkEmployeeNumTimer) clearTimeout(this.checkEmployeeNumTimer)
        this.checkEmployeeNumTimer = setTimeout(async () => {
          // 사번 체크
          await this.findId()
        }, 500)
      }
      if (key === 'email') {
        this.emailValidationMsg = ''
        this.emailChecked = false
        if (this.checkEmailTimer) clearTimeout(this.checkEmailTimer)
        this.checkEmailTimer = setTimeout(async () => {
          // 이메일 체크
          await this.checkEmail()
          setTimeout(() => {
            this.newUser.employeeNum.value = this.newUser.employeeNum.value + ' '
            this.newUser.employeeNum.value = this.newUser.employeeNum.value.trim()
          }, 0)
        }, 500)
      }
    },
    validateUserEmail (email) {
      if (!email) {
        // this.emailValidationMsg = this.$t('PUBLIC.INQUIRY.PLACEHOLDER.001')
        return false
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        this.emailValidationMsg = this.$v('이메일 형식이 맞지 않습니다.')
        return false
      }
      if (this.companyDomain !== '') {
        const enterDomain = '@' + this.newUser.email.value.split('@')[1]
        if (enterDomain !== this.companyDomain) {
          this.emailValidationMsg = this.$v('도메인이 틀렸습니다. 확인 후 입력 바랍니다.')
          return false
        }
      }
      return true
    },
    /**
     * 도메일 정보 가져오기
     */
    async setDomain (company) {
      const group = await API.iam.getAuthGroups({
        groupIdx: company.value
      })
      this.companyDomain = group[0]?.companyDomain
    },
    async checkEmail () {
      if (!this.validateUserEmail(this.newUser.email.value)) return
      this.modalLoading = true
      try {
        const res = await API.iam.checkExistEmail({ email: this.newUser.email.value, groupIdx: this.selectedCompanyIdx })
        if (res) {
          this.emailChecked = true
          this.modalLoading = false
        }
      } catch (error) {
        this.modalLoading = false
        if (error.code === 'IAM205') {
          // 동일한 이메일이 존재합니다.
          this.emailValidationMsg = this.$v('동일한 이메일이 존재합니다.')
        } else {
        // 이메일을 확인해주세요
          this.emailValidationMsg = this.$v('이메일을 확인해주세요')
        }
      }
    },
    async findId () {
      this.newUser.employeeNum.value = this.newUser.employeeNum.value.replace(/\s/g, '')
      const validated = this.validateId(this.newUser.employeeNum.value)
      if (!validated) return

      this.modalLoading = true
      try {
        const findUser = await API.iam.findId({
          isAdmin: false,
          userId: this.newUser.employeeNum.value
        })
        if (findUser) {
          // 유저 정보가 있으면(AD) 무조건 '이미 등록된 사용자 처리'
          // 이미 등록된 사용자입니다.
          this.employeeNumValidationMsg = this.$v('이미 등록된 사용자입니다.')
          return false
        } else {
          // 유저 정보가 없음 - AD를 등록해주는데, 유저 정보가 없다는 에러 메세지가 필요한가?
          // 사용자가 없습니다.
          // this.employeeNumValidationMsg = this.$t('USER.JOIN.ALERT.009')
          // return false
          this.employeeNumChecked = true
        }
      } catch (error) {
        console.log(error)
        // 사용자가 없습니다.
        this.employeeNumValidationMsg = this.$v('사용자가 없습니다.')
        return false
      } finally {
        this.modalLoading = false
      }
    },
    /**
     * 사번 검증
     */
    validateId (empNum) {
      if (!empNum) {
        // 빈칸을 입력해주세요
        this.employeeNumValidationMsg = this.$v('빈칸을 입력해주세요.')
        return false
      }
      if (!validatorUserId(empNum)) {
        this.employeeNumValidationMsg = this.$v('사번은 4자 이상, 50자 이하로 설정해주세요.')
        return false
      }
      return true
    },
    closeCreateUserModal () {
      this.newUser.group.value = null
      this.newUser.employeeNum.value = null
      this.newUser.name.value = null
      this.newUser.position.value = null
      this.newUser.email.value = null
      this.employeeNumValidationMsg = ''
      this.employeeNumChecked = false
      this.emailValidationMsg = ''
      this.emailChecked = false
      this.isViewModal = false
      this.$refs.orgDropdown[0].init() // 관계사 선택 input 초기화
      this.$refs.companyDropdown[0].init() // 조직 선택 input 초기화
    }
  },
  data () {
    return {
      checkEmployeeNumTimer: null,
      groupOptions: [],
      companyOptions: [],
      companyCode: '',
      userKeyword: '',
      perPage: 10,
      currPage: 1,
      totalCount: 0,
      employeeNumChecked: false,
      checkEmailTimer: undefined,
      companyDomain: undefined,
      selectedCompanyIdx: undefined,
      testList: [],
      user: {},
      groups: [],
      rawRelations: [],
      relationList: [],
      modalLoading: false,
      employeeNumValidationMsg: '',
      emailValidationMsg: '',
      isLoadingCreateUser: false,
      newUser: {
        // 계정 등록 시 데이터
        company: {
          title: this.$v('관계사'),
          value: null
        },
        group: {
          title: this.$v('조직'),
          value: null,
          options: []
        },
        employeeNum: {
          title: this.$v('사번'),
          value: null
        },
        name: {
          title: this.$v('이름'),
          value: null
        },
        position: {
          title: this.$v('직위'),
          value: null
        },
        email: {
          title: this.$v('이메일'),
          value: null,
          required: false
        }
      },
      isViewModal: false,
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
          placeholder: `${this.$t('common.TERMS.rel')} ${this.$t(
            'common.BTN.select'
          )}`,
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
          placeholder: `${this.$t('common.TERMS.group')} ${this.$t(
            'common.BTN.select'
          )}`,
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: undefined } // 전체
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
      accountStatus: [
        this.$t('admin.ACCOUNT.inactived'), // 비활성화
        this.$t('admin.ACCOUNT.waitApproval'), // 승인 대기
        this.$t('admin.ACCOUNT.rejectApproval'), // 승인 반려
        this.$t('admin.ACCOUNT.actived'), // 활성화
        this.$t('admin.ACCOUNT.resigned') // 퇴사
      ],
      styleSet (user) {
        let status = 0

        if (user.userStatus === 0) status = 0
        else if (user.requestStatus === 0 && user.userPermLevel === 4) { status = 1 } else status = user.userStatus

        return {
          0: 'is-fail', // 비활성화
          1: 'is-wait', // 승인 대기
          2: 'is-reject', // 승인 반려
          3: 'is-active', // 활성화
          4: 'is-quit' // 퇴사
        }[status]
      },
      // 테이블 데이터
      columns: [
        {
          header: '사번',
          binding: '_userId',
          width: 150,
          format: 'd*',
          align: 'left',
          keyPath: 'common.GRID.pressure',
          customHtml: true
        },
        {
          header: '이름',
          binding: 'userName',
          width: 150,
          align: 'left',
          keyPath: 'common.REGCON.name'
        },
        {
          header: '관계사',
          binding: 'userCompanyStr',
          width: 200,
          align: 'left',
          keyPath: 'common.TERMS.rel'
        },
        {
          header: '조직',
          binding: 'userGroupName',
          width: 200,
          align: 'left',
          keyPath: 'common.TERMS.group'
        },
        // { header: '부서', binding: 'userGroupStr',  width: '*', keyPath: 'task.PRIOR.GRID.depart' },
        {
          header: '직위',
          binding: 'userPosition',
          width: 100,
          keyPath: 'admin.ACCOUNT.position'
        },
        {
          header: '이메일',
          binding: 'userEmail',
          width: '*',
          keyPath: 'admin.ACCOUNT.email'
        },
        // { header: '휴대전화', binding: 'userPhone', width: '*' },
        {
          header: '로그인 잠금',
          binding: 'loginLock',
          width: 150,
          customHtml: true,
          keyPath: 'admin.ACCOUNT.loginLock'
        },
        // { header: '최근 접속 이력', binding: 'latestLoginTime', width: 150, customHtml: true, dataType: 'Date', keyPath: 'admin.ACCOUNT.recent' }
        {
          header: '등록일',
          binding: 'createTime',
          width: 150,
          customHtml: true,
          keyPath: 'common.REGCON.regDate'
        }
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
        department: undefined
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
.set-account-user-list {
  .filtering-component {
    .filter-wrapper {
      .el-input {
        .el-input__inner {
          border-bottom: 1px solid $purple-gray;
        }
      }
      .filtering-list {
        &:first-of-type {
          .filter-options {
            width: 200px;
            .el-select {
              min-width: 200px;
            }
          }
        }
        .filter-options {
          width: 140px;
          .el-select {
            min-width: 140px;
          }
        }
        .el-select-dropdown__list {
          width:auto;
        }
      }
    }
  }

  .is-fail {
    color: #666666;
  }
  .is-wait {
    color: $main-red;
  }
  // .is-reject { color: $main-red }
  .is-active {
    color: $primary;
  }
  .is-quit {
    color: #666666;
  }

  .el-checkbox.is-disabled {
    .el-checkbox__input.is-checked {
      .el-checkbox__inner {
        background-color: $white;
        opacity: 1;
      }
    }
  }
}

.create-user-modal {
  .create-user-list {
    .create-user-item {
      display: grid;
      grid-template-columns: auto 316px;
      grid-template-rows: auto auto;
      align-items: center;
      margin-bottom: 14px;
      .__select,
      .__input {
        width: 100%;
        &.ti-dropdown{
          .dropdown__button{
            width: 316px;
          }
          .ti-dropdown-item{
            width: 316px;
          }
        }
      }
      .__label.--required {
        position: relative;
        &::before {
          position: absolute;
          top: 0px;
          left: calc(100% + 5px);
          content: "*";
          font-size: 15px;
          color: $main-red;
        }
      }
      .validation-msg {
        font-size: 12px;
        color: #d95252;
        margin-top: 5px;
      }
    }
  }
  .modal-button-area {
    .button {
      height: 38px;
    }
  }
}
</style>
