<template>
  <el-dialog
    :visible="active"
    @close="$emit('close')"
    width="660px"
    title="Cloud Init Script 템플릿 불러오기"
  >
    <div class="fetch-modal">
      <filtering-component
        @reset-data="() => {
          filterName = ''
          onSearchFilterName('')
        }"
      >
        <div class="filter-form">
          <span class="filter-name">
            {{ $v('제목') }}
          </span>
          <search-component
            v-model="filterName"
            :placeholder="$v('제목을 입력해주세요.')"
            @input="onSearchFilterName"
          />
        </div>
      </filtering-component>
      <cmp-grid
        ref="scriptGrid"
        :columns="scriptColumns"
        :item-source="filteredScriptList"
        selectable
        @selectedRow="onSelectedRow"
        @total-count="onCollectionChanged"
      />
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="onCloseCancel"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="!selectedRow"
          @click="onClickApplyCloudInit"
        >
          {{ $v('적용') }}
        </button>
      </section>
    </div>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import Fuse from 'fuse.js'

export default {
  name: 'CloudInitFetchModal',
  props: {
    active: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    active: {
      immediate: true,
      handler (visible) {
        if (!visible) {
          this.filterName = ''
          this.onSelectedRow(null)
          this.isSetFilter = false

          if (this.$refs.scriptGrid) {
            this.$refs.scriptGrid.setAllRowDefault(this.$refs.scriptGrid.grid.rows)
          }
        }
      }
    },
    filteredScriptList () {
      if (this.isSetFilter) {
        if (this.selectedRow && this.selectedRow.dataItem) {
          const data = this.selectedRow.dataItem.userInitScriptIdx
          const find = this.filteredScriptList.findIndex(script => script.userInitScriptIdx === data)

          if (find !== -1) {
            this.initSelect = find
          } else {
            this.initSelect = -1
          }
        }
      }
    }
  },
  computed: {
    filteredScriptList () {
      if (this.isSetFilter) {
        const fuse = new Fuse(this.scriptList, {
          keys: ['initScriptName']
        })

        const result = fuse.search(this.filterName).map(node => node.item)
        return result
      } else return this.scriptList
    }
  },
  created () {
    this.getCloudInitScripts()
  },
  methods: {
    onCollectionChanged () {
      if (this.initSelect !== -1) {
        this.$refs.scriptGrid.selectableHandler({ row: this.initSelect }, this.$refs.scriptGrid.grid.rows)
      }
      this.initSelect = -1
    },
    async getCloudInitScriptDetail (id) {
      this.isLoadingScript = true

      try {
        const { data } = await API.script.getScriptDetail(id)
        return data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('스크립트 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingScript = false
      }
    },
    /**
     * Cloud Init Script 조회
     */
    async getCloudInitScripts () {
      this.isLoadingScript = true

      try {
        const { data } = await API.script.getScriptList()
        this.scriptList = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('스크립트 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingScript = false
      }
    },
    onSelectedRow (row) {
      this.selectedRow = row
    },
    onSearchFilterName (filterName) {
      if (!filterName) this.isSetFilter = false
      else this.isSetFilter = true
    },
    onCloseCancel () {
      this.$emit('close')
    },
    async onClickApplyCloudInit () {
      if (!this.selectedRow || !this.selectedRow.dataItem) return
      const initScript = await this.getCloudInitScriptDetail(this.selectedRow.dataItem.userInitScriptIdx)
      this.$emit('apply', initScript)
      this.$emit('close')
    }
  },
  data: (root) => ({
    isLoadingScript: false,
    scriptColumns: [
      { binding: 'initScriptName', header: root.$v('제목') },
      { binding: 'description', header: root.$v('설명') }
    ],
    scriptList: [],
    selectedRow: null,
    filterName: '',
    isSetFilter: false,
    initSelect: -1
  })
}
</script>

<style lang="scss" scoped>
.fetch-modal {}
</style>
