<template>
  <section
    v-loading="isLoadingBillData"
    class="project-bill"
  >
    <div class="heading">
      <div class="title">
        프로젝트 별 청구금액
      </div>
      <div class="filter">
        <span>검색일</span>
        <el-date-picker
          v-model="filterDate"
          type="monthrange"
          range-separator="~"
          popper-class="date-popper-log-check"
          :picker-options="pickerOptions"
        />
        <div class="filter-excel">
          <button
            class="button"
            @click="downloadExcel"
          >
            {{ $t("common.BTN.excelDownload") }}
            <i class="download-icon" />
          </button>
        </div>
      </div>
    </div>
    <div class="grid-wrap">
      <cmp-grid
        :columns="columns"
        :item-source="billGridData"
      >
        <template
          v-for="date in allDate"
          v-slot:[date]="slotProps"
        >
          {{ slotProps.row[date] | commaString }}
        </template>
        <template #sumCost="{ row }">
          {{ row.sumCost | commaString }}
        </template>
      </cmp-grid>
    </div>
  </section>
</template>

<script>
import dayjs from 'dayjs'
import xlsx from 'xlsx'
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'
import ChartUtil from './ChartUtil'

// deafult = 최근 3개월
export default {
  name: 'ProjectBillGrid',
  props: {
    groupIdx: {
      type: [Number, Object],
      default: null
    }
  },
  watch: {
    groupIdx (idx) {
      if (idx) {
        this.setGridData(
          this.billData.filter(bill => {
            const projectInfo = this.getProject(bill.projectIdx)
            return projectInfo && projectInfo.companyIdx === idx
          })
        )
      } else {
        this.setGridData(this.billData)
      }
    }
  },
  mixins: [ChartUtil],
  computed: {
    ...mapGetters({
      getProject: 'project/getProject'
    }),
    beforeMonth () {
      return dayjs()
        .subtract(1, 'month')
        .format('YYYY-MM')
    },
    beforeThreeMonth () {
      return dayjs()
        .subtract(3, 'month')
        .format('YYYY-MM')
    },
    allDate () {
      const allDate = [...new Set(this.billData.map(bill => bill.billDate))]
      allDate.sort((a, b) => new Date(a) - new Date(b))
      return allDate
    }
  },
  filters: {
    commaString (val) {
      if (val && val.toLocaleString) return '$ ' + val.toLocaleString()
      if (!val) return '-'
    }
  },
  created () {
    this.getBillingByDate(this.beforeThreeMonth, this.beforeMonth)
    this.filterDate = [
      new Date(this.beforeThreeMonth),
      new Date(this.beforeMonth)
    ]
    this.$watch('filterDate', (n, o) => {
      this.getBillingByDate(
        dayjs(n[0]).format('YYYY-MM'),
        dayjs(n[1]).format('YYYY-MM')
      )
    })
  },
  methods: {
    downloadExcel () {
      const workbook = xlsx.utils.book_new()
      const columns = this.columns.map(column => column.header)
      const billDatas = this.billGridData.map(bill => {
        const data = { ...bill }
        const sumCost = data.sumCost
        const projectName = data.projectName
        const user =
          data.userName && data.userId
            ? `${data.userName} (${this.$options.filters.maskingName(
                data.userId
              )})`
            : '';

        [
          'projectIdx',
          'projectName',
          'index',
          'userId',
          'userName',
          'sumCost'
        ].forEach(key => {
          delete data[key]
        })

        const m = [projectName, user]

        this.allDate.forEach(key => {
          const value = data[key] || 0
          m.push('$' + value.toLocaleString())
        })

        m.push('$' + sumCost.toLocaleString())

        return m
      })

      const worksheet = xlsx.utils.aoa_to_sheet([columns, ...billDatas])

      worksheet['!cols'] = new Array(this.allDate.length + 3)
        .fill(0)
        .map(_ => ({
          width: 25
        }))

      const fileName = `${this.allDate[0]}:${
        this.allDate[this.allDate.length - 1]
      }.xlsx`

      xlsx.utils.book_append_sheet(workbook, worksheet)
      xlsx.writeFile(workbook, fileName)
    },
    async getBillingByDate (startDate, endDate) {
      try {
        this.billData = []
        this.columns = []
        this.isLoadingBillData = true

        const { data } = await API.aws.getBillingByDateAdm(startDate, endDate)
        this.billData = data

        // 필터링
        // if (this.isSetFilter) {
        //   this.billData = this.billData.filter(bill => {
        //     const projectInfo = this.getProject(bill.projectIdx)
        //     if (projectInfo && projectInfo.companyIdx === this.groupIdx) return true
        //     return false
        //   })
        // }

        this.setColumns()
        this.setGridData(this.billData)
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingBillData = false
      }
    },
    setGridData (billData = this.billData) {
      // 프로젝트별 각 년도의 비용을 키로 저장한다
      const cloneBillData = cloneDeep(billData)
      const projectMap = {}
      const projectIdxs = [...new Set(billData.map(bill => bill.projectIdx))]

      projectIdxs.forEach(idx => {
        projectMap[idx] = {}
      })

      this.allDate.forEach(date => {
        const billDataFromDate = cloneBillData.filter(
          bill => bill.billDate === date
        )
        billDataFromDate.forEach(bill => {
          projectMap[bill.projectIdx][bill.billDate] = bill
        })
      })

      const billGridData = []

      Object.keys(projectMap).forEach(key => {
        const m = {}
        let tempName = ''
        let sum = 0
        Object.keys(projectMap[key]).forEach(k => {
          m[k] = projectMap[key][k].cost || '0'
          sum += Number(m[k])
          tempName = projectMap[key][k].projectName
        })

        const project = this.getProject(key)

        billGridData.push({
          projectIdx: key,
          projectName: tempName,
          userId: project ? project.userId : '',
          userName: project ? project.userName : '',
          sumCost: sum || '0',
          ...{ ...m }
        })
      })

      this.billGridData = billGridData
    },
    setColumns () {
      const prefixColumns = [
        { binding: 'projectName', header: '프로젝트' },
        { binding: 'userName', header: '프로젝트 소유자', customHtml: true }
      ]
      const suffixColumn = {
        binding: 'sumCost',
        header: '합계',
        customHtml: true
      }
      const columns = [
        ...prefixColumns,
        ...this.allDate.map(date => ({
          binding: date,
          header: date,
          customHtml: true
        }))
      ]
      columns.push(suffixColumn)

      this.columns = columns
    }
  },
  data: () => ({
    filterDate: null,
    pickerOptions: {
      disabledDate (value) {
        const calendarDay = new Date(value)
        return (
          calendarDay.getTime() > new Date().getTime() ||
          dayjs(calendarDay).format('YYYY-MM') === dayjs().format('YYYY-MM')
        )
      }
    },
    columns: [],
    isLoadingBillData: false,
    billData: [],
    billGridData: []
  })
}
</script>

<style lang="scss" scoped>
.project-bill {
  margin-top: 60px;

  .heading {
    .title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: $gap;
    }

    .filter {
      display: flex;
      align-items: center;

      .filter-excel {
        margin-left: auto;
      }

      span {
        margin-right: $gap-s;
      }

      .el-date-editor {
        background-color: transparent;
        border: none;
        border-bottom: 1px solid $purple-gray;

        &::v-deep {
          & > *:not(:last-child) {
            color: $white;
          }

          .el-range-input {
            background-color: transparent;

            &::placeholder {
              color: $input-placeholder;
            }
          }
        }
      }

      .el-input {
        &::v-deep {
          .el-input__inner {
            border: none;
            border-bottom: 1px solid $purple-gray;
          }
        }
      }
    }
  }

  .grid-wrap {
    margin-top: $gap;
  }
}
</style>
