<template>
  <div
    v-loading="isLoadingGroup"
    class="dist-sheet"
  >
    <div class="dist-sheet-grid">
      <div class="dist-sheet-grid__action">
        <h3 class="grid_title">배부모델 표준기준값</h3>
        <template v-if="isEdit">
          <div class="btn_box">
            <button
              class="button"
              type="is-primary"
              @click="() => onClickAddDynamicColumn(null)"
            >
              기준값 추가
            </button>
            <button
              class="button"
              type="is-anti"
              @click="onClickChangeEditMode"
            >
              취소
            </button>
            <button
              class="button"
              type="is-primary"
              @click="onClickSaveSheet"
            >
              저장
            </button>
          </div>
        </template>
        <div class="btn_box" v-else>
          <button
            class="button"
            type="is-primary"
            @click="openHisModal()"
          >
            {{ $v('히스토리') }}
          </button>
          <button
            class="button"
            type="is-primary"
            :disabled="isEdit || currentModel.confirm"
            @click="onClickChangeEditMode"
          >
            {{ $v('변경') }}
          </button>
        </div>
      </div>
      <cmp-grid
        v-loading="isLoadingUpdate"
        :key="renderKey"
        :columns="dynamicColumns"
        :item-source="distributeItems"
        :frozen-columns="1"
      >
        <template
          v-for="uid in dynamicColumnsUid"
          #[`header_${uid}`]="{ row, column }"
        >
          <div
            v-if="isEdit"
            class="custom-header"
            :key="uid"
          >
            <el-input
              v-model="column.header"
              @input="val => onCheckChangeValue(row, column)"
            />
            <!-- <button
              class="button"
              type="is-primary"
            >
              {{ $v('삭제') }}
            </button> -->
            <trash-icon
              :width="16"
              :height="16"
              is-button
              @click="() => onClickDeleteDynamicColumn(uid, column)"
            />
          </div>
          <div
            v-else
            :key="uid"
          >
            {{ column.header }}
          </div>
        </template>
        <template
          v-for="uid in dynamicColumnsUid"
          #[uid]="{ row, column }"
        >
          <el-input
            v-if="isEdit"
            v-model="row[uid]"
            @input="(val) => onCheckChangeValue(row, column)"
            type="number"
            :key="uid"
          />
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { uniqueId } from 'lodash'
import TrashIcon from '@/components/Icons/TrashIcon.vue'

