<template>
  <div
    class="container"
    :class="className"
  >
    <div>
      <div style="margin-bottom:10px;">
        <span
          class="tag"
          :class="[{'is-urgent': isUrgent}]"
          style="margin-right:5px;"
        >{{ type }}</span>
        <span
          class="tag"
          :class="[{'is-urgent': isUrgent}]"
        >{{ orderNo }}</span>
      </div>
      <div style="margin-bottom:10px;">
        <h5 class="title">
          {{ title }}
        </h5>
      </div>
      <div>
        <p class="company">
          {{ companyName }}  {{ groupName }}
        </p>
      </div>
    </div>

    <div>
      <div style="margin-bottom:10px;">
        <deplay-or-remaining-tag
          class="status"
          :date="expectedTime"
          :is-done="isDone"
          :processing-style="{
            backgroundColor: 'rgba(122, 200, 81, 0.2)',
            color: '#7ac851'
          }"
          :delayed-style="{
            backgroundColor: 'rgba(255, 92, 103, 0.2)',
            color:'#ff5c67'
          }"
          :done-style="{
            backgroundColor: 'rgba(137, 115, 255, 0.2)',
            color: '#8973FF',
          }"
        />
      </div>
      <div style="display:flex; white-space: nowrap;">
        <span class="date-label">{{ contentLabel }}</span>
        <span class="date-content">{{ createdTime }}/{{ expectedTime }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import DelayOrRemainingTag from '@/components/Tag/DelayOrRemainingTag.vue'
// import
export default {
  components: {
    'deplay-or-remaining-tag': DelayOrRemainingTag
  },
  props: {
    orderNo: {
      type: String,
      default: ''
    },
    tag02: {
      type: String,
      default: 'D-3 처리중'
    },
    title: {
      type: String,
      default: ''
    },
    subTitle: {
      type: String,
      default: ''
    },
    contentLabel: {
      type: String,
      default: ''
    },
    createdTime: {
      type: String,
      default: ''
    },
    expectedTime: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    companyName: {
      type: String,
      default: ''
    },
    groupName: {
      type: String,
      default: ''
    },
    isDone: {
      type: Boolean,
      default: false
    },
    isUrgent: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    className () {
      return {
        [this.type]: true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
h5 {
  width: 80px;
}

.container {
  width: 273px;
  box-sizing: border-box;
  height: 100%;
  height:210px;
  display:flex;
  flex-direction: column;
  justify-content: space-between;

  .tag {
    display:inline-block;
    background-color: #39394b;
    padding: 0px 8px;
    border-radius: 4px;
    font-size:12px;
    font-weight:700;
    height:22px;
    line-height:22px;
    box-shadow: border-box;

    &.is-urgent {
      color:#fff;
      background:#CF494D;
    }
  }

  .title {
    // width: 184px;
    width:100%;
    font-size: 24px;
    letter-spacing: -0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 34px;
  }

  .company {
    font-size:14px;
    font-weight:400;
    color: #727797;
  }

  .status {
    width:auto;
    display:inline-block;
    height: 22px;
    line-height: 22px;;
    background: #cf494d;
    border-radius: 12px;
    font-size:12px;
    font-weight:700;
    color: #fff;
    padding:0px 8px;
    box-sizing: border-box;
  }

  .date-label {
    white-space: nowrap;
    color: #727797;
    margin-right: 10px;
    font-weight: 700;
  }

  .date-content {
    width: 150px;
    color: #727797;
    font-weight:400;
  }
}

</style>
