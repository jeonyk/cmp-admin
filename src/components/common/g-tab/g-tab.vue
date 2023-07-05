<!--
  * 파일명 : g-tab.vue
  * 파일 기능 : [공통컴포넌트] custom TAB
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-25
  * License By Shinsegae I&C
  * 2021-01-25 fix: blsm 조직도 초기 선택 세팅 (속한 조직), g-tree 스타일 수정, $disable 스타일 수정
 -->

<template>
  <article class="g-tab-wrap">
    <h6 class="skip-article-header">
      tabs
    </h6>
    <div class="tab-header">
      <ul :class="['g-tab', type]">
        <li
          v-for="(row, rowIdx) in cloneData"
          :key="rowIdx"
          @click.stop="clickEvent(row, rowIdx)"
          :class="['tab', { '-active' : row.isActive }, { '-disable' : row.disable }]"
        >
          <!-- :class="['tab', { '-active' : rowIdx === computedActiveTab }]" -->
          <el-checkbox
            v-if="useCheckbox"
            style="margin-right: 10px;"
            v-model="row.checked"
            @click="e => e.stopPropagation()"
          />

          <!-- custom header 를 사용할 경우 slot 사용 -->
          <slot
            name="name"
            :row="row"
          >
            <span v-if="showLength">{{ $t(row.keyPath) || row.name }}{{ getLength(row) }}</span>
            <span v-else>{{ $t(row.keyPath) || row.name }}</span>
          </slot>
        </li>
      </ul>

      <div class="header-right">
        <slot name="header" />
      </div>
    </div>
    <!-- 컨텐츠 -->
    <div
      :class="[
        'tab-contents-area',
        type === 'basic' ? 'basic-inner' : null,
        type
      ]"
      :style="`padding-top: ${paddingTop}px;`"
      v-if="cloneData[tabContents]"
    >
      <!-- <slot :name="data[tabContents].field" /> -->
      <slot>
        <slot :name="cloneData[tabContents].field" />
      </slot>
    </div>
  </article>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'GTab',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    type: {
      type: String, // 'basic', 'border-card'
      default: 'block'
    },
    useCheckbox: {
      type: Boolean,
      default: false
    },
    paddingTop: { // 컨텐츠의 padding-top 을 설정... px로 적용
      type: Number,
      default: 40
    },
    showLength: {
      type: Boolean,
      default: false
    }
  },
  created () {
    this.cloneData = cloneDeep(this.data)
    this.checkActivation(this.$route.path)

    // 해결해야 할 이슈
    // g-tab row의 active 상태가 경로에 의존할 때 (참고 페이지: 중앙 영역 CMP 패키지)
    // (g-tab의 active 상태가 바뀌면 경로가 바뀌는 형태)
    // 인덱스가 0이 아닌 row를 active = true인 상태로 두고 새로고침시
    // 해당 row의 컴포넌트 훅 호출 created -> mounted ...
    // 다른 탭으로 이동시 위 훅을 한번 더 호출함 (버그)

    // const tabFields = map(this.data, 'field')
    // const tabFields = this.data.map(item => item.field)
    // const routepath = this.$route.path.split('/')
    // const lastPath = routepath[routepath.length - 1]

    // if (!tabFields.includes(lastPath)) this.data[0].isActive = true
  },
  watch: {
    $route (after, before) {
      if (after) this.checkActivation(after.path)
      else this.checkActivation(before.path)
      // this.checkActivation()
      // if(this.data[clickedTabIdx] === after.matched)
    },
    data: {
      deep: true,
      handler (newData) {
        this.cloneData = cloneDeep(newData)
        this.checkActivation(this.$route.path)
        this.tabContents = 0
        this.clikedTabIdx = 0
      }
    }
  },
  methods: {
    getLength (array) {
      if (!array) return '(0)'
      if (array.resourceList) return `(${array?.resourceList?.[0].data.length})`
      if (array.dataCount) return `(${array.dataCount})`
    },
    clickEvent (row, idx) {
      if (row.disable) return
      this.cloneData.forEach((item, index) => {
        if (index === idx) {
          item.isActive = true
          this.tabContents = idx
          this.clikedTabIdx = idx
        } else item.isActive = false
      })
      this.$emit('click', row, this.clikedTabIdx)
    },
    checkActivation (path) {
      if (!this.cloneData.length) return
      const routepath = path.split('/')
      routepath.shift()
      // const lastPath = routepath[routepath.length - 1]
      // const secondPath = routepath[routepath.length - 2]
      this.cloneData.forEach((item, idx) => {
        // if (item.field === lastPath || item.field === secondPath) item.isActive = true
        if (routepath.includes(item.field)) item.isActive = true
        // if (item.field === lastPath || item.field === secondPath) item.isActive = true
        else item.isActive = false
      })
      const activeItem = this.cloneData.filter(item => item.isActive)
      if (!activeItem.length) this.cloneData[0].isActive = true
    }
  },
  data () {
    return {
      tabContents: 0,
      tabActive: false,
      clikedTabIdx: 0,
      cloneData: []
      // tabIndex: this.active
    }
  }
}
</script>

