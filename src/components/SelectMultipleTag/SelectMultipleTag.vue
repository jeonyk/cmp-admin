<template>
  <div
    class="select-multiple-tag"
    @mousedown.self.prevent="handleClickInputContainer"
    :class="{'is-focused': isFocused}"
    :style="{width: width, height: height}"
  >
    <el-tag
      v-for="(tag,index) in selectedTags"
      :key="index"
      closable
      @close="(e)=> handleCloseTag(e, index)"
      class="tags"
    >
      {{ tag }}
    </el-tag>
    <el-input
      class="tag-value-input"
      ref="tagValueInput"
      v-model="inputValue"
      :placeholder="selectedTags.length===0? placeholder:afterPlaceholder"
      @change="(e)=> inputvalue = e"
      @focus="isFocused = true"
      @blur="handleBlurInput"
      @keypress.native.enter="handleKeypressEnter"
      @keydown.native.backspace="test"
    />
  </div>
</template>

<script>
export default {
  model: {
    props: 'value',
    event: 'change'
  },
  props: {
    value: {
      type: Array,
      default () {
        return []
      }
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: 'auto'
    },
    placeholder: {
      type: String,
      default: ''
    },
    afterPlaceholder: {
      type: String,
      default: ''
    }
  },
  methods: {
    handleBlurInput (e) {
      console.log('handleBlurInput3', e)
      console.log(event)
      if (this.isFocused === true) { this.isFocused = false }
    },
    test (e) {
      if (!this.inputValue) {
        this.selectedTags.pop()
        this.$emit('change', this.selectedTags)
      }
      console.log(e)
    },
    handleKeypressEnter (e) {
      if (this.inputValue) {
        this.selectedTags.push(this.inputValue)
        this.$emit('change', this.selectedTags)
        this.inputValue = ''
      }
    },
    handleClickInputContainer () {
      console.log(this.$refs.tagValueInput)
      if (this.isFocused === false) {
        this.$refs.tagValueInput.focus()
        this.isFocused = true
      }
    },
    handleCloseTag (e, index) {
      console.log(e)
      this.selectedTags.splice(index, 1)
    }
  },
  data () {
    return {
      inputValue: '',
      selectedTags: this.value,
      isFocused: false
    }
  }
}
</script>

<style lang='scss' scoped>
.select-multiple-tag {
  cursor: pointer;
  display: flex;
  flex-wrap:wrap;
align-content: flex-start;
  box-sizing: border-box;
  width: 400px;
  padding: 8px;
  border: 1px solid #3D435E;
  border-radius: 2px;
  transition: 0.05s ease-in-out border;
  &:hover {
    border: 1px solid white;
  }

  .tags {
    display: flex;
    align-items: center;
  }

  .tag-value-input {
    display: flex;
    width: 30px;
    min-width: 40px;
    flex-grow:1;
    &::v-deep {
      .el-input__inner {
        box-sizing: border-box;
        border: 0px;
        padding: 12px;
        font-size: 16px;
        background: none !important;
        color: white;
      }
    }
  }
  &.is-focused {
    background: white;
    .tag-value-input {
      &::v-deep {
        .el-input__inner {
          color: black;
        }
      }
    }
  }
}
</style>
