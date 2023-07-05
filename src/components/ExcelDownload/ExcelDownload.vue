<!--
  * 파일명 : ExcelDownload.vue
  * 파일 기능 : 위즈모 그리드 엑셀 Export 컴포넌트
  * 작성자 : 염창윤 외 1명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 1. Wijmo Grid 전체 Excel Download 기능 수정 (구성관리 > 자원관리 > Compute) 1-1. IP 가 Object 로 나옴 1-2. RootDisk / ExternalDisk 의 단위 통일
 -->

<template>
  <div
    class="excel-download"
  >
    <span
      class="button"
      @click="exportExcel"
      data-html2canvas-ignore="true"
    >
      {{ $t('common.BTN.excelDownload') }}
      <download-icon style="position: relative; top: 3px" />
    </span>
  </div>
</template>

<script>
import * as wjGrid from '@grapecity/wijmo.grid'
import * as WjGridXlsx from '@grapecity/wijmo.grid.xlsx'
import Dayjs from 'dayjs'
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'

export default {
  name: 'ExcelDownload',
  components: {
    DownloadIcon
  },
  props: {
    fileName: {
      type: String,
      default () {
        return 'Excel'
      }
    },
    wijmoGrid: {
      type: Object,
      default: undefined
    },
    // EXCEL 추출전 인자( option,wijmoGrid)를 수정하거나 그룹,정렬,필터링을 수행할 수 있습니다.
    customBeforeForExport: {
      type: Function,
      default () {
        return undefined
      }
    },
    // EXCEL 추출을 할 그리드를 변경합니다.
    // (customGrid라는 현재 인스턴스에 담습니다.)
    customGridForExport: {
      type: [Object, undefined],
      default: undefined
    }
  },
  methods: {
    exportExcel () {
      if (!this.wijmoGrid) return
      if (this.customGridForExport) {
        this.customGrid = this.customGridForExport
      }
      setTimeout(() => {
        this.$emit('set-now-exporting', true)
        const cView = this.customGrid?.collectionView || this.wijmoGrid.collectionView
        const oldPaging = {
          pageIndex: cView.pageIndex,
          pageSize: cView.pageSize
        }
        const filename = this.fileName + '_' + Dayjs().format('YYYY-MM-DD_HH_mm_ss') + '.xlsx'
        const options = {
          includeColumnHeaders: true,
          includeCellStyles: false,
          formatItem: args => {
            // console.log(args)
            // const rowData = args.getRow()
            const p = args.panel
            const xlsxCell = args.xlsxCell
            if (p.cellType === wjGrid.CellType.ColumnHeader) { // Header 처리
              xlsxCell.style.fill = {}
              xlsxCell.style.fill.color = '#aaaaaa'
              xlsxCell.style.color = '#000'
            } else {
              const bind = p.columns[args.col].binding
              const orgnValue = p.columns[args.col].collectionView.items[args.row][bind]
              // console.log(bind, orgnValue)

              // 구성관리 > 자원관리 > Compute
              if (this.$route.name === 'set-resource-server-list') {
                // IP
                // if (args.col === 4 && p.columns[args.col].dataType === 5) {
                //   const arrLength = orgnValue.length
                //   if (arrLength > 0) {
                //     if (arrLength > 1) {
                //       xlsxCell.value = orgnValue[0].ipAddress + ' 외 ' + (arrLength - 1)
                //     } else {
                //       xlsxCell.value = orgnValue[0].ipAddress
                //     }
                //   } else {
                //     xlsxCell.value = ''
                //   }
                // }
                // RootDisk
                // if (args.col === 12) {
                //   if (xlsxCell.value) {
                //     xlsxCell.value = this.$options.filters.byte(xlsxCell.value * 1024 * 1024 * 1024)
                //   }
                // }
                // ExternalDisk
                // if (args.col === 13) {
                //   if (xlsxCell.value) {
                //     xlsxCell.value = this.$options.filters.byte(xlsxCell.value) + ' (' + p.columns[args.col].collectionView.items[args.row].externalDiskTotalCount + 'EA)'
                //   }
                // }
              }

              // Date 타입 일 경우 처리
              if (p.columns[args.col].dataType === 4) {
                if (xlsxCell.value) {
                  xlsxCell.value = Dayjs(xlsxCell.value).format('YYYY-MM-DD HH:mm:ss')
                }
              }
              // Object 타입 일 경우 처리
              if (p.columns[args.col].dataType === 0) {
                // // 업무 > 사전협의
                // if (this.$route.name === 'task-conference') {
                //   // console.log(p.columns[args.col], rowData)
                //   if (p.columns[args.col].binding === 'orderLists.new' ||
                //   p.columns[args.col].binding === 'orderLists.change' ||
                //   p.columns[args.col].binding === 'orderLists.del') {
                //     const arr = p.columns[args.col].binding.split('.')
                //     xlsxCell.value = rowData._data[arr[0]][arr[1]].done + '/' + rowData._data[arr[0]][arr[1]].total
                //   }
                // }
              }
              // Array 타입 일 경우 처리
              if (p.columns[args.col].dataType === 5) {
                // 어드민 관리 > 역할관리
                if (this.$route.name === 'set-role-list') {
                  const bindingMatches = ['company', 'manager', 'rolePermTree']
                  if (bindingMatches.includes(bind)) {
                    let arrLength = 0
                    if (bind === 'rolePermTree') {
                      orgnValue.forEach(val => {
                        if (val.depth === 'first' && val.read) arrLength++
                      })
                    } else {
                      arrLength = orgnValue.length
                    }
                    const key = bind === 'company' ? 'label' : bind === 'rolePermTree' ? 'title' : 'tag'
                    if (arrLength > 0) {
                      const others = (arrLength > 1) ? ` 외 ${arrLength - 1}` : ''
                      if (bind === 'rolePermTree') {
                        const first = orgnValue.find(val => val.read === true)
                        // console.log('first', first)
                        xlsxCell.value = first[key] + others
                      } else {
                        xlsxCell.value = orgnValue[0][key] + others
                      }
                    } else {
                      xlsxCell.value = ''
                    }
                  }
                }
              }
            }
          }
        }
        // 위에서 설정한 옵션과 wijmoGrid를 커스텀할 수 있도록 데이터를 넘겨줍니다.
        if (this.customBeforeForExport) { this.customBeforeForExport(options, this.wijmoGrid) }
        this.$nextTick(() => {
          if (this.customGrid) this.customGrid.beginUpdate()
          else this.wijmoGrid.beginUpdate()
          cView.pageSize = cView.totalItemCount
          WjGridXlsx.FlexGridXlsxConverter.saveAsync(this.customGrid || this.wijmoGrid, options, filename, () => {
            cView.pageSize = oldPaging.pageSize
            cView.moveToPage(oldPaging.pageIndex)

            if (this.customGrid) this.customGrid.endUpdate()
            else this.wijmoGrid.endUpdate()

            this.$emit('set-now-exporting', false)
          })
        })
      }, 50)
    }

  },
  data () {
    return {
      customGrid: null
    }
  }
}
</script>

<style lang="scss" scoped>
  .excel-download {
    display: flex;
    justify-content: flex-end;
    font-size: 14px;
    color: $color-lightgrey;
    cursor: pointer;
    margin-top: 10px;
  }
</style>
