<template>
  <div
    class="region-container"
    ref="region"
  >
    <article :class="[`-contents ${type.title.toLowerCase()}-info`, { '-extend': extend }]">
      <div class="total-usage-info">
        <div class="-left">
          <h5 class="-title">
            {{ type.title }}
          </h5>

          <p class="total-amount">
            <!-- 사용중 / 전체량 -->
            <strong>{{ data.using | locale }}/</strong>
            <span>{{ data.total | locale }} {{ data.unit }}</span>
          </p>

          <button
            class="show-clusters"
            @click="extend = !extend"
          >
            {{ $t('main.DASHBOARD.clusterRanking') }}
            <!-- 클러스터 순위 -->
            <i :class="['mdi mdi-chevron-down', { '-extend': extend }]" />
          </button>
        </div>

        <div class="-right">
          <el-progress
            class="circle"
            type="circle"
            :percentage="percentNum"
            :width="110"
            :stroke-width="2"
            :show-text="false"
          />

          <span class="-text">
            <strong>
              {{ percentText }}<small>%</small>
            </strong>
          </span>
        </div>
      </div>
      <!-- /. 총 사용량 -->

      <!-- === -->
      <!-- === -->
      <!-- === -->

      <div class="-detail">
        <p class="top5-tit-wrap">
          <strong>
            <small>{{ type.top5 }}</small>
            <span>Cluster Top 5</span>
          </strong>

          <span
            class="sorting"
            @click="setSorting"
          >
            <i class="sort-icon" />
            {{ asc ? $t('main.DASHBOARD.sortlower') : $t('main.DASHBOARD.sortHigher') }}
            <!-- {{ asc ? '낮은 순' : '높은 순' }} -->
          </span>
        </p>

        <ul
          class="-progress"
          v-if="clusterTop5.length"
        >
          <li
            v-for="(item, index) in clusterTop5"
            class="-list"
            :key="`cluster_${index}`"
          >
            <div class="cluster-label">
              <span class="-label">{{ item.clusterName }}</span>
              <p class="-degree">
                <b>{{ item.rate }}</b>
                <small>/{{ item.max }}%</small>
                <!-- 가상화율 || 할당률 / 최대 가상화율 % -->
              </p>
            </div>

            <el-progress
              :percentage="item.percent"
              :show-text="false"
              :status="item.status"
            />
          </li>
        </ul>

        <span
          v-else
          class="empty-data"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </span>
      </div>
      <!-- /. 클러스터 순위 상세 -->
    </article>
  </div>
</template>

