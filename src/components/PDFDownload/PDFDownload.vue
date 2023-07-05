<!--
  * 파일명 : PDFDownload.vue
  * 파일 기능 : 해당 페이지의 그리드를 / 페이지 전체를 PDF로 저장할 수 있습니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-16
  * License By Shinsegae I&C
  * 2021-02-16 Update: 관리자 PDF 다운로드 변경
 -->

<template>
  <span
    class="pdf-download"
    @click="confirmForSavingPDF"
    data-html2canvas-ignore="true"
  >
    {{ $t('common.BTN.pdfDownload') }}
    <i class="download-icon" />
  </span>
</template>

<script>
import JsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as gridPdf from '@grapecity/wijmo.grid.pdf'
import * as wijmoPdf from '@grapecity/wijmo.pdf'
import Dayjs from 'dayjs'
import { mapGetters } from 'vuex'

export default {
  name: 'PdfDownload',
  props: {
    fileName: {
      type: String,
      default () {
        return 'CMP_Task'
      }
    },
    grids: {
      type: [Array, Object],
      default: null
    },
    captureEl: {
      type: String,
      default: '.admin-web-admin-wrapper'
    }
  },
  computed: {
    ...mapGetters('common', ['breadcrumbs'])
  },
  methods: {
    confirmForSavingPDF () {
      this.$confirm(this.$t('common.CONFIRM.BASE.033'), '알림', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.TERMS.yes'),
        cancelButtonText: this.$t('common.TERMS.no')
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.029'), '알림', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.setPdf()
        })
      }).catch(() => false)
      // }).then(this.determineCaptureMethods).catch(() => false)
    },
    generatePDF () {
      const filename = this.fileName + '_' + this.$options.filters.date(new Date(), 'YYYY-MM-DD')

      const el = document.querySelector(this.captureEl)
      // el.classList.add('pdf-reverse')
      if (!el) {
        console.warn(el + ' is not exist.')
        return false
      }

      const pdf = new JsPDF('p', 'mm', 'a4')
      // const canvas = pdf.canvas
      // html2canvas(canvas)
      // console.log('@@', pdf, canvas)

      html2canvas(el, {
        backgroundColor: '#22272b'
      }).then(function (canvas) {
        const width = 210 // 이미지 가로 길이(mm) A4 기준
        const pageHeight = width * 1.414 // 출력 페이지 세로 길이 계산 A4 기준
        const height = canvas.height * width / canvas.width
        let heightLeft = height
        heightLeft = height - (height / 2)

        const image = canvas.toDataURL('image/png')
        let position = 0

        pdf.addImage(image, 'png', 0, position, width, height) // 첫 페이지 출력

        // paging처리
        heightLeft -= pageHeight

        while (heightLeft >= 20) {
          position = heightLeft - height
          pdf.addPage()
          pdf.addImage(image, 'png', 0, position, width, height)
          heightLeft -= height
        }
        pdf.save(filename)
        // el.classList.remove('pdf-reverse')

        // var pdfData = this.convertDataURIToBinary('data:application/pdf;base64,' + image)
        // window.open(pdfData)

        // window.open(el, '', 'width=800,height=1100')
      })
    },
    determineCaptureMethods () {
      const abc = 1
      if (abc) return console.error('@@@ determineCaptureMethods DEPRECATED??? or DELAYED')

      const alert = (callback) => {
        this.$alert(this.$t('common.ALERT.BASE.029'), '알림', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback
        }).catch(() => false)
      }

      this.$confirm(this.$t('common.CONFIRM.BASE.017'), '알림', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.CONFIRM.BTN.001'),
        cancelButtonText: this.$t('common.CONFIRM.BTN.002'),
        closeOnClickModal: true
      }).then(() => alert(this.setPdf)).catch(() => false)
      // }).then(() => alert(this.setPdf)).catch(() => alert(this.generatePDF()))
    },
    setPdf () {
      if (!this.grids) this.generatePDF()

      for (const name in this.grids) {
        const flexgrid = this.grids[name][0]?.$children.filter(child => child.grid)[0].grid
        this.generatePDFGrid(flexgrid, name)
      }
    },
    generatePDFGrid (grid, name) {
      if (!grid) return

      const skipCols = ['edit', 'checked']
      const colWidth = grid?.columns.map(col => col.width)

      // pdf 다운로드 순간 ! 컬럼 세팅
      const columnSetting = (status) => {
        return grid.columns.map((col, idx) => {
          skipCols.forEach(skip => {
            if (col.binding === skip) grid.columns.getColumn(skip).visible = status
          })
          col.width = status ? colWidth[idx] : '*'
        })
      }

      grid.beginUpdate()
      columnSetting(false)

      for (var i = 0; i < grid.columns.length; i++) {
        grid.columns[i].multiLine = true
        grid.columns[i].wordWrap = true
      }

      // grid.autoSizeRows() // 너무 많이 길면 이거 주석해제, 사용하면 됨

      const breadcrumbs = this.breadcrumbs.map(crumb => crumb.label)
      let fileName = `${this.$options.filters.date(new Date(), 'YYYYMMDD')}_${this.fileName}`

      let taskName = name.split('task')[1]
      if (!taskName) taskName = name.split('done')[1]

      fileName = fileName + (breadcrumbs.includes('업무') ? `_${taskName}` : '')

      gridPdf.FlexGridPdfConverter.export(grid, `${fileName}.pdf`, {
        scaleMode: 1, // gridPdf.ScaleMode.PageWidth,
        maxPages: 10,
        styles: {
          cellStyle: {
            backgroundColor: '#ffffff',
            borderColor: '#f0f0f0',
            font: { family: 'NanumSquare', size: 6 }
          },
          headerCellStyle: {
            backgroundColor: '#f0f0f0',
            font: { family: 'NanumSquareB', size: 6 }
          },
          altCellStyle: { backgroundColor: '#f9f9f9' },
          groupCellStyle: { backgroundColor: '#dddddd' }
        },
        documentOptions: {
          compress: true,
          header: {
            declarative: {
              text: breadcrumbs.includes('업무') ? `${breadcrumbs.join(' > ')}_${taskName}` : breadcrumbs.join(' > '),
              font: new wijmoPdf.PdfFont('NanumSquareB', 13, 'normal', 'bold')
            }
          },
          footer: {
            declarative: {
              text: '\t&[Page] / &[Pages]',
              font: new wijmoPdf.PdfFont('NanumSquare', 9, 'normal', 'bold')
            }
          },
          pageSettings: {
            layout: wijmoPdf.PdfPageOrientation.Landscape, // Landscape / Portrait
            margins: { left: 20, right: 20, top: 20, bottom: 20 }
          }
        },
        customCellContent: false,
        embeddedFonts: [
          {
            source: require('../../assets/fonts/ttf/NanumSquareRoundB.ttf'),
            name: 'NanumSquareB',
            style: 'normal',
            weight: 'normal',
            sansSerif: true
          },
          {
            source: require('../../assets/fonts/ttf/NanumSquareRoundR.ttf'),
            name: 'NanumSquare',
            style: 'normal',
            weight: 'normal',
            sansSerif: true
          },
          {
            source: require('../../assets/fonts/ttf/Roboto-Regular.ttf'),
            name: 'Roboto',
            style: 'normal',
            weight: 'bold',
            sansSerif: true
          }
        ],
        formatItem: function (args) { // render the row details into the document
          const p = args.panel
          // const r = p.rows[args.row]
          const binding = p.columns[args.col].binding
          const dateData = Number(args.data.split(',').join(''))

          // header 외 하단 rows
          if (p.cellType !== 2) {
            // date 형식일 경우
            if (binding.toLowerCase().includes('time')) {
              const date = !isNaN(dateData) ? dateData : args.data
              args.data = Dayjs(date).format('YYYY.MM.DD')
            }

            // object, array 상관없이 텍스트 바인딩
            const cellData = p.getCellElement(args.row, args.col, true)
            const buttonPopUp = cellData.querySelector('.button-popup')
            if (buttonPopUp !== null) {
              args.data = buttonPopUp.textContent.replace(' ', '')
              return
            }

            args.data = cellData.textContent.replace(' ', '')
            // args.data += '이제는 길게도 됩니다용,\n 줄바꿈도 되구요 \n 줄바꿈 몇개까지?' // 🌸 줄바꿈 테스트용

            // =============================================
            // 아래 구문들은 위 2 줄 사용하면서 더이상 사용하지 않습니다!
            // 테스트 후 삭제 예정
            // =============================================

            // 바인딩이 이상해서 커스텀으로 입력해야할 경우..ㅠㅠ..
            // if (!args.data) {
            //   const customBinding = ['clusterNode', 'installProgram']

            //   const customData = function (bindingKey) {
            //     const dataItem = r.dataItem
            //     return {
            //       clusterNode: `${dataItem.cluster?.name}|${dataItem.node?.nodeName}`,
            //       installProgram: `${dataItem.pkgList.length} 개`
            //     }[bindingKey]
            //   }

            //   for (const b of customBinding) {
            //     if (binding === b) {
            //       args.data = customData(b)
            //       console.log(args.data)
            //     }
            //   }
            // }

            // // [Object | Array] 타입일 경우
            // if (args.data === '[object Object]' || args.data.includes('[object Object]')) {
            //   // 바인딩이 '.' 로 이루어진 경우 => ex) orderData.pkgList. ...
            //   if (binding.includes('.')) {
            //     const keys = binding.split('.')
            //     keys.forEach((key, idx) => {
            //       if (idx !== 0) {
            //         const result = r.dataItem[keys[0]][key]
            //         // console.log(result, `${key} - ${binding}`)

            //         // Array일 경우는 갯수만 보여줍니다. -> 내부 데이터가 object일 경우는 표시할 key값이 없습니다.
            //         if (Array.isArray(result)) args.data = `${result.length} 개`
            //       }
            //     })
            //   // 바인딩 자체 결과가 object / array 인 경우
            //   } else {
            //     const result = r.dataItem[binding]
            //     const item = r.dataItem

            //     // 해당 키를 가진 아이템을 출력함
            //     if (binding === 'cluster') {
            //       args.data = `${item.cluster ? item.clusterName || item.cluster.name : ''} , ${item.central ? item.central.centralName : ''}`
            //     }

            //     if (Array.isArray(result)) args.data = `${result.length} 개`
            //     else if (result.dataStatus) args.data = result.dataStatus // object
            //   }
            // }
          }
        }
      })

      columnSetting(true)
      grid.endUpdate()
    }
  },
  data () {
    return {

    }
  }
}
</script>

<style lang="scss" scoped>
  .pdf-download {
    font-size: 14px;
    color: $color-lightgrey;
    cursor: pointer;
    > span {
      margin-left: 30px;
    }
  }
</style>
