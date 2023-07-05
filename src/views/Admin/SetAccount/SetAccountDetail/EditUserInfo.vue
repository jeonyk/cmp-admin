<!--
  * 파일명 : EditUserInfo.vue
  * 파일 기능 :
  * 작성자 : 이성수 외 1명
  * 최종 작성일 : 2020-10-31
  * License By Shinsegae I&C
  * 2020-10-31 change : alert => this.$alert
 -->

<template>
  <section class="edit-user-info">
    <div class="edit-info-list">
      <register-contents
        type="input"
        title="사번"
        required
      >
        <template>
          <div class="input-form">
            <el-input
              placeholder="사번을 입력하세요."
              v-model="userId"
            />
            <button
              class="button -search-id-button"
              type="is-primary"
              v-if="!editUser"
              @click="memberModal = true"
            >
              사번 찾기
            </button>
          </div>
        </template>
      </register-contents>
      <!-- 사번 -->
      <register-contents
        type="input"
        title="비밀번호"
        required
        v-if="editUser && (editUser.field === 'admin')"
      >
        <template>
          <el-input
            class="information-input"
            placeholder="비밀번호를 입력하세요."
            v-model="userPassword"
            show-password
          />
        </template>
      </register-contents>
      <!-- 비밀번호 -->
      <register-contents
        type="input"
        title="비밀번호 재확인"
        required
        v-if="editUser &&(editUser.field === 'admin')"
      >
        <template>
          <el-input
            class="information-input"
            placeholder="비밀번호를 다시 입력하세요."
            v-model="userPasswordRe"
            show-password
          />
        </template>
      </register-contents>
      <!-- 비밀번호 확인 -->
    </div>

    <div class="edit-info-list">
      <register-contents
        type="input"
        :title="$t('common.MODAL.name')"
        required
      >
        <template>
          <el-input
            class="information-input"
            v-model="userName"
            :disabled="editUser ? false : true"
          />
        </template>
      </register-contents>
      <!-- 이름 -->

      <register-contents
        type="input"
        title="관계사"
        required
      >
        <template>
          <el-select
            class="information-input"
            v-model="userRelationCorp"
            :popper-append-to-body="false"
            placeholder="사번선택"
            :disabled="editUser ? false : true"
          >
            <el-option
              v-for="item in relationCorpList"
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
        title="부서"
        required
      >
        <template>
          <div class="input-form -role">
            <div
              class="form-role"
              v-for="(dep, idx) in department"
              :key="idx"
            >
              <el-select
                class="information-input"
                v-model="dep.userDepartment"
                placeholder="선택"
                :disabled="editUser ? false : true"
              >
                <!-- :disabled="department.length > 1? true : false" -->
                <el-option
                  v-for="item in departmentList"
                  :key="item.field"
                  :label="item.label"
                  :value="item.field"
                />
              </el-select>
              <a
                v-if="department.length > 1 && adminAuth !== 'special'"
                class="mdi mdi-minus -delete-button"
                @click="deleteItem(idx, department)"
              />
            </div>
            <a
              v-if="adminAuth !== 'special'"
              class="mdi mdi-plus -add-button"
              @click="addItem('department')"
            />
          </div>
        </template>
      </register-contents>
      <!-- 부서 -->

      <register-contents
        type="input"
        title="직위"
        required
      >
        <template>
          <el-select
            class="information-input"
            v-model="userPosition"
            :popper-append-to-body="false"
            placeholder="선택"
            :disabled="editUser ? false : true"
          >
            <el-option
              v-for="item in positionList"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </template>
      </register-contents>
      <!-- 직위 -->
    </div>

    <div class="edit-info-list">
      <register-contents
        type="input"
        title="이메일"
        required
      >
        <!-- v-if="!process.env.SSG_USER" -->
        <template>
          <el-input
            class="information-input"
            placeholder="이메일을 입력하세요."
            v-model="userEmail"
          />
        </template>
      </register-contents>
      <!-- 이메일 -->
      <register-contents
        type="input"
        title="휴대전화"
        required
      >
        <!-- v-if="!process.env.SSG_USER" -->
        <template>
          <el-input
            class="information-input -phone"
            placeholder="전화번호를 입력하세요."
            v-model="userPhone"
          />
        </template>
      </register-contents>
      <!-- 휴대전화 -->

      <register-contents
        type="input"
        title="권한"
        required
        v-if="editUser && (editUser.field !== 'user')"
      >
        <template>
          <div class="input-form">
            <el-radio-group v-model="adminAuth">
              <el-radio
                label="general"
              >
                운영 관리자
              </el-radio>
              <el-radio
                style="margin-left: 20px;"

                label="special"
              >
                최고 관리자
              </el-radio>
            </el-radio-group>
          </div>
        </template>
      </register-contents>
      <!-- 권한 -->

      <register-contents
        type="input"
        title="역할"
        required
        v-if="editUser && (editUser.field !== 'user')"
      >
        <template>
          <div class="input-form -role">
            <div
              class="form-role"
              v-for="(role, index) in adminRole"
              :key="index"
            >
              <el-select
                class="information-input"
                v-model="role.roleServer"
                placeholder="서버 선택"
                :disabled="adminAuth === 'special' ? true : false"
              >
                <!-- :popper-append-to-body="false" -->
                <el-option
                  v-for="item in roleServerOptions"
                  :key="item.field"
                  :label="item.label"
                  :value="item.field"
                />
              </el-select>
              <el-select
                class="information-input"
                v-model="role.roleGroup"
                :popper-append-to-body="false"
                placeholder="그룹 선택"
                style="margin-left: 5px;"
                :disabled="adminAuth === 'special' ? true : false"
              >
                <el-option
                  v-for="item in roleGroupOptions"
                  :key="item.field"
                  :label="item.label"
                  :value="item.field"
                />
              </el-select>
              <a
                v-if="adminRole.length > 1 && adminAuth !== 'special'"
                class="mdi mdi-minus -delete-button"
                @click="deleteItem(index, adminRole)"
              />
            </div>
            <a
              v-if="adminAuth !== 'special'"
              class="mdi mdi-plus -add-button"
              @click="addItem('role')"
            />
          </div>
        </template>
      </register-contents>
      <!-- 역할 -->
    </div>

    <div class="edit-info-list">
      <register-contents
        type="input"
        title="사진"
      >
        <template>
          <div class="input-form">
            <el-upload
              class="image-uploader"
              action=""
              :on-preview="handlePreview"
              accept="image/jpeg, image/png, image/jpg"
              :on-change="getFile"
              :on-remove="removeImage"
              :auto-upload="false"
              :multiple="false"
              :file-list="fileList"
            >
              <button
                class="button"
              >
                Upload
              </button>
              <div
                class="el-upload__tip"
                slot="tip"
              >
                5Mb 이하의 이미지 파일(jpg/png)을 올려주세요.
              </div>
            </el-upload>
            <p
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
        </template>
      </register-contents>
      <!-- 사진 -->

      <register-contents
        type="input"
        title="계정 상태"
      >
        <template>
          <el-select
            class="information-input"
            v-model="userActive"
            :popper-append-to-body="false"
            placeholder="선택"
          >
            <el-option
              v-for="item in activeList"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </template>
      </register-contents>

      <!-- 계정 상태 -->
      <register-contents
        type="input"
        title="로그인 잠금"
      >
        <template>
          <el-select
            class="information-input"
            v-model="userLoginLock"
            :popper-append-to-body="false"
            placeholder="선택"
          >
            <el-option
              v-for="item in loginLockList"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </template>
      </register-contents>
      <!-- 로그인 잠금 -->
      <register-contents
        type="input"
        title="권한"
        v-if="editUser && (editUser.field === 'user')"
      >
        <template>
          <div class="input-form">
            <el-radio-group v-model="userAuthority">
              <el-radio
                label="general"
              >
                일반 권한
              </el-radio>
              <el-radio
                style="margin-left: 20px;"
                label="special"
              >
                특수 권한
              </el-radio>
            </el-radio-group>
          </div>
        </template>
      </register-contents>
      <!-- 권한 -->
    </div>

    <!-- 모달 영역 -->
    <!-- 사번 검색 모달 -->
    <set-manager-modal
      :active.sync="memberModal"
      @close="memberModal = false"
      @selectedRow="setSelectedMember"
      title="구성원 검색"
      :selectable-only="true"
    />
  </section>
