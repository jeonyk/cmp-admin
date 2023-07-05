<template>
  <el-dialog
    :title="$t('license.TEXT.modifyPackage')"
    :visible="active"
    @close="$emit('close')"
    width="460px"
  >
    <div
      v-if="copyItem && !external"
      class="update-package"
    >
      <register-contents
        :title="$t('common.TERMS.version')"
        required
        type="input"
      >
        <el-input
          :value="versionName"
          disabled
        />
      </register-contents>
      <register-contents
        :title="$t('license.TEXT.nodeCnt')"
        required
        type="input"
      >
        <el-input-number
          v-model="copyItem.nodeCnt"
          style="width: 100%;"
        />
      </register-contents>
      <register-contents
        :title="$t('license.TEXT.purchaseDate')"
        required
        type="input"
      >
        <el-date-picker
          v-model="copyItem.purchase"
          format="yyyy-MM-dd"
          style="width: 100%;"
        />
      </register-contents>
      <register-contents
        :title="$t('common.REGCON.remark')"
        type="input"
        style="height: 110px; align-items: flex-start;"
      >
        <el-input
          v-model="copyItem.comment"
          type="textarea"
          :rows="3"
        />
      </register-contents>
    </div>
    <div
      v-else-if="copyItem && external && externalAdminInfo"
      class="update-package"
    >
      <register-contents
        :title="$t('license.TEXT.managerName')"
        required
        type="input"
      >
        <el-input v-model="copyItem.name" />
      </register-contents>
      <register-contents
        :title="$t('license.TEXT.managerContact')"
        required
        type="input"
      >
        <el-input v-model="copyItem.phone" />
      </register-contents>
      <register-contents
        :title="$t('common.REGCON.remark')"
        type="input"
        style="height: 110px; align-items: flex-start;"
      >
        <el-input
          v-model="copyItem.comment"
          :rows="3"
          type="textarea"
        />
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.close') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="saveUpdatedPackage"
      >
        {{ $t('common.BTN.save') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'

export default {
  name: 'UpdatePackageModal',
  props: {
    externalAdminInfo: {
      type: Object,
      required: false,
      default: null
    },
    active: {
      type: Boolean,
      required: false
    },
    external: {
      type: Boolean,
      required: false,
      default: false
    },
    licenseData: {
      type: Object,
      required: true
    },
    versionName: {
      type: String,
      required: false,
      default: ''
    }
  },
  watch: {
    active (visible) {
      if (visible) {
        if (this.external) {
          this.copyItem = { ...cloneDeep(this.externalAdminInfo) }
        } else {
          this.copyItem = {
            ...cloneDeep(this.licenseData.licenseManage)
          }
          this.originPurchaseDate = this.copyItem.purchase
        }
      } else {
        this.copyItem = null
      }
    }
  },
  methods: {
    async saveUpdatedPackage () {
      if (this.external) {
        const requestObj = {
          comment: this.copyItem.comment,
          adminName: this.copyItem.name,
          adminPhone: this.copyItem.phone
        }

        if (!requestObj.adminName) {
          return this.$alert(this.$t('common.ALERT.LIC.002', { item: '이름' }), {
            callback: () => false
          })
        } else if (!requestObj.adminPhone) {
          return this.$alert(this.$t('common.ALERT.LIC.023', { item: '연락처' }), {
            callback: () => false
          })
        }

        try {
          const updated = await API.license.updateLicense({ licenseIdx: this.licenseData.licenseIdx, extra: this.external }, requestObj)
          if (updated) {
            this.$emit('close-refresh')
            this.$alert('담당자 정보가 수정되었습니다.')
          }
        } catch (error) {
          if (error?.response?.data?.code === 'LIC005') {
            return this.$alert('구매일을 확인해주세요.<br>현재 날짜보다 과거일로 설정할 수 없습니다.', { dangerouslyUseHTMLString: true })
          }
          this.$alert('담당자 정보 수정에 실패하였습니다.')
        }
      } else {
        const requestObj = {
          comment: this.copyItem.comment,
          nodeCount: this.copyItem.nodeCnt,
          purchasesDate: dayjs(this.copyItem.purchase).format('YYYY-MM-DD')
        }

        if (!requestObj.nodeCount) {
          return this.$alert(this.$t('common.ALERT.LIC.002', { item: '노드수량' }), {
            callback: () => false
          }) // 노드수량은(는) 필수입니다.
        } else if (!requestObj.purchasesDate) {
          return this.$alert(this.$t('common.ALERT.LIC.002', { item: '구매일' }), { callback: () => false })
        } // 구매일은(는) 필수입니다.

        if (requestObj.purchasesDate === this.originPurchaseDate) {
          requestObj.purchasesDate = null
        }

        try {
          const updated = await API.license.updateLicense({ licenseIdx: this.$route.params.id }, requestObj)
          if (updated) {
            this.$emit('close-refresh')
            this.$alert('라이선스 업데이트 성공')
          }
        } catch (error) {
          if (error?.response?.data?.code === 'LIC005') {
            return this.$alert('구매일을 확인해주세요.<br>현재 날짜보다 과거일로 설정할 수 없습니다.', { dangerouslyUseHTMLString: true })
          }
          this.$alert('라이선스 업데이트 실패')
        }
      }
    }
  },
  data: () => ({
    copyItem: null,
    originPurchaseDate: ''
  })
}
</script>

<style lang="scss" scoped>
.update-package {
  border-bottom: 1px solid $purple-gray;

  & .register-contents {
    height: 40px;
    align-items: center;

    &::v-deep .contents-title {
      width: 55px !important;
      min-width: 55px !important;
    }

    &::v-deep .contents {
      padding-right: 0;
    }
  }
}
</style>
