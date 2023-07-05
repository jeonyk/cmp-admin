<template>
  <el-dialog
    :visible="active"
    @close="$emit('close')"
    @closed="$emit('closed')"
    :title="$t('common.BTN.BILL.selectAff')"
  >
    <div class="select-aff">
      <div class="selected">
        <span class="selected-label">
          {{ $t('bill.selectedAff') }}
        </span>
        <div class="selected-aff">
          <div
            v-for="group in selected"
            :key="group.groupIdx"
          >
            <clearable-tag
              :content="group.companyName"
              :unique-key="group.groupIdx"
              @clear="clearTag"
            />
          </div>
        </div>
      </div>
      <div class="search">
        <wj-flex-grid-search
          ref="affSearch"
          id="affSearch"
          :placeholder="$t('bill.affName')"
        />
        <search-icon />
        <refresh-icon
          is-button
          style="margin-left: 10px;"
          @click="onResetFilter"
        />
      </div>
      <div class="grid">
        <cmp-grid
          :columns="[{ binding: 'companyName', header: '관계사', align: 'left' }]"
          :item-source="oneDepthAff"
          searching
          search-box-id="affSearch"
          paging-type="list"
          selectable
          :use-column-filter="false"
          :height="500"
          @selectedRow="selectedRow"
        />
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="accept"
      >
        {{ $t('common.BTN.complete') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import { cloneDeep } from 'lodash'

export default {
  components: { SearchIcon, RefreshIcon },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    activeProject: {
      type: Object,
      default: () => ({})
    },
    selectedAff: {
      type: Array,
      required: true
    },
    affList: {
      type: Array,
      required: true
    }
  },
  watch: {
    active (visible) {
      if (!visible) {
        this.selected = []
        this.$refs.affSearch.control.text = ''
      } else {
        if (this.selectedAff.length) {
          this.selected = cloneDeep(this.selectedAff.filter(group => !group.isSecond && group.groupIdx))
        }
      }
    }
  },
  computed: {
    oneDepthAff () {
      if (!this.activeProject) return []

      // const groups = this.activeProject.distributeGroups
      const groups = this.affList
      const converted = groups
        .map(group => ({ groupIdx: group.groupIdx, companyName: group.groupName, amount: 1 }))
        .filter(group => this.selected.findIndex(selectedGroup => selectedGroup.groupIdx === group.groupIdx) === -1)

      return converted
    }
  },
  methods: {
    onResetFilter () {
      this.$refs.affSearch.control.text = ''
    },
    selectedRow ({ dataItem }) {
      this.selected.push(dataItem)
    },
    clearTag (groupIdx) {
      this.selected = this.selected.filter(select => select.groupIdx !== groupIdx)
    },
    accept () {
      if (!this.active) return

      this.$emit('accept', this.selected)
    }
  },
  data: () => ({
    selected: []
  })
}
</script>

<style lang="scss" scoped>
.select-aff {
  .selected {
    display: flex;
    align-items: center;

    &-label {
      display: inline-flex;
      align-self: flex-start;
      min-width: 70px;
      padding-top: $gap-s;
    }

    &-aff {
      margin-left: $gap-s;
      display: flex;
      flex-wrap: wrap;

      > div {
        margin-right: 5px;
      }
    }
  }

  .search {
    margin: 30px 0 15px 0;

    #affSearch {
      max-width: 210px;
    }
  }
}
</style>
