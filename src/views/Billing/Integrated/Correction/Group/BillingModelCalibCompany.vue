<!--
  * 파일명 : BillingModelCalibServer.vue
  * 파일 기능 : [빌링 > 서버별 보정 모델] 모든 리스트를 보여줍니다.
  * 작성자 : 이유준
  * 최종 작성일 : 2022-06-20
  * License By Shinsegae I&C
  * 2022-06-20 add: 서버보정 모델 마크업
 -->

<template>
  <billing-model-calib-content
    v-loading="isLoadingModel"
    :key="renderKey"
    :route-title="$v('관계사별 보정 모델')"
    @click-create-calib-model="handleEmitClickCreateCalibModel"
    @change-selected-model="$emit('change-selected-model')"
    @delete-model-group="onDeleteModel"
    :model-list="modelList"
    type="company"
  />
</template>
<script>
import { mapGetters } from 'vuex'
import BillingModelCalibContent from '../BillingModelCalibContent.vue'
import API from '@sd-fe/cmp-core'

export default {
  name: 'BillingModelCalibCompany',
  components: {
    BillingModelCalibContent
  },
  computed: {
    ...mapGetters({
      shortlyCloud: 'cloud/getShortlyCloud',
      cloud: 'cloud/getCloud'
    })
  },
  created () {
    this.getGroupModel()
  },
  methods: {
    /**
     * 보정 모델 삭제
     */
    async onDeleteModel (model) {
      if (!model) return
      if (!model.id) return

      this.isLoadingModel = true

      try {
        await API.billing.deleteGroupCorrectionModel(model.id)
        this.$alert(this.$v('보정 모델을 삭제하였습니다.'))
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 모델 삭제에 실패하였습니다.'))
      } finally {
        this.isLoadingModel = false
        this.getGroupModel()
      }
    },
    handleEmitClickCreateCalibModel () {
      this.$router.push({ name: 'nx-billing-model-calibration-company-create' })
    },
    async getGroupModel () {
      if (this.isLoadingModel) return

      this.isLoadingModel = true

      try {
        const { data } = await API.billing.getGroupCorrModelList()
        this.modelList = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('보정 모델 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingModel = false
        this.renderKey++
      }
    },
    getModuleType () {
      return {
        NUTANIX: 'NX',
        VMWARE: 'VMWARE'
      }[this.cloud.toUpperCase()]
    }
  },
  data () {
    return {
      modelList: [],
      isLoadingModel: false,
      renderKey: 0
    }
  }
}
</script>
