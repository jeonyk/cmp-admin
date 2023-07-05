<template>
  <div class="set-sync-account-vpc">
    <section>
      <h2 class="main-title">
        {{ $v('AWS 계정 동기화') }}
      </h2>
    </section>
    <!-- :is-valid="isValidKey" -->
    <aws-key-form
      :is-registered="isRegisteredKey"
      :is-decrypted="isDecrypted"
      :access-key="accessKey"
      :secret-access-key="secretAccessKey"
      @register="registerKeys"
      @search="searchKeys"
      @hide="hideKeys"
      @delete="resetAccountSync"
      @change="changeInputs"
      @restore="restoreKey"
    />

    <access-key-notcie
      :data-list="noticeList"
      style="margin-top: 15px;"
    />
    <aws-status-board
      :is-synchronized="isSynchronized"
      :is-loading="isLoading"
      :is-registered="isAccountSyncValid"
      :time="syncedTime"
      @sync="syncAwsInfo"
      style="margin-top: 60px;"
    />

    <main v-if="isRegisteredKey">
      <header class="grid-title">
        <h3>
          {{ $v('VPC 대역 설정') }}
        </h3>
        <div>
          <button
            class="button"
            type="is-primary"
            @click="openCreateVpc"
          >
            {{ $v('대역 추가') }}
          </button>
        </div>
      </header>
      <cmp-grid
        :columns="columns"
        :item-source="vpcList"
      >
        <template #utils="{row}">
          <div v-if="parseInt(row.userIpRange) === 0">
            <i
              @click="openUpdateVpc(row.idx)"
              class="el-icon-edit icon"
            />
            <i
              @click="deleteVpc(row.idx)"
              style="margin-left:10px;"
              class="el-icon-delete icon"
            />
          </div>
        </template>
      </cmp-grid>
    </main>

    <confirm-password-modal
      :is-visible="passwordModal"
      @close="passwordModal = false"
      @confirm="confirmPassword"
    />

    <set-vpc-modal
      :is-visible="isOpenVpc"
      :selected-data="selectedVpc"
      :type="modalType"
      @add="createVpc"
      @update="updateVpc"
      @close="isOpenVpc = false"
    />
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import AwsKeyForm from '@/components/ConfigAws/AwsKeyForm.vue'
import AwsStatusBoard from '@/components/ConfigAws/AwsStatusBoard'
import SetVpcModal from '@/components/ConfigAws/SetVpcModal'
import ConfirmPasswordModal from '@/components/ConfigAws/ConfirmPasswordModal.vue'
import AccessKeyNotcie from '@/components/ConfigAws/AccessKeyNotice.vue'

