<template>
  <el-dialog
    width="480px"
    :title="modalTitle"
    :visible="active"
    @opened="getDetail(currentItem)"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <div
      v-loading="isLoadingGetDetail"
      v-if="item"
      class="detail-version"
    >
      <register-contents
        :title="'CMP ' + $t('common.TERMS.version')"
        type="input"
        required
      >
        <el-input
          disabled
          :value="item.cmpVersion"
        />
      </register-contents>
      <register-contents
        :title="$t('license.PLACEHOLDER.selectModule')"
        type="input"
        required
      >
        <div class="module-count">
          {{ $t("license.TEXT.itemCount", { item: item.moduleCount }) }}
        </div>
      </register-contents>
      <register-contents type="input">
        <div
          v-if="mod"
          class="custom-contents pushed-modules"
        >
          <div
            v-for="moduleItem in mod.moduleList"
            :key="moduleItem.moduleIdx"
            class="pushed-modules-item"
          >
            <span>{{ moduleItem.moduleName }} ({{
              moduleItem.moduleVersion | printVersion
            }})</span>
            <type-items
              v-if="moduleItem.packageTypeList"
              :items="moduleItem.packageTypeList"
            />
          </div>
        </div>
      </register-contents>
      <register-contents
        :title="$t('common.GRID.explain')"
        type="input"
        required
      >
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          :disabled="!editMode"
          :placeholder="$t('license.PLACEHOLDER.enterUpdateExplain')"
        />
      </register-contents>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t("common.BTN.close") }}
      </button>
      <button
        v-if="!editMode"
        class="button"
        type="is-primary"
        @click="startEditMode"
      >
        {{ $t("common.BTN.modify") }}
      </button>
      <button
        v-else
        class="button"
        type="is-primary"
        @click="endEditMode"
      >
        {{ $t("common.BTN.complete") }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import TypeItems from '@/components/Package/Version/TypeItems.vue'
import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  props: {
    active: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      required: false,
      default: null
    }
  },
  filters: {
    printVersion (value) {
      return 'v.' + value
    }
  },
  components: { TypeItems },
  watch: {
    active (visible) {
      if (!visible) {
        this.editMode = false
        this.currentItem = null
        this.mod = []
      } else {
        this.currentItem = cloneDeep(this.item)
        this.newComment = this.currentItem.comment
        this.isLoadingGetDetail = true
      }
    }
  },
  computed: {
    modalTitle () {
      return this.item
        ? this.editMode
          ? this.item.cmpVersion + ` ${this.$t('common.BTN.modify')}`
          : this.item.cmpVersion + ` ${this.$t('common.BTN.detail')}`
        : this.$t('common.BTN.detail')
    }
  },
  methods: {
    startEditMode () {
      this.editMode = true
    },
    endEditMode () {
      this.$emit('end-edit', this.newComment, this.currentItem.cmpVersionIdx)
    },
    async getDetail (currentItem) {
      const { cmpVersionIdx } = currentItem

      if (!cmpVersionIdx) {
        this.$emit('close')
      } else {
        try {
          this.isLoadingGetDetail = true
          const { data } = await API.license.getDetailVersion(cmpVersionIdx)
          this.mod = data
        } catch (error) {
          console.error(error)
        } finally {
          this.isLoadingGetDetail = false
        }
      }
    }
  },
  data: () => ({
    editMode: false,
    currentItem: null,
    isLoadingGetDetail: false,
    mod: [],
    newComment: ''
  })
}
</script>

<style lang="scss" scoped>
.detail-version {
  & .register-contents {
    &:nth-of-type(2) {
      &::v-deep .contents {
        display: flex;
        align-items: center;
      }
    }

    &::v-deep .contents-title {
      align-items: flex-start;
      width: 60px;
      min-width: 60px;
      padding: 10px;
    }

    &::v-deep .contents {
      padding: 5px 20px;
      padding-right: 0;
    }

    & .custom-contents {
      height: 100px;
      width: 100%;
      background: rgba($dark-slate, $alpha: 0.6);
      border: 1px solid $purple-gray;
      box-sizing: border-box;
      border-radius: 2px;
      color: $input-placeholder;
      padding: $gap-s;
      overflow-y: auto;

      &.pushed-modules {
        & .pushed-modules-item {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 6px;

          &::v-deep {
            .type-badge {
              margin-top: 2px;
            }
          }

          & > span {
            margin-right: $gap-s;
            white-space: break-spaces;
          }
        }
      }
    }

    &:last-of-type {
      padding-bottom: $gap-s;
      border-bottom: 1px solid $purple-gray;
    }
  }
}
</style>
