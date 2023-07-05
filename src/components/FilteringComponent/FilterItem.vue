
<template>
  <div class="search-area">
    <span
      v-if="label.length !== 0"
      class="search-label"
    >
      {{ label }}
    </span>
    <el-input
      v-if="type === 'text'"
      :class="['-input', `-${size}`, { '-full-width' : fullWidth }]"
      :placeholder="placeholder"
      autocomplete="off"
      v-model="customValue"
      @input="e => $emit('change', value)"
      @keyup.native="enterEvent"
    />
    <el-date-picker
      v-else-if="type === 'daterange'"
      type="daterange"
      range-separator="~"
      popper-class="date-popper-log-check"
      :start-placeholder="$t('common.GRID.NETWORK.startDate')"
      :end-placeholder="$t('common.REGCON.endTime')"
    />
    <searchable-select
      v-else-if="type==='searchableSelect'"
      :empty-text="emptyText"
      class="select__searchable"
      :options="filterOptions"
      :org-tooltip="orgTooltip"
      :placeholder="placeholder"
      :popper-class="popperClass"
      :unique-key="uniqueKey"
      @change="(val)=>$emit('change',val)"
      v-model="customValue"
    />
    <el-select
      v-else-if="remote"
      v-model="customValue"
      :placeholder="placeholder"
      :class="['-input', `-${size}`, { '-full-width' : fullWidth }]"
      :filterable="type === 'filterable'"
      :popper-append-to-body="false"
    >
      <el-option
        v-for="item in filterOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <el-select
      v-else
      v-model="customValue"
      :placeholder="placeholder"
      :class="['-input', `-${size}`, { '-full-width' : fullWidth }]"
      remote
      :filterable="type === 'filterable'"
      :popper-append-to-body="false"
      :remote-method="remoteMethod"
      @input="inputRemoteValue"
    >
      <el-option
        v-for="item in filterOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>

    <i
      v-if="isUsedSearchIcon"
      :class="['search-icon', `-${size}`]"
      @click="type === 'text' ? $emit('input', value) : inputRemoteValue(value)"
    />
    <i
      v-if="isUsedResetIcon"
      class="reset-button"
      @click="refresh"
    />
  </div>
</template>

<script>
import { SearchableSelect } from '@sd-fe/cmp-core'
// import SearchableSelect from '../SearchableSelect/SearchableSelect.vue'
import { cloneDeep } from 'lodash'

export default {
  components: { SearchableSelect },
  name: 'FilterItem',
  model: { prop: 'value', event: 'change' },
  watch: {
    value (val) {
      this.customValue = val
    },
    customValue (val) {
      this.$emit('change', val)
    }
  },
  props: {
    type: {
      type: String,
      default: 'text',
      validator (value) {
        return ['text', 'filterable', 'select', 'searchableSelect', 'daterange'].includes(value)
      }
    },
    /** VUE_PROPS -  placeholder */
    placeholder: {
      type: String,
      default: ''
    },
    /** VUE_PROPS -  isUsedSearchIcon: 서치아이콘 사용 여부 */
    isUsedSearchIcon: {
      type: Boolean,
      default: false
    },
    /** VUE_PROPS -  userRestIcon: 서치아이콘 사용 여부 */
    isUsedResetIcon: {
      type: Boolean,
      default: false
    },
    /** VUE_PROPS - size: 사이즈
     ** normal, mini, smalll 사이즈가 있습니다.
     */
    size: {
      type: String,
      default: 'normal',
      validator (value) {
        return ['normal', 'mini', 'small'].includes(value)
      }
    },
    remote: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default () {
        return []
      }
    },
    // searchable
    uniqueKey: { // 선택 시, 실제로 전달되는 값의 키 (없으면 Object 통째로 전달)
      type: String,
      default: 'value'
    },
    value: {
      type: [String, Number, Object, undefined],
      default: ''
    },
    emptyText: {
      type: String,
      default: ''
    },
    popperClass: { // 드롭다운 popper 추가 class
      type: String,
      default: ''
    },
    orgTooltip: {
      type: Boolean,
      default: false
    }
  },
  created () {
    setTimeout(() => {
      this.filterOptions = [...this.filterOptionsDefault, ...this.options]
    })
  },
  mounted () {

  },
  methods: {
    enterEvent (e) {
      if (e.keyCode === 13) this.emitOnce()
    },
    /**
     * 여러번 emit 하면 이벤트가 여러번 발생되므로 방지
     */
    emitOnce () {
      if (!this.isEmmiting) {
        this.isEmmiting = true
        this.$emit('change', this.value)
        setTimeout(() => { this.isEmmiting = false }, 1000)
      }
    },
    refresh () {
      this.$emit('change', undefined)
      this.remoteValue = undefined
      if (this.type === 'searchableSelect') {
        this.filterOptions = []
      }
      this.$emit('input', this.value)
      this.$emit('refresh', this.value)
    },
    remoteMethod (text) {
      this.filterOptions = []
      if (!text) return false

      const options = cloneDeep(this.defaultOptions)
      for (let i = 0; i < options.length; i++) {
        const option = options[i]
        option.label += text
        this.filterOptions.push(option)
      }
      this.remoteValue = text
    },
    inputRemoteValue (text) {
      this.$emit('input', text + ': ' + this.remoteValue)
    }
  },
  data () {
    return {
      filterOptions: this.options,
      customValue: undefined || this.value,
      remoteValue: undefined,
      isEmmiting: false,
      // 기본적으로 옵션에 전체를 포함합니다.
      filterOptionsDefault: [{
        value: '전체',
        label: this.$t('service.INSTALL.COL.all') // 전체
      }]
    }
  }
}
</script>

<style lang="scss" scoped>
.search-area {
  height: 30px;
  display: flex;
  align-items: center;
  margin-right: 12px;
  .search-label {
    margin-right: 8px;
    font-weight: 300;
    white-space: nowrap;
  }
  .-input {
    width: 210px;
    //잘못된 값인거 같은데 사이드이팩있는지 확인하고 수정필요
    &.-mini {
      width: 100%;
    }
    &.-small {
      width: 160px;
    }

    &.-full-width {
      width: 100%;
    }
  }
  .el-date-editor {
    background-color: transparent;
    border: none;
    border-bottom: 1px solid $purple-gray;

    &::v-deep {
      & > *:not(:last-child) {
        color: $white;
      }

      .el-range-input {
        border: none;
        background-color: transparent;

        &::placeholder {
          color: $input-placeholder;
        }
      }
    }
  }
  .search-icon {
    position: relative;
    width: 15px; height: 15px;
    cursor: pointer;
    box-sizing: border-box;
    background-image: url('../../assets/images/icon-search.svg');
  }

  .reset-button {
    display: block;
    width: 14px;
    height: 14px;
    margin-left: 10px;
    background: url('../../assets/images/icon_refresh.svg') no-repeat center / contain;
    transition: transform .3s ease;
    cursor: pointer;
    &:hover { transform: rotate(180deg); }
  }
}
</style>

<style lang="scss">
.search-area {
  .el-input {
    .el-input__inner {
      border: none !important;
      border-radius: 0;
      border-bottom: 1px solid #64676B !important;

      &:focus {
        background-color: transparent;
        color: $white;
        border: none !important;
        border-bottom: 1px solid #64676B !important;
      }
    }
  }
}

</style>