export default {
  components: {
    'set-vpc-modal': SetVpcModal,
    'confirm-password-modal': ConfirmPasswordModal,
    'access-key-notcie': AccessKeyNotcie,
    'aws-key-form': AwsKeyForm,
    'aws-status-board': AwsStatusBoard
  },
  computed: {
    isAccountSyncValid () {
      if (this.isRegisteredKey) return false
      return true
    }
  },
  watch: {
    isRegisteredKey: {
      immediate: true,
      handler (newVal) {
        if (newVal && !this.isDecrypted) {
          this.accessKey = this.createMaskedKey()
          this.secretAccessKey = this.createMaskedKey()
        }
      }
    },
    isDecrypted: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          this.clonedKey = cloneDeep(this.accessKey)
          this.clonedSecretKey = cloneDeep(this.secretAccessKey)
        }
      }
    },
    isOpenVpc: {
      immediate: true,
      handler (newVal) {
        if (!newVal) {
          setTimeout(() => {
            this.modalType = 'create'
          }, 500)
          this.selectedVpc = undefined
        }
      }
    }
  },
  created () {
    this.checkRegisteredKey()
    this.fetchVpc()
  },
  methods: {
    openCreateVpc () {
      this.modalType = 'create'
      this.isOpenVpc = true
    },
    async fetchVpc () {
      const res = await this.getVpcConfigList()
      this.vpcList = res
    },
    async getVpcConfigList () {
      const res = await API.aws.getVpcConfig()
      return res.data
    },
    async checkRegisteredKey () {
      const res = await API.aws.checkRegisteredKey()
      if (res?.data) {
        this.isRegisteredKey = true
        this.accessKey = this.createMaskedKey()
        this.secretAccessKey = this.createMaskedKey()
        this.isSynchronized = true
        // this.isValidKey = true
      }
      console.log('키 등록 여부: ', res)
      console.log('키 등록 여부: ', res.data)
    },
    resetAccountSync () {
      this.$confirm(this.$v('AccessKey / SecretAccessKey<br>를 변경하시겠습니까?'), {
        dangerouslyUseHTMLString: true
      }).then(async () => {
        // resetAccountSync 사용 안 해해해해 reset
        // UI 일번 프로세르로 돌아가나 키가 삭제된 것은 아님
        this.isRegisteredKey = false
        this.isDecrypted = false
        this.accessKey = ''
        this.secretAccessKey = ''

        // @키 CRUD 플로우 변경;
        // const res = await API.aws.resetAccountSync()
        // if (res.status === 200) {
        //   this.isRegisteredKey = false
        //   this.isDecrypted = false
        //   this.accessKey = ''
        //   this.secretAccessKey = ''
        //   this.$alert('계정 동기화를 취소했습니다.')
        //   console.log('@resetAccountSync:', res)
        // }
      }).catch(() => {
      })
    },
    openUpdateVpc (idx) {
      const foundVpc = this.vpcList.find(data => data.idx === idx)
      if (foundVpc) {
        this.modalType = 'update'
        this.selectedVpc = foundVpc
        console.log('클릭한 VPC', this.selectedVpc)
        this.isOpenVpc = true
      }
    },
    async deleteVpc (id) {
      await this.$confirm(this.$v('대역을 삭제하시겠습니까?')).then(async () => {
        try {
          const res = await API.aws.deleteVpc(id)
          if (res.status === 200) this.fetchVpc()
        } catch (error) {
          this.$alert(this.$v('삭제를 실패했습니다'))
        }
      })
    },
    async updateVpc (payload) {
      try {
        const { environment, configValue } = payload
        const hasVpc = this.vpcList.find(vpc => {
          const ips = vpc.vpcIpRange.split('.')
          const sameEnvironment = environment === vpc.environment
          const sameIps = configValue === `${ips[0]}.${ips[1]}`
          return sameEnvironment && sameIps
        })

        if (hasVpc) return this.$alert(this.$v('이미 존재하는 VPC 정보입니다'))

        const res = await API.aws.updateVpc(payload)
        if (res.status === 200) {
          this.fetchVpc()
          this.isOpenVpc = false
        }
      } catch (error) {
        if (error.response.data.message === 'Already exist VPC Config') return this.$alert(this.$v('이미 존재하는 VPC 정보입니다'))
        return this.$alert(this.$v('변경을 실패했습니다'))
      }
    },
    async createVpc ({ type, head, middle }) {
      const payload = {
        configKey: 'IP_ADDR',
        configValue: `${head}.${middle}`,
        serviceName: 'VPC',
        environment: type
      }

      try {
        const res = await API.aws.createVpc(payload)
        if (res.status === 200) {
          this.fetchVpc()
          this.isOpenVpc = false
        }
      } catch (error) {
        let message = error?.response?.data?.message || this.$v('VPC 생성을 실패했습니다')
        if (message === 'Not valid config environment') message = this.$v('현재 CSP 타입은 생성할 수 없습니다')
        if (message === 'Already exist VPC Config') message = this.$v('이미 등록된 VPC 대역입니다')
        this.$alert(message)
      }
    },
    syncAwsInfo () {
      // 1. 동기화 중
      this.isSynchronized = true
      // this.isSynchronized = false
      this.isLoading = true
      setTimeout(() => {
        // 동기화 끝
        // this.isSynchronized = true
        this.isLoading = false
        this.syncedTime = new Date().toISOString()
      }, 2000)
    },
    async confirmPassword () {
      const isSuccessfulPwd = true
      if (isSuccessfulPwd) {
        // 비밀번호 성공 시 복호화 API 호출
        const res = await API.aws.decryptKey()
        if (res?.data) {
          this.accessKey = res.data.accessKey
          this.secretAccessKey = res.data.secretKey
          this.isDecrypted = true
          this.passwordModal = false
        }
      } else {
        this.$alert(this.$v('비밀번호 실패'))
      }
    },
    searchKeys () {
      this.passwordModal = true
    },
    registerKeys (key, secretKey) {
      if (!key || !secretKey) return this.$alert('값을 입력해주세요.')
      console.log('registerKeys :', key, secretKey)

      this.$confirm(this.$v('Access Key/ScretAccess Key<br>를 등록하시겠습니까?'), {
        dangerouslyUseHTMLString: true
      }).then(async () => {
        const payload = {
          accessKey: key,
          secretKey: secretKey
        }
        const response = await API.aws.createAccessKeys(payload)
        console.log('@responseData :', response)

        if (response?.status === 200) {
          this.isRegisteredKey = true // 키 등록 완료
          this.$alert(this.$v('키가 등록되었습니다'))
        } else {
          this.$alert(this.$v('Access Key 가 올바르지 않습니다'))
          this.clearInputFields()
        }
      })
    },
    syncAvailableZones () {
      const response = API.aws.syncAvailableZones()
      return response
    },
    createMaskedKey () {
      return '*'.repeat(10)
    },
    clearInputFields () {
      this.accessKey = ''
      this.secretAccessKey = ''
    },
    restoreKey () {
      console.log('키 변경을 취소합니다')
      console.log(this.accessKey, this.clonedKey, this.accessKey === this.clonedKey)
      console.log(this.secretAccessKey, this.clonedSecretKey, this.secretAccessKey === this.clonedSecretKey)
      this.getClonedKey()
    },
    getClonedKey () {
      this.accessKey = this.clonedKey
      this.secretAccessKey = this.clonedSecretKey
    },
    changeInputs (key, secretKey) {
      this.accessKey = key
      this.secretAccessKey = secretKey
    },
    hideKeys () {
      this.isDecrypted = false
      this.accessKey = this.createMaskedKey()
      this.secretAccessKey = this.createMaskedKey()
      this.$alert(this.$v('키를 암호화합니다'))
    }
  },
  data () {
    return {
      accessKey: '',
      secretAccessKey: '',
      clonedKey: '',
      clonedSecretKey: '',
      isRegisteredKey: false,
      isDecrypted: false,
      // isValidKey: false,
      modalType: 'create',
      selectedVpc: undefined,
      isOpenVpc: false,
      passwordModal: false,
      isSynchronized: false,
      isLoading: false,
      syncedTime: undefined,

      noticeList: [
        '※ 등록되는 Access Key/Secret Access Key 로는 정보를 동기화 하는 용도로만 사용 가능합니다.',
        '※ Access Key/Secret Access Key을 잘못 등록하는 경우 정상적인 사용이 어려울 수 있습니다.',
        '※ 잘못 된 Access Key/Secret Access Key 입력 시 AWS 정보 동기화가 안될 수 있습니다'
      ],
      columns: [
        { binding: 'environment', header: '대역 종류 ', keyPath: this.$v('대역 종류'), width: '*' },
        { binding: 'vpcIpRange', header: 'VPC 대역', keyPath: this.$v('VPC 대역'), width: '*' },
        { binding: 'userIpRange', header: '사용중인 VPC 대역 수', keyPath: this.$v('사용중인 VPC 대역 수'), width: '*' },
        { binding: 'restOfIpRange', header: '잔여 VPC 수', keyPath: this.$v('잔여 VPC 수'), width: '*' },
        { binding: 'utils', header: '', keyPath: '', width: 200, customHtml: true }
      ],
      vpcList: [
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.set-sync-account-vpc {
  margin:auto;
  width:1130px;
}
.main-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  padding-bottom: 20px;
  border-bottom: 1px solid #3d435e;
}

.grid-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  margin-top: 50px
}

.icon {
  cursor: pointer;
}
</style>

<style lang="scss">
.set-sync-account-vpc {
  .form-control {
    .el-input__inner {
      height: 44px !important;
      background: #2a2d44 !important;
      &:focus {
        background: #fff !important;
      }
    }
  }

  .wj-header {
    &:last-child{
      color:#2A2D44 !important;
    }
  }
}
</style>
