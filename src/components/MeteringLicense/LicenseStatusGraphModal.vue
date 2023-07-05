<template>
  <el-dialog
    :title="$v('카테고리 관리')"
    :visible.sync="visible"
    width="800px"
    :before-close="() => $emit('close')"
  >
    <!-- v-loading="isDefaultUsedDetail" -->
    <section class="modal-body">
      <div
        class="flex-wrap -flex-end button-area"
        style="margin-bottom: 10px;"
      >
        <button
          class="button"
          type="is-primary"
          v-if="!editable"
          @click="editable = !editable"
        >
          {{ $v('추가') }}
        </button>
        <button
          class="button"
          type="is-primary"
          v-else
          @click="editable = !editable"
        >
          {{ $v('적용') }}
        </button>
        <button
          class="button"
          v-if="!editable"
          :disabled="!checkedData.length || checkedData.length > 1"
        >
          {{ $v('변경') }}
        </button>
        <button
          v-else
          class="button"
          :disabled="!checkedData.length || checkedData.length > 1"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          :disabled="editable"
        >
          {{ $v('삭제') }}
        </button>
      </div>

      <cmp-grid
        :item-source="data"
        :columns="columns"
        header-checkbox
        @checkedRowsData="checkedRowsData"
      />
    </section>

    <div class="modal-footer modal-button-area">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
      >
        {{ $v('추가') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'AddMeteringLicenseModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    checkedRowsData (rows) {
      this.checkedData = cloneDeep(rows)
      console.log(this.checkedData)
    }
  },
  data: root => ({
    editable: false,
    columns: [{ header: root.$v('카테고리'), binding: 'category' }],
    data: [
      { category: '-' },
      { category: '-' },
      { category: '-' },
      { category: '-' }
    ],
    checkedData: []
  })
}
</script>
