<template>
  <div
    class="dist-summary"
    :class="[{ [$i18n.locale]: true }]"
  >
    <div
      v-for="(item, index) in summaryData"
      :key="index"
      class="dist-summary-item"
    >
      <div class="dist-summary-item__title">
        {{ item.title }}
      </div>
      <div class="dist-summary-item__value">
        {{ item.value }}
      </div>
      <div
        v-if="index === 1"
        class="dist-summary-item__icon"
      >
        <file-icon
          :width="18"
          :height="20"
          is-button
          @click="handleClickOpenModalHistory"
        />
      </div>
    </div>
    <el-dialog
      :visible.sync="isOpenedModalHistory"
      width="800px"
      :title="historyModalTitle"
    >
      <div
        v-loading="isLoadingHistory"
        class="modal-history-container"
      >
        <div
          v-if="historyInfo"
          class="history-item-wrap"
        >
          <div
            v-for="(history, historyIdx) in historyInfo"
            :key="historyIdx"
            class="history-item"
          >
            <p class="history-item-title">
              {{ history.createTime | date('YYYY-MM-DD') }}
              <template v-if="history.note">
                {{ history.note }}
              </template>
              <template v-else-if="history.actionType === 'I'">
                <span>{{ history.userName | decode }}({{ history.userId | maskingName }})</span>
                <span class="ml-2">보정 모델 생성</span>
                <ul v-if="history[innerDataKey]">
                  <li
                    v-for="child in history[innerDataKey]"
                    :key="child.id"
                  >
                    <div v-if="correctionType === 'server'">
                      {{ child.dataCenter }} | {{ child.ipAddress }} | {{ child.hostName }} | {{ child.taskInfo }} | {{ getServerChildActionTypeText(child.actionType) }}
                    </div>
                    <div v-else />
                  </li>
                </ul>
              </template>
              <template v-else-if="history.actionType === 'U'">
                <span>{{ history.userName | decode }}({{ history.userId | maskingName }})</span>
                <span class="ml-2">보정 모델 수정</span>
                <ul v-if="history[innerDataKey]">
                  <li
                    v-for="child in history[innerDataKey]"
                    :key="child.id"
                  >
                    <div v-if="correctionType === 'server'">
                      {{ child.dataCenter }} | {{ child.ipAddress }} | {{ child.hostName }} | {{ child.taskInfo }} | {{ getServerChildActionTypeText(child.actionType) }}
                    </div>
                    <div v-else />
                  </li>
                </ul>
              </template>
            </p>
          </div>
        </div>
      </div>
      <div class="modal-history-toolbar">
        <excel-download
          :wijmo-grid="historyGrid"
          force-center
          skip-first-row
          @set-now-exporting="onSetNowExporting"
          @first-row="setFirstRow"
        >
          {{ $v('통합 히스토리 Excel 다운로드') }}
        </excel-download>
      </div>

      <div
        class="
          modal-footer
          modal-button-area"
      >
        <button
          class="button -modal-button"
          @click="isOpenedModalHistory = false"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
      <cmp-grid
        class="never-visible"
        :columns="historyGridColumns"
        :item-source="historyGridInfo"
        :init-custom-action="onInitHistoryGrid"
        cell-merge
      />
    </el-dialog>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import FileIcon from '@/components/Icons/FileIcon.vue'
import API, { ExcelDownload } from '@sd-fe/cmp-core'
import * as wjGrid from '@grapecity/wijmo.grid'
import * as wjcXlsx from '@grapecity/wijmo.xlsx'
import { uniqueId } from 'lodash'

/**
 * history actionType
 * I = 생성
 * U = 수정
 * D = 삭제
 */

