<!--
  * 파일명 : DashboardAll.vue
  * 파일 기능 : 대시보드 - 데이터센터별 인프라 현황 + 자원 현황 파이차트
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 Merge branch 'publish/dashboard' into 'dev'
 -->

<template>
  <article class="dashboard-all-wrapper">
    <div class="dashboard wrap-common">
      <h6>{{ $t('main.DASHBOARD.infra') }}</h6>

      <div
        class="-contents"
        v-loading="commonDataLoad"
      >
        <section class="chart-area-wrap">
          <div
            class="chart-area"
            v-for="chart in commonPieData"
            :key="chart.field"
          >
            <p class="label-title">
              {{ $t(chart.title) }}
            </p>
            <div
              :class="['chart-label', { 'has-router': chart.routeTo }]"
              @click="chart.routeTo ? $router.push({ name: chart.routeTo }) : null"
            >
              <p class="label-desc">
                {{ totalCounter(chart.chartData) | locale }}
                <span>{{ chart.unit }}</span>
              </p>
            </div>

            <cmp-pie-chart
              :class="['pie-chart', `-${chart.field}`]"
              :height="150"
              :items-source="chart.chartData"
              :initialized="initChart"
              binding-name="label"
              binding="value"
              :inner-radius="0.8"
              :start-angle="-45"
              :palette="['rgba(185, 187, 241, 1)', 'rgba(135, 141, 255, 1)']"
              :tooltip-content="pieToolTipContent"
            />
          </div>
        </section>
      </div>
    </div>
    <!-- /. 공통 -->

    <div class="dashboard">
      <section class="board-info flex-wrap -space-between">
        <div class="flex-wrap">
          <h6>{{ $t('main.DASHBOARD.res') }}</h6>
          <!-- <el-select
            v-model="relCluster"
            placeholder="클러스터 선택"
            class="chart-options"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in relClusterOptions"
              :key="item.label"
              :value="item.label"
            />
          </el-select> -->
        </div>

        <div class="flex-wrap -space-between">
          <chart-label
            v-for="label in pieLabelData"
            :key="label.color"
            :label="label.label"
            :color="label.color"
          />
        </div>
      </section>

      <div
        class="-contents"
        v-loading="corpsDataLoad"
      >
        <section class="chart-area-wrap">
          <div
            class="chart-area"
            v-for="chart in corpsPieData"
            :key="chart.field"
          >
            <p class="label-title">
              {{ $t(chart.title) }}
            </p>
            <div class="chart-label">
              <p class="label-desc">
                {{ totalCounter(chart.chartData) | locale }}
                <span>{{ chart.unit }}</span>
              </p>
            </div>

            <cmp-pie-chart
              :class="['pie-chart', `-${chart.field}`]"
              :height="150"
              :items-source="chart.chartData"
              :initialized="initChart"
              binding-name="label"
              binding="value"
              :inner-radius="0.8"
              :start-angle="-45"
              :palette="['rgba(185, 187, 241, 1)', 'rgba(135, 141, 255, 1)']"
              :tooltip-content="pieToolTipContent"
            />
          </div>
        </section>
      </div>
    </div>
  </article>
</template>

<script>
import ChartLabel from './ChartLabel'
import API from '@sd-fe/cmp-core'

