<!--
  * 파일명 : MarketplaceItemInformation.vue
  * 파일 기능 : 서비스 카탈로그 > 마켓플레이스 제품 정보 추가/수정/삭제 템플릿, 템플릿 drag기능
  * 작성자 : 박경화 외 2명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 마켓플레이스 제품정보 삭제 로직 변경
 -->

<template>
  <div class="marketplace-item-information">
    <section class="button-area -right top-button-area">
      <button
        class="button -edit-button"
        type="is-primary"
        @click="visibleAddCodeModal = !visibleAddCodeModal"
      >
        {{ $t('main.LAYOUT.manageCode') }}
      </button>
      <button
        class="button -edit-button"
        type="is-primary"
        @click="addNewTemplate"
      >
        {{ $t('common.BTN.SERV.addProduct') }}
      </button>
    </section>

    <div class="info-contents">
      <draggable
        :move="onMove"
        :list="bpSvcInfos"
        draggable=".template-contents"
        :group="{name: 'templateGroup', pull: true, put: true}"
        :animation="250"
        :set-data="setData"
        handle=".-draggable-icon"
        ghost-class="ghost"
        @end="e => onDragEnd(bpSvcInfos)"
        @start="onDragStart"
      >
        <div
          class="template-contents"
          v-for="(temp) in bpSvcInfos"
          :key="temp.typeOrder"
        >
          <section class="template-header">
            <a
              v-if="!temp.fixed"
              class="-draggable-icon"
            />
            <el-select
              v-if="!temp.fixed"
              v-model="temp.typeIdx"
              :placeholder="$t('service.selectCode')"
              :popper-append-to-body="false"
              popper-class="dropdown-code"
              style="width: 180px;"
            >
              <el-option
                v-for="item in descTypeOptions"
                :key="item.typeIdx"
                :label="getCodeName(item)"
                :value="item.typeIdx"
                :disabled="checkExistCode(item) || item.isDeleted"
              />
            </el-select>
            <span
              v-else
              class="root-code"
            >
              {{ temp.typeInfo.typeName }}
            </span>
            <button
              v-if="!temp.fixed"
              class="button"
              type="is-icon"
              @click="deleteTemplate(temp)"
            >
              <i class="delete-icon" />
            </button>
          </section>

          <cmp-grid
            v-show="temp.show"
            :item-source="temp.bpDescList"
            :columns="columns"
            :use-excel-download="false"
          >
            <template
              v-for="column in columns"
              :slot="column.binding"
              slot-scope="props"
            >
              <div :key="column.binding">
                <el-input
                  v-if="!props.row.isDefault && !(column.binding === 'descKey' && props.row.bpDescIdx)"
                  v-model="props.row[column.binding]"
                  @click.native="(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }"
                />
                <span
                  v-else
                  class="mp-column-value"
                  :class="{'-default': props.row.isDefault && column.binding === 'descKey'}"
                >{{ props.row[column.binding] }}</span>
              </div>
            </template>

            <template #delete="props">
              <button
                v-if="!props.row.isDefault && temp.bpDescList.length > 1"
                class="button"
                type="is-icon"
                @click="deleteItem({
                  arr: temp.bpDescList,
                  item: props.row,
                  key: 'descKey'
                })"
              >
                <i class="delete-icon" />
              </button>
            </template>
          </cmp-grid>

          <span
            class="temp-ghost"
            v-show="!temp.show"
            :style="temp.bpDescList && `height: ${ (temp.bpDescList.length + 1) * 40}px`"
          >
            {{ $t('service.PLACEHOLDER.marketItemDrag') }}
          </span>

          <div class="add-area flex-wrap">
            <a
              class="add-icon"
              @click="addRow(temp.bpDescList)"
            />
          </div>
        </div>
      </draggable>
    </div>

    <section class="button-area -center bottom-button-area -save-bottom-buttons">
      <button
        class="button"
        size="is-large"
        type="is-anti"
        @click="$router.go(-1)"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        size="is-large"
        type="is-primary"
        @click="applySave"
      >
        {{ $t('common.BTN.save') }}
      </button>
    </section>

    <el-dialog
      :title="$t('service.marketCode')"
      :visible.sync="visibleAddCodeModal"
      width="1000px"
    >
      <div class="manage-code-modal">
        <div class="manage-code-modal-buttons">
          <button
            class="button"
            type="is-primary"
            @click="addNewCode"
            :disabled="codeEditing"
          >
            {{ $t('common.BTN.ADMIN.addCode') }}
          </button>
          <!-- 코드 추가 -->
          <button
            v-if="!codeEditing"
            class="button"
            :disabled="!selectedCodeItem"
            @click="changeEditStatus"
          >
            {{ $t('common.BTN.change') }}
          </button>
          <!-- 변경 -->
          <button
            v-else
            class="button"
            @click="saveCode"
          >
            {{ $t('common.BTN.complete') }}
          </button>
          <!-- 완료 -->
          <button
            v-if="codeEditing"
            class="button"
            type="is-anti"
            @click="cancelCodeEditing"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <!-- 취소 -->
          <button
            class="button"
            type="is-anti"
            :disabled="!selectedCodeItem || codeEditing"
            @click="deleteCode"
          >
            {{ $t('common.BTN.delete') }}
          </button>
          <!-- 삭제 -->
        </div>
        <cmp-grid
          :columns="modifyCodeColumns"
          :item-source="marketCode"
          @selectedRow="selectCode"
          :init-custom-action="init"
          :selectable="!codeEditing"
        >
          <template #typeCode="props">
            <el-input
              v-if="props.row.edit && !props.row.isDefault"
              v-model="props.row.typeCode"
              @keypress.enter.native="saveCode"
            />
          </template>
          <!-- Code -->
          <template #typeName="props">
            <el-input
              v-if="props.row.edit"
              v-model="props.row.typeName"
              @keypress.enter.native="saveCode"
            />
          </template>
          <!-- Name -->
          <template #typeDesc="props">
            <el-input
              v-if="props.row.edit"
              v-model="props.row.typeDesc"
              @keypress.enter.native="saveCode"
            />
          </template>
          <!-- Desc -->
        </cmp-grid>
      </div>
    </el-dialog>
    <!-- 코드 추가 -->
  </div>
