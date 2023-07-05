<!--
  * 파일명 : SetAccountDetail.vue
  * 파일 기능 : 계정 관리 상세 + 상세 수정 기능
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 fix: 부서 추가 버튼 위치 개선
 -->

<template>
  <div class="set-account-detail">
    <!-- style="border:1px solid red;" -->
    <section
      v-if="loading || !isDataLoaded"
      style="height:500px;"
      v-loading="loading"
    />
    <section
      v-else
      class="edit-area"
      v-loading="loading"
    >
      <div
        v-if="isCmpUser"
        class="edit-info-list"
      >
        <register-contents
          type="input"
          :title="$t('common.REGCON.changePw')"
          v-if="isAdmin() && !otp"
        >
          <button
            type="is-primary"
            class="button -confirm"
            @click="otpModalActive = !otpModalActive"
          >
            {{ $t('common.BTN.authOtp') }}
          </button>
        </register-contents>
        <!-- /. OTP 인증 -->

        <register-contents
          type="input"
          :title="$t('common.REGCON.newPw')"
          required
          v-if="isAdmin() && otp"
        >
          <div class="flex-wrap">
            <el-input
              class="information-input"
              placeholder="새 비밀번호를 입력하세요."
              v-model="user.userPw"
              show-password
            />
            <span class="pw-info">{{ $t('common.PLACEHOLDER.pwValid') }} (&nbsp;&#33;&nbsp;&#35;&nbsp;&#36;&nbsp;&#37;&nbsp;&#38;&nbsp;&#42;&nbsp;&#63;&nbsp;&#64;&nbsp;) {{ $t('common.PLACEHOLDER.pwValidRight') }}</span>
          </div>
        </register-contents>
        <!-- /. 비밀번호 -->

        <register-contents
          type="input"
          :title="$t('common.REGCON.newRePw')"
          required
          v-if="isAdmin() && otp"
        >
          <el-input
            class="information-input"
            :placeholder="$t('common.PLACEHOLDER.enterNewRePw')"
            v-model="userPasswordRe"
            show-password
          />
        </register-contents>
      <!-- /. 비밀번호 확인 -->
      </div>
      <!-- /. OTP 인증, 비밀번호, 비밀번호 확인 (운영 관리자용) -->

      <div class="edit-info-list">
        <register-contents
          type="input"
          :title="$t('common.TERMS.rel')"
          required
        >
          <!-- v-if="companyList && companyList.length" -->
          <el-select
            class="information-input"
            v-model="user.userCompany"
            :popper-append-to-body="false"
            :placeholder="$t('admin.ACCOUNT.selectAff')"
            @change="userCompanyChange"
            :disabled="!isCmpUser"
          >
            <!-- :disabled="isSsg" -->
            <el-option
              v-for="item in companyList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </register-contents>
        <!-- /. 관계사 -->

        <register-contents
          type="input"
          :title="$t('common.TERMS.group')"
          required
        >
          <!-- v-if="userGroupList != null" -->
          <el-select
            class="information-input"
            v-model="user.userGroup"
            :placeholder="$t('common.PLACEHOLDER.selectOrg')"
            @change="checkUserGroupValid(user.userGroup)"
            :disabled="!isCmpUser"
          >
            <template v-for="item in userGroupList">
              <el-tooltip
                v-if="item.groupUpperName"
                :key="item.value"
                :content="item.groupUpperName"
                placement="left"
                effect="light"
              >
                <el-option
                  :label="item.label"
                  :value="item.value"
                />
              </el-tooltip>
              <el-option
                v-else
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </template>
          </el-select>
        </register-contents>
        <!-- /. 조직 -->

        <register-contents
          type="input"
          :title="$t('common.GRID.pressure')"
          required
        >
          <div class="input-form">
            <el-input
              :placeholder="$t('config.IP.enter', { name: $t('common.GRID.pressure') })"
              v-model="user.userId"
              disabled
            />
          </div>
        </register-contents>
        <!-- /. 사번 -->

        <register-contents
          type="input"
          :title="$t('common.MODAL.name')"
          required
        >
          <el-input
            class="information-input"
            v-model="user.userName"
            :disabled="isSsg"
          />
        </register-contents>
        <!-- /. 이름 -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.position')"
          required
        >
          <el-select
            class="information-input"
            v-model="user.userPosition"
            :popper-append-to-body="true"
            :placeholder="$t('common.BTN.select')"
            :disabled="isSsg"
          >
            <el-option
              v-for="item in positionList"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.email')"
        >
          <el-input
            class="information-input"
            :placeholder="$t('config.IP.enter', { name: $t('admin.ACCOUNT.email') })"
            :disabled="!isCmpUser"
            v-model="user.userEmail"
          />
        </register-contents>
        <!-- /. 이메일 -->

        <register-contents
          v-if="!isCmpUser"
          type="input"
        >
          <p class="data-empty">
            {{ $v('CMP에 등록이 필요한 계정 입니다.') }}
          </p>
        </register-contents>
        <!-- /. 직위 -->

        <!-- v-if="!isSsg || user.userEmail" -->

        <register-contents
          v-if="isCmpUser"
          type="input"
          :title="$t('admin.NOTI.phone')"
        >
          <el-input
            class="information-input -phone"
            :placeholder="$t('config.IP.enter', { name: $t('admin.NOTI.phone') })"
            v-model="user.userPhone"
            :maxlength="13"
          />
        </register-contents>
        <!-- /. 휴대전화 -->
        <!-- 휴대전화 시안에 없음 -->
      </div>
      <!-- /. 관계사, 조직, 사번, 이름, 직위, 이메일, 휴대전화 -->
      <div
        v-if="isCmpUser"
        class="edit-info-list"
      >
        <register-contents
          type="input"
          required
          :title="$t('admin.ACCOUNT.state')"
        >
          <el-select
            class="information-input"
            v-model="user._userStatus"
            :popper-append-to-body="true"
            :placeholder="$t('common.BTN.select')"
          >
            <el-option
              v-for="item in activeList"
              :key="item.field"
              :label="$t(item.keyPath) || item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- /. 계정 상태 -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.perm')"
          required
        >
          <!-- ⭐️ 디버깅 :: {{ user._tempUserPermLv }} -->
          <div class="input-form">
            <el-radio-group
              v-if="editUser.field === 'admin'"
              v-model="user._tempUserPermLv"
            >
              <el-radio
                v-for="perm in admPermLevels"
                :key="perm.value"
                :label="perm.value"
                style="margin-right: 20px;"
              >
                <!-- // 0 최고관리자, 1 운영관리자 -->
                {{ perm.label }}
              </el-radio>
            </el-radio-group>
            <!-- /. 🌙 운영 관리자계정 일 때 -->

            <el-radio-group
              v-else
              v-model="user._tempUserPermLv"
              :disabled="user.userPermLevel === 2"
              @change="setMultiUser"
            >
              <el-radio
                v-for="perm in userPermLevels"
                :key="perm.value"
                :label="perm.value"
                style="margin-right: 20px;"
                :disabled="perm.value === 2 || changedOrgOrAff"
              >
                <!-- 2 중간관리자, 3 빌링사용자, 4, 일반 사용자, 5 커스텀 사용자, 6 협력사 -->
                <!-- {{ perm.value }} :: -->
                {{ perm.label }}
              </el-radio>
            </el-radio-group>

            <!-- /. 🌞 사용자계정 일 때 -->
          </div>
        </register-contents>
        <!-- /. 권한 -->

        <register-contents
          type="input"
          :title="$t('admin.ROLE.role')"
          required
          v-if="isAdmin() && user._tempUserPermLv === 1"
        >
          <div class="input-form -role">
            <div>
              <div
                class="form-role"
                v-for="(role, index) in user.userPermRole"
                :key="index"
              >
                <el-select
                  class="information-input"
                  v-model="user.userPermRole[index]"
                  :placeholder="$t('admin.ACCOUNT.selectRole')"
                  @input="checkRoleValid"
                >
                  <el-option
                    v-for="item in roleList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <a
                  v-if="user.userPermRole.length > 1"
                  class="mdi mdi-minus -delete-button"
                  @click="deleteItem(index, user.userPermRole)"
                />
              </div>
            </div>
            <a
              v-if="user._tempUserPermLv === 1"
              class="mdi mdi-plus -add-button"
              @click="addItem('role')"
            />
          </div>
        </register-contents>
        <!-- /. 역할 :: 🌙 운영관리자용  -->
      </div>
      <!-- /. 계정 상태, 권한, 추가 부서, 역할 -->

      <div
        v-if="isCmpUser"
        class="edit-info-list"
      >
        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.photo')"
        >
          <div class="photo-form">
            <el-upload
              class="image-uploader"
              action=""
              accept="image/jpeg, image/png, image/jpg"
              :on-change="getFile"
              :on-remove="removeImage"
              :auto-upload="false"
              :multiple="false"
              :file-list="fileList"
            >
              <button
                class="button"
                style="margin-right: 5px;"
              >
                {{ $t('admin.ACCOUNT.upload') }}
              </button>
              <button
                v-if="user.userPhoto"
                class="button"
                type="is-primary"
                @click.stop="removePhotoImage"
              >
                {{ $t('admin.ACCOUNT.deletePhoto') }}
              </button>
              <div
                class="el-upload__tip"
                slot="tip"
              >
                {{ $t('admin.ACCOUNT.limitFileSize') }}
              </div>
            </el-upload>
            <div
              v-if="user.userPhoto"
              class="photo-view"
            >
              <img
                class="photo-image"
                :src="user.userPhoto"
                width="220px"
                height="auto"
                @click="removePhotoImage"
              >
            </div>
          </div>
        </register-contents>
        <!-- 사진 -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.applyDate')"
          v-if="changeAccountAuth(user)"
        >
          <el-input
            class="information-input"
            v-model="user._applyDate"
            disabled
          />
        </register-contents>
        <!-- /. 신청일 (상태) -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.loginLock')"
        >
          <el-checkbox v-model="user.loginLock" />
        </register-contents>
        <!-- /. 로그인 잠금 -->

        <register-contents
          v-if="!isAdmin()"
          type="input"
          :title="$v('빌링 담당자')"
        >
          <el-checkbox v-model="user.isBilling" />
        </register-contents>
        <!-- /. 빌링 밤당자 -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.regDate')"
        >
          <div class="flex-wrap">
            <el-input
              class="information-input"
              disabled
              v-model="user._createTime"
            />

            <a
              v-if="!isAdmin()"
              style="margin-left: 10px;"
              @click="openUserLogin(user.userId)"
            >
              <button
                class="button"
                type="is-primary"
                :disabled="user.userStatus !== 3"
              >
                {{ $t('common.BTN.userLogin') }}
              </button>
            </a>
          </div>
        </register-contents>
        <!-- /. 등록일(최근접속일) -->
      </div>
      <!-- /. 신청일(승인일), 로그인 잠금, 등록일 -->
    </section>

    <div class="big-button-area">
      <button
        class="button -cancel"
        @click="() => {
          loading = true
          $router.go(-1)
        }"
      >
        {{ $v('목록') }}
      </button>

      <button
        v-if="isCmpUser"
        class="button -confirm"
        type="is-primary"
        @click.stop="applySave"
      >
        {{ $v('저장') }}
      </button>
    </div>

    <otp-modal
      :active="otpModalActive"
      @close="otpModalActive = false"
      @validated-otp="validatedOTP"
    />
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import OTPModal from '@/components/Modal/OTPModal/OTPModal'
import { isEqual, cloneDeep, pick } from 'lodash'
import { mapState } from 'vuex'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import Dayjs from 'dayjs'
import { validatorUserId, validatorUserName } from '@/components/AccountMixins/AccountMixins'

