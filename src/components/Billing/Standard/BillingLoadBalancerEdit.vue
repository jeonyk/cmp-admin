<template>
  <el-dialog
    width="800px"
    lock-scroll
    :title="modalTitle"
    :visible="active"
    @close="$emit('close')"
  >
    <div class="billing-lb">
      <div class="billing-lb-form">
        <register-contents
          v-if="field !== 'firewall'"
          title="이름"
          required
        >
          <el-input
            v-model="form.name"
            :placeholder="$v('이름을 입력해주세요.')"
          />
        </register-contents>
        <register-contents
          v-else
          title="항목"
          required
        >
          <el-select v-model="form.name">
            <el-option
              label="SDN"
              value="SDN"
            />
            <el-option
              label="LEGACY"
              value="LEGACY"
            />
          </el-select>
        </register-contents>
        <register-contents
          :title="field !== 'firewall' ? $v('스위치 장비') : $v('방화벽 장비')"
          required
        >
          <searchable-select
            ref="searchableSelect"
            v-model="form.selectedEquip"
            :options="equipOptions"
            :placeholder="field !== 'firewall' ? $v('스위치 장비를 선택해주세요.') : $v('방화벽 장비를 선택해주세요.')"
            disabled-change-text
            width="300px"
          />
          <div class="tags">
            <clearable-tag
              v-for="equipment in form.equipmentList"
              unique-key="netIdx"
              :content="equipment.netName"
              :key="equipment.netIdx"
              @clear="() => onClearEquipment(equipment)"
            />
          </div>
        </register-contents>
        <register-contents
          title="과금 단위"
        >
          <span>개수</span>
        </register-contents>
        <register-contents
          title="기준 범위"
        >
          <span>1</span>
        </register-contents>
        <register-contents
          title="과금 단가"
        >
          <el-input-number
            v-model="form.price"
            :step="10"
            :min="0"
            :max="100000000"
            thousands-sep=","
          />
        </register-contents>
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $v('닫기') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="onSaveLoadBalancer"
      >
        {{ $v('저장') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { flatten } from 'lodash'

export default {
  name: 'BillingLoadBalancerEdit',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    field: { // 네트워크 탭 필드 l4, l7, firewall
      type: String,
      default: 'l4',
      validator (value) {
        return ['l4', 'l7', 'firewall'].includes(value)
      }
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    registeredList: {
      type: Array,
      default: () => ([])
    },
    networkEquip: {
      type: Array,
      default: () => ([])
    },
    selectedRow: {
      type: Object,
      default: null
    }
  },
  watch: {
    active (visible) {
      if (!visible) {
        this.resetForm()
      } else if (visible && this.isEdit) {
        this.setForm(this.selectedRow)
      }
    },
    'form.selectedEquip' (equip) {
      if (equip) {
        this.form.selectedEquip = undefined
        this.$refs.searchableSelect.valueText = ''
        this.$refs.searchableSelect.selectedItem = null
        this.pushEquip(this.getEquip(equip))
      }
    }
  },
  computed: {
    modalTitle () {
      const text = this.isEdit ? this.$v('변경') : this.$v('추가')
      return `${this.field.toUpperCase()} ${text}`
    },
    equipOptions () {
      if (['l4', 'l7'].includes(this.field)) {
        return this.networkEquip
          .filter(equip => equip.netType === 'SWITCH')
          .filter(this.filterExist)
          .filter(this.filterRegistered)
          .map(this.mapEquipOption)
      } else {
        return this.networkEquip
          .filter(equip => equip.netType === 'FIREWALL')
          .filter(this.filterExist)
          .filter(this.filterRegistered)
          .map(this.mapEquipOption)
      }
    }
  },
  methods: {
    filterRegistered (equip) {
      if (!this.registeredList.length) return true

      if (this.isEdit && this.selectedRow) {
        const selectedRegistered = this.selectedRow.billingModelCategory.equipmentList.map(equip => equip.equipmentIdx)
        if (selectedRegistered.includes(equip.netIdx)) return true
      }

      const registered = flatten(this.registeredList.map(grid => grid.billingModelCategory.equipmentList))
      const registeredIdxs = registered.map(reg => reg.equipmentIdx)

      if (registeredIdxs.includes(equip.netIdx)) return false
      return true
    },
    setForm (selectedRow) {
      if (!selectedRow) return

      this.form.name = selectedRow.billingModelCategory.name
      this.form.equipmentList = selectedRow.billingModelCategory.equipmentList.map(eq => this.getEquip(eq.equipmentIdx))
      this.form.price = selectedRow.fares[0].cost
    },
    onClearEquipment (equip) {
      this.form.equipmentList = this.form.equipmentList.filter(e => e.netIdx !== equip.netIdx)
    },
    filterExist (equip) {
      return !this.form.equipmentList.map(e => e.netIdx).includes(equip.netIdx)
    },
    pushEquip (equip) {
      this.form.equipmentList.push(equip)
    },
    getEquip (netIdx) {
      return this.networkEquip.find(equip => equip.netIdx === netIdx)
    },
    mapEquipOption (equip) {
      return {
        ...equip,
        value: equip.netIdx,
        label: equip.netName
      }
    },
    async validateForm () {
      return new Promise((resolve, reject) => {
        if (!this.form.name) {
          return this.$alert(this.$v('이름을 입력해주세요.'), {
            callback: () => reject(new Error('name'))
          })
        }
        if (!this.form.equipmentList || !this.form.equipmentList.length) {
          return this.$alert(this.$v('스위치 장비를 선택해주세요.'), {
            callback: () => reject(new Error('no equipment'))
          })
        }
        resolve(true)
      })
    },
    onSaveLoadBalancer () {
      this.$confirm(this.$v('입력한 내용으로 저장하시겠습니까?'))
        .then(async () => {
          const validated = await this.validateForm()
          if (!validated) return

          this.$emit('save', {
            ...this.form,
            isEdit: this.isEdit,
            selectedRow: this.selectedRow,
            field: this.field
          })
          this.$emit('close')
        })
        .catch((err) => {
          console.log(err)
        })
    },
    resetForm () {
      this.form = {
        name: '',
        equipmentList: [],
        price: 1000,
        selectedEquip: undefined
      }
    }
  },
  data: () => ({
    form: {
      name: '',
      equipmentList: [],
      price: 1000,
      selectedEquip: undefined
    }
  })
}
</script>

<style lang="scss" scoped>
.billing-lb {
  max-height: 900px;
  overflow-y: auto;

  &-form {
    .tags {
      margin-top: $gap-s;
      display: flex;
      flex-wrap: wrap;
    }
  }
}
</style>
