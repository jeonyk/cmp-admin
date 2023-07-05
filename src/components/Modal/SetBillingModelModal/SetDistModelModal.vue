<!--
  * 파일명 : SetDistModelModal.vue
  * 파일 기능 : [빌링 > 모델 > 배부모델 > 배부모델 관리] 클릭시 보이는 모달입니다. 배부모델을 생성/변경/삭제할 수 있습니다.
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-01-29
  * License By Shinsegae I&C
  * 2021-01-29 fix: 모달 오픈시, body 스크롤 제거 ... 공통 적용, 이에 따른 불필요 코드 제거
 -->

<template>
  <el-dialog
    :title="$t('common.MODAL.manageDistModel')"
    :visible.sync="isActive"
    :before-close="done => {
      close()
      done()
    }"
    width="50%"
    top="5%"
    class="set-billing-model-modal"
  >
    <section class="modal-body">
      <div class="button-area -right">
        <button
          class="button"
          @click="activeNewDist"
          type="is-primary"
          v-if="!newDistForm"
        >
          {{ $t('common.BTN.BILL.newModelCreate') }}
        </button>
        <template v-else>
          <button
            class="button"
            type="is-anti"
            @click="newDistForm = false"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="confirm"
          >
            {{ $t('common.BTN.create') }}
          </button>
        </template>
      </div>

      <ul
        class="form-area"
        v-show="newDistForm"
      >
        <li class="form-item">
          <span class="form-title">{{ $t('bill.modelName') }}:</span>
          <el-input
            v-model="newDist.name"
            style="width: 250px;"
            ref="billingModelInput"
          />
        </li>
      </ul>

      <cmp-tree
        v-if="copiedData && copiedData.length"
        :item-source="copiedData"
        :columns="columns"
        ref="tree"
        :init-custom-action="customInit"
        class="tree-area"
        :all-row-selectable="true"
        height="65vh"
        :use-all-expand="false"
      >
        <template #title="props">
          <section class="cell-contents">
            <el-input
              v-if="props.row.edit"
              v-model="props.row.title"
              class="form-input"
              clearable
              @keypress.enter.native="updateModelName(props.row)"
            />
            <span
              v-else
              class="tree-label"
              :class="{'-recent': props.row.isNew}"
            >
              {{ props.row.title }}
            </span>
          </section>
          <div
            class="button-area"
            style="margin-left: 20px;"
          >
            <!-- <button
              class="button"
              @click="addChildrenRow(props.row)"
              v-if="!props.row.edit"
            >
              항목 추가
            </button> -->
            <button
              class="button"
              v-if="!props.row.edit && props.row.deletable"
              type="is-anti"
              @click.stop="e => {
                props.row.beforeEditData = props.row.title
                props.row.edit = true
              }"
              :disabled="props.row._default"
            >
              {{ $t('common.BTN.modify') }}
            </button>
            <button
              class="button"
              v-if="props.row.edit && !props.row._default"
              @click.stop="e => {
                props.row.title = props.row.beforeEditData
                props.row.edit = false
              }"
              type="is-anti"
            >
              {{ $t('common.BTN.cancel') }}
            </button>
            <button
              class="button"
              type="is-primary"
              v-if="props.row.edit && !props.row._default"
              @click.stop="updateModelName(props.row)"
            >
              {{ $t('common.BTN.change') }}
            </button>

            <button
              class="button"
              v-if="props.row.deletable"
              @click="deleteModel(props.row)"
              type="is-icon"
            >
              <i class="icon-button delete-icon" />
            </button>
          </div>
        </template>
      </cmp-tree>
      <div
        v-else-if="!copiedData.length && !newDistForm"
        class="empty-data"
      >
        {{ $t('common.PLACEHOLDER.noData') }}
      </div>
    </section>
    <section class="modal-button-area">
      <button
        type="is-anti"
        class="button"
        @click="close"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { mapValues, cloneDeep } from 'lodash'
import * as wjGrid from '@grapecity/wijmo.grid'
import API from '@sd-fe/cmp-core'
import ManageModelMixins from './ManageModelMixins'

