<template>
  <!-- 대역 추가 -->
  <el-dialog
    :visible="isVisible"
    @close="$emit('close')"
    :title="$v(`VPC 대역 ${type === 'create' ? '추가' : '변경'}`)"
  >
    <div class="set-vpc-modal">
      <header class="header">
        <div>{{ $v('대역 종류') }}</div>
        <div>{{ $v('VPC 대역') }}</div>
      </header>
      <div class="input-control">
        <el-select
          v-model="vpc.type"
          style="width: 150px; height: 32px"
        >
          <el-option
            :key="op.value"
            v-for="op in vpcOptions"
            :value="op.value"
          >
            {{ op.label }}
          </el-option>
        </el-select>
        <input
          class="input"
          v-model="vpc.head"
          type="number"
          @input="e => {
            vpc.head = parseInt(e.target.value, 10)
          }"
        >
        <span style="margin-left: 10px">.</span>
        <input
          class="input"
          v-model="vpc.middle"
          type="number"
          @input="e => {
            vpc.middle = parseInt(e.target.value, 10)
          }"
        >
        <p style="margin-left: 10px">
          . 0 . 0/16
        </p>
      </div>
      <div class="button-area">
        <button
          class="button"
          type="is-anti"
          @click="$emit('close')"
        >
          {{ $v('취소') }}
        </button>
        <button
          v-if="type === 'create'"
          class="button"
          type="is-primary"
          @click="addVpc"
          :disabled="!isConfirm"
        >
          {{ $v('확인') }}
          <!-- {{ type === 'create' ? '확인' : '변경' }} -->
        </button>
        <button
          v-else
          class="button"
          type="is-primary"
          @click="updateVpc"
          :disabled="!isConfirm || !isUpdated"
        >
          {{ $v('변경') }}
          <!-- {{ type === 'create' ? '확인' : '변경' }} -->
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'
export default {
  props: {
    type: {
      type: String,
      default: 'create'
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    selectedData: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    isConfirm () {
      const { type, head, middle } = this.vpc
      const isHead = head !== '' && (head < 256 && head > 0)
      const isMiddle = middle !== '' && (middle < 256 && middle >= 0)
      if (type !== '' && isHead && isMiddle) return true
      return false
    },
    isUpdated () {
      const { environment, vpcIpRange } = this.clonedData
      const ips = vpcIpRange.split('.')
      if (
        environment !== String(this.vpc.type) ||
        ips[0] !== String(this.vpc.head) ||
        ips[1] !== String(this.vpc.middle)) return true
      return false
    }
  },
  watch: {
    isVisible: {
      immediate: true,
      handler (newVal) {
        if (!newVal) {
          this.vpc.type = ''
          this.vpc.head = ''
          this.vpc.middle = ''
        }

        if (newVal && this.type !== 'create') {
          this.vpc.type = newVal.type
          this.vpc.head = newVal.head
          this.vpc.middle = newVal.middle
        }
      }
    },
    selectedData: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          const ips = newVal.vpcIpRange.split('.')
          this.clonedData = cloneDeep(newVal)
          this.vpc.type = newVal.environment
          this.vpc.head = ips[0]
          this.vpc.middle = ips[1]
        }
      }
    }
  },
  methods: {
    clearInputs () {
      this.vpc.type = ''
      this.vpc.head = ''
      this.vpc.middle = ''
    },
    updateVpc () {
      const data = this.selectedData
      const payload = {
        configKey: 'IP_ADDR',
        configValue: `${this.vpc.head}.${this.vpc.middle}`,
        serviceName: 'VPC',
        environment: this.vpc.type,
        idx: data.idx
      }
      this.$emit('update', payload)
    },
    addVpc () {
      if (this.type === 'create') this.$emit('add', this.vpc)
      else this.$emit('update', this.vpc, this.selectedData.id)
    }
  },
  data () {
    return {
      clonedData: undefined,
      vpcOptions: [
        { value: 'PUBLIC', label: 'PUBLIC' },
        { value: 'HYBRID', label: 'HYBRID' }
        // { value: 'CSP', label: 'CSP' }
      ],
      vpc: {
        type: '',
        head: '',
        middle: ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.header {
  height: 42px;
  line-height: 42px;
  display: flex;
  background: #2a2d44;
  div {
    width: 50%;
    text-align: center;
  }
}
.input-control {
  padding:15px 10px;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid #3d435e;
  .input {
    width: 100px;
    margin-left: 15px;
    height: 32px;
    box-sizing: border-box;
    text-indent: 10px;
  }
}

.button-area {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
</style>