<style lang="scss" scoped>
  .g-tab-wrap{
    width: 100%;
    ul.g-tab.block {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      li.tab {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-right: 2px;
        width: 150px;
        text-align: center;
        font-weight: 400;
        letter-spacing: -0.8px;
        cursor: pointer;
        color: $text-lighter-gray;
        // line-height: 50px;
        padding: $gap-s 0 $gap 0;
        border-bottom: 1px solid transparent;
        &:before {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          width: 0;
          height: 3px;
          background-color: $main-blue;
          transition: width .1s ease;
        }
        &:after {
          content: "";
          position: absolute;
          top: 100%;
          right: 50%;
          width: 0;
          height: 3px;
          background-color: $main-blue;
          transition: width .1s ease;
        }
      }

      li.tab.-active {
        color: $white;
        font-weight: bold;
        background: transparent;
        &:before {
          width: 50%;
          transition: width .4s ease;
        }
        &:after {
          width: 50%;
          transition: width .4s ease;
        }
      }
      li.tab.-disable {
        color: $color-ticket;
        font-weight: bold;
        background: transparent;
        cursor: not-allowed;
      }
    }

    ul.g-tab.basic {
      display: flex;
      flex-direction: row;
      justify-content: center;
      padding: 0;
      margin-top: 70px;
      margin: auto;

      > li.tab {
        position: relative;
        padding: 0 $gap;
        text-align: center;
        line-height: 50px;
        width: 186px;
        border-radius: $radius-m;
        cursor: pointer;
        transition: all .3s;
        color: $disable;
        font-weight: normal;
        opacity: .5;
        &:before {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background-color: $general;
        }
        & + li.tab {margin-left: $gap;}
        &.-active {
          font-weight: bold;
          color: inherit;
          opacity: 1;
        }
      }
    }

    ul.g-tab.border-card {
      display: flex;
      flex-direction: row;
      justify-content: center;
      padding: 0;

      > li.tab {
        padding: 0 15px;
        text-align: center;
        line-height: 38px;
        border-radius: $radius $radius 0 0;
        cursor: pointer;
        transition: all .3s;
        color: $text-lighter-gray;
        font-weight: normal;
        border: 1px solid $border-color;
        & + li.tab {margin-left: -1px;}
        &.-active {
          color: $white;
          background-color: $primary;
          border: 1px solid $primary;
        }
      }
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    // slot 내용
    .tab-contents-area {
      border-top: 1px solid $main-gray;
      &.basic-inner {
        border-top: 0;
      }
      &.border-card {
        margin-top: -1px;
        border: 1px solid $border-color;
        border-radius: 0 $radius $radius $radius;
        transition: all .3s;
      }
    }
  }
</style>
