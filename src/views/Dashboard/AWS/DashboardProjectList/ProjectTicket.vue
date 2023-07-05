<template>
  <div class="project-ticket-wrapper">
    <div class="body-content">
      <div class="ticket-header">
        <strong class="ticket-title">{{ data.projectName }}</strong>
        <small class="company-name">{{ data.companyName }} - {{ data.groupName }}</small>
        <!--
        <div class="ticket-alert">
          <i class="-bell" />
          <span>15+</span>
        </div> -->
      </div>
      <!-- /. ticket-header -->

      <div class="total-amount">
        <strong class="tiny-title">{{ $v('총 신청량') }}</strong>
        <hr class="divider-1">

        <div class="amount-infos">
          <dl
            v-for="item in contents"
            :key="item.tit"
          >
            <dt>{{ item.tit }}</dt>
            <dd class="value">
              <span
                v-for="(val, index) of item.value.length"
                :key="val.unit"
              >
                <b>{{ item.value[index] }}</b>
                <small>{{ item.unit[index] }}</small>
                {{ index + 1 === item.value.length - 1 ? ',' : '' }}
              </span>
            </dd>
          </dl>
        </div>

        <hr class="divider-1">
      </div>
      <!-- /. 총 신청량 -->

      <div class="last-3month-trend">
        <strong class="tiny-title">{{ $v('지난 3개월 간 자원 트렌드') }}</strong>

        <div class="m-charts">
          <div
            v-for="item in palettes"
            :key="item.title"
          >
            <p :class="['chart-tit', item.class]">
              {{ item.title }}
            </p>

            <cmp-chart
              class="chart"
              :items-source="trend[item.title]"
              binding-x="label"
              :height="100"
              :chart-binding="chartBinding"
              :x-label-angle="0"
              :palette="item.palette"
              :x-axis-line="true"
              stacking="Stacked"
              :initialized="initChart"
              :tooltip-content="tooltipContent"
              chart-animation="None"
              :y-min-max="resStatusYMinMax(trend[item.title])"
            />
          </div>
        </div>
      </div>
      <!-- /. 지난 3개월 간 자원 트렌드 -->
    </div>

    <div class="footer-content">
      <hr class="divider-2">

      <div class="content">
        <span><b>{{ $v('예상 청구 비용') }}</b> {{ $v('월') }}</span>
        <strong>${{ data.bill.toFixed(2) }}</strong>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectTicket',
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
  },
  computed: {
    contents () {
      const { subnet, availableIp, securityGroup, ec2, vcore, ebs, efs } = this.data

      return [
        { tit: 'Subnet', value: [subnet], unit: [this.$v('서브넷')] },
        { tit: 'Available IP', value: [availableIp], unit: ['ea'] },
        { tit: 'S.G', value: [securityGroup], unit: [this.$v('보안그룹')] },
        { tit: 'EC2', value: [ec2, vcore], unit: ['Core', 'GB'] },
        { tit: 'EBS', value: [ebs], unit: ['PB'] },
        { tit: 'EFS', value: [efs], unit: ['PB'] }
      ]
    },
    trend () {
      const { trend: trends } = this.data

      // 일자 / trend 그래프 분리 - 값 정리 및 바인딩 할 수 있도록 데이터 세팅
      const result = { EC2: [], EBS: [], EFS: [] }

      for (const { createMonth, ...trend } of trends) {
        for (const key in trend) {
          const { avg, min, max } = trend[key]
          const type = key.toUpperCase()

          if (key === 'elb') continue // ELB는 현재 UI 에서 보여주고있지 않음
          result[type].push({ avg, min, max, maxVal: max - min, createMonth, type })
        }
      }

      return result
    }
  },
  methods: {
    initChart (chart) {
      chart.series[2].style = { strokeWidth: 0.8 }
    },
    tooltipContent (ht) {
      const colors = {
        EC2: '#7681FF',
        EBS: '#CC4679',
        EFS: '#E29C4F'
      }[ht.item?.type]
      // console.log(colors, ht.item)

      const { avg, min, max } = ht.item
      return `<p style="color: ${colors}"><b> ${avg} </b> <span>(Min : ${min}, Max : ${max})</span></p>`
    },
    /**
     * 자원현황 트렌드 차트의 최소, 최대값 반환
     */
    resStatusYMinMax (source) {
      if (!source || !source.length) return { min: 0, max: 0 }
      let maxValue = parseInt(Math.max(...source.map(trend => trend.avg))) || 0

      for (let i = 0; i < 5; i++) {
        if (maxValue % 5 === 0) break
        maxValue++
      }

      return { min: 0, max: maxValue }
    }
  },
  data () {
    return {
      testData: [
        { label: 'm-2', color: '#16A3BF', avg: 11.366175280139942, all: 11.366175280139942, usage: 4.643129998255972, rate: 6.723045281883969 },
        { label: 'm-1', color: '#16A3BF', avg: 11.366175280139942, all: 11.366175280139942, usage: 5.040105797297656, rate: 6.326069482842286 }, { label: 'm', color: '#16A3BF', avg: 11.366175280139942, all: 11.366175280139942, usage: 5.801490845484295, rate: 5.564684434655646 }],
      chartBinding: [
        { name: 'min', binding: 'min' },
        { name: 'max', binding: 'maxVal' },
        { name: 'avg', binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 2 } }
      ],
      palettes: [
        { title: 'EC2', class: '-ec2', palette: ['rgba(118, 129, 255, 1)', 'rgba(118, 129, 255, 0.3)'] },
        { title: 'EBS', class: '-ebs', palette: ['rgba(204, 70, 121, 1)', 'rgba(204, 70, 121, 0.3)'] },
        { title: 'EFS', class: '-efs', palette: ['rgba(226, 156, 79, 1)', 'rgba(226, 156, 79, 0.3)'] }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.project-ticket-wrapper {
  background: url('../../../../assets/images/dashboard/page.svg') no-repeat;
  width: 520px;
  height: 600px;
  overflow: hidden;

  > .body-content { padding: 30px 30px 25px 30px; }
  > .footer-content { margin: 0 20px; }
  .content {
    margin: 30px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 25px;

    strong { font-size: 25px; }
  }

  .ticket-header { position: relative; }

  .ticket-title {
    font-size: 18px;
    display: block;
    margin-bottom: 15px;
  }

  .company-name {
    display: block;
    font-size: 13px;
    line-height: 100%;
    color: #727797;
    margin-bottom: 25px;
  }

  // .ticket-alert {
  //   position: absolute;
  //   top: 0; right: 0;

  //   .-bell {
  //     background: url('../../../../assets/images/dashboard/bell.svg') no-repeat center;
  //     width: 20px;
  //     height: 25px;
  //     display: block;
  //   }

  //   > span {
  //     position: absolute;
  //     top: 0px; right: 15px;
  //     background: $main-red;
  //     padding: 0 3px;
  //     border-radius: 25px;
  //     font-size: 8px;
  //     min-width: 12px;
  //     font-weight: 500;
  //     line-height: 15px;
  //     text-align: center;
  //     border: 1.5px solid #070A20;
  //   }
  // }

  .total-amount {
    .tiny-title { margin-bottom: 15px; }

    .amount-infos {
      display: grid;
      align-items: center;
      grid-template-columns: 1fr 1fr 1fr;
      row-gap: 25px;
      margin: 30px 0;

      > dl {
        height: 35px;
        display: flex;
        align-items: center;
        flex-direction: column;

        dt {
          font-size: 10px;
          color: #727797;
          margin-bottom: 5px;
        }

        dd.value {
          b {
            font-weight: 500;
            font-size: 16px;
          }

          small {
            font-size: 13px;
            display: inline-block;
            margin-left: 5px;
            font-weight: 300;
          }
        }
      }
    }
  }

  .last-3month-trend {
    margin-top: 35px;
    .tiny-title { margin-bottom: 25px; }

    .m-charts {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;

      > div {
        overflow: hidden;
        height: 120px;
        display: flex;
        align-items: center;
        flex-direction: column;

        .chart-tit {
          text-align: center;
          border-radius: 25px;
          line-height: 22px;
          width: 42px;

          &.-ec2 { color: #7681FF; background-color: rgba(118, 129, 255, 0.22); }
          &.-ebs { color: #CC4679; background-color: rgba(204, 70, 121, 0.22); }
          &.-efs { color: #E29C4F; background-color: rgba(226, 156, 79, 0.22); }
        }
        .chart {
          margin-left: -30px;
          width: 100%;
        }

      }
    }
  }

  // 공통
  .tiny-title {
    display: block;
    font-weight: normal;
    color: #FFFFFF;
  }

  .divider {
    &-1 {
      border: none;
      border-top: 1px solid #1D2034;
      height: 0px;
    }
    &-2 {
      border: none;
      border-top: 2px dashed #1D2034;
      height: 0px;
    }
  }
}
</style>

<style lang="scss">
.project-ticket-wrapper {
  // bar 차트 그리드 라인
  .wj-flexchart .wj-gridline { stroke: none; }
}
</style>
