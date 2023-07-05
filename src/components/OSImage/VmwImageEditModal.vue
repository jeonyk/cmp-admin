<template>
  <el-dialog
    v-loading="isLoadingApiCalling"
    class="new-image-create-modal"
    :visible="active"
    :title="modalTitle"
    @close="$emit('close')"
    width="80%"
  >
    <div
      v-loading="isLoading"
      class="modal-body"
    >
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
        <el-radio-group v-model="mixinSelectedOsBit">
          <!-- <el-radio label="X64">
            X64
          </el-radio>
          <el-radio label="X86">
            X86
          </el-radio> -->
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
            class="kernalInput"
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
        v-loading="isLoadingGuestOS"
        title="Guest OS 선택"
        required
        class="guest-os"
      >
        <!-- <el-select v-model="form.guestOs">
          <el-option v-for="os in guestOSList" :key="os." />
        </el-select> -->
        <searchable-select
          v-model="form.guestOs"
          unique-key="id"
          disabled-change-text
          class="tiny-scroll"
          width="300px"
          :options="guestOsOptions"
          :placeholder="$v('Guest OS를 선택하세요.')"
        />
      </register-contents>

      <register-contents
        title="이미지 파일"
        required
        class="central-element"
        style="min-height: 50px;"
      >
        <div class="ce-wrap">
          <button
            class="button"
            type="is-primary"
            @click="onClickSelectImageFile"
          >
            이미지 파일 선택
          </button>
          <div
            v-if="savedFiles && savedFiles.length"
            class="saved-file-wrap"
          >
            <clearable-tag
              v-for="file in savedFiles"
              :key="file.parentPath + file.path"
              :clearable="false"
              unique-key="path"
              :content="file.path"
            />
          </div>
        </div>
      </register-contents>
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
        @click="mode === 'new' ? createVmwOsImage() : updateVmwOsImage()"
      >
        {{ mode === "new" ? $v("추가") : $v("수정") }}
      </button>
    </section>
    <vmw-select-image-file-modal
      :find-v-center="finderVCenterByUuid"
      :active="isActiveSelectImageFileModal"
      :host-list="hostData"
      :tree-data="treeData"
      :edit-files="editFiles"
      :datastore="datastoreData"
      @close="onCloseSelectImageFileModal"
      @save="onSaveImageFile"
    />
  </el-dialog>
</template>

<script>
import { cloneDeep, groupBy } from 'lodash'
import API, { OSImageCodeMixin, ClearableTag, AddLicenseModal } from '@sd-fe/cmp-core'
import VmwSelectImageFileModal from './VmwSelectImageFileModal.vue'

const DEFAULT_FORM = {
  imageName: '',
  imageDescription: '',
  osBit: 'X64',
  selectedSwLicense: null,
  osRootDiskSize: 0,
  isPublic: false, // true or false
  downloadUrl: '',
  imageDiskType: 'DISK_IMAGE',
  osType: null,
  osSystem: null,
  osVersion: null,
  kernelName: null,
  licenseList: [],
  guestOs: null
}

