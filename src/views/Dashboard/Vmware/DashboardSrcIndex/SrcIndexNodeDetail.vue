<template>
  <div class="detail-lists-wrapper">
    <section class="slider-wrapper">
      <div
        class="transform-slider"
        :style="`transform: translateX(${ -480 * (activeIdx - 1) }px)`"
      >
        <ranking-list
          :index-title="`vCPU ${this.$t('main.DASHBOARD.virtualRate')}`"
          :src-title="setTitle(cluster.name)"
          :data="vcpuData"
          @selectedNode="emitNode"
        />
        <!-- vCPU 가상화율 -->
        <ranking-list
          :index-title="`Memory ${this.$t('main.DASHBOARD.quota')}`"
          :src-title="setTitle(cluster.name)"
          :data="memoryData"
          @selectedNode="emitNode"
        />
        <!-- Memory 할당률 -->
      </div>
    </section>

    <ul class="detail-page">
      <li
        v-for="idx in 2"
        :key="`page_${idx}`"
        :class="{ '-active': activeIdx === idx }"
        @click="activateIndex(idx)"
      />
    </ul>
  </div>
</template>

<script>
import RankingList from './RankingList'

export default {
  components: { RankingList },
  name: 'SrcIndexNodeDetail',
  props: {
    data: {
      type: Object,
      default: () => {},
      required: true
    },
    cluster: {
      type: Object,
      default: () => {},
      required: true
    }
  },
  watch: {
    data (data) {
      // 데이터 소팅 및 세팅
      const rawData = JSON.parse(JSON.stringify(data))
      this.vcpuData = rawData.cpu
      this.memoryData = rawData.memory

      // 인터벌 리셋
      if (this.time) {
        clearTimeout(this.time)
        this.time = null

        this.activeIdx = 1
      }
      this.time = setTimeout(this.timeout, 10000)
    }
  },
  created () {
    setTimeout(this.timeout, 10000)
  },
  methods: {
    timeout () {
      // console.log('=== 안전한 인터벌은 Timeout 돌리기~')
      this.activeIdx = this.activeIdx === 2 ? 1 : 2
      this.setTimeInterval()
    },
    setTimeInterval () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(this.timeout, 10000)
    },
    activateIndex (idx) {
      this.activeIdx = idx

      // 인터벌 리셋
      this.setTimeInterval()
    },
    emitNode (node) {
      this.$emit('selectedNode', node)
    }
  },
  data () {
    return {
      time: null,
      activeIdx: 1,
      vcpuData: [],
      memoryData: [],
      setTitle (name) {
        return name ? `${name} - Node Top 10` : 'Node Top 10'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-lists-wrapper {
  box-sizing: border-box;
  position: relative;
  height: 100%;

  .slider-wrapper {
    height: 100%;
    overflow: hidden;
    .transform-slider {
      height: inherit;
      display: flex;
      transition: .8s ease;
    }
  }

  .detail-page {
    position: absolute;
    bottom: 25px;
    left: 0;
    width: 100%;
    height: 45px;
    display: flex;
    justify-content: center;

    > li {
      width: 50px;
      height: 45px;
      cursor: pointer;
      position: relative;

      &:first-child { margin-right: 5px; }
      &::after {
        position: absolute;
        content: '';
        width: 100%;
        height: 4px;
        top: 20px; left: 0;
        background-color: #292C51;
        transition: .5s ease;
      }

      &.-active {
        &::after { background-color: $white; }
      }
    }
  }
}
</style>
