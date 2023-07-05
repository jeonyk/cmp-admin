<template>
  <div class="ebs-type-management">
    <cmp-grid
      :item-source="instanceData"
      :columns="instanceColumns"
      :use-column-filter="false"
    >
      <template #isShownUser="{ row }">
        <el-switch
          v-model="row.isShownUser"
          @change="e => ebsUserExpose(e, row)"
        />
        <!-- /. ❌ 사용자 노출여부 스위치 :: 삭제됨 -->
      </template>
    </cmp-grid>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'EBSTypeManagement',
  created () {
    this.getEbsVolumeTypes()
    console.log()
  },
  methods: {
    /**
     * EBS 볼륨 타입 목록 가져오기
     */
    async getEbsVolumeTypes () {
      try {
        const { data } = await API.aws.getEbsVolumeTypes()
        this.instanceData = [...data]
      } catch (error) {
        console.error('@@ getEbsVolumeTypes : ', error)
        throw error
      }
    },

    /**
     * EBS 볼륨 타입 사용자 노출여부 설정
     * @param {Boolean} isShownUser
     * @param {Object} row
     */
    async ebsUserExpose (isShownUser, { volumeType }) {
      try {
        const param = { isShownUser, volumeType }
        await API.aws.ebsUserExpose(param)
      } catch (error) {
        console.error('@@ ebsUserExpose : ', error)
        throw error
      } finally {
        await this.getEbsVolumeTypes()
      }
    }
  },
  data () {
    return {
      test: true,
      instanceColumns: [
        { header: this.$t('service.EBSType.type'), binding: 'volumeType', width: 100 }, // 유형
        { header: this.$t('service.EBSType.delayPct'), binding: 'durability', width: 200 }, // 지연율
        { header: this.$t('service.EBSType.useCase'), binding: 'useCase' }, // 사용케이스
        { header: this.$t('service.EBSType.sizeMin'), binding: 'minSize', width: 110 }, // 사이즈 (최소)
        { header: this.$t('service.EBSType.sizeMax'), binding: 'maxSize', width: 110 }, // 사이즈 (최대)
        { header: this.$t('service.EBSType.iopsMax'), binding: 'maxIops', width: 150 }, // IOPS 최대값
        { header: this.$t('service.EBSType.maxProceed'), binding: 'maxThroughput', width: 230 } // 최대 처리량
        // { header: this.$t('service.EBSType.userShown'), binding: 'isShownUser', width: 120, customHtml: true } // 사용자 노출 여부
      ],
      instanceData: [
        // { createDate: '2021-11-02T23:34:21', durability: '', isShownUser: true, maxIops: '40–200', maxSize: '1TiB', maxThroughput: '40-90MiB/s', minSize: '1GiB', useCase: '데이터에 자주 액세스하지 않는 워크로드', volumeType: 'standard' }
      ]
    }
  }
}
</script>

<style lang="scss">
.ebs-type-management {
  .el-switch.is-checked .el-switch__core::before { left: -9px; }
}
</style>
