<template>
  <el-dialog
    v-loading="isLoadingModal"
    :visible="active"
    :title="modalTitle"
    @close="$emit('close')"
    width="650px"
    class="alarm-trigger-create-modal"
  >
    <div class="alarm-trigger">
      <div class="trigger-form">
        <register-contents
          title="트리거명"
          required
        >
          <el-input
            v-model="form.triggerName"
            placeholder="트리거명을 입력하세요."
          />
        </register-contents>

        <register-contents
          title="트리거 유형"
          required
        >
          <el-select
            v-model="form.triggerType"
            placeholder="트리거 유형 선택"
          >
            <el-option
              v-for="type in cycleOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </register-contents>

        <register-contents
          title="URL"
          required
        >
          <el-input
            v-model="form.url"
            placeholder="URL을 입력하세요."
          />
        </register-contents>

        <register-contents
          title="Method"
          required
        >
          <el-select
            v-model="form.method"
            class="method-select"
            placeholder="Method 선택"
          >
            <el-option
              v-for="option in methodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </register-contents>

        <register-contents
          title="Content"
          required
        >
          <div class="vertical-flex">
            <el-input
              v-model="form.contentKeyword"
              placeholder="변수명"
            />
            <el-select
              v-model="form.content"
              placeholder="선택"
            >
              <el-option
                v-for="content in contents"
                :key="content.value"
                :label="content.label"
                :value="content.value"
              />
            </el-select>
            <el-input
              v-model="form.contentValue"
              placeholder="값"
            />
          </div>
        </register-contents>

        <register-contents
          title="Content Type"
          required
        >
          <el-select
            v-model="form.contentType"
            placeholder="선택"
          >
            <el-option
              v-for="contentType in contentTypes"
              :key="contentType.value"
              :label="contentType.label"
              :value="contentType.value"
            />
          </el-select>
        </register-contents>

        <register-contents
          title="Macro"
          required
        >
          <div class="macro-wrapper">
            <div
              v-for="(macro, macroIdx) in form.macros"
              :key="macro.key"
              class="vertical-flex"
            >
              <el-input
                v-model="macro.keyword"
                placeholder="Template Key"
              />
              <el-input
                v-model="macro.jsonKey"
                placeholder="Json Key"
              />
              <div class="macro-actions">
                <i
                  v-if="form.macros.length !== 1 && macroIdx !== 0"
                  class="mdi mdi-minus-circle-outline mr-s"
                  @click="() => onRemoveMacro(macro)"
                />
                <i
                  class="mdi mdi-plus-circle-outline"
                  @click="() => onAddMacro(macroIdx)"
                />
              </div>
            </div>
          </div>
        </register-contents>

        <register-contents
          title="기본 수신 대상"
          required
        >
          <el-input
            v-model="form.defaultReceiver"
            placeholder="기본 수신 대상을 입력하세요."
          />
        </register-contents>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="$emit('close')"
        >
          취소
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onClickSave"
        >
          {{ isEdit ? '적용' : '저장' }}
        </button>
      </section>
    </div>
  </el-dialog>
</template>

<script>
import { uniqueId, cloneDeep, omit } from 'lodash'
import API from '@sd-fe/cmp-core'

const defaultFormData = {
  triggerName: '', // 트리거명
  triggerType: '', // 트리거 유형
  url: '', // URL
  method: '', // Method
  content: '', // Content
  contentKeyword: '',
  contentValue: '',
  contentType: '', // Content Type
  macros: [
    { keyword: '', jsonKey: '', key: uniqueId('macro-') }
  ], // Macro
  defaultReceiver: ''
}

