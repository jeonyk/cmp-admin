<template>
  <div class="config-network-cate-env">
    <cmp-grid
      v-loading="isLoadingEnvGrid"
      :item-source="envVarGridData"
      :columns="envConfColumn"
      header-checkbox
      :paging-size="7"
      class="content-area"
      :use-excel-download="false"
      @checkedRowsData="handleCheckRows"
      :changing-page-reset="false"
    >
      <template
        v-for="(column) in envConfColumn"
        :slot="column.binding"
        slot-scope="props"
      >
        <div
          v-if=" column.binding !== 'isEncrypted'"
          :key="column.binding"
        >
          <el-input
            v-if="isActiveInput && props.row.isSelected"
            v-model="props.row[column.binding]"
            :placeholder="column.placehoder"
            size="mini"
            @input="handleChangeInput"

            @click="
              e => {
                e.stopPropagation();
                e.preventDefault();
              }
            "
          />

          <span
            v-else
            v-html="props.row[column.binding]"
          />
        </div>
        <el-checkbox
          v-else
          v-model="props.row[column.binding]"
          :key="column.binding"
          :disabled="!isActiveInput || !props.row.isSelected"
        />
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
export default {

  computed: {
    isActiveInput () {
      return this.isEditEnv
    }
  },
  props: {
    isEditEnv: {
      type: Boolean,
      default: false
    },
    isNewRow: {
      type: Boolean,
      default: true
    },
    selectedCateItem: {
      type: Object,
      default () {
        return null
      }
    },
    isDeletedBefore: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    selectedCateItem: {
      deep: true,
      immediate: true,
      handler () {
        console.log('카테고리 변경')
        return this.setEnvVarGridData()
      }
    },
    isDeletedBefore (val) {
      console.log('isDeletedBefore변경', val)
      if (!val) {
        console.log('isDeletedBefore변경점', val)
        this.setEnvVarGridData()
        this.newEnvItem = { varKey: '', envInput: '', comment: '', isEncrypted: false, isSelected: true }
      }
    },
    isEditEnv (val) {
      if (val) {
        if (this.isNewRow) { // 추가일경우
          this.addInputGrid()
        } else { // 변경일 경우
          const cehckedIndex = this.checkedRows[0].index
          this.envVarGridData[cehckedIndex].isSelected = true
          this.newEnvItem = this.envVarGridData[cehckedIndex]
          this.$emit('change', this.newEnvItem)
        }
      } else {
        // 초기화
        this.setEnvVarGridData()
        this.newEnvItem = { varKey: '', envInput: '', comment: '', isEncrypted: false, isSelected: true }
      }
    }
  },
  methods: {
    /** EVENT_HANDLER (EMIT) 체크 클릭시 이벤트 전파 */
    handleCheckRows (checkedList) {
      this.checkedRows = checkedList || []
      this.$emit('checkRows', this.checkedRows)
    },
    addInputGrid () {
      this.envVarGridData.unshift(this.newEnvItem)
    },
    handleChangeInput () {
      this.$emit('change', this.newEnvItem)
    },
    async setEnvVarGridData () {
      try {
        this.isLoadingEnvGrid = true
        this.envVarGridData = await this.getEnvVarsCate(this.selectedCateItem.cateIdx)
        this.handleCheckRows()
      } catch (error) {

      } finally {
        this.isLoadingEnvGrid = false
      }
    },
    /** API_HANDLER (GET) 카테로리로 */
    async getEnvVarsCate (ipCategoryIdx) {
      try {
        const result = await API.network.getEnvVarsCate(ipCategoryIdx)
        this.$emit('apiGetAfter', true)
        return result
      } catch (error) {
        console.log(error)
        this.$emit('apiGetAfter', false)
        this.$alert('환경변수를 불러올 수 없습니다.')
      }
    }

  },
  data () {
    return {
      newEnvItem: { varKey: '', envInput: '', isEncrypted: false, comment: '', isSelected: true },
      envVarGridData: [],
      envConfColumn: [
        { header: this.$v('변수명'), placehoder: this.$v('변수명 입력'), binding: 'varKey', width: 200, customHtml: true },
        { header: this.$v('변수값'), placehoder: this.$v('변수값 입력'), binding: 'varValue', width: 200, customHtml: true },
        { header: this.$v('암호화 여부'), binding: 'isEncrypted', width: 100, customHtml: true },
        { header: this.$v('비고'), placehoder: this.$v('비고 입력'), binding: 'comment', width: '*', customHtml: true }

      ],
      setCheckedRows: [],
      checkedRows: [],
      editStatus: true,
      isLoadingEnvGrid: false
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