// 변경 상태로 진입시 - Event
// - 기존에 존재하던 기준은 -> 수정 대상 (값이 변했는지 안변했는지 체크?) -> API에서 받아온 데이터와 비교
// - "추가" 버튼을 눌러서 추가한 기준은 생성 API 대상
// - "삭제" 아이콘을 눌러 삭제한 기준은 삭제 API 대상
// shouldDeleteItems = []
// shouldUpdateItems = []
// shouldCreateItems = []
export default {
  name: 'DistributeSheet',
  components: {
    TrashIcon
  },
  props: {
    currentModel: {
      type: Object,
      required: true
    },
    sheetData: {
      type: Array,
      default: () => ([])
    }
  },
  watch: {
    isEdit () {
      this.renderKey = Date.now()
    },
    dynamicColumnsUid: {
      immediate: true,
      deep: true,
      handler (columns) {
        if (!columns) return

        if (columns.length === 0) {
          // 관계사 컬럼만 존재하는 경우
          this.dynamicColumns[0].width = 250
        } else if (columns.length < 4) {
          // 4개 미만
          this.dynamicColumns.forEach((column, index) => {
            column.width = 250
          })
        } else if (columns.length === 4) {
          this.dynamicColumns.forEach((column, index) => {
            column.width = '*'
          })
        } else {
          this.dynamicColumns.forEach((column, index) => {
            column.width = 250
          })
        }
      }
    },
    currentModel (model) {
      this.renderKey = Date.now()
    }
  },
  async created () {
    await this.getGroups()
    this.setSheet(this.sheetData)
    this.isEdit = false
  },
  methods: {
    openHisModal () {
      this.$emit('open')
    },
    onCheckChangeValue (row, column) {
      console.log(column.stdRefIdx, column.changed)
      if (column.stdRefIdx && !column.changed) {
        this.$set(column, 'changed', true)
        console.log(this.$set(column, 'changed', true))
      }
    },
    setSheetStandradValue (groupData, sheet) {
      const group = this.gridMap.get(groupData.companyIdx)

      if (group) {
        group[sheet.stdRefName] = groupData.standardValue
      }
    },
    setSheet (sheetData = []) {
      sheetData.forEach(sheet => {
        this.onClickAddDynamicColumn(sheet)
        if (sheet.companyStdValueList && sheet.companyStdValueList.length) {
          sheet.companyStdValueList.forEach(groupData => this.setSheetStandradValue(groupData, sheet))
        }
      })
    },
    async validateSheetData (sheetData) {
      if (!sheetData) {
        sheetData = this.getSheetData()
      }

      const failOption = { callback: () => false }

      if (!sheetData.allColumns.length) {
        return this.$alert(this.$v('배부 템플릿 기준 값을 추가하세요.'), failOption)
      }
      if (sheetData.allColumns.some(column => !column.header)) {
        return this.$alert(this.$v('배부 템플릿 기준명을 입력하세요.'), failOption)
      }
      if (!sheetData.allValues.length) {
        return this.$alert(this.$v('배부 기준 값을 확인하세요.'), failOption)
      }
      if (sheetData.allValues.some(value => !Number.isSafeInteger(value))) {
        return this.$alert(this.$v('배부 기준 값을 확인하세요.'), failOption)
      }
      // 이름 중복 체크
      let isExistDuplicateName = false
      sheetData.allColumns.forEach(column => {
        if (isExistDuplicateName) return
        if (sheetData.allColumns.filter(c => c.header === column.header).length > 1) {
          isExistDuplicateName = true
        }
      })
      if (isExistDuplicateName) {
        return this.$alert(this.$v('동일한 배부 기준명이 존재합니다.'), failOption)
      }

      return sheetData
    },
    getSheetData () {
      const allValues = []
      const itemSource = this.distributeItems.map(group => {
        const { groupName, groupIdx } = group
        const dynamicColumns = this.dynamicColumns.slice(1)

        return {
          groupName,
          groupIdx,
          getColumn: function (binding) {
            return this.columns.find(column => column.binding === binding)
          },
          columns: dynamicColumns.map(col => {
            const value = Number(group[col.binding])
            allValues.push(value)
            return {
              name: col.header,
              value,
              binding: col.binding,
              changed: col.changed,
              deleted: col.deleted
            }
          })
        }
      })
      const findValueColumn = (columns) => {
        if (!columns || !columns.length) return []

        const result = []

        columns.forEach(column => {
          const companyStdValueList = []

          itemSource.forEach(source => {
            const findColumn = source.getColumn(column.binding)

            if (findColumn) {
              companyStdValueList.push({
                companyIdx: source.groupIdx,
                companyName: source.groupName,
                standardValue: findColumn.value
              })
            }
          })
          const stdRef = {
            companyStdValueList,
            stdRefName: column.header,
            distributeModelId: this.currentModel.id
          }
          if (column.stdRefIdx) {
            stdRef.stdRefIdx = column.stdRefIdx
          }
          result.push(stdRef)
        })
        return result
      }
      /**
       * 생성해야 되는 거
       */
      const getCreated = () => {
        const createdColumns = this.dynamicColumns.slice(1).filter(col => !col.stdRefIdx)
        return findValueColumn(createdColumns)
      }
      /**
       * 수정해야 되는 거
       */
      const getUpdated = () => {
        const updatedColumns = this.dynamicColumns.slice(1).filter(col => col.changed)
        return findValueColumn(updatedColumns)
      }
      /**
       * 삭제해야 되는 거
       */
      const getDeleted = () => {
        const deletedColumns = this.deletedData.filter(col => col.deleted)
        return findValueColumn(deletedColumns)
        // return this.shouldDelete || []
      }
      /**
       * 모음
       */
      const req = {
        created: getCreated(),
        updated: getUpdated(),
        deleted: getDeleted()
      }
      /**
       * 생성, 수정, 삭제 API를 호출해야하는 횟수
       * 왜 이렇게 만들었을까
       */
      const apiCallCount = (req.created.length + req.updated.length + req.deleted.length)

      return {
        itemSource,
        allColumns: this.dynamicColumns.slice(1),
        allValues,
        req,
        apiCallCount
      }
    },
    onClickSaveSheet () {
      this.$confirm(this.$v('입력한 내용으로 저장하시겠습니까?'))
        .then(async () => {
          try {
            const validatedSheetData = await this.validateSheetData(this.getSheetData())
            if (!validatedSheetData) return

            this.isLoadingUpdate = true

            const {
              created,
              updated,
              deleted
            } = validatedSheetData.req

            for (let i = 0; i < deleted?.length; i++) {
              deleted[i].isDeleted = true
            }

            await Promise.any([
              created?.length ? this.createPromiseWrap(created) : null,
              updated?.length || deleted?.length ? this.updatePromiseWrap([...updated, ...deleted]) : null
            ])

            // if (created?.length) await this.createPromiseWrap(created)
            // if (updated?.length || deleted?.length) await this.updatePromiseWrap([...updated, ...deleted])

            this.$alert(this.$v('배부 템플릿을 저장하였습니다.'), {
              callback: () => {
                this.isEdit = false
                this.$emit('refresh')
              }
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$v('배부 템플릿 수정에 실패하였습니다.'))
          } finally {
            this.isLoadingUpdate = false
          }
        })
        .catch(() => false)
    },
    async onClickDeleteDynamicColumn (uid, column) {
      this.$set(column, 'deleted', true)
      const item = this.dynamicColumns.filter(column => column.binding === uid)
      this.deletedData.push(...item)
      // if (column.stdRefIdx && column.deleted) {
      //   this.shouldDelete.push({
      //     isDeleted: true,
      //     stdRefIdx: column?.stdRefIdx
      //   })
      // }
      this.dynamicColumns = this.dynamicColumns.filter(column => column.binding !== uid)
      this.dynamicColumnsUid = this.dynamicColumnsUid.filter(column => column !== uid)
      // this.distributeItems.forEach(item => (delete item[uid]))
    },
    onClickAddDynamicColumn (sheet = null) {
      const uid = sheet ? sheet.stdRefName : uniqueId('dynamic-column-')
      const column = {
        binding: uid,
        header: '',
        customColumnCell: this.isEdit,
        sorting: !this.isEdit,
        filtable: false,
        width: '*',
        customHtml: true
      }

      if (sheet) {
        column.stdRefIdx = sheet.stdRefIdx
        column.header = sheet.stdRefName
      }

      this.dynamicColumns.push(column)
      this.dynamicColumnsUid.push(uid)

      this.distributeItems.forEach(item => (this.$set(item, uid, 0)))
    },
    onClickChangeEditMode () {
      this.isEdit = !this.isEdit
      if (this.isEdit) {
        // 수정 모드로 변경
        for (let i = 1; i < this.dynamicColumns.length; i++) {
          this.dynamicColumns[i].customColumnCell = true
        }
      } else {
        // Read-Only 모드로 변경
        // 취소했으면 배부 모델 초기화..
        this.$emit('refresh')
      }
    },
    initGrid () {
      this.dynamicColumns = this.dynamicColumns.slice(0, 1)
      this.dynamicColumnsUid = []
      this.shouldDelete = []

      this.gridMap = new Map()

      this.distributeItems = this.rawGroups.map(group => {
        const obj = {
          groupName: group.groupName,
          groupIdx: group.groupIdx
        }
        this.gridMap.set(group.groupIdx, obj)

        return obj
      })
    },
    async getGroups () {
      this.isLoadingGroup = true

      try {
        const res = await API.iam.getGroupList({ groupUpper: 0 })
        this.rawGroups = res
        this.initGrid()
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingGroup = false
      }
    },
    createPromiseWrap (payload) {
      return API.billing.createDistributeStdRef(payload)
    },
    updatePromiseWrap (payload) {
      return API.billing.updateDistributeStdRef(payload)
    }
  },
  data: () => ({
    isLoadingUpdate: false,
    renderKey: Date.now(),
    deletedData: [],
    dynamicColumnsUid: [],
    dynamicColumns: [
      {
        binding: 'groupName',
        header: '관계사',
        width: '*'
      }
    ],
    rawGroups: [],
    distributeItems: [],
    gridMap: new Map(),
    isLoadingGroup: false,
    isEdit: false,
    /**
     * CRUD
     */
    // shouldCreate: [], // 로직에서 파악 가능
    shouldDelete: []
  })
}
</script>

<style lang="scss" scoped>
.dist-sheet {
  &-grid {
    &__action {
      text-align: right;
      margin-bottom: $gap-s;
      display: flex;
      align-content: center;
      justify-content: space-between;
      .btn_box {
        display: flex;
        align-content: center;
        justify-content: flex-end;
        flex: 1;
        gap: 5px;
      }
    }
    .custom-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 $gap-s;

      .el-input {
        max-width: 100%;
        margin: 0 $gap;
      }
    }

    &::v-deep {
      .wj-flexgrid {
        .wj-row:hover {
          .wj-frozen-col {
            &:not(.wj-header) {
              transition: background-color 0.3s, color 0.3s !important;
              will-change: left, right, top, bottom;
            }
          }
        }
        .wj-frozen-col {
          border-color: rgba(0, 0, 0, 0.2);
        }

        .wj-cell:not(.wj-header) {
          background-color: #1F1E32;
        }
      }
    }
  }
}
</style>
