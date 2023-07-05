<!--
  * 파일명 : GTable.vue
  * 파일 기능 :
  * 작성자 : 김진범 외 1명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 push~
 -->

<template>
  <div class="smc-table">
    <table class="table-main">
      <thead class="table-head">
        <tr>
          <th
            v-if="useCheckbox"
            :class="['table-head-item', 'table-head-checkbox']"
          >
            <template v-if="useCheckboxSelectAll">
              <input
                type="checkbox"
                @input="setCheckAll"
                v-model="checkAll"
              >
            </template>
          </th>
          <th
            v-for="column in columns"
            :key="'header-' + column.field"
            :class="['table-head-item', 'table-head-' + column.field, column.cls]"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="table-body">
        <tr
          v-for="(row, rowIndex) in data"
          :key="'row-' + rowIndex"
          :class="[
            'table-body-row',
            {'-selected': isSelectedRow(rowIndex)}
          ]"
          @click="selectRow(row, rowIndex)"
        >
          <td
            v-if="useCheckbox"
            :class="['table-body-item', 'table-body-checkbox']"
          >
            <input
              type="checkbox"
              v-model="checkedRowsStatus[row[dataKey]]"
              @click.stop="e => e"
            >
          </td>
          <td
            v-for="column in columns"
            :key="column.field"
            :class="['table-body-item', 'table-body-column-' + column.field, column.cls]"
          >
            <!-- <slot
              v-if="column.isSelect"
              :name="column.field"
              :row="row"
              :column="column"
            /> -->
            <slot
              :name="column.field"
              :row="row"
              :column="column"
            >
              {{ row[column.field] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'GTable',
  props: {
    // v-model로서 사용됨. row를 클릭하면 해당 row가 value로 자동 업데이트됩니다.
    value: {
      type: Object,
      default () {
        return { gTableValueDefault: true }
      }
    },

    // 테이블에 표시할 data
    data: {
      type: Array,
      default () {
        return []
      }
    },

    // useCheckbox 설정시 각 data의 고유값과 ckeckedRows를 매칭하기 위한 각 row의 uniqueKey.
    dataKey: {
      type: String,
      default: ''
    },

    // table columns
    columns: {
      type: Array,
      required: true,
      defualt () {
        return []
      }
    },

    // useCheckbox 사용시 체크된 rows들에 대한 데이터를 교환하기 위해 사용합니다.
    // attr 지정시 반드시 .sync 옵션이 필요합니다.
    checkedRows: {
      type: Array,
      default () {
        return []
      }
    },

    // checkbox 사용 여부
    useCheckbox: {
      type: Boolean,
      default: false
    },
    useCheckboxSelectAll: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    isSelectedRow (index) {
      return (this.selectedRow === index)
    },
    selectRow (row, index) {
      if (this.value.gTableValueDefault) return false
      this.selectedRow = index
      this.$emit('input', row)
    },
    setCheckAll (e) {
      // console.log('@setCheckAll', e, this.checkAll)
      this.data.forEach(item => {
        this.checkedRowsStatus[item[this.dataKey]] = !this.checkAll
      })
    }
  },
  watch: {
    checkedRowsStatus: {
      deep: true,
      handler (newval) {
        const arr = []
        for (const key in this.checkedRowsStatus) {
          if (this.checkedRowsStatus[key]) arr.push(this.dataByKey[key])
        }
        this.$emit('update:checked-rows', arr)
      }
    },
    data () {
      for (const key in this.checkedRowsStatus) {
        if (!this.dataByKey[key]) {
          delete this.checkedRowsStatus[key]
        }
      }
      this.checkedRowsStatus = { ...this.checkedRowsStatus }
    }
  },
  computed: {
    dataByKey () {
      if (!this.dataKey) return {}
      const result = {}
      this.data.forEach(item => {
        result[item[this.dataKey]] = item
      })
      return result
    }
  },
  data () {
    return {
      selectedRow: {},
      checkedRowsStatus: {},
      checkAll: false
    }
  }
}
</script>

<style lang="scss">
  .smc-table {
    position: relative;
    .table-main {
      width: 100%;
      .table-head {
        font-weight: bold;
        font-size: 0.85em;
        line-height: 32px;
        .table-head-item {
          padding: 0.25em 0.5em;
          position: sticky;
          top: 0;
          box-shadow: 0 1px 0 $c-line;
          background: $panel-bg;
        }
      }
      .table-body {
        font-size: 0.85em;
        line-height: 2em;
        .table-body-row {
          &.-selected {
            background-color: $c-primary;
            color: $c-text-inverted;
            font-weight: bold;
          }
          .table-body-item {
            padding: 0.25em 0.5em;
            &:first-of-type {
              border-top-left-radius: 5px;
              border-bottom-left-radius: 5px;
            }
            &:last-of-type {
              border-top-right-radius: 5px;
              border-bottom-right-radius: 5px;
            }
          }
        }

      }
    }
  }
</style>
