<!--
  * 파일명 : EditableSpecGrid.vue
  * 파일 기능 : Compute 변경 > 편집 가능한 사양 그리드
  * 작성자 : 김예담
  * 최종 작성일 : 2021-09-03
  * License By Shinsegae I&C
 -->

<template>
  <section class="editable-spec-grid">
    <div
      class="flex-wrap"
      v-if="!editableMode"
    >
      <span class="origin-spec-value">{{ `${$t('common.GRID.spec')}: ${originSpecValue}` }}</span>
      <button
        class="button"
        type="is-primary"
        style="margin-left: 30px;"
        @click="editableMode = true"
        :disabled="disabled"
      >
        <!-- 변경 -->
        {{ $t('common.BTN.change') }}
      </button>
    </div>

    <div v-else>
      <p
        class="origin-spec-value"
        v-if="!vmware"
      >
        {{ `${$t('common.REGCON.existingSpec')}: ${originSpecValue}` }}
      </p>
      <div
        class="button-area -right"
        :class="{ '-nx': !vmware}"
        style="width: 630px"
      >
        <button
          class="button"
          type="is-anti"
          @click="() => {
            afterSpec = {...originSpec}
            editableMode = false
          }"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="saveSpec()"
        >
          <!-- 적용 -->
          {{ $t('common.BTN.apply') }}
        </button>
      </div>
      <cmp-grid
        :item-source="[{...afterSpec}]"
        :columns="editableSpecColumns"
        style="margin-top: 10px; width: 630px;"
        :use-column-filter="false"
      >
        <template
          v-for="col in editableSpecColumns"
          :slot="col.binding"
          slot-scope="props"
        >
          <div
            :key="col.binding"
          >
            <el-tooltip
              :disabled="col.binding !== 'flavorDisk' || !disabledDiskReason"
              :content="disabledDiskReason"
              placement="top"
              effect="light"
            >
              <el-input
                v-model="afterSpec[col.binding]"
                class="editable-spec-input"
                type="number"
                :disabled="col.binding === 'flavorDisk' && !!disabledDiskReason"
                :min="col.binding === 'flavorDisk' ? originSpec.flavorDisk : 1"
                @keypress.native.enter="saveSpec()"
                @keydown.native="e => {
                  const invalid = ['i','+','e','-', '.']
                  if(invalid.includes(e.key)) e.preventDefault()
                }"
                @blur="e => {
                  if(col.binding !== 'flavorDisk' && !+props.row[col.binding]) afterSpec[col.binding] = 1
                }"
              />
            </el-tooltip>
            <span class="unit">{{ col.binding === 'flavorCpu' ? 'Core' : 'GB' }}</span>
          </div>
        </template>
      </cmp-grid>
      <small
        class="-reference"
        v-if="!vmware"
      >

        <!-- * 자원 상태가 On인 경우, 사양 변경 시 발생하는 이슈에 대해 보장되기 어렵습니다. -->
        *&nbsp;{{ $t('common.ALERT.COMP.065') }}
      </small>
    </div>
  </section>
</template>

