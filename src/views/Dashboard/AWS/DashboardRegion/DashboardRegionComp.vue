<template>
  <div
    class="region-container"
    ref="region"
  >
    <article :class="[`-contents ${type.toLowerCase()}-info`, { '-extend': extend }]">
      <div class="total-usage-info">
        <div class="-left">
          <h5 class="-title">
            {{ type }}
          </h5>

          <p :class="['total-amount', { 'is-efs' : type === 'EFS' }]">
            <!-- 사용중 / 전체량 -->
            <strong>{{ data.total | locale }}</strong>
            <span><small>EA</small></span>
          </p>

          <button
            class="show-clusters"
            v-if="type !== 'EFS'"
            @click="extend = !extend"
          >
            {{ comptxt[type].extend }}
            <i :class="['mdi mdi-chevron-down', { '-extend': extend }]" />
          </button>
        </div>

        <i class="difference">
          ({{ data.diff }} EA)
        </i>

        <i
          class="mdi mdi-chevron-right move-directly"
          @click="$router.push({ name: routeTo })"
        />
      </div>
      <!-- /. 총 사용량 -->

      <!-- === -->
      <!-- === -->
      <!-- === -->

      <div
        class="-detail"
        v-if="comptxt[type]"
      >
        <p class="top5-tit-wrap">
          <strong>
            <small>{{ comptxt[type].top5 }}</small>
            <span>{{ comptxt[type].top5Title }}</span>
          </strong>

          <span
            class="sorting"
            @click="setSorting(sort)"
          >
            <i class="sort-icon" />
            {{ sort ? $t('main.DASHBOARD.sortlower') : $t('main.DASHBOARD.sortHigher') }}
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
            <div
              class="cluster-label"
              v-if="item"
            >
              <div class="-labels">
                <span class="-rank">{{ index + 1 }}</span>
                <p class="-label">
                  <strong>{{ item.name }}</strong>
                  <span v-if="item.vcpu && item.memory">CPU : {{ item.vcpu }} Core, MEM : {{ item.memory | MB }}</span>
                </p>
              </div>
              <p class="-degree">
                <b>{{ item.count | locale }}</b>
                <small> {{ comptxt[type].unit }}</small>
              </p>
            </div>
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
import { cloneDeep } from 'lodash'

export default {
  name: 'DashboardRegionComp',
  props: {
    type: {
      type: String,
      default: undefined
    },
    data: {
      type: Object,
      default: () => {}
    },
    routeTo: {
      type: String,
      default: undefined
    }
  },
  watch: {
    data (data) {
      // 한번 초기화
      this.sort = true
      this.rawData = []

      if (data.top5) {
        const hasTop5 = Object.keys(data.top5).length

        // 키만있고 데이터는 없는경우
        if (!hasTop5) {
          this.clusterTop5 = []
          return
        }

        this.rawData = this.setTop5List(data.top5)
        this.setSorting(false)
      }
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
      // 일단 가져온 데이터 Array 형식으로 바인딩
      const temp = []
      for (const name in data) {
        const values = data[name]
        temp.push({ name, ...values })
      }
      return temp
    },
    /**
     * 높은순/낮은순 데이터를 세팅합니다.
     */
    setSorting (sort) {
      this.sort = !sort
      const type = sort ? 'desc' : 'asc'
      // console.log(type)

      if (!this.rawData.length) return

      // 낮은순/높은순 sorting
      const condition = {
        asc: ({ count: cnt1 }, { count: cnt2 }) => {
          if (cnt1 < cnt2) return -1
          else if (cnt1 > cnt2) return 1
          return 0
        },
        desc: ({ count: cnt1 }, { count: cnt2 }) => {
          if (cnt1 > cnt2) return -1
          else if (cnt1 < cnt2) return 1
          return 0
        }
      }[type]

      const allSort = cloneDeep(this.rawData).sort(condition)

      this.clusterTop5 = []
      for (let i = 0; i < 5; i++) this.clusterTop5.push(allSort[i])
    }
  },
  beforeDestroy () {
    document.removeEventListener('click', this.eventHandler)
  },
  data () {
    return {
      extend: false,
      sort: true,
      percentText: 0,
      percentNum: 0,
      rawData: [],
      clusterTop5: [],
      comptxt: {
        VPC: { top5: '사용중인 VPC', top5Title: 'Remain VPC Top 5', extend: '사용중인 VPC', unit: '대역', sort: true },
        EC2: { top5: '인스턴스 유형', top5Title: 'Used Type Top 5', extend: '인스턴스 유형 랭킹', unit: 'EA' },
        EBS: { top5: 'EBS 유형', top5Title: 'Used Type Top 5', extend: 'EBS 유형별 랭킹', unit: 'EA' }
      }
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
  padding: $gap-m $gap-m $gap-m 35px;
  position: absolute;
  top: 0; left: 0;
  height: 176px;
  overflow: hidden;
  z-index: 2;
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
        height: 30px;
        margin-bottom: 15px;
      }

      .total-amount {
        margin-bottom: 20px;
        strong { font-size: 28px; margin-right: 5px; }
        span {
          font-size: 19px;
          color: rgba(255, 255, 255, 0.4);

          small { font-size: 14px; }
        }

        &.is-efs {
          margin-bottom: 40px;
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

    .difference {
      margin-top: $gap-s;
      font-style: italic;
      font-weight: 300;
      font-size: 20px;
      line-height: 23px;
      text-align: right;
    }

    .move-directly {
      position: absolute;
      top: 15px; right: 15px;
      width: 20px;
      height: 20px;
      cursor: pointer;
      &::before { font-weight: bold; }
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

        .-labels {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
        }

        .-rank {
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-sizing: border-box;
          border-radius: 3px;
          display: block;
          width: 30px;
          height: 30px;
          line-height: 28px;
          text-align: center;
          color: $white;
          font-weight: 800;
          font-size: 16px;
          margin-right: 15px;
        }

        .-label {
          font-weight: 400;
          font-size: 13px;

          strong, span { display: block; }
          strong { font-size: 14px; line-height: 14px; height: 14px; }
          span { font-size: 13px; line-height: 13px; height: 13px; margin-top: 3px; }
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

.vpc-info {
  background:
    url('../../../../assets/images/dashboard/vpc.svg') no-repeat,
    linear-gradient(90deg, #71A8D9 -2.29%, #3E57C9 100.34%), #FFFFFF;
  box-shadow: 10px 10px 50px #1B2659;

  .-detail { background-color: rgba(55, 10, 97, 0.2); }
}

.ec2-info {
  background:
    url('../../../../assets/images/dashboard/vcpu.svg') no-repeat,
    linear-gradient(90deg, #7681FF -2.29%, #8F15FF 100.34%);
  box-shadow: 10px 10px 50px #59218E;

  .-detail { background-color: rgba(55, 10, 97, 0.2); }
}

.ebs-info {
  background:
    url('../../../../assets/images/dashboard/ebs.svg') no-repeat,
    linear-gradient(90deg, #FF969F 8.34%, #FE3D80 95.97%);
  box-shadow: 10px 10px 50px #8C1F44;
  .-detail { background: rgba(72, 0, 25, 0.1); }
}

.efs-info {
  background:
    url('../../../../assets/images/dashboard/efs.svg') no-repeat,
    linear-gradient(90deg, #F8C255 -2.29%, #FD730E 100.34%);
  box-shadow: 10px 10px 50px #713508;
  .-detail { background: rgba(255, 255, 255, 0.15); }
}
</style>
