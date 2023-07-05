<template>
  <!-- @close="$emit('close')"
    @closed="$emit('closed')" -->
  <el-dialog
    :visible="active"
    title="1차 배부 관계사 변경"
    v-loading="isLoading"
    :show-close="false"
  >
    <div class="select-aff">
      <div class="selected">
        <span class="selected-label">
          선택 관계사
        </span>
        <div class="selected-aff">
          <div
            class="selected-aff-inner"
            v-for="(group,idx) in tagList"
            :key="idx"
          >
            <clearable-tag
              v-if="group.groupIdx !== 0"
              :content="group.groupName"
              :unique-key="group.groupIdx"
              @clear="removeTag(group.groupName)"
            />
          </div>
        </div>
      </div>
      <div class="search">
        <wj-flex-grid-search
          ref="affSearch"
          class="search-inner"
          id="affSearch"
          placeholder="관계사 이름"
        />
        <search-icon />
        <refresh-icon
          is-button
          style="margin-left: 10px;"
        />
      </div>
      <div class="grid">
        <cmp-grid
          :columns="[{ binding: 'groupName', header: '관계사', align: 'left' }]"
          :item-source="tableList"
          searching
          search-box-id="affSearch"
          selectable
          @selectedRow="selectRow"
          paging-type="list"
          :height="300"
        />
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        완료
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
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
    selectedAff: {
      type: Array,
      default: () => {
        return []
      },
      required: true
    }
  },
  computed: {
    tagNameList () {
      return this.selected.map(group => group.groupName)
    },
    tagList () {
      const result = this.selected
      return result || []
    },
    tableList () {
      return this.companyList.filter(c => !this.tagNameList.includes(c.groupName))
    }
  },
  watch: {
    async active (newVal) {
      if (!newVal) {
        // this.selected = []
        this.$refs.affSearch.control.text = ''
      }
    },
    selectedAff: {
      deep: true,
      immediate: true,
      handler (newVal) {
        if (newVal) {
          this.selected = newVal
        }
      }
    }
  },
  async created () {
    this.clonedData = cloneDeep(this.selected)
    this.companyList = await this.getGroupList({ groupUpper: 0 })
  },
  methods: {
    /**
     * API : 관계사/조직 정보를 조회합니다.
     */
    async getGroupList (param) {
      try {
        this.isGroupLoading = true
        const result = await API.iam.getGroupList(param)
        if (!result) return []
        return result.map(g => {
          return {
            groupName: g.groupName,
            groupIdx: g.groupIdx,
            amount: 1,
            isSelected: false
          }
        })
      } catch (error) {
        console.error(error)
      } finally {
        this.isGroupLoading = false
      }
    },
    save () {
      this.$emit('save', this.selected)
    },
    close () {
      this.$emit('close')
    },
    selectRow (row) {
      const group = row._data
      this.selected.push(group)
    },
    removeTag (groupName) {
      this.selected = this.selected.filter(g => g.groupName !== groupName)
    }

  },
  data () {
    return {
      isGroupLoading: false,
      companyList: [],
      useAllCompany: [],
      groupNames: [],
      selected: [],
      isLoading: false
    }
  }
}
</script>

<style lang="scss" scoped>
.select-aff {
  .selected {
    display: flex;
    align-items: center;
    .selected-label {
      display: inline-flex;
      align-self: flex-start;
      min-width: 70px;
      padding-top: $gap-s;
    }

    .selected-aff {
      margin-left: $gap-s;
      display: flex;
      flex-wrap: wrap;
       .selected-aff-inner {
          margin-right: 5px;
       }
    }
  }

  .search {
    margin: 30px 0 15px 0;
    .search-inner {
      max-width: 210px;
    }
  }
}
</style>