<script>
import { isEqual } from 'lodash'
export default {
  name: 'EditableSpecGrid',
  props: {
    originSpec: {
      type: Object,
      default: null
    },
    minVcpuSize: { // vCPU 최솟값 (Core)
      type: Number,
      default: 1
    },
    minRamSize: { // Ram 최솟값 (GB)
      type: Number,
      default: 1
    },
    minDiskSize: { // Disk 최솟값 (GB)
      type: Number,
      default: 1
    },
    canDownVcpu: { // vCPU를 초깃값보다 down 시킬 수 있는지 ?
      type: Boolean,
      default: true
    },
    canDownRam: { // Ram을 초깃값보다 down 시킬 수 있는지 ?
      type: Boolean,
      default: true
    },
    disabledDiskReason: { // Disk 입력 인풋 disabled 처리 이유
      type: String,
      default: ''
    },
    editing: {
      type: Boolean,
      default: false
    },
    vmware: {
      type: Boolean,
      default: false
    },
    disabled: { // 변경 가능 여부
      type: Boolean,
      default: false
    }
  },
  watch: {
    originSpec: {
      immediate: true,
      deep: true,
      handler (newVal) {
        this.afterSpec = JSON.parse(JSON.stringify(newVal))
      }
    },
    editing: {
      immediate: true,
      handler (flag) {
        this.editableMode = flag
      }
    }
  },
  computed: {
    originSpecValue () {
      if (!this.originSpec) return ''
      const { flavorName, flavorCpu, flavorRam, flavorDisk } = this.originSpec

      if (this.vmware) return `vCPU : ${flavorCpu}Core, RAM : ${flavorRam}GB, DISK : ${flavorDisk}GB`
      else return `${flavorName} (vCPU : ${flavorCpu}Core, RAM : ${flavorRam}GB, DISK : ${flavorDisk}GB)`
    }
  },
  methods: {
    /**
     * '수정' 시, 바뀐 데이터가 있는지 판단합니다.
     */
    checkIsChangedData () {
      if (!this.originSpec) return true

      let changed = false

      const columns = this.editableSpecColumns
      for (let i = 0; i < columns.length; i++) {
        if (!isEqual(this.afterSpec[columns[i].binding], this.originSpec[columns[i].binding])) {
          changed = true
          break
        }
      }
      return changed
    },
    /**
     * 변경 데이터를 emit합니다.
     */
    saveSpec () {
      const noEmpty = Object.values(this.afterSpec).every(val => val !== '')
      if (!noEmpty) return this.$alert(this.$t('common.ALERT.BASE.011')) // 빈 칸을 모두 채워주세요.

      if (this.checkIsChangedData()) { // '수정'시 변경 사항이 있는지 체크합니다.
        if (!this.canDownVcpu && +this.afterSpec.flavorCpu < +this.minVcpuSize) {
          this.afterSpec.flavorCpu = this.minVcpuSize
          return this.$alert(this.$t('common.ALERT.COMP.051'), { dangerouslyUseHTMLString: true }) // VM ON일 때,<br>vCPUs는 초기보다 작을 수 없습니다.
        }
        if (!this.canDownRam && +this.afterSpec.flavorRam < +this.minRamSize) {
          this.afterSpec.flavorRam = this.minRamSize
          return this.$alert(this.$t('common.ALERT.COMP.052'), { dangerouslyUseHTMLString: true }) // VM ON일 때,<br>RAM 사이즈는 초기보다 작을 수 없습니다.
        }
        if (+this.afterSpec.flavorDisk < +this.minDiskSize) {
          this.afterSpec.flavorDisk = this.minDiskSize
          return this.$alert(this.$t('common.ALERT.COMP.024', { size: this.minDiskSize + ' GB' }), { dangerouslyUseHTMLString: true }) // DISK 사이즈는 this.minDiskSizeGB 보다 작을 수 없습니다.
        }

        this.afterSpec.flavorName = 'Custom'
        this.afterSpec.flavorCustomIdx = -1
        this.afterSpec.flavorIdx = -1
        this.afterSpec.profileId = -1

        this.$emit('save', this.afterSpec)
        this.$alert(this.$t('common.ALERT.COMP.022')) // 사양 정보가 변경되었습니다.
      }
      this.editableMode = false
    }

  },
  data () {
    return {
      editableMode: false, // 편집 가능 모드인지?
      afterSpec: { // emit 데이터
        flavorName: 'Custom',
        flavorCpu: 0,
        flavorRam: 0,
        flavorDisk: 0
      },
      editableSpecColumns: [ // 편집 가능한 사양 컬럼
        { header: 'vCPUs', binding: 'flavorCpu', customHtml: true, align: 'center' },
        { header: 'RAM', binding: 'flavorRam', customHtml: true, align: 'center' },
        { header: 'DISK', binding: 'flavorDisk', customHtml: true, align: 'center' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .editable-spec-grid {
    color: #9d9d9d;
    .origin-spec-value {
      display: block;
      line-height: 32px;
    }
    .-nx {
      margin-top: -33px;
    }
    .editable-spec-input {
      min-width: 70px;
      width: 70px;
      & + .unit { margin-left: 5px; }
    }
    .-reference {
      display: block;
      margin-top: $gap-s;
      width: 100%;
      color: $main-red;
    }
  }
</style>
