
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
      v-model="value"
      @input="e => $emit('input', value)"
      @change="emitOnce()"
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
    <el-select
      v-else
      v-model="value"
      :placeholder="placeholder"
      :class="['-input', `-${size}`, { '-full-width' : fullWidth }]"
      remote
      :filterable="type === 'filterable'"
      :popper-append-to-body="false"
      :remote-method="remoteMethod"
      @input="inputRemoteValue"
    >
      <el-option
        v-for="item in options"
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
      v-if="userResetIcon"
      class="reset-button"
      @click="refresh"
    />
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'SearchBar',
  props: {
    type: {
      type: String,
      default: 'text',
      validator (value) {
        return ['text', 'filterable', 'select', 'daterange'].includes(value)
      }
    },
    placeholder: {
      type: String,
      default () {
        return this.$t('service.INSTALL.PLACEHOLDER.007') // '소프트웨어를 입력하세요'
      }
    },
    isUsedSearchIcon: {
      type: Boolean,
      default: true
    },
    userResetIcon: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'normal',
      validator (value) {
        return ['normal', 'mini', 'small'].includes(value)
      }
    },
    label: {
      type: String,
      default: ''
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    optionsSet: {
      type: Array,
      default () {
        return [{
          value: '전체:',
          label: this.$t('service.INSTALL.COL.all') + ': ' // 전체
        }]
      }
    }
  },
  // created () {
  //   this.options
  // },
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
      this.value = undefined
      this.remoteValue = undefined
      this.options = []
      this.$emit('input', this.value)
      this.$emit('refresh', this.value)
    },
    remoteMethod (text) {
      this.options = []
      if (!text) return false

      const options = cloneDeep(this.defaultOptions)
      for (let i = 0; i < options.length; i++) {
        const option = options[i]
        option.label += text
        this.options.push(option)
      }
      this.remoteValue = text
    },
    inputRemoteValue (text) {
      this.$emit('input', text + this.remoteValue)
    }
  },
  data () {
    return {
      options: [],
      filterOpstions: [],
      defaultOptions: [{
        value: '전체:',
        label: this.$t('service.INSTALL.COL.all') + ': ' // 전체
      }, {
        value: '호스트명:',
        label: this.$t('service.INSTALL.COL.hostname') + ': ' // 호스트명
      }, {
        value: '설치 프로그램:',
        label: this.$t('service.INSTALL.COL.installProgram') + ': ' // 설치 프로그램
      }, {
        value: '설치 스크립트:',
        label: this.$t('service.INSTALL.COL.installScript') + ': ' // 설치 스크립트
      }],
      value: undefined,
      remoteValue: undefined,
      isEmmiting: false
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
      border: none;
      border-radius: 0;
      border-bottom: 1px solid #64676B;

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