export default {
  name: 'AlarmTriggerCreate',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    alarmCycles: {
      type: Array,
      default: () => ([])
    },
    contentCondition: {
      type: Array,
      default: () => ([])
    },
    methodTypes: {
      type: Array,
      default: () => ([])
    },
    editData: {
      type: Object,
      default: null
    }
  },
  computed: {
    modalTitle () {
      return this.isEdit ? '트리거 수정' : '트리거 추가'
    },
    contents () {
      return this.contentCondition.map(condition => ({
        ...condition,
        label: condition.codeName,
        value: condition.codeVal
      }))
    },
    methodOptions () {
      return this.methodTypes.map(method => ({
        ...method,
        label: method.codeName,
        value: method.codeVal
      }))
    },
    cycleOptions () {
      return this.alarmCycles.map(cycle => ({
        ...cycle,
        label: cycle.codeName,
        value: cycle.codeVal
      }))
    }
  },
  watch: {
    active: {
      handler (visible) {
        if (visible) this.handleActive()
      }
    }
  },
  methods: {
    /**
     * 유효성 검증
     */
    validateForm () {
      const validates = [
        { c: this.form.triggerName, message: this.$v('트리거명을 입력하세요.') },
        { c: this.form.triggerType, message: this.$v('트리거 유형을 선택하세요.') },
        { c: this.form.url, message: this.$v('URL을 입력하세요.') },
        { c: this.form.method, message: this.$v('Method를 선택하세요.') },
        { c: this.form.contentKeyword, message: this.$v('Content 변수명을 입력하세요.') },
        { c: this.form.content, message: this.$v('Content 비교 유형을 선택하세요.') },
        { c: this.form.contentValue, message: this.$v('Content 값을 입력하세요.') },
        { c: this.form.contentType, message: this.$v('Content Type을 선택하세요.') },
        { c: this.form.macros.every(macro => macro.keyword && macro.jsonKey), message: this.$v('매크로의 Template Key 혹은 JSON Key를 입력하세요.') },
        { c: this.form.defaultReceiver, message: this.$v('기본 수신 대상을 입력하세요.') }
      ]

      const validated = validates.every(v => v.c)

      if (validated) return true
      else {
        const noValidate = validates.find(v => !v.c)
        this.$alert(noValidate.message)
        return false
      }
    },
    /**
     * 변경/저장 버튼 클릭 이벤트
     */
    onClickSave () {
      if (!this.validateForm()) return

      const confirmMessage = this.isEdit
        ? this.$v('트리거를 수정하시겠습니까?')
        : this.$v('트리거를 추가하시겠습니까?')

      this.$confirm(confirmMessage)
        .then(async () => {
          const successMessage = this.isEdit
            ? this.$v('수정 완료되었습니다.')
            : this.$v('생성 완료되었습니다.')
          const failMessage = this.isEdit
            ? this.$v('수정 실패하였습니다.')
            : this.$v('생성 실패하였습니다.')
          const apiFn = this.isEdit
            ? API.alarm.updateTrigger
            : API.alarm.createTrigger

          try {
            this.isLoadingModal = true
            const reqBody = {
              alarmType: 'MAIL',
              alarmCycleType: this.form.triggerType,
              contentComparisonSymbol: this.form.content,
              contentKeyword: this.form.contentKeyword,
              contentType: this.form.contentType,
              contentValue: this.form.contentValue,
              defaultReceiverName: this.form.defaultReceiver,
              macroList: this.form.macros.map(macro => omit(macro, ['key'])),
              method: this.form.method,
              name: this.form.triggerName,
              url: this.form.url
            }
            if (this.isEdit) {
              reqBody.id = this.editData.id
              reqBody.useYn = this.editData.useYn
              reqBody.macroList = reqBody.macroList.map(macro => ({ ...macro, almTriggerId: this.editData.id }))
            }
            await apiFn(reqBody)
            this.$alert(successMessage)
            this.$emit('close')
            this.$emit('required-refresh')
          } catch (error) {
            console.log(error)
            this.$alert(failMessage)
          } finally {
            this.isLoadingModal = false
          }
        })
        .catch(() => false)
    },
    handleActive () {
      // 폼 데이터 초기화
      this.form = cloneDeep(defaultFormData)

      if (this.isEdit) {
        // 수정일 때 필요한 내용을 채운다.
        this.form.triggerType = this.editData.alarmCycleType
        this.form.triggerName = this.editData.name
        this.form.content = this.editData.contentComparisonSymbol
        this.form.contentKeyword = this.editData.contentKeyword
        this.form.contentValue = this.editData.contentValue
        this.form.url = this.editData.url
        this.form.defaultReceiver = this.editData.defaultReceiverName
        this.form.method = this.editData.method
        this.form.contentType = this.editData.contentType
        this.form.macros = (this.editData.macroList || []).map(macro => ({
          ...macro,
          key: uniqueId('macro-key-')
        }))
      } else {
        this.form.triggerType = this.cycleOptions[0]?.value
        this.form.method = this.methodOptions[0]?.value
        this.form.content = this.contents[0]?.value
        this.form.contentType = this.contentTypes[0].value
      }
    },
    /**
     * 매크로를 제거한다.
     */
    onRemoveMacro (macro) {
      this.form.macros = this.form.macros.filter(_macro => _macro.key !== macro.key)
    },
    /**
     * 매크로를 추가한다.
     * (+ 버튼을 누른 다음 순서에 추가한다.)
     */
    onAddMacro (idx) {
      const _macro = {
        keyword: '',
        jsonKey: '',
        key: uniqueId('macro-')
      }

      this.form.macros.splice(idx + 1, 0, _macro)
    }
  },
  data: () => ({
    isLoadingModal: false,
    form: cloneDeep(defaultFormData),
    contentTypes: [
      { label: 'String', value: 'String' },
      { label: 'Integer', value: 'Integer' },
      { label: 'Boolean', value: 'Boolean' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.alarm-trigger {
  .trigger-form {
    border-top: 1px solid $dark-slate;

    .method-select {
      max-width: 200px;
    }

    .vertical-flex {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;

      .mdi {
        color: $input-placeholder;

        &:hover {
          cursor: pointer;
          color: $white;
        }
      }

      > * + * {
        margin-left: $gap-s;
      }
    }

    .el-select {
      max-width: 200px;
    }

    .mr-s {
      /* margin-right: $gap-s; */
    }

    .macro-wrapper {
      max-height: 300px;
      overflow-y: auto;

      & > * + * {
        margin-top: $gap-s;
      }
    }

    .macro-actions {
      min-width: 60px;

      > .mdi {
        display: inline-block;

        &.mdi-minus-circle-outline {
          margin-right: 5px;
        }
      }
    }
  }
}

.alarm-trigger-create-modal {
  &::v-deep {
    .el-dialog {
      max-height: 80%;
      overflow-y: auto;
    }
  }
}
</style>