<script>
export default {
  name: 'DashboardRegionComp',
  props: {
    type: {
      type: Object,
      default: () => {}
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    data (data) {
      this.clusterTop5 = this.setTop5List(data.top5)

      // 퍼센트 그래프 계산
      const using = Number(data.using)
      const total = Number(data.total)

      this.percentText = using <= 0 || total <= 0 ? 0 : Math.floor((using / total) * 100)
      this.percentNum = this.percentText > 100 ? 100 : this.percentText
    },
    extend (status) {
      if (status) document.addEventListener('click', this.eventHandler)
      else document.removeEventListener('click', this.eventHandler)
    }
  },
  methods: {
    eventHandler (e) {
      const region = this.$refs.region
      const children = Array.from(region.querySelectorAll('*'))

      const isChild = children.includes(e.target)
      if (!isChild) this.extend = false
    },
    /**
     * 낮은/높은순으로 Cluster Top 5 리스트를 세팅합니다.
     */
    setTop5List (data) {
      const copy = [...data]
      if (!this.asc) copy.reverse()

      const result = []
      for (let i = 0; i < 5; i++) {
        if (copy[i]) {
          // { rate: 가상화율/할당률 (%), standard: 임계치, max: 최대 임계치 }
          const { clusterName, rate, standard1, standard2, max } = copy[i]
          let status

          if (rate >= standard1) status = 'warning'
          if (rate > standard1 && rate >= standard2) status = 'exception'

          // console.log(`⭐️ ${copy[i].clusterName} :: \n  1차 임계치 ${standard1},\n  2차 임계치 ${standard2},\n  값 ${rate},\n  1차 초과 ${rate > standard1}, 2차 초과${rate > standard2}`)

          const calculate = isNaN(rate / max) ? 0 : (rate / max) * 100
          const percent = calculate > 100 ? 100 : calculate

          const value = {
            clusterName,
            percent,
            rate,
            max,
            standard1,
            standard2,
            gauge: 120,
            status
          }

          result.push(value)
        }
      }
      return result
    },
    /**
     * 높은순/낮은순 데이터를 세팅합니다.
     */
    setSorting () {
      this.asc = !this.asc
      this.clusterTop5 = this.setTop5List(this.data.top5)
    }
  },
  beforeDestroy () {
    document.removeEventListener('click', this.eventHandler)
  },
  data () {
    return {
      extend: false,
      asc: true,
      percentText: 0,
      percentNum: 0,
      clusterTop5: [
        // { name: 'DR-Int01-CLUSTER003', percent: 900, gauge: 120 },
        // { name: 'DR-Int01-CLUSTER003', percent: 900, gauge: 120 },
        // { name: 'DR-Int01-CLUSTER003', percent: 900, gauge: 120, status: 'warning' },
        // { name: 'DR-Int01-CLUSTER003', percent: 900, gauge: 120, status: 'exception' },
        // { name: 'DR-Int01-CLUSTER003', percent: 900, gauge: 120, status: 'exception' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>

.region-container {
  position: relative;
  height: 176px;
  color: $white;
}

.-contents {
  box-sizing: border-box;
  padding: $gap-m $gap-m $gap-m 25px;
  position: absolute;
  top: 0; left: 0;
  height: 176px;
  overflow: hidden;
  z-index: 1;
  width: 100%;
  border-radius: $radius-m;
  transition: height .5s ease, border-radius .5s ease;

  &.-extend {
    height: 530px;
    border-radius: $radius-m $radius-m 0 0;
  }

  .total-usage-info {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .-left {
      .-title {
        font-size: 30px;
        line-height: 30px;
        margin-bottom: 5px;
      }

      .total-amount {
        margin-bottom: 15px;
        strong { font-size: 20px }
        span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
        }
      }

      .show-clusters {
        background: none;
        color: $white;
        display: block;
        border: none;
        border-bottom: 1px solid $white;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0;
        cursor: pointer;

        .mdi {
          display: inline-block;
          transition: transform .5s ease;
          margin-left: 5px;
          &.-extend { transform: rotate(180deg); }
        }
      }
    }

    .-right {
      position: relative;
      width: 110px;
      height: 110px;

      .-text {
        position: absolute;
        top: 0; left: 0;
        width: inherit;
        height: inherit;
        display: flex;
        align-items: center;
        justify-content: center;

        strong { font-size: 36px; }
        small { font-size: 18px; font-weight: 300; }
      }
    }
  }

  .-detail {
    position: absolute;
    top: 176px; left: 0;
    width: 100%;
    height: calc(100% - 175px);
    padding: $gap $gap-m;
    box-sizing: border-box;

    .top5-tit-wrap {
      position: relative;
      margin-bottom: $gap;

      strong, small, span { display: block; }
      small {
        font-size: 13px;
        margin-bottom: 10px;
      }
      span { font-size: 18px; }
      .sorting {
        cursor: pointer;
        font-size: 13px;
        position: absolute;
        top: 0; right: 0;
        display: flex;
        align-items: center;

        .sort-icon {
          margin-right: 5px;
          width: 13px;
          height: 13px;
          display: block;
          background: url('../../../../assets/images/dashboard/sort.svg') no-repeat;
        }
      }
    }

    .-progress {
      .-list {
        margin-bottom: $gap;
        &:last-child { margin: 0; }
      }

      .cluster-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;

        .-label {
          font-weight: 400;
          font-size: 13px;
        }

        .-degree {
          b { font-size: 16px; }
          small { font-size: 14px; }
        }
      }
    }

    .empty-data {
      height: 180px;
      color: #e1e1e1;
    }
  }
}

.vcpu-info {
  background:
    url('../../../../assets/images/dashboard/vcpu.svg') no-repeat,
    linear-gradient(90deg, #7681FF -2.29%, #8F15FF 100.34%);
  box-shadow: 10px 10px 50px #59218E;

  .-detail { background-color: rgba(55, 10, 97, 0.2); }
}

.memory-info {
  background:
    url('../../../../assets/images/dashboard/memory.svg') no-repeat,
    linear-gradient(90deg, #FF969F 8.34%, #FE3D80 95.97%);
  box-shadow: 10px 10px 50px #8C1F44;
  .-detail { background: rgba(72, 0, 25, 0.1); }
}

.disk-info {
  background:
    url('../../../../assets/images/dashboard/disk.svg') no-repeat,
    linear-gradient(90deg, #F8C255 -2.29%, #FD730E 100.34%);
  box-shadow: 10px 10px 50px #713508;
  .-detail { background: rgba(255, 255, 255, 0.15); }
}
</style>

<style lang="scss">

.region-container {
  .el-progress-bar__inner { background: $sea-blue; }
  .is-warning { .el-progress-bar__inner { background: $yellow; } }
  .is-exception { .el-progress-bar__inner { background: $main-red; } }

  .circle {
    .el-progress-circle__path { stroke: $white }
  }

  .vcpu-info {
    .el-progress-circle__track { stroke: rgba(120, 123, 255, 0.28); }
    .el-progress-bar__outer { background: rgba(120, 123, 255, 0.28); }
  }
  .memory-info {
    .el-progress-circle__track { stroke: rgba(255, 150, 159, 0.46); }
    .el-progress-bar__outer { background: rgba(255, 150, 159, 0.46); }
  }
  .disk-info {
    .el-progress-circle__track { stroke: rgba(249, 187, 79, 0.47); }
    .el-progress-bar__outer { background: rgba(249, 187, 79, 0.46); }
  }
}

</style>
