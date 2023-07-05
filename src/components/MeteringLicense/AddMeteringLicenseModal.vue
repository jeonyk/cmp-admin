<template>
  <el-dialog
    :title="title"
    :visible.sync="visible"
    width="600px"
    :before-close="close"
  >
    <!-- {{ values }} -->
    <!-- v-loading="isDefaultUsedDetail" -->
    <section class="modal-body">
      <register-contents
        v-for="item in setSwOptions"
        :title="item.title"
        :required="item.required"
        :key="item.field"
        :style="{ width: item.width }"
        :class="{ '-version': !item.title }"
      >
        <el-select
          v-if="item.options && item.type === 'select'"
          v-model="values[item.field]"
          :placeholder="item.placeholder"
          :popper-append-to-body="false"
          :disabled="item.disabled"
          class="-input"
        >
          <el-option
            v-for="(option, i) in item.options"
            :key="`${option.field || option.value}-${i}`"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <searchable-select
          v-else-if="(item.options) && (item.type === 'search' && !item.multi)"
          v-model="values[item.field]"
          :placeholder="item.placeholder"
          :options="item.options"
          unique-key="value"
          class="-input"
          width="300px"
          @change="selectChange(item.field)"
        />

        <searchable-select-multi
          v-else-if="(item.options) && (item.type === 'search' && item.multi)"
          v-model="values[item.field]"
          :placeholder="item.placeholder"
          :options="item.options"
          unique-key="value"
          class="-input"
          width="300px"
        />

        <el-input-number
          v-else-if="item.type === 'number'"
          v-model="values[item.field]"
          :controls="item.controls"
          class="-input"
        />

        <el-input
          v-else-if="item.type === 'input'"
          v-model="values[item.field]"
          :placeholder="item.placeholder"
          class="-input"
        />
      </register-contents>
    </section>

    <div class="modal-footer modal-button-area">
      <button
        class="button"
        @click="close"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="action"
      >
        {{ isUpdate ? $v('변경') : $v('추가') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import LicenseUtil from '@/components/MeteringLicense/LicenseUtil.script'

export default {
  name: 'AddMeteringLicenseModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'new' // new | update
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  mixins: [LicenseUtil],
  computed: {
    title () {
      return {
        new: this.$v('라이선스 추가'),
        update: this.$v('라이선스 변경')
      }[this.type]
    },
    isUpdate () {
      return this.type === 'update'
    },
    text () {
      return this.isUpdate ? this.$v('변경') : this.$v('추가')
    }
  },
  watch: {
    visible (active) {
      if (active) {
        this.setOptions()

        if (this.isUpdate) {
          this.stop = true
          this.$nextTick(() => (this.values = cloneDeep(this.data)))
          setTimeout(() => (this.stop = false), 100)
        }
      }
    }
  },
  created () {
    this.setOptions()
  },
  methods: {
    async setOptions () {
      // console.log(await this.setCodeTree())
      this.setSwOptions[2].options = await this.getSWLicenseCategory() // [카테고리] 옵션 설정
      this.setSwOptions[3].options = await this.setCodeTree() // [운영체제 구분] 옵션 설정
      // this.setSwOptions[4].options = await this.getCodeList({ codeType: 'OS_TYPE' }) // [운영체제] 옵션 설정
      // this.setSwOptions[5].options = await this.getCodeList({ codeType: 'OS_VERSION' }) // [운영체제 버전] 옵션 설정
      // this.getCodeList({ codeType: 'OS_BIT' }) // [운영체제 비트]

      this.setSwOptions[6].options = await this.getMeteringLicenseSaleTypes('purchase') // [구매 SW 라이선스 유형]
      this.setSwOptions[9].options = await this.getMeteringLicenseSaleTypes('sales') // [판매 SW 라이선스 유형]
    },

    /**
     * 셀렉트박스 변경 이벤트
     * @param { String } field 셀렉트박스가 가지고있는 [field]
     * @param { Number } idx 셀렉트박스의 idx
     */
    selectChange (field, idx) {
      const values = this.values[field]
      // console.log(field, values)

      const actions = {
        // [운영체제 구분] 이 선택된 경우
        osSystem: () => {
          // 먼저 관련 옵션 / 값 리셋시키기
          this.setSwOptions[4].options = [] // [운영체제] 목록
          this.setSwOptions[5].options = [] // [운영체제 버전] 목록

          if (!this.stop) {
            this.values.osType = '' // [운영체제]
            this.values.osVersion = '' // [운영체제버전]
          }

          const value = this.setSwOptions[3].options.filter(option => option.value === values)[0]
          if (!value || value.length === 0) return

          this.setSwOptions[4].options = value.children || [] // 운영체제 option 세팅

          this.$forceUpdate()
        },

        // [운영체제] 가 선택된 경우
        osType: () => {
          this.setSwOptions[5].options = [] // [운영체제 버전] 목록

          if (!this.stop) {
            this.values.osVersion = '' // [운영체제버전]
          }

          const value = this.setSwOptions[4].options.filter(option => option.value === values)[0]
          if (!value || value.length === 0) return

          this.setSwOptions[5].options = value.children || [] // 운영체제 버전 option 세팅

          this.$forceUpdate()
        }
      }

      if (actions[field] !== undefined) return actions[field]()
    },

    /**
     * [카테고리 목록] 호출
     */
    async getSWLicenseCategory () {
      try {
        const response = await API.metering.getSWLicenseCategory()
        if (!response) return []

        return response.map(({ categoryName, categoryIdx, ...category }) => ({ label: categoryName, value: categoryIdx }))
      } catch (error) {
        console.error('@@ AddMeteringLicenseModal > getSWLicenseCategory', error)
        this.$alert(this.$v('카테고리 목록을 가져오는데 문제가 발생했습니다. 다시 시도해주세요.'))
        return []
      }
    },

    /**
     * [구매 / 판매 SW 라이선스 유형] 호출
     * @param {String} type
     */
    async getMeteringLicenseSaleTypes (type) {
      const categorize = {
        purchase: { apiName: 'getMeteringLicensePurchase', alert: '구매 S/W 라이선스 유형' },
        sales: { apiName: 'getMeteringLicenseSales', alert: '판매 S/W 라이선스 유형' }
      }[type]

      const { apiName, alert } = categorize

      try {
        const response = await API.metering[apiName]()
        if (!response) return []

        return response.map(({ label, field, ...categoryIdx }) => ({ label, value: field }))
      } catch (error) {
        console.error(`@@ AddMeteringLicenseModal > getMeteringLicenseSaleTypes > ${apiName}`, error)
        this.$alert(this.$v(`${alert}을 가져오는데 문제가 발생했습니다. 다시 시도해주세요.`))
        return []
      }
    },

    /**
     * [추가 / 변경] 버튼 클릭시 동작
     */
    action () {
      const validator = this.validation()
      if (!validator) return

      this.$confirm(this.$v(`해당 내용으로 라이선스를 ${this.text}하시겠습니까?`), {
        confirmButtonText: this.$v('추가'),
        cancelButtonText: this.$v('취소')
      }).then(() => {
        const emit = this.isUpdate ? 'update' : 'save'
        this.$emit(emit, this.values)
        this.close()
      })
    },

    /**
     * 라이선스 추가시 validation
     */
    validation () {
      const validator = [
        { condition: this.values.name, message: this.$v('S/W 이름을 입력해주세요.') },
        { condition: this.values.version, message: this.$v('S/W 버전을 입력해주세요.') },
        // { condition: this.values.categoryIdx.length > 0, message: this.$v('카테고리를 선택해주세요.') },
        { condition: this.values.categoryIdxList.length > 0, message: this.$v('카테고리를 선택해주세요.') },
        // { condition: this.values.osType, message: this.$v('운영체제 유형을 선택해주세요.') }, // 세개 다 옵션
        // { condition: this.values.osSystem, message: this.$v('운영체제 구분을 선택해주세요.') },
        // { condition: this.values.osVersion, message: this.$v('운영체제 버전을 선택해주세요.') },
        { condition: this.values.purchaseLicenseType, message: this.$v('구매 S/W 라이선스 유형을 선택해주세요.') },
        { condition: this.values.purchaseQuantity, message: this.$v('총 구매 수량을 입력해주세요.') },
        { condition: this.values.purchaseAmount !== undefined, message: this.$v('총 구매 금액을 입력해주세요.') },
        { condition: this.values.purchaseAmount && this.values.purchaseAmount < 1000000000, message: this.$v('총 구매 금액은 최대 10억까지 입력 가능합니다.') },
        { condition: this.values.salesLicenseType, message: this.$v('판매 S/W 라이선스 유형을 선택해주세요.') }
      ]

      return validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })
    },
    close () {
      this.values = {}
      this.$emit('close')
    }
  },
  data: root => ({
    values: {},
    setSwOptions: [
      {
        title: root.$v('S/W 이름'),
        field: 'name',
        type: 'input',
        placeholder: root.$v('S/W 이름을 입력해주세요.'),
        required: true
      },
      {
        title: root.$v('S/W 버전'),
        field: 'version',
        type: 'input',
        placeholder: root.$v('S/W 버전을 입력해주세요.'),
        required: true
      },
      {
        title: root.$v('카테고리'),
        field: 'categoryIdxList',
        type: 'search',
        placeholder: root.$v('카테고리를 선택해주세요.'),
        options: [],
        required: true,
        multi: true
      },
      {
        title: root.$v('운영체제 구분'),
        field: 'osSystem',
        type: 'search',
        placeholder: root.$v('운영체제 구분을 선택해주세요.'),
        options: []
      },
      {
        title: root.$v('운영체제'),
        field: 'osType',
        type: 'search',
        placeholder: root.$v('운영체제를 선택해주세요.'),
        options: []
      },
      {
        title: root.$v('운영체제 버전'),
        field: 'osVersion',
        type: 'search',
        placeholder: root.$v('운영체제 버전을 선택해주세요.'),
        options: []
      },
      {
        title: root.$v('구매 S/W 라이선스 유형'),
        field: 'purchaseLicenseType',
        type: 'search',
        placeholder: root.$v('구매 S/W 라이선스 유형을 선택해주세요.'),
        options: [],
        required: true
      },
      {
        title: root.$v('총 구매 수량'),
        field: 'purchaseQuantity',
        type: 'number',
        placeholder: undefined,
        value: 0,
        required: true,
        controls: true
      },
      {
        title: root.$v('총 구매 금액'),
        field: 'purchaseAmount',
        placeholder: root.$v('총 구매 금액을 입력해주세요.'),
        type: 'number',
        value: 0,
        required: true,
        controls: false
      },
      {
        title: root.$v('판매 S/W 라이선스 유형'),
        field: 'salesLicenseType',
        type: 'search',
        placeholder: root.$v('판매 S/W 라이선스 유형을 입력해주세요.'),
        required: true
      }
    ],
    categoryIdx: undefined,
    stop: false
  })
}
</script>

<style lang="scss" scoped>
.-input {
  width: 100%;
}
</style>