export default {
  name: 'SetAccountDetail',
  components: {
    'otp-modal': OTPModal
  },
  async created () {
    // 신세계 (사번, 이름 가입) vs 이메일/연락처로 가입 확인
    const ssgEnv = process.env.VUE_APP_SSG_USER === 'true'
    if (ssgEnv) this.isSsg = ssgEnv
  },
  async mounted () {
    this.loading = true

    this.groupManageTree = await this.initGetGroupManageTree()
    await this.getGroupManageTree()

    // 🌞 사용자계정, 🌙 운영관리자 계정 공통
    // [관계사] 리스트 설정
    const list = await this.getGroups({ groupUpper: 0 })
    this.companyList = await this.labelSort(list)

    this.setEditUser()
    await this.getUserInfo()
    await this.getRoleList()
    this.setActiveList(this.user)

    this.settingFin = true
  },
  computed: {
    ...mapState({
      admin: state => state.auth.user // 현재 접속해있는 관리자
    }),
    isCmpUser () {
      return !!this.user.userIdx
    }
  },
  watch: {
    user: {
      deep: true,
      handler (newVal) {
        if (newVal.userPw?.length === 0) { delete newVal.userPw }
        this.isChange = !isEqual(this.rawUserData, newVal)

        if (newVal.userPermLevel === 3) {
          if (newVal.addPermGroup && !newVal.addPermGroup.length) {
            newVal.addPermGroup = []
          }
        }
      }
    },
    'user.userCompany': function (newVal, oldVal) {
      if (oldVal && oldVal.length !== 0) {
        this.resetUserAuthority()
      }
      this.getGroupEmailDomain(newVal)// 이메일 변경을 위한 이메일 도메인을 가져옵니다. console.log('@user.userCompany : ', val)
    },
    'user.userGroup': function (newVal, oldVal) {
      if (oldVal && oldVal.length !== 0) {
        this.resetUserAuthority()
      }
    },
    'user._tempUserPermLv' (value) {
      if (this.isAdmin() && value === 1) {
        if (!this.user.userPermRole || !this.user.userPermRole.length) {
          this.user.userPermRole = ['']
        }
      }
    }
  },
  methods: {
    removePhotoImage () {
      this.$confirm('사진을 삭제하시겠습니까?')
        .then(() => {
          this.user.userPhoto = undefined
        })
        .catch(() => false)
    },
    getBase64 (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        let imgResult = ''
        reader.readAsDataURL(file)
        reader.onload = () => {
          imgResult = reader.result
        }
        reader.onerror = (err) => {
          reject(err)
        }
        reader.onloadend = () => {
          resolve(imgResult)
        }
      })
    },
    getFile (file, fileList) {
      if (fileList.length > 1) this.fileList = fileList.slice(-1)

      if (file.size > (1024 * 1024 * 20)) { // 20Mb 이하 파일만 업로드 가능
        this.$alert(this.$t('common.ALERT.ACCOUNT.003'))
        this.removeImage()
      } else {
        this.getBase64(file.raw).then(res => {
          this.user.userPhoto = res
          this.toUrl(file.raw)
        }, rejected => {
          this.$alert(this.$t('common.ALERT.BASE.046'))
          console.error(rejected)
        })
      }
    },
    removeImage () {
      this.user.userPhoto = undefined
    },
    async getGroupEmailDomain (userCompanyIdx) {
      const registeredDomain = this.groupManageTree.find(company => company.groupIdx === userCompanyIdx)
      if (registeredDomain) this.groupEmailDomain = registeredDomain.companyDomain
      console.log('@ 사용 가능한 도메인', this.groupEmailDomain)
    },
    validatedOTP () {
      this.otpModalActive = false
      this.otp = true
    },
    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * url 에서 편집할 ID 및 정보 를 추출합니다
     */
    setEditUser () {
      const routeField = this.$route.path.split('/')[4]
      const routeId = this.$route.params.id
      this.editUser = {
        field: routeField,
        userId: routeId
      }
    },
    /**
     * user 권한을 확인하여 [계정 상태] 옵션을 설정합니다.
     * 빌링사용자(승인대기) 인경우 옵션 목록에 [승인 대기] 추가 + 자동으로 계정상태 [승인 대기] 선택
     * 그 외 사용자일경우는 옵션 목록에 [승인 대기] 삭제 + 기존 정보로 계정상태 변경
     */
    setActiveList (user) {
      // 현재 상태가 일반사용자(4) + 승인 대기 (UI 에서는 => 빌링사용자(3) + 승인대기 상태) 일 때
      if (user._tempUserPermLv === 3 && user.requestStatus === 0 && user.userStatus !== 0) {
        this.activeList.splice(1, 0, { field: 1, label: '승인대기', keyPath: 'admin.ACCOUNT.waitApproval' })
        user._userStatus = 1 // 계정상태 :: 승인대기로 표시
      } else {
        this.activeList = this.activeList.filter(status => status.field !== 1)
        user._userStatus = user.requestStatus === 0 && user.userStatus !== 0 ? 3 : user.userStatus // 계정상태 :: 기존의 정보로 유지
      }
    },
    /**
     * 관계사, 조직 변경시 권한 정보 초기화 및 disabled
     */
    resetUserAuthority () {
      if (this.changedOrgOrAff) return
      if (!this.isAdmin()) {
        this.user.userPermLevel = 4 // 일반 사용자로 변경
        this.user._tempUserPermLv = 4 // 일반 사용자로 변경
      }
      this.user.isMultiUser = false // 멀티 유저 해제
      this.changedOrgOrAff = true // 관계사, 조직 변경되었는가
      this.userGroupMapMultiList = [] // 멀티 사용자 추가 부서 비움
      this.userGroupMapCustomList = [] // 커스텀 사용자 추가 부서 비움
    },
    /**
     * User 정보 가져오기
     */
    async getUserInfo () {
      // if (this.editUser.field === 'new') return // 신규생성
      if (!this.editUser) return

      const { userId, field } = this.editUser
      const response = await API.iam.getUserInfo({ userId, isAdmin: field === 'admin' })

      if (response) {
        // 가져온 유저 정보의 [조직] 설정
        if (response[0]?.userCompany) this.userGroupList = await this.getGroups({ companyIdx: response[0].userCompany }) // 소속부서 그룹 리스트
        this.user.addPermGroup = []

        await this.setUserInfo(response[0])

        // Breadcrumbs 세팅
        this.$store.commit('common/ADD_PARAMETERS', { label: userId, path: '' })
      } else {
        this.$alert(this.$t('common.ALERT.ACCOUNT.024')) // 해당 계정 정보가 존재하지 않습니다.
        return this.$router.push({ name: 'set-account' })
      }
    },
    /**
     * 초기 유저 정보 세팅
     */
    async setUserInfo (user) {
      const formatDate = date => Dayjs(date).format('YYYY.MM.DD')
      const formatDateSec = date => Dayjs(date).format('YYYY.MM.DD HH:mm:ss')

      // 등록일(최근접속일)
      const createDate = formatDate(user.createTime)
      const lastLoginTime = user.latestLoginTime ? formatDateSec(user.latestLoginTime) : this.$t('common.ALERT.ACCOUNT.050') // 최근 접속 이력이 없습니다.
      user._createTime = `${createDate} (${lastLoginTime})`

      // 편집용 userPermLevel 데이터 :: _tempUserPermLv
      let _tempUserPermLv = user.userPermLevel
      const _userStatus = user.userStatus // 계정 상태 복사

      // 신청일(승인일) 데이터 세팅 => 승인 대기중인 빌링사용자 전용
      if (user.registerDate !== undefined) {
        // 승인대기중인 빌링사용자는 [일반사용자] 권한 => UI 에선 빌링사용자로 표기
        if (user.requestStatus !== undefined && user.requestStatus === 0) _tempUserPermLv = 3

        // 승인 상태
        const date = {
          0: this.$t('admin.ACCOUNT.waitApproval'), // 승인 대기
          1: formatDateSec(user.approvalDate), // 승인 완료
          2: `빌링 사용자 반려: ${formatDateSec(user.approvalDate)}`// 승인 반려
        }[user.requestStatus]

        const regDate = formatDate(user.registerDate) // 신청일
        user._applyDate = `${regDate} (${date})`
      }

      this.rawUserData = await cloneDeep(user)
      this.user = { ...user, _tempUserPermLv, _userStatus }

      console.log('@@', this.user)

      this.isDataLoaded = true
    },

    /**
     * 커스텀사용자, 멀티사용자의 경우 추가부서 설정
     */
    //  추가 부서 클릭 시 *** 삭제 예정 ***

    /**
   * [사용자 로그인] 기능
   */
    async openUserLogin (userId) {
      try {
        this.loading = true
        const userToken = await API.iam.getUserLoginToken(userId)

        if (userToken) {
          const configUrl = process.env.VUE_APP_USER_URL // 사용자 URL
          // return window.open(`https://web-usr-e.growthsoft.co.kr/login/admin-login//${userToken}`, '_blank')
          // console.log(`${configUrl}/login/admin-login/${userToken}`)
          // return window.open(`${'http://192.168.11.102:8083'}/login/admin-login/${userToken}`, '_blank')
          return window.open(`${configUrl}/login/admin-login/${userToken}`, '_blank')
        }
      } catch (error) {
        console.error('@@ openUserLogin : ', error)
      } finally {
        this.loading = false
      }
    },

    // ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️
    // ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️
    // ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️

    /**
     * 🌙 운영관리자 계정용
     * [역할] 추가
     */
    addItem (field) {
      if (field === 'role') {
        const newObj = ''
        this.user.userPermRole.push(newObj)
      } else if (field === 'group') {
        if (this.tempAddDepartData.companyIdx !== null && this.tempAddDepartData.groupIdx !== null) {
          this.loading = true
          setTimeout(() => {
            this.user.addPermGroup.unshift(this.tempAddDepartData)
            this.user.addPermGroup = cloneDeep(this.user.addPermGroup)
            this.tempAddDepartData = {
              companyIdx: null,
              companyName: null,
              groupIdx: null,
              groupName: null
            }
            this.loading = false
            console.log('@addItem', this.user.addPermGroup)
          }, 500)
        } else {
          this.$alert(this.$t('admin.ACCOUNT.selectAdditionalDepart'))
        }
      }
      this.$forceUpdate()
    },
    /**
     * 🌙 운영관리자 계정용
     * [역할] 삭제
     */
    deleteItem (deleteIdx, list, deleteDepart = false) {
      if (deleteDepart) {
        this.user.addPermGroup = list.filter(dep => dep.groupIdx !== deleteIdx)
      } else {
        list.splice(deleteIdx, 1)
      }
      this.$forceUpdate()
    },
    /**
     * 🌞 사용자계정, 🌙 운영관리자 계정 공용
     * [관계사] 변경시 발생하는 이벤트
     */
    async userCompanyChange (userCompany) {
      // 선택한 조직 초기화
      this.user.userGroup = null
      // 선택한 관계사 하위의 조직 리스트 설정
      this.userGroupList = await this.getGroups({ companyIdx: userCompany })

      // 사용자 계정일때만 동작
      if (!this.isAdmin()) {
        this.checkUserGroupValid()
      }
    },
    /**
     * 🌙 운영관리자 계정용
     * [역할] 리스트 호출
     */
    async getRoleList () {
      const roleApi = await API.iam.getRoleList()
      this.roleList = roleApi.filter(role => role.roleUpper !== 0).map(role => {
        return { label: role.roleName, value: role.roleIdx }
      })
    },
    /**
     * 🌙 운영관리자 계정용
     * [역할] 선택 변경시 동작
     */
    checkRoleValid () {
      if (this.user.userPermRole.length < 2) return
      const roleSet = new Set()
      for (const role in this.user.userPermRole) {
        if (!this.user.userPermRole[role]) continue
        if (roleSet.has(this.user.userPermRole[role])) {
          // this.$alert('중복된 역할을 선택했습니다.')
          return this.$alert(this.$t('common.ALERT.ROLE.007'), {
            callback: () => {
              this.user.userPermRole.splice(role, 1)
            }
          })
        }
        roleSet.add(this.user.userPermRole[role])
      }
    },
    /**
     * 🌞 사용자계정
     * [조직] 변경할 때 발생하는 이벤트
     */
    checkUserGroupValid (newVal) {
      // 중간관리자의 경우, 관계사/조직을 변경하면 일반사용자로만 변경됩니다.
      if (this.user.userPermLevel === 2) this.user._tempUserPermLv = 4
    },
    async applySave () {
      // ???
      if (this.user.userPermLevel === 3 && !isEqual(this.rawUserData.userPermGroup, this.user.userPermGroup)) {
        this.user.userStatus = 1
      }
      this.saveFunction()
    },
    async saveFunction () {
      if (!this.userValidation()) return

      this.$confirm(this.$t('common.CONFIRM.ACCOUNT.005'), {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const userPermGroup = []
        if (this.user.addPermGroup) {
          this.user.addPermGroup.forEach(e => {
            if (e.groupIdx) { userPermGroup.push(e.groupIdx) }
          })
        }

        // console.log(this.user)
        // debugger
        // 디버깅용!
        // this.user.userGroupMapMultiList = []
        // this.user.userGroupMapCustomList = []

        this.user.userPermGroup = userPermGroup
        this.user.userPermLevel = this.user._tempUserPermLv // [권한] 설정
        this.user.userStatus = this.user._userStatus // [계정상태] 설정

        // 빌링 사용자 신청 승인 대기 상태일 때 계정 상태를 활성화로 바꿔서 보냄
        if ((this.rawUserData.requestStatus === 0 && this.user.userStatus === 1)) this.user.userStatus = 3

        if (this.user.userPermLevel !== 3 || this.user.userPermGroup?.length === 0) {
          this.user.userPermGroup = []
        }
        if (this.user.userPermLevel !== 1 || this.user.userPermRole?.length === 0) {
          this.user.userPermRole = []
        }
        if (this.user.requestUserPermLevel === 3 && this.user.requestStatus === 0 && this.user.userPermLevel === 4) {
          this.user.userPermLevel = 4
        }

        const reqUser = pick(
          this.user,
          [
            'userIdx',
            'userId',
            'userName',
            'userPhoto',
            'userEmail',
            'userGroup',
            'userGroupName',
            'userGroupCode',
            'userCompany',
            'userCompanyName',
            'userCompanyCode',
            'userPosition',
            'userPhone',
            'userDuty',
            'userPermLevel',
            'userPermRole',
            'userPermGroup',
            'userPermRoleList',
            'userPermUpperRoleList',
            'userStatus',
            'loginLock',
            'isMultiUser',
            'userGroupMapMultiList',
            'userGroupMapCustomList',
            'userPw',
            'isBilling'
          ]
        ) // 다른 키 값과 같이 보내면 수정 안됩니다.'

        let isRejected = null

        if (this.rawUserData.requestStatus === 0) {
          if (this.user._userStatus === 3 && this.user._tempUserPermLv === 3) {
            // 빌링 사용자 승인 대기 상태인데, 활성화로 바꿈 (승인)
            isRejected = false
          } else if (this.user._tempUserPermLv === 4) {
            // 빌링 사용자 승인 대기 상태인데, 일반 사용자 - 활성화로 바꿈 (반려)
            isRejected = true
          }
        }

        if (isRejected !== null) reqUser.isRejected = isRejected

        if (!reqUser.userPhone) delete reqUser.userPhone
        if (!reqUser.userEmail) delete reqUser.userEmail
        if (!reqUser.userPw) delete reqUser.userPw

        if (this.isAdmin()) {
          delete reqUser.isMultiUser
          delete reqUser.userGroupMapMultiList
          delete reqUser.userGroupMapCustomList
        }

        if (reqUser.userPhone && !this.$validate.phoneNumber(reqUser.userPhone)) {
          return this.$alert(this.$t('common.ALERT.ACCOUNT.046'), { dangerouslyUseHTMLString: true })
        }

        // const headers = {
        //   userIdx: this.user.userIdx
        // } // local 테스트
        await API.iam.updateUser(reqUser).then(res => {
          this.$alert(this.$t('common.ALERT.ACCOUNT.039'), { // 정보 수정이 완료되었습니다.
            callback: () => {
              const name = this.isAdmin() ? 'set-account-admin' : 'set-account-user'
              return this.routeTo({ name })
            }
          })
        }).catch(err => {
          const code = err.response?.data?.code
          let message
          if (code === 'IAM019') message = this.$t('common.ALERT.ACCOUNT.036') // 이전에 설정한 비밀번호를 다시 사용할 수 없습니다
          else if (code === 'IAM205') message = this.$t('common.ALERT.ACCOUNT.047') // 이미 등록된 이메일입니다.
          else if (code === 'IAM211') message = this.$t('common.ALERT.ACCOUNT.048') // 동일한 휴대폰 번호(연락처)가 존재합니다.<br>확인 후 입력 바랍니다.
          else if (code === 'IAM615') message = this.$t('common.ALERT.ACCOUNT.049') // 소유 중인 프로젝트를 이관할 수 있는<br>중간관리자가 존재하지 않습니다.
          else message = this.$t('common.ALERT.LOGGING.005') // 수정에 실패하였습니다. 관리자 문의 부탁드립니다.
          this.$alert(message, { dangerouslyUseHTMLString: true })
        })
      }).catch(() => false)
    },
    /**
     * 🌞 사용자계정, 🌙 운영관리자 계정 공용
     * 값 validation 체크
     */
    userValidation (user = this.user) {
      const emailReg = this.$validate.emailRaw()
      // const phoneReg = /^\d{2,3}-\d{3,4}-\d{4}$/
      const pwReg = /(?=.*[A-Za-z])(?=.*\d)(?=.*[!#$%&*?@])[A-Za-z\d!#$%&*?@]{8,}$/

      const blankCondition = [
        user.userId && user.userId !== null,
        user.userName && user.userName !== null,
        user.userGroup && user.userGroup !== null,
        user.userPosition && user.userPosition !== null,
        // this.isSsg || (user.userPhone && user.userPhone !== null),
        user._tempUserPermLv !== undefined && user._tempUserPermLv !== null
      ]

      const hasEmailDomain = this.user.userEmail ? (this.groupEmailDomain && this.user.userEmail !== undefined && this.user.userEmail.includes(this.groupEmailDomain)) : true

      let conditions = [
        { condition: blankCondition.every(valid => valid), message: this.$v('필수값을 입력해주세요.') },
        { condition: validatorUserId(user.userId), message: this.$v('사번은 4자 이상,<br>50자 이하로 설정해주세요.') },
        { condition: validatorUserName(user.userName), message: this.$v('이름은 2자 이상,<br>50자 이하로 설정해주세요.') },
        { condition: user.userEmail ? (user.userEmail && emailReg.test(user.userEmail)) : true, message: this.$v('이메일을 확인해주세요.') },
        { condition: hasEmailDomain, message: this.groupEmailDomain !== null ? this.$v('이메일 도메인 정보가 다릅니다.') : this.$v('이메일 도메인이 설정되지 않은 관계사입니다.') }, // 도메인 미등록시 "이메일 도메인이 설정되지 않은 관계사입니다" 문구로 출력;
        // { condition: checkUserGroupMap(user), message: checkUserGroupMapMessage(user) }, // 추가 부서를 입력해주세요.
        { condition: (user._tempUserPermLv === 1 && this.isAdmin()) ? user.userPermRole.length > 0 : true, message: this.$v('역할을 선택해주세요.') },
        { condition: (user._tempUserPermLv === 1 && this.isAdmin()) ? user.userPermRole.every(Boolean) : true, message: this.$v('역할을 선택해주세요.') },
        { condition: user.userPhone ? (this.$validate.phoneNumber(user.userPhone)) : true, message: this.$v('휴대폰 번호를 확인해주세요.<br>010-1234-5678 형태로 입력되어야 합니다.') }
      ]

      // 비밀번호 변경시
      if (this.isAdmin() && this.otp) {
        conditions = [
          ...conditions,
          { condition: pwReg.test(user.userPw), message: this.$v('비밀번호를 확인해주세요. (영문자, 숫자, 특수문자 포함 8자 이상)') },
          { condition: user.userPw === this.userPasswordRe, message: this.$v('입력한 비밀번호가 서로 다릅니다.') }
        ]
      }

      const validation = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, { dangerouslyUseHTMLString: true })
        return cond.condition
      })

      if (!validation) return false

      return true
    },
    /**
     * 🌞 사용자계정 [추가부서]
     * 관계사 목록 호출
     */
    async getGroups (payload) {
      try {
        this.loading = true
        const response = await API.iam.getGroupList(payload)
        if (!response) return

        const groupList = response.map(group => {
          const { groupName, groupIdx, companyCode, companyIdx, groupUpperName } = group
          return {
            label: groupName,
            value: groupIdx,
            companyCode: companyCode || null,
            companyIdx: companyIdx || null,
            groupUpperName: groupUpperName || null
          }
        })

        return this.labelSort(groupList)
      } catch (error) {
        console.error('@@ getGroups : ', error)
      } finally {
        this.loading = false
      }
    },
    /**
     * 🌞 사용자계정
     * [멀티사용자] 체크했을 경우 동작
     */
    setMultiUser (value) {
      // [권한]을 확인하여 [계정 상태]를 세팅합니다
      this.setActiveList(this.user)
    },
    /**
     * [등록 email 확인]
     */
    async initGetGroupManageTree () {
      try {
        this.loading = true
        const response = await API.iam.getGroupManageTree({ project: true, user: false })
        if (response) {
          return response
        }
      } catch (error) {
        console.error('@ initGetGroupManageTree: ', error)
      } finally {
        this.loading = false
      }
    },
    /**
     * 🌞 사용자계정
     * [추가부서] 목록 설정
     */
    async getGroupManageTree () {
      this.loading = true
      const tree = await JSON.parse(JSON.stringify(this.groupManageTree))

      this.groupTreeData = tree

      this.user._userPermGroupList = []
      this.loading = false
    },
    /**
     * 🌞 사용자계정, 🌙 운영관리자 계정 공통
     * 해당 계정 사용자/관리자 인지 확인
     * true === 'admin', false === 'user'
     */
    isAdmin (editUser = this.editUser) {
      return editUser.field === 'admin'
    },
    /**
     * 🌞 사용자계정
     * 빌링사용자일 경우, [신청일(상태)] 노출 여부 결정
     */
    changeAccountAuth (user) {
      // 빌링사용자 신청 + 승인 : 빌링사용자로 표기(permLv 3)
      // 빌링사용자 신청 + 승인대기 : 빌링사용자로 표기(permLv 4)
      // 빌링사용자 신청 + 반려 : 일반사용자로 표기(permLv 4)

      // 다른 권한일 경우 모두 보이지 않음
      if (user.requestStatus === undefined) return false

      // 현재 선택한 권한이 [빌링사용자]면, 조건 비교, 다른 권한으로 변경시 false
      if (user._tempUserPermLv === 3 && (user.requestStatus === 0 || user.requestStatus === 1)) return true
      // 현재 선택한 권한이 [일반사용자]면, 조건 비교, 다른권한으로 변경시 false
      if (user._tempUserPermLv === 4 && user.requestStatus === 2) return true
      return false
    }
  },
  data () {
    return {
      isDataLoaded: false,
      fileList: [],
      changedOrgOrAff: false,
      groupEmailDomain: null,
      otpModalActive: false,
      otp: false,
      allGroups: null,
      userGroupList: null,
      disapproveModal: false,
      groupManageTree: [],
      groupTreeData: [],
      /// ///
      editUser: {
        userId: undefined,
        field: undefined
      },
      rawUserData: {},
      user: {
        userId: '',
        userPw: '',
        userName: '',
        userCompany: '',
        userGroup: '',
        userPosition: '',
        userEmail: '',
        userPhone: '',
        userPermLevel: 1,
        userPermRole: [],
        userPermGroup: [],
        userPhoto: '',
        userStatus: 0,
        loginLock: false,
        addPermGroup: [],
        isBilling: false
      },
      userPasswordRe: '',
      companyList: [],
      groupList: [],
      positionList: [
        { field: '차장', label: '차장' },
        { field: '팀장', label: '팀장' },
        { field: '부장', label: '부장' },
        { field: '과장', label: '과장' },
        { field: '대리', label: '대리' },
        { field: '주임', label: '주임' },
        { field: '사원', label: '사원' }
      ],
      activeList: [
        { field: 3, label: '활성화', keyPath: 'admin.ACCOUNT.actived' },
        // { field: 1, label: '승인대기', keyPath: 'admin.ACCOUNT.waitApproval' }, // 빌링사용자
        { field: 0, label: '비활성화', keyPath: 'admin.ACCOUNT.inactived' }
        // { field: 4, label: '퇴사', keyPath: 'admin.ACCOUNT.resigned' }
      ],
      // 3 빌링사용자, 4, 일반 사용자, 5 커스텀 사용자, 6 협력사
      userPermLevels: [
        { label: this.$t('admin.ACCOUNT.generalUser'), value: 4 }, // 일반사용자
        // { label: this.$t('admin.ACCOUNT.billingUser'), value: 3 }, // 빌링사용자
        // { label: this.$t('admin.ACCOUNT.customUser'), value: 5 }, // 커스텀 사용자
        { label: this.$t('admin.ACCOUNT.middleManager'), value: 2 } // 중간관리자
      ],
      // 0 최고관리자, 1 운영관리자
      admPermLevels: [
        { label: this.$t('admin.ACCOUNT.managerSimple'), value: 1 }, // 운영관리자
        { label: this.$t('admin.ACCOUNT.topManagerSimple'), value: 0 } // 최고관리자
        // 0 최고관리자, 1 운영관리자
      ],
      loginLockList: [
        { field: true, label: 'Y' },
        { field: false, label: 'N' }
      ],
      roleList: [],
      isSsg: false,
      isChange: false,
      loading: false,
      settingFin: false,
      tempAddDepartData: {
        companyIdx: null,
        companyName: null,
        groupIdx: null,
        groupName: null
      },
      labelSort (data) { // 순서 정리
        return data.sort((a, b) => {
          if (a.label > b.label) return 1
          else if (a.label < b.label) return -1
          else return 0
        })
      }
    }
  }
}
</script>