export default {
  name: 'DashboardAll',
  components: {
    'chart-label': ChartLabel
  },
  created () {
    this.getRawClusterData()
  },
  methods: {
    async getRawClusterData () {
      try {
        // const response = await API.compute.getClusters()
        const response = await API.compute.getElementData()
        const ipCates = await API.network.getNetworkCategory()
        const categories = await API.network.getNetworkCategory()

        // console.log('%c @@@ getRawClusterData', 'color: #ff94ea')
        // console.log(response)
        // console.log(ipCates)

        response.forEach(cluster => {
          ipCates.forEach(ip => {
            if (ip.ipCategoryIdx === cluster.cateIdx) {
              cluster.center = ip.cateKey.includes('김포') ? '김포' : '송도'
            }
          })
        })

        // 차트 데이터 세팅
        const filteredCate = categories.filter(cate => cate.upperCategoryIdx === 0)
        const filteredCateNames = filteredCate.map(cate => cate.cateKey)
        const setChartDataNew = (condition) => filteredCateNames.map(condition)

        // 🍎 response에서 cateNames를 기준으로 데이터를 나눕니다.
        // 김포/송도 외에 추가 데이터가 있을 경우도 가능합니다.
        // 데이터 형식 => { 김포: [...], 송도: [...], ... }
        const filteredObj = {}
        filteredCateNames.filter(cate => {
          filteredObj[cate] = []
          response.forEach(resp => { if (resp.center === cate) filteredObj[resp.center].push(resp) })
        })
        // console.log(filteredObj)

        // 김포/송도 데이터 세팅
        const category = setChartDataNew(label => {
          const hasCluster = response.some(cluster => cluster.center === label)
          return { label, value: Number(hasCluster) }
        })

        // 클러스터, 노드, 가상서버, Vcpu, 메모리, 가상디스크 데이터 세팅
        const clusters = []
        const nodes = []
        const vmsCount = []
        const numVcpus = []
        const memory = []
        const diskCapacityInBytes = []

        const reducer = (acc, curr) => acc + curr

        for (const label in filteredObj) {
          const data = filteredObj[label]

          // 특정 값의 갯수를 구할 수 있습니다.
          const getReducedData = (key) => {
            return data.length ? data.map(object => object[key] ? object[key].length : 0).reduce(reducer) : 0
          }

          clusters.push({ label, value: data?.length })
          nodes.push({ label, value: getReducedData('hosts') })
          vmsCount.push({ label, value: getReducedData('vms') })

          // vms 라는 key 값 내부에서 모든 값을 더해야할 경우에 사용합니다.
          const getTotalCnt = (key) => {
            const value = data.map(cluster => {
              const allVals = cluster.vms?.map(vm => vm[key] ? vm[key] : 0)
              return allVals && allVals.length ? allVals.reduce(reducer) : 0
            })
            return data.length ? value.reduce(reducer) : 0
          }

          numVcpus.push({ label, value: getTotalCnt('numVcpus') })
          memory.push({ label, value: getTotalCnt('memoryCapacityInBytes') })
          diskCapacityInBytes.push({ label, value: getTotalCnt('diskCapacityInBytes') })
        }

        // TB, GB 계산 및 unit 설정
        const byte = (data) => {
          const filter = (value) => this.$options.filters.byte(value).split(' ')
          const chartData = data.map(d => { return { ...d, value: Number(filter(d.value)[0]) } })
          const setUnit = data.map(d => d.value).reduce(reducer) // value끼리 더해서 unit을 구한 값
          return { unit: filter(setUnit)[1], chartData }
        }

        // 대시보드 - 공통 / 관계사 PIE 데이터 세팅
        this.commonPieData = this.commonPieData.map((data, idx) => {
          if (data.field === 'datacenter') data.chartData = category // 김포/송도
          if (data.field === 'cluster') data.chartData = clusters // 클러스터
          if (data.field === 'node') data.chartData = nodes // 노드
          return data
        })

        this.corpsPieData = this.corpsPieData.map(data => {
          if (data.field === 'virtualServer') data.chartData = vmsCount // 가상서버
          if (data.field === 'vcpu') data.chartData = numVcpus // Vcpu
          if (data.field === 'memory') { // 메모리
            const { unit, chartData } = byte(memory)
            data.unit = unit
            data.chartData = chartData
          }
          if (data.field === 'disk') { // 가상디스크
            const { unit, chartData } = byte(diskCapacityInBytes)
            data.unit = unit
            data.chartData = chartData
          }
          return data
        })

        // ====== tooltip을 위한 unit 추가
        const addIUnit = (chartData) => {
          return chartData.map(data => {
            data.chartData.forEach(cData => { cData.unit = data.unit })
            return data
          })
        }

        this.commonPieData = addIUnit(this.commonPieData)
        this.corpsPieData = addIUnit(this.corpsPieData)
      } catch (err) {
        console.error('@@ getRawClusterData', err)
      }
      this.commonDataLoad = false
      this.corpsDataLoad = false
    },
    initChart (flex) {
      this.chart = flex
    },
    totalCounter (items) {
      if (items.length) {
        const reducer = (acc, curr) => acc.value + curr.value
        return items.reduce(reducer)
      }
    },
    pieToolTipContent (ht) {
      const data = ht.chart.collectionView.items
      const tipData = this.pieLabelData.map((list, index) => {
        list.unit = data[index].unit
        if (data[index].label === list.label) {
          list.data = Number(data[index].value) % 1 === 0 ? data[index].value.toLocaleString() : data[index].value
        }
        return list
      })

      return tipData.map(td => `
        <span style="line-height: 1.5">
          ${td.label}
          <span style="color: ${td.color}; font-size: 12px"> <b style="font-size: 14px">${td.data}</b> ${td.unit} </span>
        </span>`
      ).join('<br>')
    }
  },
  data () {
    return {
      commonDataLoad: true,
      corpsDataLoad: true,
      commonPieData: [
        {
          field: 'datacenter',
          title: 'main.DASHBOARD.dataCenter',
          unit: 'EA',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        },
        {
          field: 'cluster',
          title: 'main.DASHBOARD.cluster',
          routeTo: 'set-cluster',
          unit: 'EA',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        },
        {
          field: 'node',
          title: 'main.DASHBOARD.node',
          routeTo: 'set-host',
          unit: 'EA',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        }
      ],
      relClusterOptions: [
        // { label: '김포' },
        // { label: '송도' },
        // { label: '신세계' },
        // { label: '이마트..' }
      ],
      relCluster: undefined,
      corpsPieData: [
        {
          field: 'virtualServer',
          title: 'main.DASHBOARD.server',
          unit: 'EA',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        },
        {
          field: 'vcpu',
          title: 'main.DASHBOARD.vCPU',
          unit: 'Core',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        },
        {
          field: 'memory',
          title: 'main.DASHBOARD.memory',
          unit: undefined,
          // unit: 'GB',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        },
        {
          field: 'disk',
          title: 'main.DASHBOARD.vDisk',
          unit: undefined,
          // unit: 'TB',
          chartData: [
            { label: '김포', value: 0 },
            { label: '송도', value: 0 }
          ]
        }
      ],
      pieLabelData: [
        { label: '김포', color: '#b9bbf1' },
        { label: '송도', color: '#878dff' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .dashboard-all-wrapper {
    display: flex;
    h6 {
      font-size: 13px;
      font-weight: normal;
      letter-spacing: -0.65px;
      width: 50px;
    }

    .dashboard {
      flex: 1 1 auto;
      .board-info {
        height: 15px;
      }
      .-contents {
        box-sizing: border-box;
        margin-top: $gap;
        padding: 0 80px;
        height: 226px;
        border-radius: $radius-m;
        background-color: $ticket-back-color;
        box-sizing: border-box;
      }
    }
    .wrap-common {
      flex: 0 0 690px;
      margin-right: $gap;
    }

    .chart-area-wrap {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;

      .chart-area {
        position: relative;
        width: 150px;
        margin-right: 40px;
        margin-top: $gap-s;
        &:last-child { margin-right: 0 }
        > .pie-chart { width: 100%; }

        > .label-title {
          margin-bottom: $gap-s;
          color: $light-gray;
          text-align: center;
          height: 16px;
          font-size: 16px;
          font-weight: bold;
          font-style: normal;
          letter-spacing: -0.4px;
          color: #b4b4b4;
        }
        .chart-label {
          font-family: 'Roboto';
          position: absolute;
          bottom: 32px; left: 32px;
          width: 86px; height: 86px;
          background-color: $white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          &.has-router {
            cursor: pointer;
          }
          > .label-desc {
            color: #253b73;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            letter-spacing: -0.5px;
            line-height: 14px;
            height: 14px;
            span {
              height: 14px;
              line-height: 10px;
              display: inline-block;
              font-weight: normal;
              font-size: 13px;
              letter-spacing: -0.33px;
            }
          }
        }
      }
    }
  }
</style>

<style lang="scss">
.dashboard {
  .chart-options {
    width: 140px;
    .el-input {
      .el-input__inner {
        border-radius: 0;
        border: none;
        width: 100%;
        border-bottom: 1px solid $input-stroke;
      }
    }
  }
}
</style>
