<template>
  <section class="vmw-image">
    <h2>이미지 관리</h2>
    <section class="table-top-wrap">
      <total-count :total-count="images.length" />

      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="onClickCreateImage(false)"
        >
          {{ $v('이미지 추가') }}
        </button>
        <button
          class="button"
          type="is-black"
          @click="onClickCreateImage(true)"
          :disabled="!checkedImages.length || checkedImages.length > 1"
        >
          {{ $v('변경') }}
        </button>
        <button
          class="button"
          type="is-anti"
          @click="onClickDeleteImage"
          :disabled="!checkedImages.length"
        >
          {{ $v('삭제') }}
        </button>
      </div>
    </section>
    <section class="table-area">
      <cmp-grid
        use-checkbox
        header-checkbox
        :columns="imageColumns"
        :item-source="images"
        :changing-page-reset="false"
        @checkedRowsData="onCheckImageGrid"
      >
        <template
          v-for="column in imageColumns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div :key="column.binding">
            <span v-if="column.binding === 'isDisplay'">

              <div
                class="input-form"
                v-if="props.row[column.binding]!==null"
              >
                <template v-if="props.row[column.binding]">
                  {{ $v('노출') }}
                </template>
                <template v-if="!props.row[column.binding]">
                  {{ $v('미노출') }}
                </template>
                <el-radio-group v-if="false">
                  <el-radio :label="true">{{ $v('노출') }}</el-radio>
                  <el-radio
                    :label="false"
                    style="margin-left: 10px"
                  >{{ $v('미노출') }}</el-radio>
                </el-radio-group>
              </div>
              <template v-else>-</template>

            </span>
            <span v-else>{{ props.row[column.binding] }}</span>
          </div>
        </template>
      </cmp-grid>
    </section>
    <vmw-image-edit-modal
      :active="isActiveImageEditModal"
      :mode="editMode"
      :update-image="updateImageData"
      @close="onCloseImageEditModal"
    />
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import VmwImageEditModal from './VmwImageEditModal.vue'
import dayjs from 'dayjs'

export default {
  name: 'VmwImageManage',
  components: {
    VmwImageEditModal
  },
  created () {
    this.getVmwImages()
  },
  methods: {
    onClickDeleteImage () {
      if (!this.checkedImages.length) return

      this.$confirm(this.$v('선택한 {n}개의 이미지를 삭제하시겠습니까?', { n: this.checkedImages.length }))
        .then(() => {
          const ids = this.checkedImages.map(image => image.userImageIdx)
          const promisePool = ids.map(id => API.vmware.image.deleteVMwareImage(id))
          this.isLoadingImage = true

          Promise.all(promisePool)
            .then(() => {
              this.$alert(this.$v('이미지를 삭제하였습니다.'), {
                callback: () => this.getVmwImages()
              })
            })
            .catch(() => {
              this.$alert(this.$v('이미지 삭제에 실패하였습니다.'), {
                callback: () => this.getVmwImages()
              })
            })
        })
        .catch(() => false)
    },
    onCheckImageGrid (rows) {
      this.checkedImages = rows
    },
    getOsText (image) {
      return `${image.osSystem} ${image.osType} ${image.osVersion} (${image.osBit})`
    },
    mapImage (image) {
      return { ...image, formattedCreateTime: image.createTime ? dayjs(new Date(image.createTime)).format('YYYY.MM.DD HH:mm:ss') : null, os: this.getOsText(image) }
    },
    async getVmwImages () {
      this.checkedImages = []

      try {
        this.isLoadingImage = true
        const res = await API.vmware.image.getVMwareImageList()
        ;(res || []).sort((a, b) => b.createTime - a.createTime)
        this.images = (res || []).map(this.mapImage)
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('이미지 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingImage = false
      }
    },
    onCloseImageEditModal (refresh = false) {
      this.isActiveImageEditModal = false

      if (refresh) {
        this.getVmwImages()
      }
    },
    onClickCreateImage (update = false) {
      if (update) {
        this.updateImageData = this.checkedImages[0]
        this.editMode = 'update'
      } else {
        this.editMode = 'new'
      }

      this.isActiveImageEditModal = true
    }
  },
  data: (root) => ({
    isActiveImageEditModal: false,
    isLoadingImage: false,
    images: [],
    imageColumns: [
      { binding: 'userImageName', header: root.$v('이미지 이름') },
      { binding: 'userImageDesc', header: root.$v('이미지 설명') },
      { binding: 'isDisplay', header: root.$v('사용자 노출 여부'), width: 100, customHtml: true },
      { binding: 'os', header: root.$v('이미지 OS') },
      { binding: 'guestOs.fullName', header: 'Guest OS' },
      { binding: 'osRootDiskSize', header: 'OS Root Disk Size' },
      { binding: 'formattedCreateTime', header: root.$v('생성 시간') }
    ],
    checkedImages: [],
    updateImageData: null,
    editMode: 'new'
  })
}
</script>

<style lang="scss" scoped>
.vmw-image {
  margin-top: 100px;
}
</style>
