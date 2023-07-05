<template>
  <div
    class="container"
    :class="isExtended ? 'is-extended' : ''"
  >
    <section
      class="card"
      :class="isExtended ? 'is-extended' : ''"
      @click="$emit('click', data)"
    >
      <div class="row row--order">
        <template>
          <span
            class="type"
            :class="{'urgent' : data.orderType === 'URGENT'}"
          >{{ data.orderTypeKor }} </span>
        </template>
        <span style="color: #727797">
          {{ data.orderNo }}
        </span>
      </div>
      <!-- 긴급 구분 및 타이틀-->
      <div class="row row--title">
        <span
          v-if="data.isExpress"
          class="tag tag--urgent"
        >[{{ $v("긴급") }}]</span>
        <h5>{{ data.projectName }}</h5>
      </div>
      <div class="row row--company">
        <span>{{ data.ordererCompany.name }}</span> |
        <span>{{ data.ordererGroup.name }}</span>
      </div>
      <div style="position:relative; padding:20px 0px;">
        <ul
          class="row row-resource"
          :class="isExtended ? 'is-extended' : ''"
        >
          <li
            class="role"
            :class="[{'is-connected': role.isConnected}]"
            v-for="(role, idx) in data.workRsps"
            :key="idx"
          >
            <el-tooltip
              v-if="getRole(role).length > 5"
              effect="light"
              placement="top"
              style="margin-left:5px;"
            >
              <div slot="content">
                {{ getRole(role) }}
              </div>
              <span
                style="margin-right: 5px;"
                class="service-name"
              >{{
                getRole(role)
              }}</span>
            </el-tooltip>
            <span
              v-else
              style="margin-right: 5px;"
              class="service-name"
            >{{
              getRole(role)
            }}</span>

            <span style="margin-right:5px;">{{ role.workItemRsps.length }}</span>
          </li>
        </ul>
      </div>
      <div
        v-if="data.workRsps.length > 6"
        class="horizontal-line"
      >
        <div class="icon">
          <i
            class="mdi"
            :class="isExtended ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            @click="(event) => {
              toggle(event, data)
            }"
          />
        </div>
      </div>
      <ul class="row row--bottom">
        <li>
          <span>{{ $v("주문자") }}</span>
          <span>{{ data.orderer }}</span>
        </li>
        <li>
          <span>{{ $v("처리 상태") }}</span>
          <span>{{ data.workState || "-" }}</span>
        </li>
        <li>
          <span>{{ $v("주문일") }}</span>
          <span>{{ data.orderCreateTime }}</span>
        </li>

        <li>
          <span>{{ $v("완료 희망일") }}</span>
          <span>{{ data.expectedDay }}</span>
          <deplay-or-remaining-tag
            v-if="pageName !== 'task-done'"
            style="margin-left:5px; white-space:nowrap;"
            :date="data.expectDate"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import DelayOrRemainingTag from '@/components/Tag/DelayOrRemainingTag.vue'
export default {
  components: {
    'deplay-or-remaining-tag': DelayOrRemainingTag
  },
  inject: ['pageName'],
  props: {
    idx: {
      type: Number,
      default: 0
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  beforeDestroy () {
    this.removeClickOutsideListener()
  },
  computed: {
    rolesLength () {
      return this.data.workRsps.length
    }
  },
  watch: {
    deep: true,
    hanlder (newVal) {
      this.isExtended = newVal.isExtendable
    }
  },
  mounted () {
    this.setupClickOutside(this.$el)
  },
  methods: {
    removeClickOutsideListener () {
      document.querySelector('body').removeEventListener('click', this.clickOutsideListener)
    },
    setupClickOutside (el) {
      this.clickOutsideListener = (e) => {
        if (el.contains(e.target)) return
        this.isExtended = false
      }
      document.querySelector('body').addEventListener('click', this.clickOutsideListener)
    },
    toggle (event) {
      event.stopPropagation()
      this.isExtended = !this.isExtended
    },
    getRole (role) {
      return role.roleName
    },
    convertType (type) {
      return this.type[type] || type
    }
  },
  data () {
    return {
      isExtended: false,
      type: {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제')
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.container {
  width: 385px;
  height: 335px;
  position:relative;
}

.card {
  display: inline-block;
  // width: 385px;
  // height: 335px;
  padding: 25px 20px;
  box-sizing: border-box;
  background: #0a0c20;
  border-radius: 6px;
  cursor: pointer;
  &.is-extended {
    position:relative;
    height:auto;
      background:#000000;
      border: 1px solid #777777;
      box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.5);
      z-index:1;
  }
}
.row {
  &--order {
    height: 22px;
    line-height: 22px;
    .type {
      display: inline-block;
      color: #fff;
      padding: 0px 10px;
      height: 22px;
      line-height: 22px;
      background-color: #39394b;
      font-size: 12px;
      border-radius: 10px;
      margin-right: 10px;
      &.urgent {
        background:#CF494D;
      }
    }
  }
  &--title {
    margin-top: 15px;
    display: flex;
    height: 16px;
    font-size: 18px;
  }

  &--company {
    color: rgba(114, 119, 151, 1);
    font-size: 12px;
    margin-top: 10px;
  }

  &-resource {
    position:absolute;
    top:0px;
    min-height:90px;
    max-height:90px;
    overflow:hidden;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    height:auto;
    gap: 10px;
    position:relative;
    box-sizing: border-box;
    &.is-extended {
      max-height: 1000px;
    }

    .completed {
      background: rgba(42, 115, 192, 0.2);
      border: 1px solid #2a73c0;
    }

    .role {
      position:relative;
      width: 105px;
      height: 36px;
      line-height: 36px;
      text-align: center;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(119, 119, 119, 0.2);
      border: 1px solid #777777;
    }
  }

  &--bottom {
    display: flex;
    flex-wrap: wrap;
    margin-top: 25px;
    li {
      font-size: 12px;
      font-weight: 400;
      width: 56%;
      display: flex;

      span:first-child {
        width: 70px;
        display: inline-block;
        color: #fff;
      }

      &:nth-child(odd) {
        width: 130px;
        margin-right: 20px;
      }
    }
  }
}

.tag {
  &--urgent {
    color: #ff5c67;
    margin-right: 5px;
  }
}

.service-name {
  white-space: nowrap;
  text-overflow:ellipsis;
  overflow: hidden;
}

.horizontal-line {
  width:100%;
  height:1px;
  border-bottom: 1px solid #777777;
  position: relative;
  .icon {
    width:24px;
    height:24px;
    background: #202232;
    border:1px solid #777777;
    border-radius: 50%;
    position:absolute;
    left:50%;
    top:50%;
    transform: translate(-50%, -50%);
    display:flex;
    justify-content: center;
    align-items:center;
  }
}
</style>
