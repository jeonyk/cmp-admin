<template>
  <el-dialog
    v-loading="isLoadingApiCalling"
    class="new-image-create-modal"
    :visible="active"
    :title="modalTitle"
    @close="$emit('close')"
    width="80%"
  >
    <div class="modal-body">
      <register-contents
        :title="$v('이미지 이름')"
        required
      >
        <el-input
          v-model="form.imageName"
          :placeholder="$v('이미지명을 입력해주세요.')"
        />
      </register-contents>
      <!-- 이미지명 -->

      <register-contents
        :title="$v('이미지 설명')"
        required
      >
        <el-input
          v-model="form.imageDescription"
          :placeholder="$v('이미지 설명을 입력해주세요.')"
        />
      </register-contents>
      <!-- 이미지 설명 -->

      <register-contents
        title="OS Bit"
        required
      >
        <!-- <el-radio-group v-model="form.osBit">
          <el-radio label="X64">
            X64
          </el-radio>
          <el-radio label="X86">
            X86
          </el-radio>
        </el-radio-group> -->
        <el-radio-group v-model="mixinSelectedOsBit">
          <el-radio
            v-for="bit in mixinOsBit"
            :key="bit.codeVal"
            :label="bit.codeVal"
          >
            {{ bit.codeName }}
          </el-radio>
        </el-radio-group>
      </register-contents>
      <!-- OS Bit -->

      <register-contents
        title="OS Type"
        required
      >
        <!-- <el-select
          v-model="form.osType"
          style="max-width: 250px;"
        >
          <el-option
            v-for="type in osTypes"
            :label="type.name"
            :value="type.codeVal"
            :key="type.codeVal"
          />
        </el-select> -->
        <div class="os-types-select">
          <el-select
            key="os-system"
            v-model="mixinSelectedOsSystem"
            value-key="codeVal"
          >
            <el-option
              v-for="type in displayOsSystem"
              :label="type.codeName"
              :value="type"
              :key="type.codeVal"
            />
          </el-select>
          <el-select
            key="os-type"
            v-model="mixinSelectedOsType"
            value-key="codeVal"
          >
            <el-option
              v-for="type in displayOsType"
              :label="type.codeName"
              :value="type"
              :key="type.codeVal"
            />
          </el-select>
          <el-select
            key="os-version"
            v-model="mixinSelectedOsVersion"
            value-key="codeVal"
          >
            <el-option
              v-for="type in displayOsVersion"
              :label="type.codeName"
              :value="type"
              :key="type.codeVal"
            />
          </el-select>
          <el-input
            class="kernelInput"
            v-model="form.kernelName"
            :placeholder="$v('이미지 커널명을 입력해주세요.')"
          />
        </div>
      </register-contents>
      <!-- OS Type -->

      <register-contents
        :title="$v('S/W 라이선스')"
        required
      >
        <!-- <button
          class="button"
          type="is-primary"
        >
          {{ $v("라이선스 선택") }}
        </button> -->
        <add-license-modal
          get-data-once
          ref="addLicenseModal"
          :data="swLicenses"
          @save="onSaveLicense"
          @loaded="onLoadedLicense"
        />
      </register-contents>
      <!-- S/W 라이선스 -->

      <register-contents
        :title="$v('OS Root Disk 용량') + ' (GB)'"
        required
      >
        <el-input-number
          :placeholder="$t('common.ALERT.NUTA.025')"
          v-model="form.osRootDiskSize"
          style="width: 200px;"
          :min="50"
        />
        <!-- :min="minOsRootDisk[updateItemDefaultOsType] || 0" -->
      </register-contents>
      <!-- OS Root Disk 용량 -->

      <!-- <register-contents
        :title="$v('이미지 타입')"
        required
      >
        <el-radio-group v-model="form.imageDiskType">
          <el-radio label="DISK_IMAGE">
            Disk
          </el-radio>
        </el-radio-group>
      </register-contents> -->
      <!-- 이미지 타입 -->

      <register-contents
        :title="$v('이미지 노출 여부')"
        required
      >
        <el-radio-group v-model="form.isPublic">
          <el-radio :label="true">
            {{ $v("노출") }}
          </el-radio>
          <el-radio :label="false">
            {{ $v("미노출") }}
          </el-radio>
        </el-radio-group>
      </register-contents>
      <!-- 이미지 노출 여부 -->

      <register-contents
        :title="$v('이미지 구분')"
        required
      >
        <el-radio-group
          v-model="form.imageType"
          :disabled="mode === 'update'"
        >
          <el-radio :label="IMAGE_PART.UNREGISTER">
            {{ $v("미등록") }}
          </el-radio>
          <el-radio :label="IMAGE_PART.NEW">
            {{ $v("신규") }}
          </el-radio>
        </el-radio-group>
      </register-contents>
      <!-- 이미지 구분 -->

      <register-contents
        v-if="form.imageType === 'NEW'"
        :title="$v('다운로드 URL')"
        required
      >
        <el-input
          v-model="form.downloadUrl"
          :disabled="mode === 'update'"
          :placeholder="$v('다운로드 URL을 입력해주세요.')"
        />
      </register-contents>
      <!-- 다운로드 URL -->

      <register-contents
        v-loading="isLoadingCentral"
        :title="$v('뉴타닉스')"
        required
        class="central-element"
        style="min-height: 50px;"
      >
        <div class="ce-wrap">
          <tab-with-grid
            v-if="mode === 'new' ? centrals && centrals.length : (updateImageDetailData && centrals.length)"
            v-show="form.imageType === IMAGE_PART.UNREGISTER"
            v-loading="
              isLoadingCentralUnregisterImage || isLoadingElementUnregisterImage
            "
            :centrals="centrals"
            :elements="onlyElements"
            :central-unregister-images-map="centralUnregisterImagesMap"
            :element-unregister-images-map="elementUnregisterImagesMap"
            :central-loading="isLoadingCentralUnregisterImage"
            :element-loading="isLoadingElementUnregisterImage"
            :update-mode="mode"
            @select-central="onSelectCentral"
            @select-element="onSelectElement"
            @central-checked-rows="onCheckedCentralRows"
            @element-checked-rows="onCheckedElementRows"
          />
          <check-group-table
            v-if="mode === 'new' ? centrals && centrals.length : (updateImageDetailData && centrals.length)"
            v-show="form.imageType === IMAGE_PART.NEW"
            class="check-group-table"
            ref="checkGroupTable"
            init-unique-key="clusterUuid"
            :is-view-state="mode === 'update'"
            :required-init-check="mode === 'update'"
            :init-unique-values="updateClusterUuids"
            :update-image-detail-data="updateImageDetailData"
            :data="centrals"
            @re-upload="onReUpload"
          />
        </div>
      </register-contents>
      <!-- 다운로드 URL -->
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $v("취소") }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="mode === 'new' ? createNxOsImage() : updateNxOsImage()"
        :disabled="isLoadingCentral || isLoadingElement"
      >
        {{ mode === "new" ? $v("추가") : $v("수정") }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { cloneDeep, omit } from 'lodash'
import CheckGroupTable from '../CloudInit/CheckGroupTable.vue'
import TabWithGrid from './TabWithGrid.vue'
import API, { AddLicenseModal, OSImageCodeMixin } from '@sd-fe/cmp-core'

const DEFAULT_FORM = {
  imageName: '',
  imageDescription: '',
  osBit: 'X64',
  selectedSwLicense: null,
  osRootDiskSize: 0,
  isPublic: false, // true or false
  imageType: 'UNREGISTER', // 'UNREGISTER', 'NEW'
  downloadUrl: '',
  imageDiskType: 'DISK_IMAGE',
  osType: null,
  kernelName: null,
  swIdxList: []
}

export default {
  name: 'NxImageEditModal',
  mixins: [OSImageCodeMixin],
  components: {
    CheckGroupTable,
    TabWithGrid,
    AddLicenseModal
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    /**
     * 편집 상태
     * - `new`: 생성
     * - `update`: 편집 (변경)
     */
    mode: {
      type: String,
      default: 'new'
    },
    /**
     * 체크된 아이템 정보
     */
    updateImage: {
      type: Object,
      default: undefined
    }
  },
  watch: {
    active: {
      immediate: true,
      handler (visible) {
        if (!visible) {
          this.form = cloneDeep(DEFAULT_FORM)
          this.centrals = []
          this.checkedCentralImages = []
          this.checkedElementImages = []
          this.swLicenses = []
          this.updateLicenseMapped = false
          this.mixinResetCodes()
        } else {
          if (this.mode !== 'update') {
            this.getCentralList()
            this.setUnregisterImagesMap()
          }

          if (this.mode === 'update') this.getUpdateImageData()
          // if (!this.osTypes.length) this.getOsTypes()
        }
      }
    }
  },
  computed: {
    /**
     * 모달 제목
     * 추가 = 이미지 추가
     * 변경 = 이미지 변경
     */
    modalTitle () {
      return this.mode === 'new'
        ? this.$t('admin.PREF.addImage')
        : this.$t('admin.PREF.changeImage')
    },
    /**
     * 센트럴에서 엘리먼트만 조회
     */
    onlyElements () {
      const elements = []

      this.centrals.forEach(central => {
        if (central.elements && central.elements.length) {
          elements.push(...central.elements)
        }
      })

      return elements
    },
    /**
     * 이미지 업데이트시 미등록인 경우
     * 선택한 이미지 uuid
     */
    updateImageUuids () {
      if (this.mode === 'update' && this.form.imageType === this.IMAGE_PART.UNREGISTER && this.updateImageDetailData) {
        return []
      } else {
        return []
      }
    },
    /**
     * 이미지 업데이트시 신규인 경우
     * 선택한 클러스터 uuid
     */
    updateClusterUuids () {
      if (this.mode === 'update' && this.form.imageType === this.IMAGE_PART.NEW && this.updateImageDetailData && this.updateImageDetailData.clusterImages) {
        return this.updateImageDetailData.clusterImages.map(clusterImage => clusterImage.clusterUuid)
      } else {
        return []
      }
    }
  },
  created () {
    // this.getOsTypes()
  },
  methods: {
    mappingLicense (rows) {
      const ref = this.$refs.addLicenseModal
      if (!ref || !this.updateImage) return

      const swIdxs = this.updateImage.licenseList.map(license => license.swIdx)
      const filtered = rows.filter(row => swIdxs.includes(row.swIdx))

      this.swLicenses = filtered
      this.updateLicenseMapped = true
    },
    onLoadedLicense (rows) {
      this.loadedLicense = true
      if (this.updateLicenseMapped) return
      if (this.mode === 'update') {
        this.mappingLicense(rows)
      }
    },
    onSaveLicense (license) {
      this.swLicenses = license
    },
    /**
     * 재업로드한다.
     */
    async onReUpload (cell) {
      if (!cell) return
      // 페이로드 정보 가공
      const centralIdxList = [cell.cluster.centralIdx]
      const clusterUuidList = [cell.cluster.clusterUuid]
      const updatePayload = this.getUpdatePayload()

      try {
        this.isLoadingApiCalling = true

        await API.compute.reUploadClusterImage(this.updateImage.userImageIdx, {
          ...updatePayload,
          centralIdxList,
          clusterUuidList
        })
        this.$alert(this.$v('재업로드 요청을 완료하였습니다.'))
      } catch (error) {
        this.$alert(this.$v('재업로드에 실패하였습니다.'))
      } finally {
        this.isLoadingApiCalling = false
      }
    },
    /**
     * 업데이트 이미지 데이터 -> 폼 데이터 바인딩
     */
    bindUpdateImageToForm () {
      const {
        imagePart,
        imageType,
        isManage,
        osBit,
        osDesc,
        osName,
        osType,
        osSystem,
        osVersion,
        osKernel,
        osRootDiskSize,
        // swIdxList,
        licenseList,
        imageUrl
      } = this.updateImageDetailData

      this.form.imageDescription = osDesc
      this.form.imageDiskType = imageType
      this.form.imageName = osName
      this.form.imageType = imagePart
      this.form.isPublic = isManage
      this.mixinSelectedOsBit = osBit
      this.form.kernelName = osKernel
      // this.form.swIdxList = swIdxList
      this.swLicenses = licenseList
      this.form.osRootDiskSize = osRootDiskSize

      if (this.loadedLicense) {
        const ref = this.$refs.addLicenseModal
        if (!ref) return
        this.mappingLicense(ref.tableData)
      }

      const findOsSystem = this.mixinOsSystem.find(os => os.codeVal === osSystem)
      this.mixinSelectedOsSystem = findOsSystem

      this.$nextTick(() => {
        const findOsType = this.mixinOsType.find(os => os.codeVal === osType)
        this.mixinSelectedOsType = findOsType

        this.$nextTick(() => {
          const findOsVersion = this.mixinOsVersion.find(os => os.codeVal === osVersion)
          this.mixinSelectedOsVersion = findOsVersion

          this.$nextTick(() => {
            // const findOsKernel = this.mixinOsKernel.find(os => os.codeVal === osKernel)
            // this.mixinSelectedOsKernel = findOsKernel
          })
        })
      })

      if (this.form.imageType === this.IMAGE_PART.NEW) {
        // 이미지 구분이 '신규' 일 경우 URL 바인딩
        this.form.downloadUrl = imageUrl
      }
    },
    /**
     * mode === 'update' 인 경우 이미지 데이터 조회
     */
    async getUpdateImageData () {
      // mode === 'update' 인 경우에만 실행
      if (this.mode !== 'update') return
      // 이미지 정보가 있을때만 실행
      if (!this.updateImage) return

      try {
        this.isLoadingApiCalling = true

        const { data } = await API.compute.getCentralImageByUserImageIdx(this.updateImage.userImageIdx)
        this.updateImageDetailData = data
        this.bindUpdateImageToForm()
        this.getCentralList()
        this.setUnregisterImagesMap()
      } catch (error) {
        this.$alert(this.$v('이미지 조회에 실패하였습니다.'), {
          callback: () => this.$emit('close')
        })
      } finally {
        this.isLoadingApiCalling = false
      }
    },
    // getOsTypes () {
    //   API.enum.getOsTypes()
    //     .then((result) => (this.osTypes = result))
    // },
    /**
     * 체크된 센트럴, 엘리먼트 데이터
     */
    getCheckedItem () {
      return [].concat(
        this.getCheckedCentralItem(),
        this.getCheckedElementItem()
      )
    },
    /**
     * 액티브된 센트럴 탭의 체크된 항목 조회
     */
    getCheckedCentralItem () {
      const map = this.centralUnregisterImagesMap.get(
        this.activeCentralTab.centralIdx
      )
      return map.filter(image => image.checked)
    },
    /**
     * 엘리먼트 탭의 체크된 항목 조회
     */
    getCheckedElementItem () {
      const result = []

      for (const element of this.elementUnregisterImagesMap.values()) {
        for (const image of element) {
          if (
            image.centralIdx === this.activeCentralTab.centralIdx &&
            image.checked
          ) { result.push(image) }
        }
      }

      return result
    },
    /**
     * 페이로드 유효성 검증
     */
    validatePayload (payload, isUpdate = false) {
      if (!payload.osName) {
        // 이미지 이름
        return this.$alert(this.$v('이미지명을 입력해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.osDesc) {
        // 이미지 설명
        return this.$alert(this.$v('이미지 설명을 입력해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.osBit) {
        return this.$alert(this.$v('OS Bit를 선택해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.osType) {
        return this.$alert(this.$v('OS Type을 선택해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.osVersion) {
        return this.$alert(this.$v('OS Version을 선택해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.osRootDiskSize) {
        // OS Root Disk 용량
        return this.$alert(this.$v('OS Root Disk 용량을 입력해주세요.'), {
          callback: () => false
        })
      }
      if (!Number.isInteger(payload.osRootDiskSize)) {
        // OS Root Disk 용량 타입 검증
        return this.$alert(this.$v('OS Root Disk 용량을 확인해주세요.'), {
          callback: () => false
        })
      }

      if (!payload.swIdxList.length) {
        return this.$alert(this.$v('S/W 라이선스를 선택해주세요.'), {
          callback: () => false
        })
      }
      if (!isUpdate) {
        if (payload.imagePart === this.IMAGE_PART.NEW) {
          const urlRegex = /(\w+?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|\w+?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gim
          // 이미지 구분 > '신규'
          if (!payload.imageUrl) {
            return this.$alert(this.$v('다운로드 URL을 입력해주세요.'), {
              callback: () => false
            })
          } else if (!urlRegex.test(payload.imageUrl.replace(/ /, '%20'))) {
            return this.$alert(this.$v('URL 형식이 올바르지 않습니다.'), {
              callback: () => false
            })
          }
          if (![].concat(payload.centralIdxList, payload.clusterUuidList).length) {
            return this.$alert(this.$v('센트럴 혹은 엘리먼트를 선택해주세요.'), {
              callback: () => false
            })
          }
        } else if (payload.imagePart === this.IMAGE_PART.UNREGISTER) {
          if (!this.getCheckedItem().length) {
            return this.$alert(this.$v('미등록 이미지를 선택해주세요.'), { callback: () => false })
          }
          if (!this.getCheckedElementItem().length) {
            return this.$alert(this.$v('선택된 클러스터가 없습니다.'), {
              callback: () => false
            })
          }
          // 용량 검증
          // 이미지 추가시 선택된 이미지 파일 중 제일 큰 이미지 파일과 OS Root Disk Size 비교 Validation (선택된 이미지 파일보다 작으면 안됨)
          const osRootDiskSize = parseInt(payload.osRootDiskSize)
          // Byte로 변환
          const byteOsRootDiskSize = this.$options.filters.gbToByte(osRootDiskSize)
          if (!byteOsRootDiskSize) {
            return this.$alert(this.$v('OS Root Disk 용량을 확인해주세요.'), {
              callback: () => false
            })
          }

          // 제일 큰 파일
          const maxSizeFromImages = this.getCheckedItem().map(image => {
            if (image.sizeBytes) return image.sizeBytes
            else return image.vmDiskSize
          })

          if (Math.max(maxSizeFromImages) > byteOsRootDiskSize) {
            return this.$alert(this.$v('OS Root Disk Size 용량은<br>선택한 이미지 파일 용량보다 커야합니다.'), {
              callback: () => false,
              dangerouslyUseHTMLString: true
            })
          }
        }
      }
      return true
    },
    /**
     * 수정시 페이로드 변환
     */
    getUpdatePayload () {
      const payload = this.getPayload()

      if (this.imageType === this.IMAGE_PART.UNREGISTER) {
        return omit(payload, ['unregisterImageUuid', 'unregisterImages'])
      } else {
        return {
          ...omit(payload, ['centralIdxList', 'clusterUuidList']),
          imageUrl: this.updateImageDetailData.imageUrl
        }
      }
    },
    /**
     * 페이로드 변환
     */
    getPayload () {
      const common = {
        osName: this.form.imageName,
        osDesc: this.form.imageDescription, // 이미지 설명
        osBit: this.mixinSelectedOsBit, // OS Bit
        swIdxList: this.swLicenses.map(sw => sw.swIdx), // TODO) SW 라이선스 과업 완료 후 연동
        osRootDiskSize: this.form.osRootDiskSize, // OS Root Disk 용량
        imageType: this.form.imageDiskType,
        isManage: this.form.isPublic, // 이미지 노출 여부
        imagePart: this.form.imageType, // 이미지 구분
        osSystem: this.mixinSelectedOsSystem?.codeVal,
        osType: this.mixinSelectedOsType?.codeVal, // OS Type
        osVersion: this.mixinSelectedOsVersion?.codeVal,
        osKernel: this.form.kernelName,
        imageUrl: null
      }
      const merge = target => ({ ...common, ...target })

      console.log(common, this.IMAGE_PART.UNREGISTER)

      if (common.imagePart === this.IMAGE_PART.UNREGISTER) {
        const allCheckedItem = this.getCheckedItem()
        const imageUuids = []

        allCheckedItem.forEach(image => {
          if (!imageUuids.includes(image.imageUuid)) imageUuids.push(image.imageUuid)
        })

        return merge({
          // unregisterImageUuid: imageUuids,
          unregisterImageUuid: imageUuids[0],
          unregisterImages: allCheckedItem.filter(image => image.clusterUuid)
        })
      } else {
        const checked = this.$refs.checkGroupTable?.getAllCheckedItem()
        const centralIdxList = []
        const clusterUuidList = []

        if (checked && checked.length) {
          checked.forEach(item => {
            if (item.clusterUuid) clusterUuidList.push(item.clusterUuid)
            if (item.centralIdx && !centralIdxList.includes(item.centralIdx)) { centralIdxList.push(item.centralIdx) }
          })
        }

        // 신규
        return merge({
          imageUrl: this.form.downloadUrl,
          centralIdxList,
          clusterUuidList
        })
      }
    },
    /**
     * 체크 이벤트시 모든 아이템 disabled 핸들링
     *
     * 센트럴에 미등록 이미지를 체크한 경우
     * 다른 센트럴은 미등록 이미지 체크하지 못함.
     * 센트럴 미등록 이미지 체크시 엘리먼트에 있는 모든 미등록 이미지 중에서
     * 같은 imageUuid 를 찾아서 check 처리 및 나머지 아이템 disabled 처리
     */
    handleMapCheckState (bool, targetImageUuid) {
      if (!targetImageUuid) return

      const activeCentralMap = this.centralUnregisterImagesMap.get(
        this.activeCentralTab.centralIdx
      )
      // const activeElementMap = this.elementUnregisterImagesMap.get(this.activeElementTab.elementIdx)

      // 체크한 아이템과 uuid가 같은 모든 걸 체크 표시
      // 센트럴
      if (activeCentralMap) {
        for (const image of activeCentralMap) {
          if (image.checked) break
          if (image.imageUuid === targetImageUuid) {
            image.checked = bool
            break
          }
        }
      }
      // 엘리먼트
      for (const elements of this.elementUnregisterImagesMap.values()) {
        for (const image of elements) {
          if (image.imageUuid === targetImageUuid) {
            image.checked = bool
          }
        }
      }

      // 센트럴 맵에서 현재 센트럴과 맞지 않는 맵 전부 disabled
      for (const images of this.centralUnregisterImagesMap.values()) {
        images.forEach(image => {
          if (image.centralIdx !== this.activeCentralTab.centralIdx) {
            image.checked = false
            image.disable = bool
          } else if (image.centralIdx === this.activeCentralTab.centralIdx) {
            if (image.imageUuid === targetImageUuid) {
              image.checked = bool
            }
            image.disable = bool ? !image.checked : false
          }
        })
        // 엘리먼트의 항목 중 체크된 아이템이 없으면
        // 체크 가능한 상태로 유지한다.
        // (현재 활성화된 센트럴 탭만)
        if (
          images.every(
            image =>
              !image.checked &&
              this.activeCentralTab.centralIdx === image.centralIdx
          )
        ) {
          images.forEach(image => (image.disable = false))
        }
      }

      // 엘리먼트도 disable 처리 하기
      for (const elements of this.elementUnregisterImagesMap.values()) {
        for (const image of elements) {
          image.disable = bool
          if (image.checked) image.disable = false
        }
        // 엘리먼트의 항목 중 체크된 아이템이 없으면
        // 체크 가능한 상태로 유지한다.
        if (elements.every(image => !image.checked)) { elements.forEach(image => (image.disable = false)) }
      }
    },
    /**
     * 센트럴 이미지 그리드 체크된 애들
     */
    onCheckedCentralRows (rows, row) {
      if (!rows || !row) return

      this.handleMapCheckState(
        !!rows.length,
        row.imageUuid
      )
    },
    /**
     * 엘리먼트 이미지 그리드 체크된 애들
     */
    onCheckedElementRows (rows, row) {
      if (!rows || !row) return

      this.handleMapCheckState(
        !!rows.length,
        row.imageUuid
      )
    },
    /**
     * 엘리먼트 미등록 이미지 조회
     */
    async getElementUnregisterImages (element) {
      if (this.isLoadingElementUnregisterImage) return
      if (this.elementUnregisterImagesMap.has(element.elementIdx)) return

      this.isLoadingElementUnregisterImage = true

      try {
        const { data } = await API.compute.getElementUnregisterImagesByIdx(
          element.elementIdx
        )
        this.elementUnregisterImagesMap.set(
          element.elementIdx,
          (data || []).map(image => ({
            ...image,
            checked: false,
            disable: this.mode === 'update',
            centralIdx: element.centralIdx
          }))
        )
      } catch (error) {
        console.log(error)
        this.$alert('엘리먼트 이미지 조회에 실패하였습니다.')
      } finally {
        this.isLoadingElementUnregisterImage = false
      }
    },
    /**
     * 센트럴 미등록 이미지 조회
     */
    async getCentralUnregisterImages (central) {
      if (this.isLoadingCentralUnregisterImage) return
      if (this.centralUnregisterImagesMap.has(central.centralIdx)) return

      this.isLoadingCentralUnregisterImage = true

      try {
        const { data } = await API.compute.getCentralUnregisterImagesByIdx(
          central.centralIdx
        )
        this.centralUnregisterImagesMap.set(
          central.centralIdx,
          (data || []).map(image => ({
            ...image,
            checked: false,
            disable: this.mode === 'update'
          }))
        )
      } catch (error) {
        console.log(error)
        this.$alert('센트럴 이미지 조회에 실패하였습니다.')
      } finally {
        this.isLoadingCentralUnregisterImage = false
      }
    },
    /**
     * 미등록 이미지 데이터 초기화
     */
    setUnregisterImagesMap () {
      this.centralUnregisterImagesMap = new Map()
      this.elementUnregisterImagesMap = new Map()
    },
    /**
     * 센트럴 탭 변경 이벤트
     */
    onSelectCentral (central) {
      if (!central) return

      this.activeCentralTab = central
      this.getCentralUnregisterImages(central)
    },
    /**
     * 엘리먼트 탭 변경 이벤트
     */
    onSelectElement (element) {
      if (!element) return

      this.activeElementTab = element
      this.getElementUnregisterImages(element)
    },
    /**
     * 추가 모달에서 추가 버튼 이벤트
     */
    createNxOsImage () {
      this.$confirm(this.$v('이미지를 추가하시겠습니까?'))
        .then(async () => {
          try {
            const payload = this.getPayload()
            const validated = await this.validatePayload(payload)

            if (!validated) return

            this.isLoadingApiCalling = true

            await API.compute.createCentralImage(payload)

            this.$alert(this.$v('성공적으로 등록되었습니다.'), {
              callback: () => this.$emit('close', true)
            })
          } catch (error) {
            this.$alert(this.$v('이미지 추가에 실패하였습니다.'))
          } finally {
            this.isLoadingApiCalling = false
          }
        })
        .catch(() => false)
    },
    /**
     * 수정 모달에서 수정 버튼 이벤트
     */
    updateNxOsImage () {
      this.$confirm('이미지를 수정하시겠습니까?')
        .then(async () => {
          try {
            const payload = this.getUpdatePayload()
            const validated = await this.validatePayload(payload, true) // isUpdate

            if (!validated) return

            this.isLoadingApiCalling = true

            await API.compute.updateCentralImage(this.updateImageDetailData.userImageIdx, payload)

            this.$alert(this.$v('수정되었습니다.'), {
              callback: () => this.$emit('close', true)
            })
          } catch (error) {
            this.$alert(this.$v('변경에 실패하였습니다.'))
          } finally {
            this.isLoadingApiCalling = false
          }
        })
        .catch(() => false)
    },
    /**
     * 센트럴 리스트 조회
     */
    async getCentralList () {
      if (this.isLoadingCentral) return
      if (this.mode === 'update' && this.updateImage.imagePart === this.IMAGE_PART) return

      this.isLoadingCentral = true

      try {
        const centrals = await API.compute.getCentralList()

        if (centrals && centrals.length) {
          this.centrals = centrals.map(central => ({
            ...central,
            elements: central.elements
          }))
        } else {
          this.centrals = []
        }
      } catch (error) {
        this.$alert(this.$v('센트럴 목록 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingCentral = false
      }
    }
  },
  data: () => ({
    activeCentralTab: null,
    activeElementTab: null,
    centrals: [],
    centralUnregisterImagesMap: null,
    checkedCentralImages: [],
    checkedElementImages: [],
    elementUnregisterImagesMap: null,
    form: cloneDeep(DEFAULT_FORM),
    isLoadingCentral: false, // 센트럴 리스트 로딩 여부
    isLoadingCentralUnregisterImage: false, // 센트럴 > 미등록 이미지 로딩 여부
    isLoadingElement: false, // 엘리먼트 리스트 로딩 여부
    isLoadingElementUnregisterImage: false, // 엘리먼트 > 미등록 이미지 로딩 여부
    IMAGE_PART: {
      UNREGISTER: 'UNREGISTER',
      NEW: 'NEW'
    },
    isLoadingApiCalling: false, // 생성, 업데이트 API 대기
    minOsRootDisk: {
      // OS 이미지 타입별로 최소값 (단위: GB)
      WINDOWS: 100,
      LINUX: 50,
      UBUNTU: 50,
      CENTOS: 50,
      RHEL: 50
    },
    osTypes: [],
    updateImageDetailData: null,
    swLicenses: [],
    updateLicenseMapped: false,
    loadedLicense: false
  })
}
</script>

<style lang="scss" scoped>
.new-image-create-modal {
  .modal-body {
    max-height: 90%;
    min-height: 90%;
    overflow: auto;
    border-top: 1px solid $border-color;
    &.-scroll-hidden {
      overflow: hidden;
    }

    .central-element {
      &::v-deep {
        .contents {
          overflow-x: auto;
        }
      }
    }
  }

  .os-types-select {
    .el-select {
      max-width: 175px;
    }

    .kernelInput {
      max-width: 220px;
    }

    & > * + * {
      margin-left: $gap-s;
    }
  }
}
</style>