</template>
<script>
import * as wjGrid from '@grapecity/wijmo.grid'
import draggable from 'vuedraggable'
import API from '@sd-fe/cmp-core'
import { max } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'MarketplaceItemInformation',
  components: {
    draggable
  },
  props: {
    bpInfo: {
      type: Object,
      default: () => {}
    },
    isOva: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      user: 'user'
    })
  },
  watch: {
    bpInfo: {
      immediate: true,
      handler (newVal) {
        if (!newVal) return
        console.log('@@ bp detail : ', newVal)
        console.log('@@ bp desc infos : ', newVal.bpDescriptions)
        this.mpDetailData = newVal
        this.bpSvcInfos = newVal[this.isOva ? 'ovaDescriptions' : 'bpDescriptions']
          ?.map(item => {
          // 최상단 조건 템플릿 내 isDefault인 키가 참이면
          // 해당 Draggable item을 항상 최상단에 고정하고 설명 타입을 바꿀 수 없게 합니다.
            item.fixed = item.bpDescList?.map(desc => desc.isDefault).includes(true)
            item.crud = ''
            item.show = true
            if (!item.bpDescList) item.bpDescList = []
            return item
          })

        this.setDescTypeOptions()
      }
    },
    visibleAddCodeModal (visible) {
      if (!visible) {
        this.selectedCodeItem = null
        this.codeEditing = false
        this.setDescTypeOptions()
      }
    }
  },
  methods: {
    init (grid) {
      this.codeManageGrid = grid
    },
    /**
     * 템플릿에 삭제된 코드가 있을 시 처리
     */
    insertDeletedCode () {
      const typeInfos = this.bpSvcInfos.filter(bp => bp.typeInfo.isDeleted)

      // 템플릿에 삭제된 코드가 있을 시 처리
      if (typeInfos.length) {
        this.descTypeOptions.push(...typeInfos.map(bp => bp.typeInfo))
      }
    },
    /**
     * 코드 편집 상태를 취소하고 데이터 다시 받아오기
     */
    cancelCodeEditing () {
      this.codeEditing = false
      this.setDescTypeOptions()
    },
    /**
     * 삭제 버튼 클릭 시 삭제 API 호출 및 처리
     */
    deleteCode () {
      if (this.selectedCodeItem.isDefault) this.$alert(this.$t())
      this.$confirm(this.$t('common.CONFIRM.BASE.008')) // 삭제하시겠습니까?
        .then(async () => {
          if (this.codeEditing) return

          try {
            await API.market.deleteMarketCodeType(this.selectedCodeItem.typeIdx)
            this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다.
            this.setDescTypeOptions()
          } catch (error) {
            this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다.
          }
        })
    },
    /**
     * 추가 버튼 클릭 시 새로운 Row 생성
     */
    addNewCode () {
      this.selectedCodeItem = null
      this.codeEditing = true

      if (this.codeManageGrid.rows.length) {
        this.codeManageGrid.rows.forEach(s => {
          s.isSelected = false
          s.cssClass = undefined
        })
      }

      const row = new wjGrid.Row()
      const code = {
        typeCode: '',
        typeDesc: '',
        typeName: '',
        edit: true,
        create: true
      }
      row.dataItem = code
      row.cssClass = 'selected-row'
      this.codeManageGrid.rows.insert(0, row)
      this.selectedCodeItem = row.dataItem
    },
    /**
     * 완료 버튼 클릭 시 코드 저장 후 업데이트
     * 및 새로운 코드 추가 (단건)
     */
    async saveCode () {
      const { typeCode, typeDesc, typeName, typeIdx, create } = this.selectedCodeItem
      const { userId } = this.user
      const payload = {
        typeCode,
        typeDesc,
        typeName,
        userId
      }

      if (!typeCode.trim() || !typeDesc.trim() || !typeName.trim()) {
        return this.$alert(this.$t('common.ALERT.BASE.011')) // 빈 칸을 모두 채워주세요.
      }

      try {
        if (create) await API.market.createMarketCodeType(payload)
        else await API.market.updateMarketCodeType(payload, typeIdx)
        this.marketCode.forEach(item => (item.edit = false))
        this.codeEditing = false
        this.setDescTypeOptions()
        // 추가 시: 추가하였습니다, 변경 시: 변경하였습니다.
        this.$alert(create ? this.$t('common.ALERT.BASE.026') : this.$t('common.ALERT.BASE.007'))
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.020')) // 실패하였습니다.
      }
    },
    /**
     * 변경 버튼 클릭 시 편집 상태 업데이트
     */
    changeEditStatus () {
      this.selectedCodeItem.edit = true
      this.codeEditing = true
    },
    /**
     * row 선택 이벤트
     */
    selectCode (row) {
      if (this.codeEditing) return
      this.selectedCodeItem = row ? row.dataItem : null
    },
    /**
     * Select box에서 이미 존재하는 코드에 대한 disable 처리
     */
    checkExistCode (item) {
      // 생성되있지 않은 코드에서 타입 인덱스 가져오기
      // const templates = this.bpSvcInfos
      //   .filter(bp => !bp.crud || bp.crud !== 'create')
      //   .map(bp => bp.typeIdx)
      // 상관없이 모두 가져오기
      const templates = this.bpSvcInfos.map(bp => bp.typeIdx)
      return templates.includes(item.typeIdx)
    },
    /**
     * 단건 삭제
     */
    deleteTemplate (template) {
      // 백엔드에서 업데이트되지 않고 UI에서 추가하려는 아이템
      if (template.crud === 'create') {
        const findIdx = this.bpSvcInfos.findIndex(desc => desc.descType === template.descType)
        this.bpSvcInfos.splice(findIdx, 1)
      } else {
        this.$confirm(this.$t('common.CONFIRM.BASE.008')) // 삭제하시겠습니까?
          .then(async () => {
            if (this.isOva) {
              const payload = this.bpInfo.ovaDescriptions.filter(desc => desc.typeIdx !== template.typeIdx)
              this.$emit('update-blueprint-desc', { bpDescReqs: payload }, this.bpInfo.ovaUuid)
              return
            }
            // 삭제 API 호출
            try {
              await API.market.deleteMarketTemplate(this.bpInfo.bpIdx, template.descTypeIdx)
              this.$emit('refresh')
              this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다.
            } catch (error) {
              this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다.
            }
          })
          .catch(() => false)
      }
    },
    /**
     * 코드 이름 처리 삭제된 코드일 시에 (삭제됨) 표시
     */
    getCodeName (item) {
      return item.isDeleted ? item.typeName + ` (${this.$t('service.deletedCode')})` : item.typeName
    },
    /**
     * Draggable 리스트 이동 핸들링
     * 고정된 Element는 리스트에서 이동할 수 없게 만듭니다.
     */
    onMove ({ relatedContext, draggedContext }) {
      const relatedElement = relatedContext.element
      const draggedElement = draggedContext.element
      return (
        (!relatedElement || !relatedElement.fixed) && !draggedElement.fixed
      )
    },
    async setDescTypeOptions () {
      this.descTypeOptions = await API.market.getMarketDescType()
      this.insertDeletedCode()
      this.marketCode = this.descTypeOptions.map(desc => ({ ...desc, edit: false }))
      this.selectedCodeItem = null
    },
    /**
     * 빈 값을 체크합니다.
     * @param {Object} obj 체크 할 오브젝트
     * @return {Boolean} 코드가 비었을 때 'noCode' 반환, 그 외 빈 값이 있으면 True, 없으면 False 반환
     */
    isEmptyData (obj) {
      let isEmpty = false
      // if (!obj.code) isEmpty = 'noCode'
      if (!obj.descType) isEmpty = 'noCode'
      else {
        const emptyItems = obj.bpDescList.filter(item => !item.descKey || !item.displayName || !item.descValue)
        if (emptyItems?.length) isEmpty = true
      }
      return isEmpty
    },
    /**
     * 마켓플레이스 템플릿 데이터 검증
     */
    validateTemplates () {
      const parent = this.bpSvcInfos.map(info => info.bpDescList)
      const child = parent.every(templates => templates.every(t => t.isDefault || (t.descKey.trim() && t.displayName.trim() && t.descValue.trim())))

      console.log(parent, child)

      if (!this.bpSvcInfos.every(info => !!info.typeIdx)) return { isValidated: false, code: 'noCode' }
      if (!child) return { isValidated: false, code: 'noInput' }

      return { isValidated: true, code: '' }
    },
    applySave () {
      // 검증
      const { isValidated, code } = this.validateTemplates()
      if (!isValidated) {
        const message = {
          noCode: this.$t('common.ALERT.SERVICE.007'), // 코드를 선택해주세요.
          noInput: this.$t('common.ALERT.BASE.012') // 빈 칸을 입력해주세요.
        }[code]

        return this.$alert(message)
      }

      this.bpSvcInfos.forEach(bp => {
        bp.bpDescList.forEach(desc => {
          if (desc.crud === 'create') {
            delete desc.descTypeIdx
            delete desc.isDefault
          }
        })
      })

      const payload = {
        bpDescReqs: this.bpSvcInfos.map(bp => {
          const bpTemp = {
            descTypeIdx: bp.descTypeIdx,
            bpIdx: bp.bpIdx,
            typeIdx: bp.typeIdx,
            typeOrder: bp.typeOrder,
            isDeleted: bp.isDeleted,
            bpDescList: bp.bpDescList
          }
          if (bp.crud === 'create') delete bpTemp.descTypeIdx
          // 기존의 코드를 다른 코드로 했을 때
          else if (bp.typeIdx !== bp.typeInfo.typeIdx) {
            bpTemp.bpDescList.forEach(desc => (delete desc.bpDescIdx))
            delete bpTemp.descTypeIdx
          }
          return bpTemp
        })
      }

      return this.$emit('update-blueprint-desc', payload, this.isOva ? this.$route.params.uuid : this.$route.params.bpIdx)
    },
    addNewTemplate () {
      const newTemp = {
        bpIdx: this.mpDetailData.bpIdx,
        bpUuid: this.mpDetailData.bpUuid,
        crud: 'create',
        descType: '',
        bpDescList: [],
        show: true
      }

      const orders = this.bpSvcInfos.map(bp => bp.typeOrder)
      newTemp.typeOrder = max(orders) + 1

      this.addRow(newTemp.bpDescList)
      this.bpSvcInfos.push(newTemp)
    },
    /**
     * [추가] 아이콘을 눌렀을 때, 테이블 하단에 입력 가능한 row를 추가합니다.
     * @param {Array} arr 추가 당하는 배열
     */
    addRow (arr) {
      console.log('@@ addRow > arr : ', arr)
      const newItem = {
        descKey: '',
        displayName: '',
        descValue: ''
      }

      arr.push(newItem)

      this.$forceUpdate()
    },
    /**
     * 템플릿 제거
     * @param {Array} arr 제거 대상 배열
     * @param {Object} item 제거 할 아이템
     * @param {String} key 비교 할 id 값
     */
    deleteItem ({ arr, item, key }) {
      let removeIdx
      if (item.isDefault) return
      for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === item[key]) {
          removeIdx = i
          break
        }
      }
      arr.splice(removeIdx, 1)
      this.$forceUpdate()
    },
    setData (dataTransfer) {
      const img = new Image()
      dataTransfer.setDragImage(img, 0, 0)
    },
    onDragStart (event) {
      this.bpSvcInfos = this.setGridVisibility(this.bpSvcInfos, false)
    },
    async onDragEnd (tempList) {
      console.log('@ tempList :', tempList)
      try {
        for (const i in tempList) {
          tempList[i].typeOrder = Number(i) + 1
        }
        const result = await API.market.updateProductDescOrder({ bpIdx: this.mpDetailData.bpIdx, req: tempList })
        console.log('@@ onDragEnd > result', result)

        this.bpSvcInfos = this.setGridVisibility(this.bpSvcInfos, true)
      } catch (error) {
        console.error(error)
      }
    }
  },
  data () {
    return {
      codeManageGrid: null,
      visibleAddCodeModal: false,
      editTemplateModal: false,
      updateItem: {},
      initData: [],
      bpSvcInfos: [],
      descTypeOptions: [],
      mpDetailData: {},
      isTemplate: true,
      columns: [
        { header: 'Key(사용자단 비노출)', binding: 'descKey', customHtml: true, width: 300, align: 'left', keyPath: 'service.key' },
        { header: 'Display Name', binding: 'displayName', customHtml: true, width: 300, align: 'left' },
        { header: 'Value', binding: 'descValue', customHtml: true, width: '*', align: 'left' },
        { header: ' ', binding: 'delete', customHtml: true, width: 60 }
      ],
      setGridVisibility (data, status) {
        return data.map(info => {
          info.show = status
          return info
        })
      },
      modifyCodeColumns: [
        { header: 'Code', binding: 'typeCode', customHtml: true },
        { header: 'Name', binding: 'typeName', customHtml: true },
        { header: 'Desc', binding: 'typeDesc', customHtml: true }
      ],
      selectedCodeItem: null,
      codeEditing: false,
      marketCode: []
    }
  }
}
</script>
<style lang="scss">
.dropdown-code {
  width: inherit;
}
.marketplace-item-information {
  position: relative;
  margin-top: -$gap;
  > .top-button-area {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
  .info-contents {
    position: relative;
    > .-edit-button {
      position: absolute;
      top: -$gap-s;
      right: 0;
    }
    .template-contents {
      &:first-of-type .template-header {
        height: 40px;
        .root-code {
          position: relative;
          top: -1px;
          margin-left: $gap-s;
        }
      }
      & + .template-contents {margin-top: $gap * 2;}
      .template-header {
        display: flex;
        align-items: center;
        margin-bottom: $gap-s;
        .-draggable-icon {
          display: inline-block;
          width: 8px;
          height: 12px;
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
          background-image: url('../../../../../assets/images/icon-dnd.svg');
        }
        > * {margin-right: $gap-s;}
      }

      .mp-column-value {
        &.-default {
          position: relative;
          &::after {
            content: '*';
            position: absolute;
            top: 0px;
            left: calc(100% + 5px);
            font-size: 15px;
            color: $main-red;
            height: 100%;
          }
        }
      }
    }
    .add-area {
      margin: $gap 0;
      justify-content: center;
    }

    .temp-ghost {
      display: grid;
      align-items: center;
      justify-content: center;
      border: 1px solid $input-stroke;
      font-size: 12px;
      color: $input-placeholder
    }
  }

  .-save-bottom-buttons {
    margin-top: $gap * 2;
  }
}
.manage-code-modal {
  > .manage-code-modal-buttons {
    display: flex;
    justify-content: flex-end;
    margin-bottom: $gap-s;
    > * + * {
      margin-left: $gap-s;
    }
  }
}
</style>
