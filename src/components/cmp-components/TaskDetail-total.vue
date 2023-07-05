<!--
  * 파일명 : TaskDetail-total.vue
  * 파일 기능 :
  * 작성자 : jhkim 외 2명
  * 최종 작성일 : 2020-09-10
  * License By Shinsegae I&C
  * 2020-09-10 // comment: 으으.. 졸려서 여기까지밖에 못할것 같아요 ㅠ
 -->

<template>
  <div class="preview-info">
    <div class="source-info">
      <strong class="sub-title">{{ summaryTit }}</strong>
      <!-- <p> -->
      <!-- {{ eaCount }}EA -->
      <!-- {{ totalPrice.toLocaleString() }} 원 -->
      <!-- </p> -->

      <div class="item-counts">
        <i class="box-icon" />
        <!-- <i class="message-icon" /> -->
        <span class="-alarm">{{ eaCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
// comment 0910
// 이친구는... 피일명이 특이하군요!!
export default {
  props: {
    summaryTit: {
      type: String,
      default: ''
    },
    eaCount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    // 편집가능한 상태인지 판단합니다.
    edtiableStatus: {
      type: Object,
      default: () => {}
    },
    editable: { // 변경 버튼을 사용 할 경우에 true를 입력합니다.
      type: Boolean,
      default: false
    },
    editing: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
     * [자원생성] 클릭시 발생하는 이벤트를 다룹니다.
     * @function
     */
    createSource () {
      // return this.$router.push(to)
      return this.$emit('create-source-route')
    },
    /**
     * [변경] 클릭시 발생하는 이벤트를 다룹니다.
     * @function
     */
    modifySource () {
      this.$emit('modify-source')
    },
    /**
     * [삭제] 클릭시 발생하는 이벤트를 다룹니다.
     * @function
     */
    removeSource () {
      this.$emit('remove-source')
    },
    /**
     * [삭제] 클릭시 발생하는 이벤트를 다룹니다.
     * @function
     */
    resetEditSource () {
      this.$emit('reset-source')
    },
    /**
     * [취소] 클릭시 발생하는 이벤트를 다룹니다.
     * @function
     */
    cancelEditSource () {
      this.$emit('cancel-edit')
    }
  }
}
</script>

<style lang="scss" scoped>
  .preview-info {
    display: flex;
    > div {
      flex: 1 1 50%;
    }
    .source-info {
      // overflow: hidden;
      // line-height: 36px;
      font-size: 16px;
      font-family: 'Roboto';

      // .sub-title {
      //   position: relative;
      //   display: block;
      //   padding-left: $gap-s;
      //   margin-right: 15px;
      //   font-size: 18px;
      //   font-weight: 400;
      //   float: left;
      //   &::before {
      //     content: '';
      //     position: absolute;
      //     top: 3px;
      //     left: 0;
      //     width: 2px;
      //     height: 16px;
      //     background-color: $primary;
      //   }
      // }
      // > p {
      //   float: left;
      //   font-size: 18px;
      //   font-weight: 500;
      //   color: $color-lightgrey;
      // }
      > .item-counts {
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        width: 20px;

        > .box-icon {
          display: inline-block;
          margin-top: 7px;
          width: 16px;
          height: 16px;
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
          background-image: url('../../assets/images/box_ico.png');
          -webkit-filter: invert(100%);
          filter: invert(100%);
        }
        > .-alarm {
          position: absolute;
          top: 0px;
          right: -4px;
          display: inline-block;
          width: 16px;
          height: 16px;
          font-size: 11px;
          line-height: 16px;
          text-align: center;
          border-radius: 50%;
          background-color: $primary;
        }
      }
    }
    .source-edit-btns {
      display: flex;
      justify-content: flex-end;
      > .basic-buttons {
        margin-left: $gap-s;
      }
    }
  }
</style>
