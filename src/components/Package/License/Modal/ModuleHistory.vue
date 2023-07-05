<template>
  <el-dialog
    :title="$t('license.TEXT.updateHistory')"
    width="1100px"
    :visible="active"
    @close="$emit('close')"
  >
    <div class="update-history">
      <cmp-grid
        :item-source="moduleHistory"
        :columns="columns"
      >
        <template #no="{ row }">
          {{ row.index + 1 }}
        </template>
        <template #moduleCount="{ row }">
          <el-tooltip
            effect="light"
            placement="right"
          >
            <span>{{ row.moduleCount }}</span>
            <div
              style="padding: 5px;"
              slot="content"
            >
              <div
                v-for="mod in row.moduleList"
                :key="mod.moduleIdx"
              >
                {{ mod.moduleName }}
              </div>
            </div>
          </el-tooltip>
        </template>
        <template #comment="{ row }">
          <el-tooltip
            v-if="row.comment"
            effect="light"
            placement="right"
            :disabled="row.comment.length < 40"
          >
            <span>{{ row.comment }}</span>
            <div
              style="grid-comment"
              slot="content"
            >
              {{ row.comment }}
            </div>
          </el-tooltip>
        </template>
        <template #updateTime="{ row }">
          <span>{{ row.updateTime | dateSimple('YYYY-MM-DD') }}</span>
        </template>
        <template #adminName="{ row }">
          {{ row.adminName }}({{ row.adminId | maskingName }})
        </template>
      </cmp-grid>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.close') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import columns from './ModuleHistory.column'
import Dayjs from 'dayjs'
import { cloneDeep } from 'lodash'

export default {
  props: {
    active: {
      type: Boolean,
      required: true
    },
    history: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  created () {
    this.moduleHistory = cloneDeep(this.history)
  },
  filters: {
    dateFormat (date) {
      return Dayjs(new Date(date)).format('YYYY-MM-DD').toString()
    }
  },
  data: root => ({
    columns: columns(root),
    moduleHistory: null
  })
}
</script>

<style lang="scss" scoped>
.update-history {
  padding-bottom: 35px;
  border-bottom: 1px solid $purple-gray;

  .grid-comment {
    padding: 5px;
    overflow: hidden;
    display: block;
  }
}
</style>
