<template>
  <el-dialog
    :title="$t('license.TEXT.addPackage')"
    :visible="active"
    @close="$emit('close')"
    width="560px"
  >
    <div class="new-package">
      <register-contents
        :title="$t('license.TEXT.buyer')"
        type="input"
        required
      >
        <el-input v-model="newPackage.purchaseAff" />
      </register-contents>
      <!-- 구매사 -->
      <register-contents
        :title="$t('license.TEXT.buyerCode')"
        type="input"
        required
      >
        <el-input v-model="newPackage.companyCode" />
      </register-contents>
      <!-- 구매사 코드 -->
      <register-contents
        :title="$t('license.TEXT.managerName')"
        type="input"
        required
      >
        <el-input v-model="newPackage.manager" />
      </register-contents>
      <!-- 담당자명 -->
      <register-contents
        :title="$t('license.TEXT.managerContact')"
        type="input"
        required
      >
        <el-input v-model="newPackage.managerContact" />
      </register-contents>
      <!-- 연락처 -->
      <register-contents
        :title="$t('common.TERMS.version')"
        type="input"
        required
      >
        <el-select
          v-model="newPackage.version"
          :placeholder="$t('license.PLACEHOLDER.selectVersion')"
        >
          <el-option
            v-for="version in sharedPackage.packageTypeList"
            :key="version.packageTypeIdx"
            :label="version.packageTypeName"
            :value="version.packageTypeIdx"
          />
        </el-select>
      </register-contents>
      <!-- 버전 -->
      <register-contents
        :title="$t('license.TEXT.type')"
        type="input"
        required
        style="height: 50px;"
      >
        <el-radio-group
          v-model="newPackage.type"
          class="type-wrapper"
        >
          <el-radio :label="1">
            {{ $t('license.TEXT.purchaseType') }}
          </el-radio>
          <el-radio :label="2">
            {{ $t('license.TEXT.subscription') }}
          </el-radio>
        </el-radio-group>
      </register-contents>
      <!-- 유형 -->
      <register-contents
        v-if="isVisibleDate"
        :title="$t('license.TEXT.date')"
        type="input"
        required
        style="height: 90px;"
      >
        <div class="package-date">
          <div class="package-date-buttons">
            <button
              v-for="(button, index) in buttons"
              :key="button.label"
              :type="button.type"
              class="button"
              @click="() => handleDateClick(button, index)"
            >
              {{ button.label }}
            </button>
          </div>
          <div class="package-date-pickers">
            <el-date-picker
              v-model="newPackage.dateRange.start"
              :placeholder="$t('license.PLACEHOLDER.selectDate')"
            />
            <span style="margin: 0 5px;">~</span>
            <el-date-picker
              v-model="newPackage.dateRange.end"
              :placeholder="$t('license.PLACEHOLDER.selectDate')"
            />
          </div>
        </div>
      </register-contents>
      <!-- 기간 -->
      <register-contents
        :title="$t('license.TEXT.nodeCnt')"
        type="input"
        required
      >
        <el-input-number
          v-model="newPackage.nodeCount"
          :min="0"
          style="width: 100%;"
        />
      </register-contents>
      <!-- 노드수량 -->
      <register-contents
        :title="$t('license.TEXT.purchaseDate')"
        type="input"
        required
      >
        <el-date-picker
          v-model="newPackage.purchaseDate"
          :placeholder="$t('license.PLACEHOLDER.selectDate')"
          style="width: 100%;"
        />
      </register-contents>
      <!-- 구매일 -->
      <register-contents
        :title="$t('common.REGCON.remark')"
        type="input"
        style="height: 80px; align-items: flex-start;"
      >
        <el-input
          v-model="newPackage.note"
          type="textarea"
        />
      </register-contents>
      <!-- 비고 -->
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        v-loading="applyLoading"
        class="button"
        type="is-primary"
        @click="applyNewLicense"
      >
        {{ $t('common.BTN.enroll') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default {
  props: {
    active: {
      type: Boolean,
      required: false
    }
  },
  watch: {
    'newPackage.type': {
      immediate: true,
      handler (type) {
        this.isVisibleDate = type === 2
      }
    },
    active (visible) {
      if (!visible) {
        this.newPackage = {
          purchaseAff: '',
          companyCode: '',
          manager: '',
          managerContact: '',
          version: null,
          type: 1,
          dateRange: {
            start: null,
            end: null
          },
          nodeCount: 0,
          purchaseDate: null,
          note: ''
        }
      }
    }
  },
  inject: ['sharedPackage'],
  methods: {
    /**
     * 구독형 > 날짜 모든 버튼의 타입을 default로 변경
     */
    allDisableDateButtons () {
      this.buttons.forEach(button => (button.type = 'is-default'))
    },
    /**
     * 구독형 > 날짜 클릭시 버튼 타입을 바꾸고
     * 현재 날짜를 기준으로 종료 날짜를 지정
     */
    handleDateClick ({ label, type, distance }, index) {
      if (type === 'is-default') {
        this.allDisableDateButtons()
        this.buttons[index].type = 'is-primary'
      } else {
        this.buttons[index].type = 'is-default'
      }

      if (distance !== undefined) {
        const now = Date.now()

        this.newPackage.dateRange.start = now
        this.newPackage.dateRange.end = now + distance
      } else {
        this.newPackage.dateRange.start = null
        this.newPackage.dateRange.end = null
      }
    },
    /**
     * 라이선스 객체 유효성 검사
     */
    async validateNewLicense (reqObj) {
      if (!reqObj.adminName) {
        // 담당자명은 필수입니다.
        this.$alert(this.$t('common.ALERT.LIC.002', { item: '담당자명' }))
        return false
      } else if (!reqObj.companyName) {
        // 구매사은(는) 필수입니다.
        this.$alert(this.$t('common.ALERT.LIC.023', { item: '구매사' }))
        return false
      } else if (!reqObj.adminPhone) {
        // 연락처은(는) 필수입니다.
        this.$alert(this.$t('common.ALERT.LIC.023', { item: '연락처' }))
        return false
      } else if (!this.$validate.phoneNumber(reqObj.adminPhone)) {
        // 휴대폰 번호를 확인해주세요.<br>010-1234-5678 형태로 입력되어야 합니다.
        this.$alert(this.$t('common.ALERT.ACCOUNT.046'), { dangerouslyUseHTMLString: true })
        return false
      } else if (!reqObj.licensePackageIdx) {
        // 버전은(는) 필수입니다.
        this.$alert(this.$t('common.ALERT.LIC.002', { item: '버전' }))
        return false
      } else if (reqObj.nodeCount < 1) {
        // 노드수량은(는) 필수입니다.
        this.$alert(this.$t('common.ALERT.LIC.002', { item: '노드수량' }))
        return false
      } else if (!reqObj.purchasesDate) {
        // 구매일은(는) 필수입니다.
        this.$alert(this.$t('common.ALERT.LIC.002', { item: '구매일' }))
        return false
      } else if (!reqObj.isPurchases && (!reqObj.endDate || !reqObj.startDate)) {
        // 구독형인 경우 날짜를 지정해야합니다.
        this.$alert(this.$t('common.ALERT.LIC.003'))
        return false
      } else if (!reqObj.isPurchases && reqObj.startDate > reqObj.endDate) {
        // 시작 날짜가 종료 날짜보다 클 수 없습니다.
        this.$alert(this.$t('common.ALERT.LIC.004'))
        return false
      }
      return true
    },
    /**
     * 라이선스 생성 (등록 버튼 클릭시)
     */
    async applyNewLicense () {
      this.applyLoading = true

      const requestObj = {
        adminName: this.newPackage.manager,
        adminPhone: this.newPackage.managerContact,
        comment: this.newPackage.note,
        companyName: this.newPackage.purchaseAff,
        companyCode: this.newPackage.companyCode,
        endDate: this.newPackage.dateRange.end,
        isPurchases: this.newPackage.type === 1,
        nodeCount: this.newPackage.nodeCount,
        purchasesDate: this.newPackage.purchaseDate,
        startDate: this.newPackage.dateRange.start,
        licensePackageIdx: this.newPackage.version
      }

      const validated = await this.validateNewLicense(requestObj)

      if (validated) {
        // 날짜 변환
        if (!requestObj.isPurchases) {
          requestObj.startDate = dayjs(requestObj.startDate).format('YYYY-MM-DD')
          requestObj.endDate = dayjs(requestObj.endDate).format('YYYY-MM-DD')
        } else {
          requestObj.startDate = null
          requestObj.endDate = null
        }
        requestObj.purchasesDate = dayjs(requestObj.purchasesDate).format('YYYY-MM-DD')

        try {
          const { data } = await API.license.createLicense(requestObj)
          if (data) {
            this.$emit('apply')
            // 라이선스 생성 완료
            this.$alert(this.$t('common.ALERT.LIC.038'))
          }
        } catch (error) {
          // console.error(error.response.data.code)
          if (error.response.data.code === 'LIC102') {
            // 해당하는 CMP 패키지가 존재하지 않습니다.
            this.$alert(this.$t('common.ALERT.LIC.040'))
          } else {
            // 라이선스 생성 실패
            this.$alert(this.$t('common.ALERT.LIC.039'))
          }
        }
      }

      this.applyLoading = false
    }
  },
  data: (root) => ({
    applyLoading: false,
    newPackage: {
      purchaseAff: '',
      companyCode: '',
      manager: '',
      managerContact: '',
      version: null,
      type: 1,
      dateRange: {
        start: null,
        end: null
      },
      nodeCount: 0,
      purchaseDate: null,
      note: ''
    },
    isVisibleDate: false,
    buttons: [
      {
        label: root.$t('license.TEXT.DATE.six'),
        type: 'is-default',
        distance: 86400000 * 180
      },
      {
        label: root.$t('license.TEXT.DATE.oneYear'),
        type: 'is-default',
        distance: 86400000 * 365
      },
      {
        label: root.$t('license.TEXT.DATE.twoYear'),
        type: 'is-default',
        distance: 86400000 * 730
      },
      {
        label: root.$t('license.TEXT.DATE.custom'),
        type: 'is-default'
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.new-package {
  &::after {
    content: "";
    display: block;
    height: 1px;
    background-color: $purple-gray;
    margin: $gap-s 0 0 $gap;
  }

  & .register-contents {
    align-items: center;
    height: 40px;

    &::v-deep .contents-title {
      width: 70px;
      min-width: 70px;
      padding-right: 10px;
    }

    &::v-deep .contents {
      padding-right: 0;
    }

    & .type-wrapper {
      > *:first-child {
        margin-right: $gap * 2;
      }
    }
  }

  & .package-date {
    display: flex;
    flex-wrap: wrap;

    &-buttons {
      display: flex;
      flex-wrap: nowrap;
      margin-bottom: $gap-s;
      width: 100%;

      & > * + * {
        margin-left: $gap-s / 2;
      }

      & > button {
        padding: 0 14px;
        flex: 1 0 auto;
      }
    }

    &-pickers {
      display: flex;

      &::v-deep .el-date-editor {
        width: auto;
      }
    }
  }
}
</style>
