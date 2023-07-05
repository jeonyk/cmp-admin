
<template>
  <div class="search-area">
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
      v-if="userSearchIcon"
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
        return ['text', 'filterable', 'select'].includes(value)
      }
    },
    placeholder: {
      type: String,
      default () {
        return this.$t('service.INSTALL.PLACEHOLDER.007') // '소프트웨어를 입력하세요'
      }
    },
    userResetIcon: {
      type: Boolean,
      default: true
    },
    userSearchIcon: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'normal',
      validator (value) {
        return ['normal', 'mini'].includes(value)
      }
    },
    fullWidth: {
      type: Boolean,
      default: false
    }
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
      defaultOptions: [{
        value: '전체:',
        label: this.$v('전체') + ': '
      }, {
        value: '호스트명:',
        label: this.$v('호스트명') + ': '
      }, {
        value: '설치 프로그램:',
        label: this.$v('설치프로그램 명') + ': '
      }, {
        value: '설치 스크립트:',
        label: this.$v('설치 스크립트') + ': '
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

  .-input {
    width: 210px;
    &.-mini {
      width: 100%;
    }

    &.-full-width {
      width: 100%;
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