<style lang="scss">
.set-account-detail {
  > .edit-area {
    .edit-info-list {
      margin-top: -1px;
      border-bottom: 1px solid $dark-slate;
      .information-input {
        width: 500px;
      }
      & + .info-item {
        margin-top: $gap;
      }
      .input-form {
        display: flex;
        position: relative;
        width: 500px;
        > .el-radio-group {
          display: flex;
          align-items: center;
        }
        &.-role {
          &.admin {
            width: 435px;
          }
          flex-direction: column;
          .form-role {
            display: flex;
            align-items: center;
            width: 100%;
            & + .form-role {
              margin-top: $gap-s;
            }
            & > .el-input {
              &:first-of-type {
                margin-right: 5px;
              }
            }
          }
          .-add-button {
            position: absolute;
            bottom: 1px;
            right: -$gap-m;
            color: $primary;
          }
          .-delete-button {
            margin-left: $gap-s;
            color: $primary;
          }
        }
        &.display-input-form {
          box-sizing: border-box;
          background-color: #171a1d;
          padding: 10px 10px 0 10px;
          border: 1px solid #171a1d;
          height: auto;
          min-height: 54px;
          max-height: 250px;
          &.no-data {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #606266;
          }
        }
        &.add-input-form {
          margin-bottom: 10px;
          .form-role {
            .el-select {
              &:first-of-type {
                margin-right: 5px;
              }
            }
            .-add-depart-button {
              margin-left: $gap-s;
              color: $primary;
            }
          }
        }
      }
      .flex-wrap {
        display: flex;
        align-items: center;
        .pw-info {
          margin-left: $gap-s;
          font-size: 1em;
          color: #c0c4cc;
        }
      }
    }
    .-search-id-button {
      width: 120px;
      margin-left: 5px;
    }
  }

  .photo-form {
    display: inline-block;

    .photo-view {
      display: inline-block;
      margin-top: $gap;

      .photo-image {
        cursor: pointer;
      }
    }
  }
}

.data-empty {
  width:500px;
  text-align:center;
  font-size:14px;
  font-weight:500;
  color:#c0c4cc;
  padding: 50px 0px;
}

</style>
