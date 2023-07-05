<!--
  * 파일명 : NutanixCentralImageList.vue
  * 파일 기능 : Nutanix 설정 > Central 이미지 추가/수정/삭제
  * 작성자 : 정재은
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Update : 파일 is-ready 상태일 경우 css 버그 수정
 -->

<template>
  <div class="image-list">
    <h3 class="mid-title">
      Central Images
    </h3>
    <template>
      <div class="button-area -right central-image-buttons">
        <button
          class="button"
          type="is-primary"
          :disabled="centralList.length === 0"
          @click="createClickButton"
        >
          <!-- 항목 추가 -->
          {{ $t('admin.PREF.addImage') }}
        </button>
        <button
          class="button"
          :disabled="!selectedImage"
          @click="updateClickButton"
        >
          <!-- 변경 -->
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          type="is-anti"
          :disabled="checkedRows.length === 0"
          @click="deleteClickButton"
        >
          <!-- 삭제 -->
          {{ $t('common.BTN.delete') }}
        </button>
      </div>

      <div class="table-area">
        <cmp-grid
          :item-source.sync="imageList"
          :columns="imageColumns"
          :init-custom-action="init"
          :changing-page-reset="false"
          :header-checkbox="true"
          page-keeping
          @changingPage="changingPage"
          @checkedRowsData="setCheckedRows"
          :column-data-map="columnDataMap"
        >
          <template
            v-for="column in imageColumns"
            :slot="column.binding"
            slot-scope="props"
          >
            <div :key="column.binding">
              <span v-if="column.binding === 'createTime'">
                {{ props.row[column.binding] | date }}
              </span>
              <span v-else-if="column.binding === 'fileSize'">
                {{ props.row[column.binding] | byte(0) }}
              </span>
              <span v-else-if="column.binding === 'isManage'">

                <div class="input-form" v-if="props.row[column.binding]!==null">
                  <template v-if="props.row[column.binding]">
                    {{ $v('노출') }}
                  </template>
                  <template v-if="!props.row[column.binding]">
                    {{ $v('미노출') }}
                  </template>
                  <el-radio-group v-if="false">
                    <el-radio :label="true">{{ $v('노출') }}</el-radio>
                    <el-radio :label="false" style="margin-left: 10px">{{ $v('미노출') }}</el-radio>
                  </el-radio-group>
                </div>
                <template v-else>-</template>

              </span>
              <span v-else>{{ props.row[column.binding] }}</span>
            </div>
          </template>
        </cmp-grid>
      </div>
    </template>

    <nx-image-edit-modal
      :active="controlImageModal.view"
      :mode="controlImageModal.type"
      :update-image="checkedRows[0]"
      @close="closeDialog"
    />

    <!-- 모달 -->
    <el-dialog
      v-if="false"
      class="new-image-create-modal"
      :title="controlImageModal.type === 'update' ? $t('admin.PREF.changeImage') : $t('admin.PREF.addImage')"
      :visible.sync="controlImageModal.view"
      :top="controlImageModal.type === 'update' ? '10vh' : '15vh'"
      :width="controlImageModal.type === 'update' ? '80%' : '600px'"
      @close="closeDialog"
      :close-on-press-escape="!processing"
      :close-on-click-modal="!processing"
      :show-close="!processing"
      :before-close="cancelUpdate"
    >
      <div :class="['modal-body', { '-scroll-hidden': processing }]">
        <section
          v-if="controlImageModal.type"
          v-loading.fullscreen.lock="processing"
          :element-loading-text="$t('common.PLACEHOLDER.working')"
          element-loading-background="rgba(0, 0, 0, 0.8)"
        >
          <div :class="controlImageModal.type === 'new' ? 'edit-list-update' : 'edit-list'">
            <register-contents
              title="Central"
              required
              v-if="controlImageModal.type === 'new'"
            >
              <div class="input-form">
                <el-select
                  v-model="selectedCentralIdx"
                  :placeholder="$t('admin.PREF.selectCentral')"
                >
                  <el-option
                    v-for="central in newCentralList"
                    :key="central.centralIdx"
                    :label="central.centralName"
                    :value="central.centralIdx"
                  />
                </el-select>
              </div>
            </register-contents>
            <!-- /. Central -->

            <register-contents
              :title="$t('common.GRID.NUTA.osName')"
              required
            >
              <div class="input-form">
                <el-input
                  :placeholder="$t('admin.PREF.enterOsName')"
                  v-model="createImageInfo.osName"
                />
              </div>
            </register-contents>
            <!-- /. OS 이름 -->

            <register-contents
              :title="$t('common.GRID.NUTA.osExplain')"
              required
            >
              <el-input
                :placeholder="$t('admin.PREF.enterOsExplain')"
                v-model="createImageInfo.osDesc"
              />
            </register-contents>
            <!-- /. OS 설명 -->

            <register-contents
              title="OS Bit"
              required
            >
              <div class="input-form">
                <el-radio-group
                  v-model="createImageInfo.osBit"
                >
                  <el-radio
                    label="X64"
                  >
                    X64
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px;"
                    label="X86"
                  >
                    X86
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- /. OS Bit -->

            <register-contents
              title="OS Type"
              required
            >
              <el-select
                v-model="createImageInfo.osType"
                :placeholder="$v('OS 선택')"
                @change="osChange"
              >
                <el-option
                  v-for="osType in osTypes"
                  :key="osType.value"
                  :label="osType.label"
                  :value="osType.value"
                />
              </el-select>
            </register-contents>
            <!-- /. OS Type -->

            <register-contents
              :title="$t('service.sw')"
              required
            >
              <div class="input-form">
                <el-select
                  v-if="createImageInfo.osType"
                  v-model="createImageInfo.swIdx"
                  :placeholder="$t('service.selectSw')"
                  style="width: 200px;"
                  @change="swChange"
                >
                  <el-option
                    v-for="item in filteredSwLicenseList"
                    :key="item.swIdx"
                    :label="item.name"
                    :value="item.swIdx"
                  />
                </el-select>
                <template v-else>
                  {{$v('OS를 선택해주세요')}}
                </template>
              </div>
            </register-contents>
            <!-- /. S/W 라이선스 -->

            <register-contents
              :title="$t('admin.PREF.osRootDiskSize')"
              required
            >
              <el-input-number
                :placeholder="$t('common.ALERT.NUTA.025')"
                v-model="createImageInfo.osRootDiskSize"
                style="width: 200px;"
                :min="minOsRootDisk[updateItemDefaultOsType] || 0"
              />
              <!-- :min="0" -->
            </register-contents>
            <!-- /. OS Root 디스크 용량 -->

            <register-contents
              :title="$t('admin.PREF.imageType')"
              required
            >
              <div class="input-form">
                <el-radio-group
                  v-model="createImageInfo.imageType"
                >
                  <!-- <el-radio label="ISO_IMAGE">
                    ISO
                  </el-radio> -->
                  <!-- style="margin-left: 10px;" -->
                  <el-radio
                    label="DISK_IMAGE"
                  >
                    DISK
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- /. 이미지 타입 -->

            <register-contents
              :title="$t('admin.PREF.isExpoImage')"
              required
              v-if="controlImageModal.type === 'update'"
            >
              <div class="input-form">
                <el-radio-group
                  v-model="createImageInfo.isManage"
                  @change="changeIsManage"
                >
                  <el-radio
                    :label="true"
                  >
                    {{ $t('admin.PREF.expo') }}
                  </el-radio>
                  <el-radio
                    style="margin-left: 10px;"
                    :label="false"
                  >
                    {{ $t('admin.PREF.unExpo') }}
                  </el-radio>
                </el-radio-group>
              </div>
            </register-contents>
            <!-- /. 이미지 노출 여부 -->

            <register-contents
              :title="$t('common.BTN.ADMIN.uploadFile')"
              required
              v-if="false"
            >
              <el-upload
                class="image-uploader cmp-upload"
                action=""
                :auto-upload="false"
                :multiple="false"
                :limit="1"
                ref="fileRefs"
                :file-list="fileList"
              >
                <button
                  class="button"
                  slot="trigger"
                >
                  {{ $t('admin.PREF.executeUpload') }}
                </button>
              </el-upload>
            </register-contents>
          </div>

          <!--
          element-loading-text="작업을 진행중입니다. 해당 페이지에서 벗어날 경우 중단됩니다."
          element-loading-background="rgba(0, 0, 0, 0.8)" -->
          <div
            class="edit-list-update2"
            v-if="controlImageModal.type === 'update'"
          >
            <register-contents
              :title="$t('admin.PREF.fileInfo')"
              required
            >
              <small class="mini-desc">
                <span v-if="createImageInfo.fileSize"> {{ $t('admin.PREF.fileSize') }} : {{ createImageInfo.fileSize | byte(0) }} </span>
                <span v-else-if="fileList.length"> {{ $t('admin.PREF.fileSize') }} : {{ fileList[0].size | byte(0) }} </span>
                <span v-else>{{ $t('admin.PREF.noFile') }}</span>
                <!-- 첨부된 파일이 없습니다. -->
              </small>

              <div
                class="flex-wrap"
                style="margin-top: 10px;"
              >
                <el-upload
                  class="central-image-uploader cmp-upload"
                  style="margin-right: 10px;"
                  ref="fileRefsVersion"
                  action=""
                  :multiple="false"
                  :auto-upload="false"
                  :limit="1"
                  :file-list="fileList"
                  :on-preview="preview"
                  :on-remove="removeFile"
                  :on-change="changeFile"
                >
                  <!-- style="width:30%; float: right;" -->
                  <button
                    class="button"
                    type="is-primary"
                    style="margin-right: 20px;"
                    @click="confirmUpdateImageFile"
                    :disabled="!fileList.length || hasFile"
                  >
                    {{ $v('파일업로드') }}
                  </button>
                  <button
                    class="button"
                    slot="trigger"
                  >
                    {{ $v('파일 선택') }}
                  </button>
                  <!-- <button
                    class="button"
                    @click="updateImageFile"
                    type="is-anti"
                  >
                    파일 변경
                  </button> -->

                  <!-- <p v-if="createImageInfo.userFile"> -->
                  <p v-if="false">
                    <a
                      class="-link"
                      :href="createImageInfo.userFile.sourceUri"
                      style="margin-right: 10px;"
                    >
                      <!-- @click.prevent="fileDownload(createImageInfo.userFile)" -->
                      {{ createImageInfo.userFile.orgFileName }}
                    </a>
                  </p>
                </el-upload>
              </div>
            </register-contents>

            <register-contents
              :title="$t('admin.PREF.addedCentralList')"
              required
            >
              <div class="central-lists-wrap">
                <article class="image-list-wrap">
                  <div class="button-area -right">
                    <el-select
                      v-model="selectedCentralIdx"
                      :placeholder="$t('admin.PREF.selectCentral')"
                      style="width: 200px; margin-right: 10px;"
                      :disabled="selectedImage && !selectedImage.userFileIdx"
                    >
                      <el-option
                        v-for="central in newCentralList"
                        :key="central.centralIdx"
                        :label="central.centralName"
                        :value="central.centralIdx"
                      />
                    </el-select>
                    <button
                      class="button"
                      type="is-primary"
                      @click="addCentralFileClickButton"
                      :disabled="selectedImage && !selectedImage.userFileIdx"
                    >
                      {{ $t('common.BTN.ADMIN.addCentral') }}
                    </button>
                  </div>

                  <div class="cental-elements">
                    <div
                      class="centrals"
                      v-if="selectedImage && selectedImage.userImageFiles"
                    >
                      <span
                        v-for="file of selectedImage.userImageFiles"
                        :key="file.taskUuid"
                        class="centralname"
                      >
                        {{ file.centralName }}
                      </span>
                    </div>
                    <p
                      class="empty-central"
                      v-else
                    >
                      {{ selectedImage && selectedImage.userFileIdx ? $t('admin.PREF.noCentralMessage') : $t('admin.PREF.noCentralMessage2') }}
                    </p>

                    <!-- ////////// -->
                    <!-- ////////// -->
                    <!-- ↓↓↓↓ 🍎 g-tree => element 구조까지 보여주어야 할 경우 사용할 예정입니다. -->
                    <!-- ////////// -->
                    <!-- ////////// -->
                    <!-- :select-object.sync="selTempOpTeam" -->
                    <!-- unique-key="groupIdx" -->
                    <!-- :selectable-company="true" -->
                    <!-- @selected="saveOpTeam" -->
                    <g-tree
                      v-if="false"
                      :data="centralTreeData"
                      :view-line="true"
                      ref="tree"
                    >
                      <template #title="{ node }">
                        <p :class="['-elements', '-central']">
                          {{ node.groupIdx }}

                          <button
                            v-if="node.children"
                            type="is-icon"
                            class="button"
                            @click="e => { e.stopPropagation() }"
                          >
                            <i class="delete-icon" />
                          </button>
                        </p>
                      </template>
                    </g-tree>
                  </div>
                  <!-- <div class="table-area">
                    <cmp-grid
                      :item-source="createImageInfo.centralImageMaps"
                      :columns="centralListColumns"
                    />
                  </div> -->
                </article>
              </div>
            </register-contents>
          </div>
        </section>

        <section
          class="modal-footer modal-button-area"
          v-if="controlImageModal.type === 'update'"
        >
          <button
            class="button -modal-button"
            type="is-anti"
            @click="closeDialog"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            @click="updateCmpImageMeta"
          >
            {{ $t('common.BTN.change') }}
            <!-- 변경 -->
          </button>
        </section>

        <section
          class="modal-footer"
          v-if="controlImageModal.type === 'new'"
        >
          <div class="modal-footer modal-button-area">
            <button
              class="button -modal-button"
              type="is-anti"
              @click="controlImageModal = false"
            >
              {{ $t('common.BTN.cancel') }}
              <!-- 취소 -->
            </button>
            <button
              class="button -modal-button"
              type="is-primary"
              @click="createImageTemp"
            >
              {{ $t('common.BTN.add') }}
              <!-- 추가 -->
            </button>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API, { GTree } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import NxImageEditModal from '@/components/OSImage/NxImageEditModal.vue'