</template>
<script>
import SetManagerModal from '@/components/Modal/SetManagerModal/SetManagerModal'
// import SetAuthModal from '@/components/Modal/SetAuthModal/SetAuthModal'

export default {
  name: 'EditUserInfo',
  components: {
    'set-manager-modal': SetManagerModal
    // 'set-auth-modal': SetAuthModal
  },
  props: {
    userData: {
      type: Object,
      default: () => {}
    }
  },
  mounted () {
    const editField = this.$route.path.split('/')[4]
    const editId = this.$route.path.split('/')[5]
    if (editField !== 'new') {
      this.editUser.field = editField
      this.editUser.id = editId
    } else this.editUserId = null
  },
  methods: {
    handlePreview (file) {
      console.log('file: ', file)
    },
    removeImage () {
      this.userPhoto = undefined
      this.photoUrl = undefined
    },
    getFile (file, fileList) {
      if (fileList.length > 1) this.fileList = fileList.slice(-1)

      if (file.size > (1024 * 1024 * 5)) {
        this.$alert('5Mb 이하의 사진을 올려주세요')
        this.removeImage()
      } else {
        this.getBase64(file.raw).then(res => {
          this.userPhoto = res
          this.toUrl(file.raw)
        }, rejected => {
          this.$alert('이미지 로드 실패')
          console.error(rejected)
        })
      }
    },
    addItem (field) {
      if (field === 'role') {
        const newObj = {
          id: 'role_' + Math.random().toString(36).substr(2, 9),
          roleServer: '',
          roleGroup: ''
        }
        this.adminRole.push(newObj)
      } else if (field === 'department') {
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
    setSelectedMember (parameter) {
      console.log(parameter._data.name)
    }
  },
  data () {
    return {
      editUser: {
        id: undefined,
        field: undefined
      },
      memberModal: false,

      userId: this.userData.id ? this.userData.id : '',
      userPassword: this.userData.password ? this.userData.password : '',
      userPasswordRe: this.userData.passwordRe ? this.userData.passwordRe : '',
      userName: this.userData.name ? this.userData.name : '',
      userRelationCorp: this.userData.relationCorp ? this.userData.relationCorp : '',
      department: [
        {
          id: 'department_1',
          userDepartment: this.userData.department ? this.userData.department : ''
        }
      ],
      userPosition: this.userData.position ? this.userData.position : '',
      userEmail: this.userData.email ? this.userData.email : '',
      userPhone: this.userData.phone ? this.userData.phone : '',
      userAuthority: this.userData.authority ? this.userData.authority : '',
      adminAuth: this.userData.auth ? this.userData.auth : 'general',
      adminRole: [
        {
          id: 'role_1',
          roleServer: this.userData.roleServer ? this.userData.roleServer : '',
          roleGroup: this.userData.roleGroup ? this.userData.roleGroup : ''
        }
      ],

      userPhoto: this.userData.photo ? this.userData.photo : '',
      // userManage: this.userData.manage ? this.userData.manage : '',
      userActive: this.userData.active ? this.userData.active : '',
      userLoginLock: this.userData.loginLock ? this.userData.loginLock : '',

      relationCorpList: [
        { field: 'emart', label: '이마트' },
        { field: 'shinsegae', label: '신세계' }
      ],
      departmentList: [
        { field: '영업1팀', label: '영업1팀' },
        { field: '영업마케팅팀', label: '영업마케팅팀' }
      ],
      positionList: [
        { field: '차장', label: '차장' },
        { field: '팀장', label: '팀장' },
        { field: '과장', label: '과장' },
        { field: '대리', label: '대리' },
        { field: '주임', label: '주임' },
        { field: '사원', label: '사원' }
      ],
      // manageList: [
      //   { field: 'user', label: '사용자' },
      //   { field: 'admin', label: '관리자' },
      //   { field: 'taskAdmin', label: '업무관리자' }
      // ],
      activeList: [
        { field: 'active', label: '활성' },
        { field: 'inactive', label: '비활성' }
      ],
      loginLockList: [
        { field: 'Y', label: 'Y' },
        { field: 'N', label: 'N' }
      ],

      photoUrl: undefined,
      fileList: [],

      roleServerOptions: [
        { field: 'server1', label: '서버1' },
        { field: 'server2', label: '서버2' },
        { field: 'server3', label: '서버3' }
      ],
      roleGroupOptions: [
        { field: 'group1', label: '그룹1' },
        { field: 'group2', label: '그룹2' },
        { field: 'group3', label: '그룹3' }
      ]
      // setAuthModal: false
    }
  }
}
</script>
<style lang="scss">
  .edit-user-info {
    border-top: 1px solid $border-color;
    .edit-info-list {
      margin-top: -1px;
      border-bottom: 1px solid $dark-slate;
      .information-input {
        width: 400px;
      }
      &+.info-item {
        margin-top: $gap;
      }
      // .info-item-label {
      //   min-width: 150px;
      // }
      .input-form {
        display: flex;
        align-items: center;
        position: relative;
        width: 400px;
        > .el-radio-group {
          display: flex;
          align-items: center;
        }
        &.-role {
          flex-direction: column;
          .form-role {
            display: flex;
            align-items: center;
            width: 100%;
            & + .form-role { margin-top: $gap-s;}
          }
          .-add-button {
            position: absolute;
            bottom: 5px;
            right: -$gap-m;
            color: $primary;
            // &:hover { color: $primary;}
          }
          .-delete-button {
            margin-left: $gap-s;
            color: $primary;
          }
        }
      }
    }
    .-search-id-button {
      width: 120px;
      margin-left: 5px;
    }
  }
</style>
