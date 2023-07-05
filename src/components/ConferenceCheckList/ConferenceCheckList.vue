<!--
  * 파일명 : ConferenceCheckList.vue
  * 파일 기능 : [확인사항] 확인사항을 체크할 수 있는 모달을 띄워줍니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 업무 > 확인사항 수정
 -->

<template>
  <div class="conference-checklist">
    <button
      class="button icon-button"
      ref="d-check"
      type="is-icon"
      @click.stop="checkListModal = !checkListModal"
    >
      <i class="icon-checklist" />
      <span>{{ $t('task.PRIOR.DETAIL.check') }}</span>
    </button>

    <cmp-drop-down
      :active.sync="checkListModal"
      @close="checkListModal = false"
      custom-id="d-check"
      :title="$t('task.PRIOR.DETAIL.check')"
      transition-style="fade"
      :right="right"
      inner-close-btn
    >
      <ul class="check-list">
        <li
          class="check-item"
          v-for="(item, index) in checkLists"
          :key="index"
        >
          <work-flow-fold-panel
            :data="item"
            :fold-state="item.foldState"
            class="checklist-fold-panel"
            :deletable="false"
            :draggable="false"
            :is-check-list="true"
          />
        </li>
      </ul>

      <template #footer>
        <div
          class="button-area -center -save-checkList"
          v-if="!isDone"
        >
          <button
            class="button"
            type="is-primary"
            size="is-small"
            @click="saveList"
          >
            {{ $t('common.BTN.save') }}
          </button>
        </div>
      </template>
    </cmp-drop-down>
  </div>
</template>
<script>
import CMPDropDown from '@/components/common/g-drop-down/cmp-drop-down'
import WorkFlowFoldPanel from '@/components/WorkFlowFoldPanel/WorkFlowFoldPanel'
export default {
  name: 'ConferenceCheckList',
  components: {
    'cmp-drop-down': CMPDropDown,
    'work-flow-fold-panel': WorkFlowFoldPanel
  },
  props: {
    data: { // 체크리스트에 뿌려주는 데이터 입니다.
      type: Array,
      default: () => []
    },
    right: {
      type: String,
      default: '0px'
    },
    isDone: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    data (newVal) {
      this.setData(newVal)
    }
  },
  mounted () {
    this.setData(this.data)
    // console.log('사전협의 확인사항 > ', this.checkLists)
  },
  methods: {
    setData (data) {
      this.checkLists = JSON.parse(JSON.stringify(data))
      // this.checkLists = [...data]
      this.checkLists = this.checkLists.map(item => {
        item.edit = false
        this.setChildrenValue(item)
        return item
      })
    },
    setChildrenValue (item) {
      if (!item.setList?.length) return
      item.setList.forEach(child => {
        child.writable = true
        // else if (child.readable) child.edit = false

        if (!child.value) this.$set(child, 'value', '')
      })
    },
    saveList () {
      this.$confirm(this.$t('common.CONFIRM.BASE.034'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$emit('save', this.checkLists)
      }).catch(() => {
        return false
      })
    }
  },
  data () {
    return {
      checkListModal: false,
      checkLists: []
    }
  }
}
</script>
<style lang="scss">
  .conference-checklist {
    font-size: 13px;
    > .cmp-drop-down {
      > .cmp-dropdown-wrapper {
        padding: 65px 0 20px;;
      }
    }
    > .icon-button {
      color: $color-lightgrey;
      display: flex;
      align-items: center;

      .icon-checklist {
        display: inline-block;
        margin-right: 5px;
        width: 20px;
        height: 20px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../assets/images/icon-checklist@3x.png');
      }

      span {
        display: block;
        line-height: 20px;
        margin-top: 2px;
      }
    }
    .check-list {
      padding: 0 $gap-m;
      > .check-item {
        width: 250px;
        color: $white;
        & + .check-item {
          margin-top: $gap-s;
        }
        .workflow-fold-panel.checklist-fold-panel {
          > .fold-body {
            position: relative;
            &::before {
              content: '';
              position: absolute;
              top: 0;
              right: $gap;
              left: $gap;
              height: 1px;
            }
          }
        }
      }
    }
    .-save-checkList {
      margin-top: $gap;
    }
  }
</style>
