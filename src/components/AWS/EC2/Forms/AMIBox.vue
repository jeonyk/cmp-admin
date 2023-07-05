<template>
  <div
    v-if="cloneAmiData"
    class="wrapper"
  >
    <div
      class="box"
      v-for="(ami, index) in itemByPage"
      :key="index"
      :class="{ selected: ami.selected }"
      @click="onSelectAMI(ami, index)"
    >
      <div class="box-inner">
        <div class="box-inner-bit">
          {{ ami.architecture }}
        </div>
        <div class="box-inner-title">
          <el-tooltip
            v-if="ami.name.length > 45"
            effect="light"
            placement="bottom"
            popper-class="shade-popper"
            :content="ami.name"
          >
            <span>
              {{ ami.name.slice(0, 45) }}...
            </span>
          </el-tooltip>
          <span v-else>
            {{ ami.name }}
          </span>
        </div>
        <div class="box-inner-os">
          <div class="box-inner-os__title">
            운영체제
          </div>
          <div class="box-inner-os__value">
            {{ ami.platformDetail }}
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="overflowed"
      class="pagination-wrap"
    >
      <el-pagination
        :current-page="currentPage"
        :total="totalCount"
        :page-size="perPage"
        @current-change="onChangePage"
        layout="prev, pager, next"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AMIBox',
  props: {
    amiData: {
      type: Array,
      required: false,
      default: () => []
    },
    perPage: {
      type: Number,
      default: 9
    },
    selectedSpec: {
      type: Boolean,
      required: true
    },
    selectedAmi: {
      type: Object,
      default: () => null
    }
  },
  filters: {
    sliceAmiName (name) {
      if (typeof name !== 'string') return ''
      return name.length > 55 ? name.slice(0, 55) + '...' : name
    }
  },
  computed: {
    totalCount () {
      return this.amiData.length
    },
    overflowed () {
      return this.totalCount > this.perPage
    },
    itemByPage () {
      const startIndex = (this.currentPage - 1) * this.perPage
      const endIndex = startIndex + this.perPage

      return this.cloneAmiData.slice(startIndex, endIndex)
    }
  },
  watch: {
    amiData: {
      immediate: true,
      handler (ami) {
        this.cloneAmi(ami)
      }
    }
  },
  created () {
  },
  methods: {
    cloneAmi (ami) {
      this.cloneAmiData = ami.map((innerAmi, index) => {
        const data = {
          ...innerAmi,
          index,
          selected: innerAmi.selected || false
        }

        if (this.selectedAmi && this.selectedAmi.imageId === innerAmi.imageId) {
          data.selected = true
        }

        return data
      })
      this.cloneAmiData.sort((a, b) => {
        if (a.selected) return -1
        else if (b.selected) return 1
        return 0
      })

      const hasSelected = this.cloneAmiData.filter(ami => ami.selected)

      if (hasSelected) {
        this.selectedItem = hasSelected[0]
      }
    },
    onChangePage (page) {
      this.currentPage = page
    },
    onSelectAMI (ami, index) {
      if (this.selectedItem && this.selectedSpec) {
        this.$confirm('AMI를 변경하는 경우<br>기존에 선택하는 모든 값이 초기화됩니다.<br>진행하시겠습니까?', { dangerouslyUseHTMLString: true })
          .then(() => {
            this.selectAMI(ami, index, true)
          })
          .catch(() => false)
      } else {
        this.selectAMI(ami, index)
      }
    },
    selectAMI (ami, index, hardReset = false) {
      const selected = ami.selected
      const pageIndex = ((this.currentPage - 1) * this.perPage) + index
      this.allUnSelect()
      ami.selected = !selected
      this.selectedItem = selected ? null : this.cloneAmiData[pageIndex]
      this.$emit('select-ami', selected ? null : this.cloneAmiData[pageIndex], hardReset)
    },
    allUnSelect () {
      this.cloneAmiData.forEach(ami => (ami.selected = false))
    }
  },
  data: () => ({
    cloneAmiData: null,
    currentPage: 1,
    selectedItem: null
  })
}
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-wrap: wrap;
  margin-top: $gap-s;

  > .box {
    flex: 0 0 calc(33% - 5px);
    min-height: 140px;
    max-height: 140px;
    overflow: hidden;
    background-color: #232642;
    margin: 0 $gap-s $gap-s 0;
    cursor: pointer;
    transition: all 300ms ease;
    border-radius: 6px;
    position: relative;

    .box-inner {
      display: block;
      padding: $gap;

      &-bit {
        color: $purple;
        font-weight: bold;
      }

      &-title {
        margin: 5px 0;
        font-weight: bold;
        word-break: break-word;
      }

      &-os {
        position: absolute;
        bottom: 0;
        left: $gap;
        width: calc(100% - #{$gap * 2});
        padding-top: $gap-s;
        margin-bottom: $gap;
        border-top: 1px solid #2A2D44;
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;

        &__title {
          color: $input-placeholder;
        }
      }
    }

    &.selected,
    &:hover {
      background-color: #0A0C20;
      box-shadow: 3px 3px 20px rgba(11, 1, 1, 0.15);
    }
  }

  > :nth-child(3n) {
    margin-right: 0;
  }

  .pagination-wrap {
    margin: $gap auto;
    width: 100%;
  }
}
</style>