export default {
  name: 'SetDistModelModal',
  mixins: [ManageModelMixins],
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    },
    send: {
      type: String,
      required: true
    }
  },
  created () {
    this.cloneTreeData(this.data)
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal

      if (!newVal) this.newDistForm = false
    },
    data (newVal) {
      this.cloneTreeData(newVal)
    },
    newDistForm (newVal) {
      if (!newVal) {
        this.newDist = mapValues(this.newDist, () => '')
      }
    }

  },
  methods: {
    close () {
      this.setAllRowEditState(this.copiedData, false)
      this.$emit('close')
    },

    emptyDataAlert () {
      this.$alert(this.$t('common.ALERT.BASE.012'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        type: 'error'
      })
      return false
    },
    customInit (grid) {
      this.grid = grid
    },
    /**
     * [신규 과금 등록] 버튼 클릭 시, 새로운 배부 모델을 추가합니다.
     */
    activeNewDist () {
      this.newDistForm = true

      this.$nextTick(() => {
        this.$refs.billingModelInput.focus()
      })
    },

    /**
     * 새 모델 생성 시, 기본 오브젝트 세팅
     */
    setnewDistModel (item) {
      const obj = Object.assign(item, {
        name: item.name,
        edit: false
      })
      return obj
    },

    /**
     * 배부 모델 추가/수정 후 [확인] 버튼 클릭 시
     */
    saveBillingGroup () {
      if (!this.newDist.name) this.emptyDataAlert()

      if (this.newDist.crud === 'create') { // 배부 모델 생성일 때
        const newOrgObj = this.setnewDistModel(this.newDist)
        const newRow = new wjGrid.Row()
        newRow.dataItem = newOrgObj
        newRow.level = 0

        this.grid.rows.insert(0, newRow)
        if (this.copiedData?.length) this.copiedData.unshift(newOrgObj)
        else this.copiedData.push(newOrgObj)
        this.gridRefresh()
      } else { // 배부 모델 수정일 때
        this.editingBillingModel = cloneDeep(this.newDist)
      }
      this.newDistForm = false
    },

    /**
     * [신규 과금 등록] > [변경] 일 때
     * @param {Obect} item 변경 할 아이템
     */
    applyUpdateBillingModel (row) {
      this.editingBillingModel = row

      // row.beforeData = JSON.parse(JSON.stringify(row))
      row.crud = 'update'
      this.newDist = this.objectMap(row, value => value)

      this.newDistForm = true
    },
    deleteDistModel (row) {
      console.log('deleteDistModel')
      console.log(row)
      this.$confirm(this.$t('common.CONFIRM.BILL.009'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.deleteApi(row)
      }).catch(() => {
        return false
      })
    },
    async deleteApi (row) {
      await API.billing.deleteDistModel(row.id)
      this.$alert(this.$t('common.ALERT.BASE.017'))
      var cv = this.grid.collectionView
      cv.sourceCollection = this.removeItems(cv.sourceCollection, row, 'id')
      this.gridRefresh()
    },
    /**
     * 전체 데이터에서 item을 삭제합니다.
     * @param {Array} all 전체 데이터
     * @param {Object} itm 삭제 할 객체
     * @param {String} key 삭제 할 객체의 고유 key값..
     */
    removeItems (all, itm, key) {
      all.find((item, index) => {
        if (item[key] === itm[key]) {
          all.splice(index, 1)
        } else if (item.children?.length > 0) {
          item.children = this.removeItems(item.children, itm, key)
        }
      })
      this.gridRefresh()
      return all
    },
    /**
     * 전체 데이터의 편집 상태를 설정합니다.
     */
    setAllRowEditState (allData, state) {
      return allData.map(item => {
        item.edit = state
      })
    },

    /**
     * [완료]버튼을 눌렀을 때, 수정 사항을 적용합니다.
     */
    finishEdit (cellItem, beforeEditItem = null) {
      if (beforeEditItem) {
        for (const key in cellItem) {
          cellItem[key] = beforeEditItem[key]
        }
        // cellItem.title = this.beforeEditItem.title
      } else {
        if (!cellItem.billingUpper) { // 신규 과금일 때
          if (!cellItem.title) {
            this.$alert(this.$t('common.ALERT.BASE.012'), '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              type: 'error'
            })
            return false
          }
        } else {
          // 서비스일 때
          if (!cellItem.title) {
            this.$alert(this.$t('common.ALERT.BILL.011'), '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              type: 'error'
            })
            return false
          }
        }
      }
      cellItem.edit = false
      this.gridRefresh()
    },
    /**
     * [항목 추가]버튼을 눌렀을 때, 해당 항목에 자식 요소를 추가합니다.
     */
    addChildrenRow (rowItem) {
      if (rowItem.children?.length) {
        const isNewItem = rowItem.children.filter(row => row.crud === 'create' && row.edit)
        if (isNewItem.length) return
      }

      const newRow = new wjGrid.Row()
      const newObj = {
        crud: 'create',
        billingUpper: Math.random().toString(36).substr(2),
        id: '_' + Math.random().toString(36).substr(2),
        title: '',
        edit: true,
        children: []
      }
      newRow.dataItem = newObj
      // if (!this.selectedRow) this.setRowToSelect(newRow)
      newRow.level = rowItem.level + 1
      if (rowItem.children) rowItem.children.unshift(newObj)
      else {
        rowItem.children = []
        rowItem.children.push(newObj)
      }
      this.grid.rows.insert(rowItem._idx + 1, newRow)

      this.gridRefresh()
    },
    objectMap (object, mapFn) {
      return Object.keys(object).reduce(function (result, key) {
        result[key] = mapFn(object[key])
        return result
      }, {})
    }
  },
  data () {
    return {
      isActive: this.active || false,

      copiedData: null,
      newDist: {
        // crud: 'create',
        // billingUpper: 0,
        // id: '_' + Math.random().toString(36).substr(2),
        name: ''
        // newMethod: 'copy' // copy, new
      },
      newDistForm: false,

      columns: [
        { header: '배부 모델', binding: 'title', width: '*', foldable: true, customHtml: true }
      ],
      beforeEditItem: null, // 편집할 때, 편집 전 데이터를 기억하기 위한....
      editingBillingModel: {} // 편집 중인 빌링 모델.

    }
  }
}
</script>
<style lang="scss">
  .set-billing-model-modal {
    .el-dialog {
      max-height: 700px;
      overflow: hidden;

      &__body {
        max-height: 600px;
        overflow: auto;
      }
    }

    .form-area {
      display: flex;
      margin: $gap-s 0;
      padding: $gap-s $gap;
      background: $ticket-back-color;
      border-radius: $radius-m;
      > .form-item {
        // flex: 1 1 70%;
        display: flex;
        align-items: center;
        &:not(:first-child) {margin-left: 100px;}
        > .form-title {min-width: 80px;}
        > .el-input {width: 100%;}
      }
    }

    .tree-area {
      margin-top: $gap-s;
      .tree-label {
        &.-recent {
          position: relative;
          &::after {
            content: 'NEW';
            position: absolute;
            right: -40px;
            padding: 2px 5px;
            color: $white;
            font-size: 9px;
            background-color: $main-red;;
            border-radius: 2px;
          }
        }
      }
    }

    .empty-data {
      margin: $gap 0;
    }
  }
</style>