export default {
  name: 'NutanixCentralImageList',
  components: {
    'g-tree': GTree,
    NxImageEditModal
  },
  props: {
    centralList: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  computed: {
    updateItemDefaultOsType () { // 이미지 추가/변경 중인 아이템의 대표 OSType ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL']
      if (!this.createImageInfo?.osType) return undefined

      const osType = ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => this.createImageInfo?.osType.includes(os))
      return osType
    }
  },
  async created () {
    await this.getInstallCode()
    this.getCentralImageList()
    // this.getSwLicenseList()
  },
  methods: {
    /**
     * 이미지 추가/변경 모달을 핸들링합니다.
     * @param { Boolean } view 모달 show/hide 결정
     * @param { String | null } type 'new', 'update', null
     */
    setImageModal (view, type) {
      return { view, type }
    },
    /* --- 이미지 추가 --- */
    /**
     * [이미지 추가] 클릭시 발생하는 이벤트
     * @return   {void}
     */
    createClickButton () {
      // this.osChange()
      this.newCentralList = this.imageDataSetting()
      this.controlImageModal = this.setImageModal(true, 'new')
    },
    /**
     * [이미지 추가 > 추가] 클릭시 발생하는 이벤트
     * @return   {void}
     */
    async createImageTemp () {
      const conditions = [
        { condition: this.selectedCentralIdx !== '', message: this.$t('common.ALERT.NUTA.019') },
        { condition: this.createImageInfo.osName.trim() !== '', message: this.$t('common.ALERT.NUTA.024') },
        { condition: this.createImageInfo.osDesc.trim() !== '', message: this.$t('common.ALERT.NUTA.023') },
        { condition: this.createImageInfo.swIdx && this.createImageInfo.swIdx !== '', message: this.$t('common.ALERT.NUTA.026') },
        { condition: this.createImageInfo.osRootDiskSize && this.createImageInfo.osRootDiskSize !== '' && this.createImageInfo.osRootDiskSize !== 0 && this.createImageInfo.osRootDiskSize !== '0', message: this.$t('common.ALERT.NUTA.025') }
      ]

      const validator = conditions.every(con => {
        if (!con.condition) this.$alert(con.message)
        return con.condition
      })

      if (validator) {
        this.$confirm(this.$t('common.CONFIRM.BASE.030'), {
          confirmButtonText: this.$t('common.TERMS.yes'),
          cancelButtonText: this.$t('common.TERMS.no')
        }).then(async () => {
          const res = await this.createCmpImageMeta(this.createImageInfo)
          console.log(this.createImageInfo)
          if (res) {
            return this.$alert(this.$t('common.ALERT.BASE.018'), {
              callback: () => {
                this.closeDialog()
                this.getCentralImageList() // image list 재조회
                this.$forceUpdate()
              }
            })
          }
        }).catch(() => false)
      }
    },

    /* --- 이미지 변경 --- */
    /**
     * [이미지 변경] 의 모달이 open될 시 Central Options 리스트를 조건에 맞게 세팅합니다.
     * @param { Array } data
     * @param { Object } image
     * @return { Array }
     */
    setCentralOptions (data = this.newCentralList, image = this.selectedImage) {
      data = this.imageDataSetting()
      const files = image.userImageFiles
      if (files) {
        const filterd = data.filter(central => {
          let centralIdx
          files.forEach(file => { centralIdx = central.centralIdx !== file.centralIdx })
          return centralIdx
        })
        return filterd
      } else return data
    },
    /**
     * [이미지 변경] 클릭시 발생하는 이벤트 - 변경 popup 생성
     * @return   {void}
     */
    updateClickButton () {
      // row 선택 불가하게 되면서 init() 함수 내 addEventListener 에서 처리하던 부분 이쪽으로 옮김
      this.savedSelImage = this.selectedImage ? { ...this.selectedImage } : null

      this.newCentralList = this.setCentralOptions(this.newCentralList)
      this.controlImageModal = this.setImageModal(true, 'update')
      this.createImageInfo = cloneDeep(this.selectedImage)

      // console.log(this.swLicenseList, ' ==== swLicenseList...')
      // console.log(this.createImageInfo, ' ==== 선택된 이미지...')
      // console.log(this.selectedImage, ' ==== 선택된 이미지...')

      if (this.savedSelImage && this.savedSelImage.orgFileName && this.savedSelImage.sourceUri) {
        const { orgFileName, sourceUri } = this.savedSelImage
        this.fileList = [{ name: orgFileName, sourceUri }]
        this.hasFile = true
      }
      return this.osChange()
    },
    /**
     * 파일 삭제 시 이벤트
     */
    removeFile (file, fileList) {
      this.fileList = [...fileList]
      if (!this.fileList.length) {
        this.createImageInfo.isManage = false
        this.hasFile = false
      }
    },
    /**
     * 파일 변경시 이벤트
     * @param    {Object} file 업로드된 파일 한개
     * @param    {Array} formData 업로드된 파일 리스트
     * @return   {void}
     */
    changeFile (file, fileList) {
      if (file.size > (1024 * 1024 * 1024 * 30)) { // 30GB 이하 파일만 업로드 가능
        const list = this.fileList.filter(item => item.name !== file.name)
        this.fileList = list
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '30GB' }))
      } else {
        this.hasFile = false
        this.fileList = !fileList.length ? [...fileList] : fileList.slice(-1)
      }
      // console.log(this.fileList, 'FileList is changing...')
    },
    /**
     * [파일 변경] 클릭시 동작 -> @@ DEPRECATED
     * @return   {void}
     */
    async updateImageFile () {
      console.error('%c @@@ updateImageFile() = DEPRECATED METHODS!', 'font-size: 15px')
      if (this.$refs.fileRefsVersion.uploadFiles.length === 0) {
        // this.$alert('파일 업로드가 필요합니다.')
        this.$alert(this.$t('common.ALERT.NUTA.013'))
        return
      }
      this.$confirm(this.$t('common.CONFIRM.NUTA.005'), '', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.TERMS.yes'),
        cancelButtonText: this.$t('common.TERMS.no')
      }).then(async () => {
        this.createImageInfo.imageName = this.createImageInfo.osName
        this.createImageInfo.imageDesc = this.createImageInfo.osDesc
        const formData = new FormData()
        formData.append('userImageIdx', this.createImageInfo.userImageIdx)
        formData.append('file', this.$refs.fileRefsVersion.uploadFiles[0].raw)

        const res = await this.createCmpImageFileUpload(formData)
        if (res) {
          await this.getCentralImageList()
          for (const i in this.imageList) {
            if (this.createImageInfo.userImageIdx === this.imageList[i].userImageIdx) {
              this.createImageInfo = this.imageList[i]
            }
          }
          this.fileList = []
        }
      })
    },
    /**
     * 파일 개별 클릭시 다운로드 됩니다.
     * @param    {Object} file 업로드된 파일 한개
     * @param    {Array} formData 업로드된 파일 리스트
     * @return   {void}
     */
    preview (file, fileList) {
      if (!file.sourceUri) return
      this.$confirm(this.$t('common.CONFIRM.NUTA.002'))
        .then(() => {
          const a = document.createElement('a')
          a.href = file.sourceUri
          a.setAttribute('download', file.sourceUri)
          a.click()
          a.remove()
        }).catch(() => false)
    },
    /**
    * [파일 업로드]시 발생하는 이벤트
    * 파일을 업로드하고 화면을 업데이트합니다.
    * @return {void}
    */
    async confirmUpdateImageFile () {
      // if (!this.fileList.length) return this.$alert('파일을 선택해주세요.')
      if (!this.fileList.length) return this.$alert(this.$t('common.ALERT.NUTA.015'))

      this.$confirm(this.$t('common.CONFIRM.NUTA.001'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const file = new FormData()
          const userImageIdx = this.createImageInfo.userImageIdx

          file.append('file', this.fileList[0].raw)
          try {
            this.processing = true
            const res = await API.compute.createCmpFile(file, userImageIdx)

            if (res.isSuccess) {
              // return this.$alert('성공적으로 파일이 업로드 되었습니다.', {
              return this.$alert(this.$t('common.ALERT.NUTA.004'), {
                callback: async () => {
                  await this.getCentralImageList() // image list 재조회
                  this.grid.collectionView.moveToPage(this.currPage)

                  this.imageList.forEach(image => {
                    if (image.index === this.savedSelImage.index) this.selectedImage = image
                  })
                  this.newCentralList = this.setCentralOptions(this.newCentralList)
                  this.hasFile = true
                  this.fileList[0].userFileIdx = res.userFileIdx
                  return this.$forceUpdate()
                }
              })
            }
          } catch (error) {
            console.error(error)
            console.log(error.response.data)
            // return this.$alert('파일 업로드중에 문제가 발생하였습니다.<br>다시 시도해주세요.', { dangerouslyUseHTMLString: true })
            return this.$alert(this.$t('common.ALERT.NUTA.014'), { dangerouslyUseHTMLString: true })
          } finally {
            this.processing = false
          }
        })
        .catch(() => false)
    },
    /** [이미지 변경 > 변경] 클릭시 발생하는 이벤트
     * @return   {void}
     */
    async updateCmpImageMeta () {
      const conditions = [
        // { condition: this.selectedCentralIdx !== '', message: 'Central을 선택 해주세요.' },
        { condition: this.createImageInfo.osName.trim() !== '', message: this.$t('common.ALERT.NUTA.024') }, // OS 이름을 입력 해주세요.
        { condition: this.createImageInfo.osDesc.trim() !== '', message: this.$t('common.ALERT.NUTA.023') }, // OS 설명을 입력 해주세요.
        { condition: this.createImageInfo.swIdx && this.createImageInfo.swIdx !== '', message: this.$t('common.ALERT.NUTA.026') }, // S/W 라이선스를 선택 해주세요.
        { condition: this.createImageInfo.osRootDiskSize !== '' && this.createImageInfo.osRootDiskSize !== 0 && this.createImageInfo.osRootDiskSize !== '0', message: this.$t('common.ALERT.NUTA.025') } // OS Root 디스크 용량을 입력 해주세요.
      ]

      const validator = conditions.every(con => {
        if (!con.condition) this.$alert(con.message)
        return con.condition
      })

      if (!validator) return false
      this.$confirm(this.$t('common.CONFIRM.NUTA.004'), '', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.TERMS.yes'),
        cancelButtonText: this.$t('common.TERMS.no')
      }).then(async () => {
        try {
          this.processing = true

          const payload = {
            ...this.createImageInfo,
            userFileIdx: this.fileList[0].userFileIdx
          }

          const response = await API.compute.updateCmpImageMeta(payload)

          if (response) {
            await this.getCentralImageList()
            // this.grid.collectionView.moveToPage(this.currPage)

            // this.$alert('성공적으로 변경되었습니다.', {
            this.$alert(this.$t('common.ALERT.BASE.019'), {
              callback: () => this.closeDialog()
            })
          }
        } catch (error) {
          console.error(error)
          // return this.$alert('변경에 실패하였습니다.')
          return this.$alert(this.$t('common.ALERT.NETWORK.010'))
        } finally {
          this.processing = false
        }
      })
    },

    /* --- 이미지 삭제 --- */
    /** [이미지 삭제] 클릭시 발생하는 이벤트
     * @return   {void}
     */
    deleteClickButton () {
      this.$confirm(this.$t('common.CONFIRM.NUTA.003', { n: this.checkedRows.length }), '알림', { // 이미지 삭제 시 상당 시간이 소요될 수 있습니다. n 개의 이미지를 삭제하시겠습니까?
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => {
        try {
          for (const row of this.checkedRows) {
            await API.compute.deleteCentralImage(row)
          }
          await this.getCentralImageList()
        } catch (error) {
          console.error(error)
          return false
        } finally {
          this.checkedRows = []
        }
      })
    },

    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */

    /* --- Central 선택 Selectbox Options 설정 --- */
    /**
     * [Central 추가] 버튼 클릭시 동작
     * @return   {void}
     */
    async addCentralFileClickButton () {
      if (this.selectedCentralIdx === '') {
        // this.$alert('Central 선택이 필요합니다.')
        this.$alert(this.$t('common.ALERT.NUTA.019'))
        return
      }

      return this.$confirm(this.$t('common.CONFIRM.NUTA.008'), {
        dangerouslyUseHTMLString: true,
        cancelButtonText: this.$t('common.BTN.cancel'),
        confirmButtonText: this.$t('common.BTN.confirm')
      })
        .then(() => this.addCentralAction())
        .catch(() => false)
    },
    /**
     * [Central 추가] 시 동작
     * @return   {void}
     */
    async addCentralAction () {
      /**
       * Central 추가 Selected value 필터링
       * @param { Boolean | Number } - true: centralIdx와 일치하는 경우, false: 일치하지 않는경우, -1: 전체 선택시
       */
      const filtered = (bool = true) => this.newCentralList.filter(central => {
        if (bool === true) return central.centralIdx === this.selectedCentralIdx
        else if (bool === false) return central.centralIdx !== this.selectedCentralIdx
        else return true
      })

      const centralIdx = filtered(true)[0].centralIdx
      const userImageIdx = this.createImageInfo.userImageIdx
      const params = { centralIdx, userImageIdx }

      try {
        this.processing = true
        const response = await API.compute.createNxImageMeta(params)

        // ↓↓↓ respones가 있으면 실행 시작
        if (response) {
          await this.getCentralImageList() // image list 재조회
          this.grid.collectionView.moveToPage(this.currPage)

          this.imageList.forEach(image => {
            if (image.index === this.savedSelImage.index) this.selectedImage = image
          })
          this.selectedCentralIdx = ''
          this.newCentralList = this.setCentralOptions(this.newCentralList)
          return this.$forceUpdate()
        }
      } catch (error) {
        // return this.$alert('Central 을 추가하는데 문제가 발생했습니다.<br>다시 시도해주세요.', { dangerouslyUseHTMLString: true })
        return this.$alert(this.$t('common.ALERT.NUTA.017'), { dangerouslyUseHTMLString: true })
      } finally {
        this.processing = false
      }
    },

    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */

    /**  [이미지 추가 / 변경] 모달 닫을때 발생하는 이벤트
     * @return   {void}
     */
    closeDialog (refreshImage = false) {
      // this.createImageInfo.imageVersionList = []
      // this.createImageInfo = this.clearCreateImageInfo()
      // this.selectedCentralIdx = ''
      // this.fileList = []

      if (refreshImage) {
        this.getCentralImageList()
      }

      setTimeout(() => {
        this.controlImageModal = this.setImageModal(false, null)
      }, 200)
    },
    /**  이미지 메타데이터 생성
     * @param    {Object} payload 생성할 이미지 메타데이터
     * @return   {void}
     */
    async createCmpImageMeta (payload) {
      try {
        return await API.compute.createCmpImageMeta(payload)
      } catch (error) {
        console.error(error)
        return error
      }
    },

    /**  image 파일 업로드
     * @param    {FormData} formData 업로드할 이미지
     * @return   {void}
     */
    async createCmpImageFileUpload (formData) {
      try {
        return await API.compute.createCmpFile(formData)
      } catch (error) {
        console.error(error)
        return error
      }
    },
    /**  이미지 뉴타닉스 메타데이터 생성 -> Elements
     * [Central 추가] 될때 사용됩니다.
     * @return   {void}
     */
    async createNxImageMeta () {
      try {
        const payload = {
          // imageType: 'ISO_IMAGE',
          imageType: 'DISK_IMAGE',
          centralIdx: this.createImageInfo.centralIdx,
          userFileIdx: this.createImageInfo.userFileIdx,
          userImageIdx: this.createImageInfo.userImageIdx
        }
        this.processing = true
        return await API.compute.createNxImageMeta(payload)
      } catch (error) {
        console.error(error)
        const err = (error.response && error.response.data) ? error.response.data.message : error.message
        // const message = `이미지를 불러오는데 문제가 발생했습니다. <br> Error: ${err}`
        const message = this.$t('common.ALERT.NUTA.007', { err })

        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          dangerouslyUseHTMLString: true
        })
        return false
      } finally {
        this.processing = false
      }
    },

    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */

    /**
     * CentralImage 리스트 호출
     * @author 전경열
     * @return {void}
     */
    async getCentralImageList () {
      const imageList = await API.compute.getCentralImageList()

      const mappedTimes = []
      const mappedFileSizes = []

      for (const i in imageList) {
        if (imageList[i].userFile) {
          imageList[i].fileSize = imageList[i].userFile.fileSize
        }
        if (imageList[i].centralImageMaps && imageList[i].centralImageMaps.length > 0) {
          for (const j in imageList[i].centralImageMaps) {
            for (const k in this.centralList) {
              if (imageList[i].centralImageMaps[j].centralIdx === this.centralList[k].centralIdx) {
                imageList[i].centralImageMaps[j].centralName = this.centralList[k].centralName
                imageList[i].centralImageMaps[j].centralUrl = this.centralList[k].connectUrl
              }
            }
          }
        }
        mappedTimes.push({ value: imageList[i].createTime, caption: this.$options.filters.date(imageList[i].createTime) })
        mappedFileSizes.push({ value: imageList[i].fileSize, caption: this.$options.filters.byte(imageList[i].fileSize, 0) })
      }

      const sortedImageList = imageList.slice(0)
      sortedImageList.sort((a, b) => b.createTime - a.createTime)

      // console.log('sortedImageList:', sortedImageList)
      this.imageList = sortedImageList
      this.selectedImage = null
      this.checkedRows = []

      this.columnDataMap.createTime = mappedTimes
      this.columnDataMap.fileSize = mappedFileSizes
    },
    /**  install code 리스트 불러옴
     * @return   {Object}
     */
    async getInstallCode () {
      const response = await API.enum.getOsTypes()
      this.osTypes = response.map(({ codeVal }) => ({ value: codeVal, label: codeVal }))
    },
    /**  S/W 라이선스 목록 불러옴
     * @return   {void}
     */
    async getSwLicenseList () {
      this.swLicenseList = await API.config.getSwLicenseList({ category: 'image' })
    },
    /**  Central Select Option 리스트를 위한 이미지 데이터 세팅 (이미지 추가 / 변경에서 모두 사용)
     * @return   {Object} 이미지 리스트 정보를 가진 object
     */
    imageDataSetting () {
      const copyData = this.centralList.map(central => {
        const { centralIdx, centralName, elements } = central
        return { centralIdx, centralName, elements }
      })
      // copyData.unshift({ centralIdx: -1, centralName: '전체' })
      return copyData
    },
    // os 변경시
    osChange () {
      if (this.controlImageModal.type !== 'update') this.createImageInfo.swIdx = null

      this.filteredSwLicenseList = this.swLicenseList.filter(sw => sw.osType === this.createImageInfo.osType)
      this.$forceUpdate()
    },
    // S/W 라이선스 변경시
    swChange () {
      this.$forceUpdate()
    },
    cancelUpdate () {
      this.$confirm(this.$t('common.CONFIRM.BASE.029'), {
        cancelButtonText: this.$t('common.BTN.cancel'),
        confirmButtonText: this.$t('common.BTN.confirm')
      })
        .then(() => this.closeDialog())
        .catch(() => false)
    },

    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */
    /* --- ========= --- */

    /**
    * this.createImageInfo 초기화
    * @return   {Object}
    */
    clearCreateImageInfo () {
      return {
        centralIdx: '',
        osName: '',
        osDesc: '',
        osBit: 'X64',
        osType: undefined,
        isManage: false,
        osRootDiskSize: 0,
        file: [],
        imageType: 'DISK_IMAGE',
        imageVersionList: []
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    setCheckedRows (checkedRows) {
      // 단일 선택시 [변경] 활성화
      this.selectedImage = checkedRows.length === 1 ? checkedRows[0] : null

      // 다중 선택시
      this.checkedRows = checkedRows
    },
    changingPage (page) {
      this.currPage = page - 1
    },
    init (grid) {
      this.grid = grid

      // grid.addEventListener(grid.hostElement, 'click', (e) => {
      //   const ht = grid.hitTest(e) // HitTestInfo
      //   const rows = grid.cells.rows // 클릭한 rows의 data
      //   const selectedRow = rows[ht.row]

      //   if (ht.cellType === 1) {
      //     if (selectedRow) this.savedSelImage = selectedRow ? selectedRow.dataItem : null
      //   }
      // })
    },
    /**
     * 이미지 노출 여부 변경 시
     */
    changeIsManage (val) {
      console.log(val)
      if (val && !this.fileList.length) {
        this.$alert(this.$v('이미지 파일을 업로드 후 노출 여부를 노출로 설정이 가능합니다.')).then(() => {
          this.createImageInfo.isManage = false
        })
      }
    }
  },
  data () {
    return {
      grid: null,
      currPage: 0,
      processing: false,
      imageList: [],
      imageColumns: [
        { binding: 'osName', header: '이미지 이름', customHtml: true, align: 'left', keyPath: 'common.GRID.NUTA.osName' },
        { binding: 'osDesc', header: '이미지 설명', customHtml: true, align: 'left', keyPath: 'common.GRID.NUTA.osExplain' },
        { binding: 'isManage', header: '사용자 노출 여부', customHtml: true, width: 100, align: 'left', keyPath: this.$v('사용자 노출 여부') },
        { binding: 'osType', header: 'OS 타입', customHtml: true, width: 200, keyPath: 'common.GRID.NUTA.osType' },
        { binding: 'osBit', header: 'OS Bit', customHtml: true, width: 150 },
        // { binding: 'fileSize', header: '이미지 크기', customHtml: true, width: 150, keyPath: 'common.GRID.NUTA.sizeImage' },
        { binding: 'osRootDiskSize', header: 'OS Root Disk Size', customHtml: true },
        { binding: 'createTime', header: '생성 시간', customHtml: true, width: 150, dataType: 'Date', keyPath: 'common.GRID.NUTA.createTime' }
      ],
      savedSelImage: null,
      selectedImage: null,
      checkedRows: [],
      controlImageModal: this.setImageModal(false, null),
      createImageInfo: this.clearCreateImageInfo(),
      centralListColumns: [
        { binding: 'centralName', header: 'Central', width: '*', customHtml: true },
        { binding: 'centralUrl', header: 'URL', width: '*', customHtml: true }
      ],
      newCentralList: [],
      selectedCentralIdx: '',
      fileList: [],
      osTypes: [],
      filteredSwLicenseList: [],
      swLicenseList: [],
      columnDataMap: {
        createTime: null,
        fileSize: null
      },
      minOsRootDisk: { // OS 이미지 타입별로 최소값 (단위: GB)
        WINDOWS: 100,
        LINUX: 50,
        UBUNTU: 50,
        CENTOS: 50,
        RHEL: 50
      },
      hasFile: false
    }
  }

}
</script>
<style lang="scss">
  .image-list {
    position: relative;
    .central-image-buttons {
      position: absolute;
      top: -$gap-s;
      right: 0;
    }

    /* .new-image-create-modal {
      .modal-body {
        max-height: 700px;
        min-height: 300px;
        overflow: auto;
        border-top: 1px solid $border-color;
        &.-scroll-hidden {
          overflow: hidden
        }
      }
    } */

    .central-lists-wrap {
      .image-list-wrap {
        // min-height: 200px;
        overflow-y: auto;
        position: relative;
        .modal-sub-title {
          position: absolute;
          top: 0; left: 0;
        }

        .cental-elements {
          border-radius: $radius-m;
          min-height: 200px;
          max-height: 300px;
          overflow-y: auto;
          padding: $gap-m;
          margin: $gap;
          background-color: $black;

          .centrals {
            display: flex;
            flex-wrap: wrap;
            .centralname {
              border: 1px dashed $purple-blue;
              border-radius: $radius-r;
              display: inline-block;
              min-width: 100px;
              margin-right: $gap;
              margin-bottom: $gap;
              text-align: center;
              padding: $gap-s $gap;
              transition: background-color .2s ease;
              &:hover {
                background-color: rgba($purple-blue, 0.2);
              }
            }
          }
          > .empty-central {
            font-size: 12px;
            color: $input-placeholder;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          // ---- tree 사용할 경우..
          .-elements {
            display: flex;
            width: 180px;
            justify-content: space-between;
            align-items: center;
            border: 1px dashed $slate;
            padding: 5px $gap-s;
            border-radius: $radius-s;
            &.-central {
              width: 200px;
              border: 2px dashed $slate;
            }
          }
        }
      }
    }
  }
</style>