export default {
  name: 'VmwImageEditModal',
  mixins: [OSImageCodeMixin],
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
  components: {
    VmwSelectImageFileModal,
    ClearableTag,
    AddLicenseModal
  },
  watch: {
    active: {
      immediate: true,
      handler (visible) {
        if (!visible) {
          this.form = cloneDeep(DEFAULT_FORM)
          this.mixinResetCodes()
          this.savedFiles = []
          this.editFiles = []
          this.swLicenses = []
          this.updateLicenseMapped = false
        } else {
          // if (this.mode === 'update') this.getUpdateImageData()
          if (this.mode === 'update') this.bindUpdateImageToForm()
        }
      }
    },
    mixinSelectedOsSystem (system) {
      this.form.guestOs = null
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
    isLoading () {
      return Object.keys(this.loading).some(key => this.loading[key])
    },
    guestOsOptions () {
      if (!this.mixinSelectedOsSystem) return []
      const selectedCodeVal = (this.mixinSelectedOsSystem.codeVal || '').toLowerCase()
      return this.guestOSList.filter(g => (g.family || '').startsWith(selectedCodeVal)).map(g => ({ ...g, label: g.fullName }))
    }
  },
  created () {
    this.getTreeData()
    this.getGuestOs()
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
    async getGuestOs () {
      this.isLoadingGuestOS = true

      try {
        const res = await API.vmware.image.getVMwareImageGuestOS()
        this.guestOSList = res
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('Guest OS 리스트 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingGuestOS = false
      }
    },
    onSaveImageFile (files) {
      this.savedFiles = files

      if (this.mode === 'update' && this.editFiles.length) {
        this.editFiles = []
      }
    },
    async getDatastoreList () {
      try {
        this.loading.getDatastore = true
        const res = await API.vmware.datastore.getDatastoreList()
        this.datastoreData = res
      } catch (error) {
        return this.$alert(this.$v('데이터스토어 조회에 실패하였습니다.'), () => false)
      } finally {
        this.loading.getDatastore = false
      }
    },
    getTreeData () {
      return new Promise((resolve, reject) => {
        Promise.all([
          this.getVcenterList(),
          this.getDatacenterList(),
          this.getClusterList(),
          this.getAllHostList(),
          this.getDatastoreList()
        ])
          .then(() => {
            this.setTreeData()
            resolve()
          })
          .catch(reject)
      })
    },
    setTreeData () {
      // k: uuid, v: host
      const hostMap = new Map()
      // 클러스터에 귀속되지 않은 호스트
      const notIncludeClusterHosts = []
      // 클러스터에 속한 호스트
      const inClusterHosts = []
      this.hostData.forEach(host => {
        host.customType = 'host'
        host.customId = `host_ ${host.hostUuid}`
        host.disabled = false
        host.onlyToggle = true
        hostMap.set(host.hostUuid, host)

        if (host.clusterId) inClusterHosts.push(host)
        else notIncludeClusterHosts.push(host)
      })

      if (hostMap.size > 0) {
        // k: h, v: ds[]
        this.datastoreData.forEach(ds => {
          ds.selected = false
          if (ds.hostList && ds.hostList.length) {
            ds.hostList.forEach(host => {
              const mapHost = hostMap.get(host.hostUuid)
              if (mapHost) {
                const copyDs = cloneDeep(ds)
                copyDs.__ui_uid__ = mapHost?.hostUuid + ds.url
                if (mapHost.children) {
                  mapHost.children.push(copyDs)
                } else {
                  mapHost.children = [copyDs]
                }
              }
            })
          }
        })
      }

      // (cluster) > host 단계 생성
      const groupedHosts = groupBy(inClusterHosts, 'clusterId')
      const clusters = this.clusterData.map(cluster => {
        let children = []
        for (const [key, value] of Object.entries(groupedHosts)) {
          if (key === cluster.clusterId) {
            children = value.map(item => ({
              ...item,
              parentNode: cluster
            }))
          }
        }
        return {
          ...cluster,
          onlyToggle: true,
          customType: 'cluster',
          customId: `cluster_ ${cluster.clusterId}`,
          children
        }
      })

      // 데이터센터 > 클러스터/호스트 단계 생성
      const groupedClusters = groupBy([...clusters, ...notIncludeClusterHosts], 'datacenterId')
      const datacenters = this.datacenterData.map(dc => {
        let children = []
        for (const [key, value] of Object.entries(groupedClusters)) {
          if (key === dc.datacenterId) {
            children = value.map(item => ({
              ...item,
              parentNode: dc
            }))
          }
        }
        return {
          ...dc,
          onlyToggle: true,
          customType: 'datacenter',
          customId: `datacenter_ ${dc.datacenterId}`,
          children
        }
      })

      // vCenter > 데이터센터 단계 생성
      const groupedDatacenters = groupBy(datacenters, 'connectIdx')
      const vcenters = this.vcenterData.map(center => {
        let children = []
        for (const [key, value] of Object.entries(groupedDatacenters)) {
          if (`${key}` === `${center.connectIdx}`) {
            children = value.map(item => ({
              ...item,
              parentNode: center
            }))
          }
        }
        return {
          ...center,
          onlyToggle: true,
          customType: 'vcenter',
          customId: `vcenter_ ${center.connectIdx}`,
          children
        }
      })

      this.treeData = vcenters
    },
    /**
     * VMware vCenter 조회
     */
    async getVcenterList () {
      try {
        this.loading.getVcenter = true
        const data = await API.vmware.vcenter.getVcenterList()
        this.vcenterData = data || []
      } catch (error) {
        console.error(error)
        return this.$alert('vCenter 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.getVcenter = false
      }
    },
    /**
     * VMware 데이터센터 조회
     */
    async getDatacenterList () {
      try {
        this.loading.getDatacenter = true
        const data = await API.vmware.vcenter.getDatacenterList()
        this.datacenterData = data || []
      } catch (error) {
        console.error(error)
        return this.$alert('데이터센터 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.getDatacenter = false
      }
    },
    /**
     * VMware 데이터센터 조회
     */
    async getClusterList () {
      try {
        this.loading.getCluster = true
        const data = await API.vmware.vcenter.getVmwareClusterList()
        this.clusterData = data || []
      } catch (error) {
        console.error(error)
        return this.$alert('클러스터 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.getCluster = false
      }
    },
    /**
     * VMware 호스트 조회
     */
    async getAllHostList () {
      try {
        this.loading.getHost = true
        const data = await API.vmware.host.getVmwareHostList()
        this.hostData = data || []
        return data || []
      } catch (error) {
        console.error(error)
        return this.$alert('호스트 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.getHost = false
      }
    },
    onCloseSelectImageFileModal () {
      this.isActiveSelectImageFileModal = false
    },
    onClickSelectImageFile () {
      this.isActiveSelectImageFileModal = true
    },
    /**
     * 업데이트 이미지 데이터 -> 폼 데이터 바인딩
     */
    bindUpdateImageToForm () {
      const {
        // imageType,
        isDisplay,
        osBit,
        userImageDesc,
        userImageName,
        osType,
        osSystem,
        osVersion,
        osKernel,
        osRootDiskSize,
        licenseList,
        guestOsId,
        fileList
      } = this.updateImage

      this.form.imageDescription = userImageDesc
      // this.form.imageDiskType = imageType
      this.form.imageName = userImageName
      // this.form.imageType = imagePart
      this.form.isPublic = isDisplay
      this.swLicenses = licenseList
      this.form.osRootDiskSize = osRootDiskSize
      this.savedFiles = fileList
      this.editFiles = fileList
      this.mixinSelectedOsBit = osBit
      this.form.kernelName = osKernel

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
        this.form.guestOs = guestOsId

        this.$nextTick(() => {
          const findOsVersion = this.mixinOsVersion.find(os => os.codeVal === osVersion)
          this.mixinSelectedOsVersion = findOsVersion

          this.$nextTick(() => {
            // const findOsKernel = this.mixinOsKernel.find(os => os.codeVal === osKernel)
            // this.mixinSelectedOsKernel = findOsKernel
          })
        })
      })
    },
    /**
     * 페이로드 유효성 검증
     */
    validatePayload (payload, isUpdate = false) {
      if (!payload.userImageName) {
        // 이미지 이름
        return this.$alert(this.$v('이미지명을 입력해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.userImageDesc) {
        // 이미지 설명
        return this.$alert(this.$v('이미지 설명을 입력해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.osSystem) {
        return this.$alert(this.$v('OS System을 선택해주세요.'), {
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
      if (!payload.guestOsId) {
        // Guest OS
        return this.$alert(this.$v('Guest OS를 선택해주세요.'), {
          callback: () => false
        })
      }
      if (!payload.fileList || !payload.fileList.length) {
        // 이미지 파일
        return this.$alert(this.$v('이미지 파일을 선택해주세요.'), {
          callback: () => false
        })
      }
      // TODO
      // OS Root Disk 용량 검증 (최소값, 최대값 등)
      if (!payload.licenseList.length) {
        return this.$alert(this.$v('S/W 라이선스를 선택해주세요.'), {
          callback: () => false
        })
      }
      return true
    },
    /**
     * 수정시 페이로드 변환
     */
    getUpdatePayload () {
      const payload = this.getPayload()
      return payload
    },
    /**
     * 페이로드 변환
     */
    getPayload () {
      const common = {
        userImageName: this.form.imageName,
        userImageDesc: this.form.imageDescription, // 이미지 설명
        osBit: this.mixinSelectedOsBit, // OS Bit
        licenseList: this.swLicenses, // TODO) SW 라이선스 과업 완료 후 연동
        osRootDiskSize: this.form.osRootDiskSize, // OS Root Disk 용량
        imageType: this.form.imageDiskType,
        isDisplay: this.form.isPublic, // 이미지 노출 여부
        osSystem: this.mixinSelectedOsSystem?.codeVal,
        osType: this.mixinSelectedOsType?.codeVal, // OS Type
        osVersion: this.mixinSelectedOsVersion?.codeVal,
        osKernel: this.form.kernelName,
        guestOsId: this.form.guestOs,
        fileList: this.savedFiles
      }

      if (this.mode === 'update') {
        common.userImageIdx = this.updateImage.userImageIdx
        common.createTime = this.updateImage.createTime
      }

      // const merge = target => ({ ...common, ...target })
      return common
    },
    /**
     * 추가 모달에서 추가 버튼 이벤트
     */
    createVmwOsImage () {
      this.$confirm(this.$v('이미지를 추가하시겠습니까?'))
        .then(async () => {
          try {
            const payload = this.getPayload()
            const validated = await this.validatePayload(payload)

            if (!validated) return

            this.isLoadingApiCalling = true

            await API.vmware.image.createVMwareImage(payload)

            this.$alert(this.$v('성공적으로 등록되었습니다.'), {
              callback: () => this.$emit('close', true)
            })
          } catch (error) {
            console.log(error)
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
    updateVmwOsImage () {
      this.$confirm('이미지를 수정하시겠습니까?')
        .then(async () => {
          try {
            const payload = this.getUpdatePayload()
            const validated = await this.validatePayload(payload, true) // isUpdate

            if (!validated) return

            this.isLoadingApiCalling = true

            await API.vmware.image.updateVMwareImage(payload)

            this.$alert(this.$v('수정되었습니다.'), {
              callback: () => this.$emit('close', true)
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$v('변경에 실패하였습니다.'))
          } finally {
            this.isLoadingApiCalling = false
          }
        })
        .catch(() => false)
    },
    finderVCenterByUuid (uuid) {
      return this.vcenterData.find(center => center.vcenterUuid === uuid)
    }
  },
  data: () => ({
    form: cloneDeep(DEFAULT_FORM),
    isLoadingApiCalling: false, // 생성, 업데이트 API 대기
    minOsRootDisk: {
      // OS 이미지 타입별로 최소값 (단위: GB)
      WINDOWS: 100,
      LINUX: 50,
      UBUNTU: 50,
      CENTOS: 50,
      RHEL: 50
    },
    updateImageDetailData: null,
    isActiveSelectImageFileModal: false,
    loading: {
      getVcenter: false,
      getDatacenter: false,
      getCluster: false,
      getHost: false,
      getDatastore: false
    },
    vcenterData: [],
    datacenterData: [],
    clusterData: [],
    hostData: [],
    datastoreData: [],
    treeData: [],
    savedFiles: [],
    editFiles: [],
    guestOSList: [],
    isLoadingGuestOS: false,
    swLicenses: [],
    updateLicenseMapped: false,
    loadedLicense: false
  })
}
</script>

<style lang="scss" scoped>
.new-image-create-modal {
  .modal-body {
    max-height: 700px;
    min-height: 300px;
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

    .ce-wrap {
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      .saved-file-wrap {
        display: flex;
        flex-wrap: wrap;
        margin-left: $gap-s;
      }
    }
  }

  .os-types-select {
    .el-select {
      max-width: 175px;
    }

    .kernalInput {
      max-width: 220px;
    }

    & > * + * {
      margin-left: $gap-s;
    }
  }
}
</style>
