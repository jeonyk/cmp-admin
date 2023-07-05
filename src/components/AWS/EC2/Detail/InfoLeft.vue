<template>
  <section
    class="instance-info-left"
    :class="[resType]"
  >
    <div class="status">
      <slot name="tag">
        <new-status-tag tag-type="running">
          실행 중
        </new-status-tag>
      </slot>
    </div>
    <div class="form">
      <div
        v-for="item in instanceInfo"
        :key="item.title"
        class="form-item"
      >
        <div class="form-item-title">
          {{ item.title }}
        </div>
        <div class="form-item-value">
          {{ item.value }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import dayjs from 'dayjs'

export default {
  components: { },
  name: 'InfoLeft',
  props: {
    resData: {
      type: Object,
      default: () => ({})
    },
    resType: {
      type: String,
      required: false,
      default: 'EC2'
    }
  },
  methods: {
    caseOfVPC (vpc) {
      switch (vpc) {
        case 'STG':
          return '스테이징'
        case 'PRD':
          return '운영'
        case 'DEV':
          return '개발'
        default:
          return ''
      }
    },
    convertPerfMode (perf) {
      return {
        generalPurpose: '범용 모드',
        maxIO: '최대 I/O 모드'
      }[perf]
    },
    convertThroughputMode (throughput) {
      return {
        bursting: '버스트 모드',
        provisioned: '프로비저닝됨'
      }[throughput]
    }
  },
  computed: {
    instanceInfo () {
      if (!this.resData) return []

      let location = ''

      switch (this.resType) {
        case 'EFS':
          location += this.caseOfVPC(this.resData.environment) + '(VPC) - '
          location += this.resData.regionName

          return [
            {
              title: 'EFS 이름',
              value: this.resData.fileSystemName
            },
            {
              title: 'EFS ID',
              value: this.resData.fileSystemId
            },
            {
              title: '적용 범위',
              value: this.resData.isRegion ? 'Region' : 'One Zone'
            },
            {
              title: '위치',
              value: location
            },
            {
              title: '성능 모드',
              value: this.convertPerfMode(this.resData.performanceMode)
            },
            {
              title: '처리량 모드',
              value: this.convertThroughputMode(this.resData.throughputMode)
            },
            {
              title: '세부 모니터링',
              value: '-'
            },
            {
              title: '운영 담당자',
              value: '-'
            },
            {
              title: '생성 시간',
              value: dayjs(new Date(this.resData.createDate)).format('YYYY/MM/DD HH:mm') + ' GMT+9'
            },
            {
              title: '마지막 변경 시간',
              value: dayjs(new Date(this.resData.modifyDate)).format('YYYY/MM/DD HH:mm') + ' GMT+9'
            }
          ]
        case 'EC2':
          return [
            {
              title: '인스턴스 이름',
              value: this.resData.instanceName || ''
            },
            {
              title: '인스턴스 ID',
              value: this.$route.params.id
            },
            {
              title: '운영체제',
              value: this.resData.platformDetail || ''
            },
            {
              title: 'Region',
              value: this.resData.regionName || ''
            },
            {
              title: 'AZ',
              value: this.resData.availabilityZone || ''
            },
            {
              title: '세부 모니터링',
              value: parseInt(this.resData.monitoringStatus) ? '활성' : '비활성'
            },
            {
              title: '운영 담당자',
              value: '-'
            },
            {
              title: '생성시간',
              value: dayjs(this.resData.createDate).format('YYYY.MM.DD HH:mm')
            },
            {
              title: '마지막 변경 시간',
              value: dayjs(this.resData.modifyDate).format('YYYY.MM.DD HH:mm')
            }
          ]
        default:
          return []
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.instance-info-left {
  flex: 0 0 440px;
  margin-right: $gap;
  height: 860px;
  overflow: hidden;
  padding: 25px 30px;
  border: 1px solid $input-stroke;
  border-radius: 6px;
  box-sizing: border-box;

  &.EFS {
    .status {
      margin-bottom: 15px;
    }
  }

  .status {
    margin-bottom: 40px;
  }

  .form {
    > :not(:last-child) {
      border-bottom: 1px solid #eee;
      padding-bottom: $gap;
      margin-bottom: $gap;
    }

    &-item {
      &-title {
        font-size: 13px;
        color: #999;
        margin-bottom: $gap-s;
      }
    }
  }
}
</style>