export default {
  name: 'BillingCorrectionSummary',
  components: { FileIcon, ExcelDownload },
  props: {
    selectModel: {
      type: Object,
      required: true
    },
    correctionType: {
      type: String,
      default: 'server'
    }
  },
  filters: {
    decode (value) {
      return window.decodeURIComponent(value)
    }
  },
  watch: {
    isOpenedModalHistory (visible) {
      if (visible) {
        this.getCorrectionHistory()
      }
    }
  },
  computed: {
    historyModalTitle () {
      return (!this.selectModel ? '' : this.selectModel.name) + ' 보정 모델 히스토리'
    },
    summaryData () {
      return [
        { title: '보정 모델 생성일', value: dayjs(this.selectModel.createDate).format('YYYY.MM.DD') },
        { title: '마지막 수정일', value: dayjs(this.selectModel.updateDate || this.selectModel.createDate).format('YYYY.MM.DD') },
        { title: '담당자', value: this.selectModel.userName + '(' + this.$options.filters.maskingName(this.selectModel.userId) + ')' || '-' }
      ]
    },
    innerDataKey () {
      return this.correctionType === 'server' ? 'serverInfo' : 'groupInfo'
    },
    historyGridInfo () {
      if (!this.historyInfo) return []

      const result = []
      const actionStr = (action) => {
        switch (action) {
          case 'I':
            return '보정 모델 생성'
          case 'U':
            return '보정 모델 수정'
          case 'D':
            return '보정 모델 삭제'
          default:
            return '과금 배치 확정'
        }
      }
      const historyMessage = (history) => {
        let message

        if (!history[this.innerDataKey] || !history[this.innerDataKey].length) message = '-'
        else {
          message = history[this.innerDataKey]
            .map(childInfo => {
              if (this.correctionType === 'server') {
                return `${childInfo.dataCenter} | ${childInfo.ipAddress} | ${childInfo.hostName || '-'} | ${childInfo.taskInfo || '-'} | ${this.getServerChildActionTypeText(childInfo.actionType)}`
              }
            })
        }

        return message
      }

      this.historyInfo.forEach((history, idx) => {
        const uid = uniqueId('corr-history-grid-excel-')

        if (!history[this.innerDataKey] || !history[this.innerDataKey].length) {
          result.push({
            uid,
            uniqueIndex: idx + 1,
            date: dayjs(new Date(history.createTime)).format('YYYY.MM.DD'),
            manager: `${decodeURIComponent(history.userName)}(${this.$options.filters.maskingName(history.userId)})`,
            action: actionStr(history.actionType),
            message: '-'
          })
        } else {
          const messages = historyMessage(history)

          messages.forEach(message => {
            result.push({
              uid,
              uniqueIndex: idx + 1,
              date: dayjs(new Date(history.createTime)).format('YYYY.MM.DD'),
              manager: `${decodeURIComponent(history.userName)}(${this.$options.filters.maskingName(history.userId)})`,
              action: actionStr(history.actionType),
              message
            })
          })
        }
      })

      return result
    }
  },
  methods: {
    setFirstRow (args) {
      if (!args) return

      const range = (min, max) => {
        const result = []

        for (let i = min; i <= max; i++) {
          result.push(i)
        }

        return result
      }

      args.xlsxCell.style.hAlign = wjcXlsx.HAlign.Center
      args.xlsxCell.style.vAlign = wjcXlsx.VAlign.Center
      args.xlsxCell.rowSpan = 1

      if (range(0, 1).includes(args.col)) {
        args.xlsxCell.colSpan = 2
        args.xlsxCell.value = '보정 모델 생성일: ' + dayjs(this.selectModel.createDate).format('YYYY.MM.DD')
      } else if (range(2, 3).includes(args.col)) {
        args.xlsxCell.colSpan = 2
        args.xlsxCell.value = '마지막 수정일: ' + dayjs(this.selectModel.updateDate || this.selectModel.createDate).format('YYYY.MM.DD')
      } else {
        args.xlsxCell.colSpan = 1
        args.xlsxCell.value = '생성자: ' + `${this.selectModel.userName}(${this.$options.filters.maskingName(this.selectModel.userId)})` || '-'
      }
    },
    onSetNowExporting (progress) {
      if (!this.historyGrid) return

      if (progress) {
        this.historyGrid.columnHeaders.rows.push(new wjGrid.Row())
      } else {
        this.historyGrid.columnHeaders.rows.pop()
      }
    },
    onInitHistoryGrid (grid) {
      this.historyGrid = grid

      const self = this

      class CustomMergeManager extends wjGrid.MergeManager {
        getMergedRange (p, r, c) {
          if (p.getCellData(r, c, false) === p.columns[c].header || !p.columns[c].binding) return null
          const ignoreColumns = [4]

          if (ignoreColumns.includes(c)) return null
          if (!ignoreColumns.length) return null

          const rng = new wjGrid.CellRange(r, c)
          const val = self.historyGridInfo[r].uid

          const getUid = (index) => {
            return self.historyGridInfo[index]?.uid
          }

          if (!val) return null

          for (let i = rng.row; i < p.rows.length; i++) {
            if (getUid(i) !== getUid(i + 1)) break
            rng.row2 = i + 1
          }

          for (let i = rng.row; i > 0; i--) {
            if (getUid(i) !== getUid(i - 1)) break
            rng.row = i - 1
          }

          return rng
        }
      }

      grid.mergeManager = new CustomMergeManager()
    },
    getServerChildActionTypeText (actionType) {
      return {
        I: '신규 생성',
        U: '수정',
        D: '삭제'
      }[actionType]
    },
    async getCorrectionHistory () {
      if (!this.selectModel) return

      this.isLoadingHistory = true

      const callback = this.correctionType === 'server'
        ? API.billing.getServerCorrectionModelHistory
        : API.billing.getGroupCorrectionModelHistory

      try {
        const { data } = await callback(this.selectModel.id)
        this.historyInfo = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 모델 히스토리 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingHistory = false
      }
    },
    handleClickOpenModalHistory () {
      this.isOpenedModalHistory = true
    }
  },
  data () {
    return {
      isLoadingHistory: false,
      isOpenedModalHistory: false,
      historyGrid: null,
      historyInfo: null,
      historyGridColumns: [
        { binding: 'uniqueIndex', header: 'No', width: 300 },
        { binding: 'date', header: '날짜', width: 300 },
        { binding: 'manager', header: '담당자', width: 300 },
        { binding: 'action', header: '업무 내용', width: 300 },
        {
          binding: 'message',
          header: '메시지',
          formatter: (args, item, binding) => {},
          customHtml: true,
          width: 500
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-history-container {
  height: 300px;
  overflow-x: hidden;
  overflow-y: auto;
  border: #3D435E 1px solid;
  padding: 30px;
  border-radius: $radius;
}
  .modal-history-toolbar {
    display: flex;
    width:100%;
    margin-top: 20px;
    justify-content: flex-end;
    .modal-history-btn {
      display: flex;
    }
  }
.dist-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: $dark-navy;
  padding: 0 50px;
  height: 70px;
  margin-top: $gap;

  &.en {
    .dist-summary {
      &-item {
        width: 25%;
        text-align: center;
        &__title {

          white-space: nowrap;
        }

        &__value,
        &__icon {
          margin-top: 5px;
        }
      }
    }
  }

  &.create :nth-child(2n) {
    border: none !important;
  }

  & > :not(:last-child) {
    padding: 2px 35px 2px 0;
    border-right: 2px solid $dark-slate;
    margin-right: 35px;
  }

  &-item {
    font-size: 15px;

    &__title,
    &__value,
    &__icon {
      display: inline-block;
    }

    &__title {
      margin-right: 15px;
    }

    &__value {
      font-weight: 400;
    }

    &__icon {
      vertical-align: middle;
      margin-left: $gap-s;
    }
  }
}

.ml-2 {
  margin-left: 5px;
}

.history-item-wrap {
  .history-item {
    ul {
      li {
        list-style: initial;
        line-height: 1.5;
        margin-left: $gap-m;
        color: $text-gray;
      }
    }
  }
}

.never-visible {
  visibility: hidden;
  position: fixed;
  pointer-events: none;
  top: -1000px;
  left: -1000px;
}
</style>
