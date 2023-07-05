<template>
  <ul
    class="custom-att-list"
    v-if="customAtt"
  >
    <li
      class="custom-att-item"
      v-if="'width' in customAtt"
    >
      <span class="custom-att-item-title">width</span>
      <el-input-number
        v-model="customAtt.width"
        :controls="false"
      />
      <span style="margin: 8px 0 0 10px; width: 30px;">px</span>
    </li>
    <!-- minLength -->

    <li
      class="custom-att-item"
      v-if="'minLength' in customAtt"
    >
      <span class="custom-att-item-title">minLength</span>
      <el-input
        v-model="customAtt.minLength"
        type="number"
        placeholder="미정"
        :min="0"
        @keydown.native="e => {
          const invalid = ['i','-', '+', 'e']
          if(invalid.includes(e.key)) e.preventDefault()
        }"
      />
    </li>
    <!-- minLength -->

    <li
      class="custom-att-item"
      v-if="'maxLength' in customAtt"
    >
      <span class="custom-att-item-title">maxLength</span>
      <el-input
        v-model="customAtt.maxLength"
        type="number"
        placeholder="미정"
        :min="1"
        @keydown.native="e => {
          const invalid = ['i','-', '+', 'e']
          if(invalid.includes(e.key)) e.preventDefault()
        }"
      />
    </li>
    <!-- maxLength -->

    <li
      class="custom-att-item"
      v-if="'placeholder' in customAtt"
    >
      <span class="custom-att-item-title">Placeholder</span>
      <el-input v-model="customAtt.placeholder" />
    </li>
    <!-- placeholder -->

    <li
      class="custom-att-item"
      v-if="'label' in customAtt"
    >
      <span class="custom-att-item-title">Label</span>
      <el-input v-model="customAtt.label" />
    </li>
    <!-- label -->

    <li
      class="custom-att-item"
      v-if="'value' in customAtt"
    >
      <span class="custom-att-item-title">Value</span>
      <el-input v-model="customAtt.value" />
    </li>
    <!-- value -->

    <li
      class="custom-att-item"
      v-if="'buttonName' in customAtt"
    >
      <span class="custom-att-item-title">버튼 명</span>
      <el-input v-model="customAtt.buttonName" />
    </li>
    <!-- buttonName -->

    <li
      class="custom-att-item"
      v-if="'modalTitle' in customAtt"
    >
      <span class="custom-att-item-title">모달 타이틀</span>
      <el-input v-model="customAtt.modalTitle" />
    </li>
    <!-- modalTitle -->

    <li
      class="custom-att-item"
      v-if="'startTime' in customAtt"
    >
      <span class="custom-att-item-title">시작 시간</span>
      <div class="flex-wrap">
        <el-input-number
          v-model="startTime.hour"
          :controls="false"
          class="time-input"
          :min="0"
          :max="23"
        />:
        <el-input-number
          v-model="startTime.min"
          :controls="false"
          class="time-input"
          :min="0"
          :max="59"
        />
      </div>
    </li>
    <!-- startTime -->

    <li
      class="custom-att-item"
      v-if="'endTime' in customAtt"
    >
      <span class="custom-att-item-title">종료 시간</span>
      <div class="flex-wrap">
        <el-input-number
          v-model="endTime.hour"
          :controls="false"
          class="time-input"
        />:
        <el-input-number
          v-model="endTime.min"
          :controls="false"
          class="time-input"
        />
      </div>
    </li>
    <!-- endTime -->

    <li
      class="custom-att-item"
      v-if="'timeStep' in customAtt"
    >
      <span class="custom-att-item-title">시간 스텝</span>
      <div class="flex-wrap">
        <el-input-number
          v-model="timeStep.hour"
          :controls="false"
          class="time-input"
        />:
        <el-input-number
          v-model="timeStep.min"
          :controls="false"
          class="time-input"
        />
      </div>
    </li>
    <!-- timeStep -->

    <li
      class="horizon-line"
      v-if="type === 'combobox'"
    />

    <li
      class="custom-att-item -options"
      v-if="'options' in customAtt"
    >
      <div
        class="option-list"
        v-for="(option, idx) in customAtt.options"
        :key="idx"
      >
        <span class="custom-att-item-title flex-wrap">
          <i
            v-if="type && type === 'checkbox'
              ? customAtt.options.length > 1
              : customAtt.options.length > 2"
            class="-delete-icon delete-btn"
            @click.stop="deleteOption(customAtt.options, idx)"
          />
          옵션&nbsp;{{ idx+1 }}
        </span>
        <div>
          <el-input
            v-model="option.label"
            placeholder="label"
          />
          <el-input
            v-if="'value' in option"
            v-model="option.value"
            placeholder="value"
            style="margin-top: 5px;"
          />
        </div>
      </div>
      <div class="button-area -right">
        <button
          class="button"
          size="is-mini"
          type="is-primary"
          @click="addOption(customAtt.options)"
        >
          옵션 추가
        </button>
      </div>
    </li>
    <!-- options -->

    <li
      class="custom-att-item"
      v-if="'sample' in customAtt"
    >
      <span class="custom-att-item-title">Excel기입 Sample</span>

      <el-input
        v-model="customAtt.sample"
        type="textarea"
        placeholder="Excel 기입 시 보여질 Sample값을 입력하세요."
        :style="{
          maxWidth: '100%'
        }"
        :rows="3"
      />
    </li>
    <!-- sample -->
  </ul>
</template>

<script>
export default {
  name: 'MetaComponentCustomAtt',
  props: {
    customAtt: {
      type: Object,
      default: () => {}
    },
    type: {
      type: String,
      default: undefined
    }
  },
  methods: {
    addOption () {
      const newOption = { label: '', value: null }

      this.customAtt.options.push(newOption)
    },
    deleteOption (list, idx) {
      list.splice(idx, 1)
    }
  },
  data: () => ({
    startTime: {
      hour: 0,
      min: 0
    },
    endTime: {
      hour: 23,
      min: 0
    },
    timeStep: {
      hour: 0,
      min: 30
    },

    // 미등록 엑셀 등록 시 필요한 정보
    excelSampleModal: false,
    beforeSampleData: null
  })
}
</script>

<style lang="scss" scoped>
.custom-att-list {
  .custom-att-item {
    display: flex;
    & + .custom-att-item { margin-top: 10px;}
    &.-options { flex-direction: column; }
    &-title {
      display: block;
      min-width: 110px;
      line-height: 32px;
    }
  }
  .option-list {
    // display: flex;
    & + .option-list { margin-top: 10px; }
  }
  .button-area {
    margin-top: $gap-s;
  }
  .delete-btn {
    margin-right: 5px;
    transform: translateY(2px);
    cursor: pointer;
  }
  .time-input { margin: 0 10px; min-width: 30px; width: 70px; }

  .horizon-line { margin: 15px 0; width: 100%; height: 1px; background-color: rgba($input-stroke, .5);}
}
</style>
