<template>
  <div class="billng-model-calib-list-grid">
    <div class="grid-container">
      <cmp-grid
        :item-source="transformGridData"
        :columns="displayColumns"
        :init-custom-action="onInitGrid"
        :use-column-filter="false"
        :sort-keeping="sortKeeping[gridCategory]"
        cell-merge
        ref="grid"
        class="route-detail-grid"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #_index="{ row }">
          {{ row._index }}
        </template>
        <template #serverInfo_discountPeriodBegin="{ row }">
          {{ row.serverInfo_discountPeriodBegin | date('YYYY.MM') }} ~ {{ row.serverInfo_discountPeriodEnd | date('YYYY.MM') }}
        </template>
        <template #serverInfo_discountPrice="{ row }">
          {{ row.serverInfo_discountPrice | moneyFormat }}
        </template>
        <template #serverInfo_createDate="{ row }">
          {{ row.serverInfo_createDate | date('YYYY.MM.DD') }}
        </template>
        <template #groupInfo_discountPeriodBegin="{ row }">
          {{ row.groupInfo_discountPeriodBegin | date('YYYY.MM') }} ~ {{ row.groupInfo_discountPeriodEnd | date('YYYY.MM') }}
        </template>
        <template #groupInfo_discountPrice="{ row }">
          {{ row.groupInfo_discountPrice | moneyFormat }} <span v-if="row.groupInfo_discountKinds === 'PER'">(%)</span>
        </template>
        <template #groupInfo_createDate="{ row }">
          {{ row.groupInfo_createDate | date('YYYY.MM.DD') }}
        </template>
        <template #option="{ row }">
          <file-icon
            :width="20"
            :height="20"
            class="file-svg"
            is-button
            @click="() => onClickNote(row)"
          />
        </template>
      </cmp-grid>
    </div>
    <el-dialog
      :visible.sync="isActiveNote"
      :title="$v('비고')"
      width="800px"
    >
      <div class="note-wrap">
        <vertical-table
          v-if="noteInfo"
          type="horizontal"
          :columns="noteColumns[gridCategory]"
          :data="noteInfo"
        >
          <template #serverInfo>
            <div
              v-if="isLoadingNoteHistory"
              v-loading="true"
              style="width: 100%; min-height: 125px;"
            />
            <div v-else>
              <div
                v-for="(hist, histIdx) in noteInfoHistory.hist"
                :key="histIdx"
              >
                {{ hist.createTime | date('YYYY-MM-DD') }}
                {{ hist.userName | decode }}
                ({{ hist.userId | maskingName }})
                <ul>
                  <li>
                    {{ discountClass(hist.discountClass) }} |
                    <span v-if="hist.discountKinds === 'PER'">
                      비율 {{ hist.discountPrice }}%
                    </span>
                    <span v-else>
                      {{ parseInt(hist.discountPrice) | moneyFormat }}원
                    </span>
                    | {{ hist.discountPeriodBegin | date('YYYY.MM') }}~{{ hist.discountPeriodEnd | date('YYYY.MM') }}
                    | {{ hist.discountReason }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </vertical-table>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-primary"
          @click="isActiveNote = false"
        >
          {{ $v('확인') }}
        </button>
      </section>
    </el-dialog>
  </div>
</template>
<script>
import { uniqueId } from 'lodash'
import * as wjGrid from '@grapecity/wijmo.grid'
import FileIcon from '@/components/Icons/FileIcon.vue'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default {
  props: {
    gridCategory: {
      type: String,
      default: 'company'
    },
    gridData: {
      type: Array,
      default () {
        return []
      }
    },
    codeMap: {
      type: Map,
      default: () => null
    }
  },
  components: {
    FileIcon
  },
  filters: {
    decode (value) {
      if (!value) return value
      return decodeURIComponent(value)
    }
  },
  mounted () {
    this.$emit('initColumns', this.displayColumns)
  },
  computed: {
    displayColumns () {
      return this[`${this.gridCategory}Columns`]
    },
    transformGridData () {
      const result = []
      const infoKey = this.gridCategory === 'server' ? 'serverInfo' : 'groupInfo'
      let maxIndex = 0

      this.gridData.forEach(data => {
        const uid = uniqueId('corr-')
        maxIndex++

        if (data[infoKey] && data[infoKey].length) {
          data[infoKey].forEach(info => {
            const temp = {}

            Object.keys(info).forEach(key => {
              temp[infoKey + '_' + key] = info[key]
            })

            const merge = { uid, _index: maxIndex, ...data, ...temp }
            result.push(merge)
          })
        }
      })

      return result
    }
  },
  watch: {
    noteInfo (noteInfo) {
      if (noteInfo) {
        this.getNoteHistory(noteInfo)
      }
    }
  },
  methods: {
    discountClass (cls) {
      const map = this.codeMap.get(cls)
      if (map) {
        return map.codeName
      }
      return cls
    },
    async getNoteHistory (noteInfo) {
      this.isLoadingNoteHistory = true

      try {
        const { data } = await API.billing.getCorrectionHistoryByVm(
          noteInfo.modelId,
          noteInfo.vmUuid
        )
        this.noteInfoHistory = data
      } catch (error) {
        this.$alert(this.$v('보정 모델 상세 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingNoteHistory = false
      }
    },
    onClickNote (row) {
      this.noteInfo = row
      this.isActiveNote = true
    },
    onInitGrid (grid) {
      this.$emit('init-grid', grid)

      const self = this

      class CustomMergeManager extends wjGrid.MergeManager {
        getMergedRange (p, r, c) {
          if (p.getCellData(r, c, false) === p.columns[c].header || !p.columns[c].binding) return null
          let ignoreColumns = []
          if (self.gridCategory === 'server') {
            ignoreColumns = [6, 7, 8, 9]
          } else {
            ignoreColumns = [2, 3, 4, 5]
          }

          if (ignoreColumns.includes(c)) return null
          if (!ignoreColumns.length) return null

          const rng = new wjGrid.CellRange(r, c)
          const val = self.transformGridData[r].uid

          const getUid = (index) => {
            return self.transformGridData[index]?.uid
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
    }
  },
  data () {
    return {
      noteColumns: {
        server: [
          { header: '관계사', binding: 'companyName', center: true },
          { header: '프로젝트', binding: 'projectName', center: true },
          { header: 'IP', binding: 'ipAddress', center: true },
          // { header: '업무명', binding: 'taskInfo', center: true },
          { header: '호스트명', binding: 'hostName', center: true, colspan: true },
          { header: '비고', binding: 'serverInfo', center: true, colspan: true, customClass: 'note-content', customHtml: true }
        ]
      },
      isActiveNote: false,
      isLoadingNoteHistory: false,
      noteInfo: null,
      noteInfoHistory: null,
      idx: 0,
      loading: false,
      sortKeeping: {
        server: {
          _index: true,
          companyName: true,
          projectName: true,
          ipAddress: true,
          hostName: true,
          taskInfo: true,
          option: true
        }
      },
      serverColumns: [
        {
          header: 'No',
          binding: '_index',
          width: 50,
          formatter: (args, item, binding) => {
            return (Number(item[binding]))
          },
          customHtml: true
        },
        { header: this.$v('관계사'), binding: 'companyName', width: '*', cellMerge: true },
        { header: this.$v('프로젝트'), binding: 'projectName', width: '*', cellMerge: true },
        { header: 'IP', binding: 'ipAddress', width: '*', cellMerge: true },
        { header: this.$v('호스트명'), binding: 'hostName', width: 100, cellMerge: true },
        // { header: this.$v('업무명'), binding: 'taskInfo', width: '*', cellMerge: true },
        { header: this.$v('분류'), binding: 'serverInfo_discountClass', width: 70, customHtml: true },
        {
          header: this.$v('기간'),
          binding: 'serverInfo_discountPeriodBegin',
          width: 140,
          customHtml: true,
          formatter: (args, item, binding) => {
            return `${dayjs(new Date(item.serverInfo_discountPeriodBegin)).format('YYYY.MM')} ~ ${dayjs(new Date(item.serverInfo_discountPeriodEnd)).format('YYYY.MM')}`
          }
        },
        { header: this.$v('금액'), binding: 'serverInfo_discountPrice', width: 130, customHtml: true },
        {
          header: this.$v('생성일'),
          binding: 'serverInfo_createDate',
          width: 100,
          customHtml: true,
          formatter: (args, item, binding) => {
            return dayjs(new Date(item[binding])).format('YYYY.MM.DD')
          }
        },
        { header: this.$v('비고'), binding: 'option', width: '*', customHtml: true, cellMerge: true, formatter: (args, item, binding) => '', excelSkip: true }
      ],
      companyColumns: [
        {
          header: 'No',
          binding: '_index',
          width: 50,
          formatter: (args, item, binding) => {
            return (Number(item[binding])) + 1
          },
          customHtml: true
        },
        { header: this.$v('관계사'), binding: 'companyName', width: '*' },
        { header: this.$v('분류'), binding: 'groupInfo_discountClass', width: '*', customHtml: true },
        {
          header: this.$v('기간'),
          binding: 'groupInfo_discountPeriodBegin',
          width: '*',
          customHtml: true,
          formatter: (args, item, binding) => {
            return `${dayjs(new Date(item.groupInfo_discountPeriodBegin)).format('YYYY.MM')} ~ ${dayjs(new Date(item.groupInfo_discountPeriodEnd)).format('YYYY.MM')}`
          }
        },
        { header: this.$v('금액'), binding: 'groupInfo_discountPrice', width: '*', customHtml: true },
        {
          header: this.$v('생성일'),
          binding: 'groupInfo_createDate',
          width: '*',
          customHtml: true,
          formatter: (args, item, binding) => {
            return dayjs(new Date(item[binding])).format('YYYY.MM.DD')
          }
        },
        { header: this.$v('비고'), binding: 'option', width: '*', customHtml: true, formatter: (args, item, binding) => '-' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.route-detail-grid {
  &::v-deep .wj-row:hover {
    .file-svg,
    .file-svg * {
      fill: $purple-gray;
    }
  }
}

.note-wrap {
  &::v-deep {
    .note-content {
      height: 150px;

      .contents {
        overflow-y: auto;

        ul li {
          list-style: disc;
          margin-left: 30px;
        }
      }
    }
  }
}
</style>
