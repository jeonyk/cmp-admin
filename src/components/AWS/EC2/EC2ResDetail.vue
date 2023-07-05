<template>
  <article
    v-loading="isLoadingDetailData"
    class="ec2-detail"
  >
    <section class="buttons">
      <button
        v-loading="isLoadEditInfoLoading"
        class="button"
        type="is-primary"
        @click="openEditModal"
      >
        수정
      </button>
      <button
        class="button"
        type="is-anti"
        @click="openRemoveModal"
      >
        삭제
      </button>
    </section>
    <section
      v-if="!isLoadingDetailData"
      class="info"
    >
      <info-left :res-data="detailData" />
      <info-right
        :res-data="detailData"
        :storage-data="storageData"
        :security-group-data="securityGroupData"
      />
    </section>
    <section
      v-else
      class="fallback-loading"
    />
    <section
      v-if="!isLoadingDetailData"
      class="tab"
      style="position: relative;"
    >
      <info-tab :res-data="detailData" />
    </section>
    <EC2ResCreate
      v-if="editData"
      :active.sync="activeEditModal"
      :edit-data="editData"
      :edit-security-group="securityGroupData"
      is-edit
      @close="activeEditModal = false"
    />
    <!-- basket-edit
      :basket-data="testBasketData" -->
    <EC2ResRemove
      v-if="detailData"
      :active.sync="activeRemoveModal"
      :instance-info="detailData"
      :order-data="detailData.orderData"
      @close="activeRemoveModal = false"
    />
  </article>
</template>

<script>
import {
  getDetailEC2,
  getSecurityGroupById,
  getStorageById
} from '@/components/Apis/AWS'
import InfoLeft from './Detail/InfoLeft.vue'
import InfoRight from './Detail/InfoRight.vue'
import InfoTab from './Detail/InfoTab.vue'
import EC2ResCreate from './EC2ResCreate.vue'
import EC2ResRemove from './EC2ResRemove.vue'
import { mapMutations } from 'vuex'

export default {
  components: { InfoLeft, InfoRight, InfoTab, EC2ResCreate, EC2ResRemove },
  name: 'EC2ResDetail',
  computed: {
    instanceId () {
      return this.$route.params.id
    },
    editData () {
      return {
        ...this.detailData,
        storage: this.editStorage
      }
    }
  },
  created () {
    this.isLoadingDetailData = true
    Promise.all([
      this.getDetailEC2Data(),
      this.getStorageAll(),
      this.getSecurityGroup()
    ])
      .then(([ec2Data, storageData, securityGroupData]) => {
        this.detailData = ec2Data
        this.storageData = storageData
        this.securityGroupData = securityGroupData
      })
      .catch((err) => {
        console.log(err)
        this.$alert('EC2 자원 상세 조회에 실패하였습니다.', {
          callback: () => this.$router.go(-1)
        })
      })
      .finally(() => {
        this.isLoadingDetailData = false
        this.$set(this.detailData, 'blockDeviceMapping', this.storageData)
      })
  },
  methods: {
    ...mapMutations({
      addBrc: 'common/ADD_PARAMETERS'
    }),
    /**
     * 스토리지 데이터 가져오기
     */
    async getStorageAll () {
      try {
        this.isLoadEditInfoLoading = true
        const { data } = await getStorageById(
          this.instanceId,
          1,
          100
        )
        this.editStorage = data
        return data
      } catch (error) {
        console.log(error)
        this.$alert('EC2 스토리지 데이터 조회에 실패하였습니다.', {
          callback: () => this.$emit('close')
        })
      } finally {
        this.isLoadEditInfoLoading = false
      }
    },
    /**
     * 인스턴스의 보안그룹 조회
     */
    async getSecurityGroup (instanceId = this.instanceId) {
      try {
        const { data } = await getSecurityGroupById(instanceId)
        return data
      } catch (error) {
        throw error.response.data
      }
    },
    async getDetailEC2Data () {
      try {
        const { data } = await getDetailEC2(this.instanceId)

        this.addBrc({ label: data.instanceName, path: '' })
        return data
      } catch (error) {
        throw error.response.data
      }
    },
    openEditModal () {
      this.activeEditModal = !this.activeEditModal
    },
    openRemoveModal () {
      this.activeRemoveModal = !this.activeRemoveModal
    }
  },
  data: () => ({
    isLoadingDetailData: true,
    isLoadEditInfoLoading: false,
    activeEditModal: false,
    activeRemoveModal: false,
    detailData: null,
    storageData: null,
    securityGroupData: null,
    storageCurrentPage: 1,
    editStorage: []
  })
}
</script>

<style lang="scss" scoped>
.ec2-detail {
  .buttons {
    text-align: right;

    > * + * {
      margin-left: $gap-s;
    }
  }

  .info {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    margin-top: $gap;
  }

  .fallback-loading {
    min-height: 800px;
    width: 100%;
    display: block;
  }
}
</style>
