<!--
  * 파일명 : SelectListModal.vue
  * 파일 기능 : 관계사 선택 모달
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할관리 > 관계사 설정 초기 설정 데이터 세팅
 -->

<template>
  <el-dialog
    :title="title"
    :visible.sync="isActive"
    class="select-list-modal"
    @close="close"
  >
    <slot />
    <section class="modal-body">
      <ul
        v-if="isActive"
        class="mapping-list"
      >
        <li
          v-for="item in listData"
          :key="item.field"
          :class="['mapping-item', {'-active': item.selected}]"
          @click="selectItem(item, listData, item.selected)"
        >
          <span class="mapping-text">{{ item.label }}</span>
        </li>
      </ul>
    </section>

    <section class="modal-footer">
      <div class="modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="close()"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="applyMapping()"
          type="is-primary"
          :disabled="!regionCondition"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </section>
  </el-dialog>
</template>

<script>
export default {
  name: 'SelectListModal',
  props: {
    title: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    },
    width: {
      type: String,
      default: '35%'
    },
    // 해당 값이 true면 선택된 아이템이 반드시 있어야 합니다.
    requiredSelect: {
      type: Boolean,
      default: false
    },
    isRegion: { // 리전 가용 용역 2개 선택
      type: Boolean,
      default: false
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal

      if (newVal) {
        // this.copyData = JSON.parse(JSON.stringify(this.data))
        this.listData = JSON.parse(JSON.stringify(this.data))
        this.selectedItems = this.listData.filter(item => item.selected === true)

        console.log('@@@@', this.listData)
      }
    },
    data: {
      immediate: true,
      handler (newVal) {
        this.listData = JSON.parse(JSON.stringify(newVal))
        this.selectedItems = this.listData.filter(item => item.selected === true)
      }
    }
    /*
    selectedItems (newVal) {
      console.log('선택된 친구들: ', newVal)
    } */
  },
  computed: {
    regionCondition () {
      // region 속성이 존재하면 맞는 condition 부여 나머지는 무조건 false
      if (this.isRegion) {
        const isLengthValid = this.selectedItems.length === 2
        return (isLengthValid) // 현재는 2 후에 변경
      }
      return (this.selectedItems.length > 0)
    }
    // listData: {
    //   get () { return this.copyData },
    //   set (newVal) { return newVal }
    // }
  },
  methods: {
    close () {
      this.$emit('close')
      // this.listData = this.copyData
      this.selectedItems = this.listData.filter(list => list.selected)
      // this.setInitState()
    },
    /**
     * @param item 선택된 아이템
     */
    selectItem (item, lists, state) {
      // console.log('item', item)
      // console.log('lists', lists)
      // console.log('state', state)

      if (item.field === 'all') {
        this.listData = this.listData.map(list => {
          list.selected = !state
          return list
        })
      } else item.selected = !state

      const exceptAll = this.listData.filter(list => list.field !== 'all')
      this.selectedItems = exceptAll.filter(list => list.selected)

      // ---
      // ---
      // ---
      // ---

      // if (state) {
      //   for (let i = 0; i < this.selectedItems.length; i++) {
      //     if (item.field === this.selectedItems[i].field) {
      //       this.selectedItems[i].selected = !state
      //       this.selectedItems.splice(i, 1)
      //       break
      //     }
      //   }
      //   // console.log('this.selectedItems', this.selectedItems)
      // } else {
      //   lists.forEach(list => {
      //     if (item.field === 'all') {
      //       list.selected = true
      //       if (!this.selectedItems.find(e => e.field === list.field) && list.field !== 'all') {
      //         this.selectedItems.push(list)
      //       }
      //     } else {
      //       if (list.field === item.field) {
      //         item.selected = true
      //         if (!this.selectedItems.find(e => e.field === item.field)) {
      //           this.selectedItems.push(item)
      //         }
      //       }
      //     }
      //   })
      // }
      this.$forceUpdate()
    },
    applyMapping () {
      if (this.requiredSelect && !this.selectedItems.length) return this.$alert(this.$t('common.ALERT.PROJECT.008'))
      this.$emit('select', this.selectedItems)
      this.$emit('close')
      this.$forceUpdate()
    }
  },
  data () {
    return {
      isActive: this.active || false,
      selectedItems: [],
      copyData: []
    }
  }
}
</script>
<style lang="scss">
  .select-list-modal {
    // margin-top: -100px;
    .modal-body {
      .mapping-list {
        overflow-y: auto;
        max-height: 75vh;
        width: 100%;
        cursor: pointer;
        > .mapping-title {
          font-weight: bold;
          padding: $gap-s 0 $gap-s $gap;
          border-radius: $radius-s;
        }
        > .mapping-item {
          margin-top: -1px;
          border-top: 1px solid $table-border-color;
          border-bottom: 1px solid $table-border-color;
          color: $light-gray;
          text-indent: $gap-s;
          background-color: $background-color;
          line-height: 36px;
          &:hover {
            background-color: lighten($background-color, 5%);
            .mapping-text {
              color: $white;
            }
          }
          &.-active {
            // font-weight: bold;
            background-color: $white;
            color: $color-black;
             &:hover {
              .mapping-text {
                color: $color-black;
              }
            }
          }
        }
      }
    }
  }
</style>
