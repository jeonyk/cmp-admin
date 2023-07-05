<!--
  * 파일명 : SetAccountCreate.vue
  * 파일 기능 : admin 계정 생성 기능
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 Update: 배부모델 전체 버그 수정 완료 및 코드 정리
 -->

<template>
  <div class="set-account-create">
    <section class="edit-area">
      <div class="edit-info-list">
        <register-contents
          type="input"
          :title="$t('common.GRID.pressure')"
          required
        >
          <div class="input-form">
            <el-input
              class="information-input"
              :placeholder="$t('config.IP.enter', { name: $t('common.GRID.pressure') })"
              v-model="user.userId"
              @keypress.enter.native="checkUserId"
              :disabled="isFindId"
            />
            <button
              class="button -search-id-button"
              type="is-primary"
              @click.stop="checkUserId"
              :disabled="isFindId"
              :style="{ width: $i18n.locale === 'en' && 'auto' }"
            >
              {{ $t('common.BTN.ADMIN.findNumber') }}
            </button>
            <button
              class="button -search-id-button"
              type="is-primary"
              v-if="isFindId"
              @click.stop="initUser"
            >
              {{ $t('common.BTN.reset') }}
            </button>
          </div>
        </register-contents>
        <!-- 사번 -->

        <register-contents
          type="input"
          :title="$t('common.REGCON.pw')"
          required
        >
          <div class="flex-wrap">
            <el-input
              class="information-input"
              :placeholder="$t('common.PLACEHOLDER.enterPw')"
              v-model="user.userPw"
              show-password
              :disabled="!isFindId"
              @input="koreanTest"
            />
            <span class="pw-info">{{ $t('common.PLACEHOLDER.pwValid') }} (&nbsp;&#33;&nbsp;&#35;&nbsp;&#36;&nbsp;&#37;&nbsp;&#38;&nbsp;&#42;&nbsp;&#63;&nbsp;&#64;&nbsp;) {{ $t('common.PLACEHOLDER.pwValidRight') }}</span>
          </div>
        </register-contents>
        <!-- 비밀번호 -->

        <register-contents
          type="input"
          :title="$t('common.REGCON.conPw')"
          required
        >
          <el-input
            class="information-input"
            :placeholder="$t('common.PLACEHOLDER.rePw')"
            v-model="userPasswordRe"
            show-password
            :disabled="!isFindId"
            @input="koreanTest"
          />
        </register-contents>
      <!-- 비밀번호 확인 -->
      </div>

      <div class="edit-info-list">
        <register-contents
          type="input"
          :title="$t('common.TERMS.rel')"
          required
        >
          <template>
            <el-select
              class="information-input"
              v-model="user.userCompany"
              :popper-append-to-body="false"
              :disabled="isSsg"
              :placeholder="isSsg ? $v('{some} 입력', { some: $v('관계사') }) : $v('선택')"
              @input="companySelectFilter"
            >
              <el-option
                v-for="item in companyList"
                :key="item.field"
                :label="item.label"
                :value="item.field"
              />
            </el-select>
          </template>
        </register-contents>
        <!-- 관계사 -->

        <register-contents
          type="input"
          :title="$v('조직')"
          required
        >
          <el-select
            class="information-input"
            v-model="user.userGroup"
            :disabled="isSsg"
            :placeholder="isSsg ? $v('{some} 입력', { some: $v('조직') }) : $v('선택')"
          >
            <el-option
              v-for="item in groupList"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 조직 -->

        <register-contents
          type="input"
          :title="$v('이름')"
          required
        >
          <el-input
            class="information-input"
            :placeholder="isSsg ? $v('{some} 입력', { some: $v('이름') }) : $v('입력')"
            v-model="user.userName"
            :disabled="isSsg"
          />
        </register-contents>
        <!-- 이름 -->

        <register-contents
          type="input"
          :title="$v('직위')"
          required
        >
          <el-select
            class="information-input"
            v-model="user.userPosition"
            :popper-append-to-body="true"
            :disabled="isSsg"
            :placeholder="isSsg ? $v('{some} 입력', { some: $v('직위') }) : $v('선택')"
          >
            <el-option
              v-for="item in positionList"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 직위 -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.email')"
          :required="!isSsg"
        >
          <el-input
            class="information-input"
            :placeholder="$t('config.IP.enter', { name: $t('admin.ACCOUNT.email') })"
            v-model="user.userEmail"
          />
        </register-contents>
        <!-- 이메일 -->

        <register-contents
          type="input"
          :title="$t('common.REGCON.phone')"
        >
          <el-input
            class="information-input -phone"
            :placeholder="$t('config.IP.enter', { name: $t('common.REGCON.phone') })"
            v-model="user.userPhone"
          />
        </register-contents>
        <!-- 휴대전화 -->
      </div>
      <!-- /. 관계사, 조직, 이름, 직위, 이메일, 휴대폰 -->

      <div class="edit-info-list">
        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.state')"
        >
          <el-select
            class="information-input"
            v-model="user.userStatus"
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
        <!-- 계정 상태 -->

        <register-contents
          type="input"
          :title="$t('admin.ROLE.perm')"
          required
        >
          <div class="input-form">
            <el-radio-group
              v-if="accountType === 'user'"
              v-model="user.userPermLevel"
            >
              <el-radio
                v-for="perm in userPermLevels"
                :key="perm.value"
                :label="perm.value"
                style="margin-right: 20px;"
              >
                {{ perm.label }}
              </el-radio>
            </el-radio-group>
            <el-radio-group
              v-else
              v-model="user.userPermLevel"
            >
              <el-radio
                v-for="perm in admPermLevels"
                :key="perm.value"
                :label="perm.value"
              >
                {{ perm.label }}
              </el-radio>
            </el-radio-group>
          </div>
        </register-contents>
        <!-- 권한 -->

        <register-contents
          v-if="user.userPermLevel === 1"
          type="input"
          :title="$t('admin.ROLE.role')"
          required
        >
          <div class="input-form -role">
            <div v-if="user.userPermRole.length > 0">
              <div
                class="form-role"
                v-for="(role, index) in user.userPermRole"
                :key="index"
              >
                <el-select
                  class="information-input"
                  v-model="user.userPermRole[index]"
                  :placeholder="$t('common.PLACEHOLDER.selectName', { name: $t('admin.ROLE.role') })"
                  @input="checkRoleValid"
                  :disabled="role !== ''"
                >
                  <!-- :popper-append-to-body="false" -->
                  <el-option
                    v-for="item in roleList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <button
                  class="button"
                  type="is-icon"
                  v-if="user.userPermRole.length > 1 && user.userPermLevel === 1"
                  @click="deleteItem(index, user.userPermRole)"
                >
                  <i class="delete-icon" />
                </button>
              </div>
            </div>
            <div v-else>
              <el-select
                class="information-input"
                v-model="user.userPermRole[0]"
                :placeholder="$t('common.PLACEHOLDER.selectName', { name: $t('admin.ROLE.role') })"
                @input="checkRoleValid"
              >
                <el-option
                  v-for="item in roleList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
            <a
              v-if="user.userPermLevel === 1"
              class="add-icon -add-role"
              @click="addItem('role')"
            />
          </div>
        </register-contents>
        <!-- 역할 -->
      </div>

      <div class="edit-info-list">
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
              <button class="button">
                Upload
              </button>
              <div
                class="el-upload__tip"
                slot="tip"
              >
                {{ $t('admin.ACCOUNT.limitFileSize') }}
              </div>
            </el-upload>
            <p
              v-if="photoUrl"
              class="photo-view"
              style="margin-left: 10px;"
            >
              <img
                class="photo-image"
                v-if="photoUrl"
                :src="photoUrl"
                width="220px"
                height="auto"
              >
            </p>
          </div>
        </register-contents>
        <!-- 사진 -->

        <register-contents
          type="input"
          :title="$t('admin.ACCOUNT.loginLock')"
        >
          <el-checkbox v-model="user.userLoginLock" />
        </register-contents>
        <!-- 로그인 잠금 -->
        <register-contents
          v-if="accountType === 'user'"
          type="input"
          :title="$v('빌링 사용자')"
        >
          <el-checkbox v-model="user.isBilling" />
        </register-contents>
        <!-- 빌링 사용자 -->
      <!-- 권한 -->
      </div>
    </section>

    <div class="button-area -center -form-bottom">
      <button
        class="button -confirm"
        type="is-primary"
        @click="applyRegister"
        size="is-large"
        :disabled="isCreatingUser"
        v-loading="isCreatingUser"
      >
        <!-- 등록 -->
        {{ $t('common.BTN.enroll') }}
      </button>
    </div>
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import { validatorUserId, validatorUserName } from '@/components/AccountMixins/AccountMixins'

export default {
  name: 'SetAccountCreate',
  mounted () {
    this.accountType = this.$route.params.detailField
    this.user.userPermLevel = this.getDefaultUserPermissionLevel(this.accountType)
    this.getRoleList()
    this.$store.commit('common/ADD_PARAMETERS', {
      label: this.$t('common.BTN.ADMIN.regAcc'),
      path: ''
    })
  },
  methods: {
    getDefaultUserPermissionLevel (type) {
      const result = {
        user: 4,
        admin: 1
      }
      return result[type]
    },
    removeImage () {
      this.userPhoto = undefined
      this.photoUrl = undefined
    },
    /**
     * 이미지 파일 업로드
     */
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
    /**
     * [역할] 추가
     */
    addItem (field) {
      if (field === 'role') {
        const newObj = ''
        this.user.userPermRole.push(newObj)
      } else if (field === 'group') {
        const newObj = {
          id: 'role_' + Math.random().toString(36).substr(2, 9),
          userDepartment: ''
        }
        this.department.push(newObj)
      }
    },
    deleteItem (deleteIdx, list) {
      list.splice(deleteIdx, 1)
    },
    toUrl (file) {
      if (file) {
        // Base64 decode
        // const userPhotoData = file.replace(/^data:image\/(png|jpg|jpeg);base64,/, '')
        this.photoUrl = window.URL.createObjectURL(file)
      }
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
    async getGroupList () {
      let groupApi = await API.iam.getGroupList()
      groupApi = groupApi.sort((a, b) => a.groupIdx - b.groupIdx)
      for (const data of groupApi) {
        this.groupMap.set(data.groupIdx, data)
      }
      this.groupList = groupApi
        .filter(group => group.groupUpper !== 0)
        .map(group => {
          return {
            label: this.groupMap.get(group.companyIdx).groupName + ' > ' + group.groupName,
            field: group.groupIdx
          }
        })
      this.companyList = groupApi
        .filter(group => group.groupUpper === 0)
        .filter(group => group.groupName.includes('(주)'))
        .map(group => {
          return {
            label: group.groupName,
            field: group.groupIdx
          }
        })
      this.groupRawData = groupApi
    },
    async getRoleList () {
      const roleApi = await API.iam.getRoleList()
      this.roleList = roleApi.filter(role => role.roleUpper !== 0).map(role => {
        return {
          label: role.roleName,
          field: role.roleIdx,
          value: role.roleIdx
        }
      })
    },
    companySelectFilter () {
      this.groupList = this.groupRawData
        .filter(group => group.companyIdx === this.user.userCompany)
        .map(group => {
          return {
            label: this.groupMap.get(group.companyIdx).groupName + ' > ' + group.groupName,
            field: group.groupIdx
          }
        })
    },

    /**
     * 역할 확인
     */
    checkRoleValid () {
      if (this.user.userPermRole.length < 2) return
      const roleSet = new Set()

      for (const role in this.user.userPermRole) {
        if (roleSet.has(this.user.userPermRole[role])) {
          return this.$alert(this.$t('common.ALERT.ROLE.007'), {
            callback: () => this.user.userPermRole.splice(role, 1)
          })
        }
        roleSet.add(this.user.userPermRole[role])
      }
    },

    /**
     * [등록] 버튼 클릭시 발생하는 이벤트
     */
    async applyRegister () {
      if (!this.isFindId) {
        this.$alert(this.$t('common.ALERT.ACCOUNT.008'))
        return
      }
      if (!this.userValidation()) return
      if (this.user.userPermGroup.length > 0) {
        this.user.userPermGroup = this.user.userPermGroup.map(group => group.groupIdx)
      }
      if (this.user.userPermLevel !== 1 || this.user.userPermRole?.length === 0) {
        this.user.userPermRole = []
      }

      if (!this.user.userPhone) delete this.user.userPhone
      if (!this.user.userEmail) delete this.user.userEmail

      try {
        this.isCreatingUser = true
        if (this.accountType === 'user') this.user.isMultiUser = false // ** backend 작업 후 삭제 ***
        const response = await API.iam.createUser(this.user)
        if (response) {
        // this.$alert('등록을 성공했습니다.')
          this.$alert(this.$t('common.ALERT.BASE.032'))
          if (this.accountType === 'user') this.$router.push({ name: 'set-account-user' })
          else this.$router.push({ name: 'set-account-admin' })
        }
      } catch (error) {
        if (error && error.code) {
          const message = {
            IAM211: this.$t('common.ALERT.ACCOUNT.048'),
            IAM308: this.$v('관계사 도메인이 등록되지 않아<br>이메일을 입력할 수 없습니다.'),
            IAM205: this.$v('이미 등록된 이메일입니다.<br>새로운 이메일을 입력해주세요.')
          }[error.code] || this.$v('계정 등록에 실패하였습니다.')

          return this.$alert(message, { dangerouslyUseHTMLString: true })
        } else return this.$alert(this.$v('계정 등록에 실패하였습니다.'))
      } finally {
        this.isCreatingUser = false
      }
    },

    /**
     * Validation 확인
     */
    userValidation () {
      // 공통으로 Validator 확인하기
      const scanValidator = () => {
        const conditions = this.conditions(this.user)

        return conditions.every(({ condition, message }) => {
          if (!condition) this.$alert(message, { dangerouslyUseHTMLString: true }) // 세팅한 alert 자동세팅
          return condition
        })
      }

      if (!scanValidator()) return false
      return true
    },

    // validator
    conditions (user = this.user) {
      const { userId, userPw, userName, userGroup, userPosition, userPermRole, userPermLevel, userEmail, userPhone } = user
      const uwerPwRe = this.userPasswordRe // 비밀번호 확인
      // const isOperator = userPermLevel === 1 // '운영관리자'인지 확인
      const isOperator = this.accountType === 'user' ? [3, 4].includes(userPermLevel) : [0, 1].includes(userPermLevel)

      // 기본 패턴
      const pwPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!#$%&*?@])[A-Za-z\d!#$%&*?@]{8,}$/
      const emailPattern = /^[a-zA-Z0-9]+([-._]?[a-zA-Z0-9]+)*[-_]?@[a-zA-Z]+[.]{1}([a-zA-Z]{3}|[a-zA-Z]{2,5}.[a-zA-z]{2})$/
      const phonePattern = /^\d{2,3}-\d{3,4}-\d{4}$/

      const conditions = [
        { condition: (isOperator && userId && userId !== ''), message: this.$v('사번을 입력해주세요.') },
        { condition: (isOperator && userPw && userPw !== ''), message: this.$v('비밀번호를 입력해주세요.') },
        { condition: (isOperator && pwPattern.test(userPw)), message: this.$v('비밀번호를 확인해주세요. (영문자, 숫자, 괄호를 제외한 특수문자 포함 8자 이상)') },
        { condition: (isOperator && uwerPwRe && uwerPwRe !== ''), message: this.$v('비밀번호 확인을 입력해주세요.') },
        { condition: (isOperator && userPw === uwerPwRe), message: this.$v('입력한 비밀번호가 서로 다릅니다.') },
        { condition: (isOperator && userName && userName !== ''), message: this.$v('이름을 입력해주세요.') },
        { condition: (isOperator && userGroup && userGroup !== ''), message: this.$v('조직을 선택해주세요.') },
        { condition: (isOperator && userPosition && userPosition !== ''), message: this.$v('권한을 선택해주세요.') },

        { condition: (this.isSsg ? true : userEmail && userEmail !== ''), message: this.$v('이메일을 확인해주세요.') },
        { condition: (userEmail ? emailPattern.test(userEmail) : true), message: this.$v('이메일을 확인해주세요.') },
        { condition: (userPhone ? phonePattern.test(userPhone) : true), message: this.$v('휴대폰 번호를 확인해주세요.<br>010-1234-5678 형태로 입력되어야 합니다.') },
        // 이메일 :: isSSG 일때는 옵션, 외부 업체일 경우에는 필수 검사, (휴대폰은 두 경우 모두 옵션)
        // 이메일 / 전화번호 :: 있을 경우 형식 확인
        // 최고 관리자 생성의 경우 역할 선택 X(바로 통과)
        { condition: ((this.accountType === 'user' || userPermLevel === 0) ? true : (isOperator && userPermRole && userPermRole.length > 0)), message: this.$v('역할을 선택해주세요.') },

        { condition: validatorUserId(userId), message: this.$v('사번은 4자 이상,<br>50자 이하로 설정해주세요.') },
        { condition: validatorUserName(userName), message: this.$v('이름은 2자 이상,<br>50자 이하로 설정해주세요.') }
      ]

      return conditions
    },

    /**
     * [비밀번호] 비밀번호 한글 포함여부 확인
     */
    koreanTest (val) {
      const reg = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힝]/
      if (reg.test(val)) return this.$alert('비밀번호에는 한글이 포함될 수 없습니다.')
    },

    /**
     * [사번 찾기] 해서 userId 확인
     */
    async checkUserId () {
      this.user.userId = this.user.userId.replace(/\s/g, '')
      const { userId } = this.user

      const conditions = [
        { condition: (userId), message: this.$t('common.ALERT.BASE.012') },
        { condition: validatorUserId(userId), message: this.$v('사번은 4자 이상,<br>50자 이하로 설정해주세요.') }
      ]

      const validator = conditions.every(({ condition, message }) => {
        if (!condition) this.$alert(message, { dangerouslyUseHTMLString: true })
        return condition
      })

      if (!validator) {
        this.user.userId = ''
        return
      }

      this.findUserId(this.user)
    },
    /**
     * 입력한 userId 를 확인합니다.
     */
    async findUserId (user = this.user) {
      const data = await API.iam.findUserId({ isAdmin: this.accountType !== 'user', userId: user.userId })

      if (data && data.userIdx) this.$alert(this.$v('이미 등록된 사용자입니다.'))
      else if (data) {
        this.user.userId = data.userId
        this.user.userName = data.userName
        this.user.userPosition = data.userPosition
        this.user.userGroup = data.userGroup
        this.user.userCompany = data.userCompany
        this.user.userDuty = data.userDuty
        this.user.userEmail = data.userEmail
        this.companyList = [{
          field: data.userCompany,
          label: data.userCompanyName
        }]
        this.groupList = [{
          field: data.userGroup,
          label: data.userGroupName
        }]
        this.isFindId = true
      } else {
        this.isFindId = false
        if (data === undefined) this.$alert(this.$v('이미 등록된 사용자입니다.'))
        else this.$alert(this.$v('사용자가 없습니다.'))
      }
    },
    initUser () {
      this.isFindId = false
      this.user = {
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
        userLoginLock: false
      }
      this.userPasswordRe = ''
      this.fileList = []
      this.removeImage()
    }
  },
  data () {
    return {
      accountType: undefined,
      userPermLevels: [
        { label: this.$t('admin.ACCOUNT.generalUser'), value: 4 } // 일반사용자
        // { label: this.$t('admin.ACCOUNT.billingUser'), value: 3 } // 빌링사용자
        // { label: this.$t('admin.ACCOUNT.customUser'), value: 5 }, // 커스텀 사용자
        // { label: this.$t('admin.ACCOUNT.middleManager'), value: 2 } // 중간관리자
      ],
      admPermLevels: [
        { label: this.$t('admin.ACCOUNT.managerSimple'), value: 1 }, // 운영관리자
        { label: this.$t('admin.ACCOUNT.topManagerSimple'), value: 0 } // 최고관리자
      ],
      isCreatingUser: false,
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
        userLoginLock: false,
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
        { field: 3, label: '활성', keyPath: 'admin.ACCOUNT.active' },
        { field: 0, label: '비활성', keyPath: 'admin.ACCOUNT.inactive' }
      ],
      loginLockList: [
        { field: true, label: 'Y' },
        { field: false, label: 'N' }
      ],

      photoUrl: undefined,
      fileList: [],

      roleList: [],
      groupMap: new Map(),
      groupRawData: [],
      isSsg: process.env.VUE_APP_SSG_USER === 'true',
      isFindId: false
    }
  }
}
</script>

<style lang="scss">
.set-account-create {
  > .edit-area {
    .edit-info-list {
      margin-top: -1px;
      border-bottom: 1px solid $dark-slate;
      .information-input {
        width: 400px;
      }
      & + .info-item {
        margin-top: $gap;
      }
      // .info-item-label {
      //   min-width: 150px;
      // }
      .input-form {
        display: flex;
        position: relative;
        // width: 400px;
        > .el-radio-group {
          display: flex;
          align-items: center;
        }
        &.-role {
          position: relative;
          flex-direction: column;
          width: 400px;
          .form-role {
            display: flex;
            align-items: center;
            width: 100%;
            & + .form-role {
              margin-top: $gap-s;
            }
          }
          .-add-role {
            position: absolute;
            bottom: 4px;
            right: -35px;
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
    }
  }
}
</style>
