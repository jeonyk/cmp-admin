<template>
  <div class="instance-row-card">
    <div class="flex-wrap card-left">
      <cmp-status-tag
        v-if="state"
        class="bound-rule-status"
        :type="`is-${stateLabel[state] ? stateLabel[state].tag : 'info'}`"
      >
        {{ stateLabel[state] ? stateLabel[state].text : state }}
      </cmp-status-tag>
      <strong>{{ title || '-' }}</strong>
    </div>

    <ul class="flex-wrap card-right">
      <li
        v-for="(col, idx) in columns"
        :key="idx"
      >
        <slot
          :name="col.binding"
          :row="data"
        >
          <span class="info-header">{{ col.header }}</span>
          <span>{{ data[col.binding] || '-' }}</span>
        </slot>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'InstanceRowCard',
  props: {
    state: {
      type: String,
      default: 'undefined'
    },
    title: {
      type: String,
      default: '-'
    },
    data: {
      type: Object,
      default: () => {}
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    stateLabel: {
      error: {
        text: '오류',
        tag: 'error'
      },
      'in-use': {
        text: '실행 중',
        tag: 'using'
      },
      pending: {
        text: '대기',
        tag: 'pending'
      },
      creating: {
        text: '진행 중',
        tag: 'loading'
      },
      'in-use-optimizing': {
        text: '진행 중',
        tag: 'loading'
      },
      'available-modifying': {
        text: '진행 중',
        tag: 'loading'
      },
      available: {
        text: '사용 가능',
        tag: 'available'
      },
      normal: {
        text: '정상',
        tag: 'available'
      },
      stopped: {
        text: '정지',
        tag: 'stop'
      },
      deleting: {
        text: '삭제',
        tag: 'undefined'
      },
      notUsing: {
        text: '미사용',
        tag: 'undefined'
      },

      // 대상그룹
      healthy: {
        text: '정상',
        tag: 'using'
      },
      unhealthy: {
        text: '이슈',
        tag: 'error'
      },
      unused: {
        text: '미사용',
        tag: 'undefined'
      },
      initial: {
        text: '초기화',
        tag: 'loading'
      },
      draining: {
        text: '해제 중',
        tag: 'loading'
      }
    }
  })

}
</script>
<style lang="scss" scoped>
  .instance-row-card {
    padding: 20px 50px;
    border-radius: $radius;
    background: $dark-navy;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .card-left { gap: $gap; }
    .card-right {
      li { display: flex; gap: $gap * 2; padding: 0 60px; }
      li + li { border-left: 2px solid $border2A;}
      .info-header { font-weight: bold; }
    }
    & + .instance-row-card { margin-top: 8px; }
  }
</style>
