<template>
  <fold-panel
    :title="activeType.label"
    class="dynamic-meta-component-item"
    :foldable="'customAtt' in activeType"
    :is-collapsed="isCollapsed"
  >
    <a
      slot="header-prefix"
      class="-draggable-icon"
    />
    <div
      slot="header"
      class="component-name"
    >
      <i
        class="component-icon"
        :class="`mdi mdi-${activeType.icon}`"
      />
      <span>
        {{ activeType.label }}
      </span>
    </div>

    <template #header-suffix="props">
      <i
        v-if="props.isFoldable"
        class="mdi"
        :class="[props.isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up']"
      />
    </template>

    <meta-component-custom-att
      :custom-att="activeType.customAtt"
      :type="activeType.type"
    />
  </fold-panel>
</template>

<script>
import FoldPanel from '@/components/FoldPanel/FoldPanel'
import MetaComponentCustomAtt from './MetaComponentCustomAtt.vue'

export default {
  name: 'DynamicMetaComponentItem',
  components: { FoldPanel, MetaComponentCustomAtt },
  props: {
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    isCollapsed: { // 접혔을 때 : true
      type: Boolean,
      default: true
    }
  },
  watch: {
    type: {
      immediate: true,
      handler (val) {
        if (val) {
          const selected = this.typeList.find(item => item.type === val)
          this.activeType = selected || this.typeList[0]
        } else this.activeType = this.typeList[0]
      }
    }
  },
  methods: {

  },
  data: () => ({
    activeType: null,
    typeList: [
      {
        type: 'text',
        label: 'Text',
        icon: 'form-textbox',
        data: '',
        dataType: 'String',
        customAtt: {
          minLength: null,
          maxLength: null,
          placeholder: '',
          width: 200,
          sample: ''
        }
      },
      {
        type: 'textarea',
        label: 'Text Area',
        icon: 'form-textarea',
        data: '',
        dataType: 'String',
        customAtt: {
          maxLength: null,
          placeholder: '',
          sample: ''
        }
      },
      {
        type: 'radio',
        label: 'Radio',
        icon: 'radiobox-marked',
        data: '',
        dataType: 'String',
        customAtt: {
          options: [
            { label: '', value: null },
            { label: '', value: null }
          ],
          sample: ''
        }
      },
      {
        type: 'checkbox',
        label: 'CheckBox',
        icon: 'checkbox-marked-outline',
        data: [],
        dataType: 'Array',
        customAtt: {
          options: [
            { label: '', value: null }
          ],
          sample: ''
        }
      },
      {
        type: 'combobox',
        label: 'Select Box',
        icon: 'form-select',
        data: '',
        dataType: 'String',
        customAtt: {
          width: 200,
          placeholder: '',
          options: [
            { label: '', value: null },
            { label: '', value: null }
          ],
          sample: ''
        }

      },
      {
        type: 'toggle',
        label: 'Toggle',
        icon: 'toggle-switch-outline',
        data: false,
        dataType: 'Boolean',
        customAtt: {
          value: '',
          sample: ''
        }
      },
      {
        type: 'datepicker',
        label: 'Date Picker',
        data: '',
        icon: 'calendar-range',
        customAtt: {
          placeholder: '',
          sample: ''
        }
      },
      {
        type: 'dateTimePicker',
        label: 'Date Time Picker',
        data: '',
        icon: 'clock-outline',
        customAtt: {
          placeholder: '',
          sample: ''
        }
      },
      {
        type: 'timepicker',
        label: 'Time Picker',
        icon: 'clock-outline',
        data: null,
        customAtt: {
          placeholder: '',
          startTime: '00:00',
          endTime: '23:00',
          timeStep: '00:10',
          sample: ''
        }
      },

      // tree/view
      {
        type: 'groupTree',
        label: '관계사-조직 Tree',
        icon: 'family-tree',
        data: null,
        dataType: 'Object',
        customAtt: {
          buttonName: '',
          modalTitle: '',
          sample: ''
        }
      },
      {
        type: 'groupAccount',
        label: '조직 계정 View',
        data: [],
        dataType: 'Array',
        icon: 'account-group-outline',
        customAtt: {
          buttonName: '',
          modalTitle: '',
          sample: ''
        }
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
  .dynamic-meta-component-item::v-deep{
    border: none;
    &.-expand {
      color: $color-grey;
      > .fold-header {
        color: $color-ticket;
        background: $white;
      }
      > .fold-body {
        background: $white;
        border-top: 1px solid #d9d9d9;
      }
      .horizon-line { background-color: #F0F0F0; }
    }
    .fold-header {
      background-color: #2A2D44;
      border: none;
    }
    .fold-body {
      padding: 10px 20px 10px 40px;
    }
    .el-input__inner, .el-textarea__inner {
      background-color: $white;
      border: 1px solid #caced0;
      color: $color-middlegrey;
      &::placeholder {
        color: #aaa;
      }
    }
  }
  .component-name {
    display: flex;
    align-items: center;
    gap: $gap-s;
  }
  .-draggable-icon {
    display: inline-block;
    margin-right: $gap-s;
    width: 7px;
    height: 12px;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('../../../assets/images/icon-dnd.svg');
  }
  .custom-att-item {
    display: flex;
    & + .custom-att-item { margin-top: 10px;}
    &.-options { flex-direction: column; }
    &-title {
      display: block;
      min-width: 100px;
      line-height: 32px;
    }
  }
  .option-list {
    display: flex;
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
</style>
