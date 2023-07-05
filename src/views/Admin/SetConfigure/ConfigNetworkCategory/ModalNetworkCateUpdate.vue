<template>
  <div>
    <vertical-table
      :data="inputCateItem"
      class="profile-vertical-table"
      :columns="modalColumns"
    >
      <template #codeValue>
        <el-input
          v-model.trim="inputCateItem.codeValue"
          :placeholder="$v('네트워크 카테고리 명을 입력하세요')"
          @change="handleChangeInput"
        />
      </template>
      <template #codeName>
        <el-input
          v-model.trim="inputCateItem.codeName"
          :placeholder="$v('코드 값을 입력하세요')"
          @change="handleChangeInput"
        />
      </template>
    </vertical-table>
  </div>
</template>

<script>
import { VerticalTable } from '@sd-fe/cmp-core'
// import { cloneDeep } from 'lodash'
export default {
  components: {
    VerticalTable
  },
  props: {
    selectedCateItem: {
      type: Object,
      default () {
        return {}
      }
    },
    isOpened: {
      type: Boolean,
      default: false
    },
    selectedCateInfo: {
      type: Array,
      default () {
        return []
      }
    },
    cateModalType: {
      type: String,
      default: ''
    }
  },
  watch: {
    isOpened: {
      immediate: true,
      handler (val) {
        if (val) {
          if (this.cateModalType === 'MODIFY') {
            this.inputCateItem = {
              codeValue: this.selectedCateInfo[0].value,
              codeName: this.selectedCateInfo[1].value,
              edit: true
            }
          } else {
            this.inputCateItem = {
              codeValue: null,
              codeName: null,
              edit: true
            }
          }
        } else {
          this.inputCateItem = {
            codeValue: null,
            codeName: null,
            edit: true
          }
        }
      }
    }
  },
  data () {
    return {
      inputCateItem: {
        codeValue: null,
        codeName: null,
        edit: true
      },
      modalColumns: [
        { binding: 'codeValue', header: this.$v('네트워크 카테고리 명'), required: true },
        { binding: 'codeName', header: this.$v('코드 값'), required: true }
      ]
    }
  },
  methods: {
    /** EVENT_HANDLER (인풋변경) 인풋변경 */
    async handleChangeInput () {
      this.$emit('change', this.inputCateItem)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
