<template>
  <div>
    <script-locked
      v-if="isLocked"
      @pass="isPassed"
    />
    <!-- /. 비밀번호 Lock 설정 -->

    <article
      class="script-detail-wrapper"
      v-else
    >
      <div class="script-area">
        <div class="title-area">
          <h5 class="title">
            Init Script
          </h5>

          <span
            v-if="selectedScript"
            class="reg-date"
          >
            <!-- 최한솔(12**56) 2021 .12.02 17:17 -->
            {{ maskingId(selectedScript) }}
          </span>
          <!-- /. Script 등록 날짜 -->
          <!-- 🌸 {{ image.amiScriptHistoryIdx }} -->

          <button
            class="button"
            type="is-primary"
            @click="initScriptModal = true"
          >
            <!-- Init Script 추가 -->
            {{ $t('service.AMIImage.BTN.addInitScript') }}
          </button>
        </div>
        <!-- /. 타이틀 -->

        <textarea
          v-if="historyData.length"
          :readonly="!isEditing"
          v-model="scriptContent"
          class="script-contents textarea tiny-scroll"
          @click="editScript"
        />

        <span
          v-else
          class="script-contents textarea -empty"
        >
          <!-- 등록된 Init Script 가 없습니다. -->
          {{ $t('service.AMIImage.PLACEHOLDER.008') }}
        </span>
      </div>
      <!-- ////////////// -->
      <!-- /. Init Script -->
      <!-- ////////////// -->

      <div class="reference-area">
        <h5 class="title">
          <!-- 비고 -->
          {{ $t('service.AMIImage.remark') }}
        </h5>

        <textarea
          v-if="historyData.length"
          :readonly="!isEditing"
          v-model="scriptRemark"
          class="reference-contents textarea tiny-scroll"
          @click="editScript"
        />

        <span
          v-else
          class="reference-contents textarea -empty"
        >
          <!-- 등록된 Init Script 가 없습니다. -->
          {{ $t('service.AMIImage.PLACEHOLDER.008') }}
        </span>

        <button
          class="button apply-button"
          type="is-primary"
          :disabled="selectedScript === null || selectedScript.amiScriptHistoryIdx === image.initScript "
          @click="applyScript"
        >
          <!-- 적용 -->
          {{ $t('common.BTN.apply') }}
        </button>
      </div>
      <!-- ////////////// -->
      <!-- /. 비고 -->
      <!-- ////////////// -->

      <div class="history-area">
        <h5 class="title">
          <!-- 작성 히스토리 -->
          {{ $t('service.AMIImage.history') }}
        </h5>

        <div class="history-contents">
          <cmp-grid
            :item-source="historyData"
            :columns="historyColumns"
            :use-column-filter="false"
            :paging-size="5"
            :init-auto-select-row="selectedScript"
            :added-item-formatter="addedItemFormatter"
            :init-custom-action="initCustomGrid"
            init-auto-select-row-key="amiScriptHistoryIdx"
            selectable
            keep-select
            page-keeping
            @selectedRow="selectedRow"
          />
        </div>
      </div>
      <!-- ////////////// -->
      <!-- /. 작성 히스토리 -->
      <!-- ////////////// -->

      <init-script
        :active="initScriptModal"
        @save-script="addScript"
        @close="initScriptModal = false"
      />
    <!-- /. Init Script 모달 -->
    </article>
  </div>
</template>

<script>
import InitScript from './InitScript'
import ScriptLocked from './ScriptLocked'
import { mapState } from 'vuex'
// import { getInitScriptList, updateInitScript, applyInitScript } from '@/components/Apis/AWS'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ScriptDetail',
  components: {
    'init-script': InitScript,
    'script-locked': ScriptLocked
  },
  props: {
    image: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    image: {
      deep: true,
      handler (image, before) {
        if (image.imageId !== before.imageId) this.getScriptDetail()
        else {
          // 보고있는 이미지는 동일한데 내용이 달라지는경우 (amiScriptHistoryIdx 변경시)
          // console.log(image.imageId, before.imageId, before.amiScriptHistoryIdx)

          this.getInitScriptList(this.image)
          this.isPassed(true)
        }
      }
    }
  },
  created () {
    this.getScriptDetail()
  },
  methods: {
    /**
     * Init Script 변경시
     */
    editScript () {
      if (this.isEditing) return

      // 적용된 Init Script 를 <br> 변경하시겠습니까?
      this.$confirm(this.$t('service.AMIImage.ALERT.003'), {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.BTN.change'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.isEditing = true
      }).catch(() => false)
    },
    async getScriptDetail () {
      this.selectedScript = null
      this.isEditing = false
      await this.getInitScriptList(this.image)

      // 비밀번호 화면 설정
      this.isLocked = this.historyData.length > 0
    },
    /**
     * password 통과된 경우 설정
     */
    isPassed (result) {
      if (!result) return
      this.isLocked = false
      this.isEditing = false

      if (!this.historyData.length) return

      if (!this.image.amiScriptHistoryIdx) this.selectedScript = this.historyData[0]
      else {
        // [적용] 된 내용이 있으면 해당 내용으로 세팅
        this.historyData.forEach(data => { if (this.image.amiScriptHistoryIdx === data.amiScriptHistoryIdx) this.selectedScript = data })
      }

      this.scriptContent = this.selectedScript.initScript
      this.scriptRemark = this.selectedScript.note
    },
    async getInitScriptList (image = this.image) {
      try {
        const { imageId, regionName } = image
        const { data } = await API.aws.getInitScriptList({ imageId, regionName })

        if (data) {
          this.historyData = data.list.map(item => {
            item.date = this.$options.filters.date(item.createTime, 'YYYY.MM.DD HH:mm')
            item.name = this.maskingId(item, false)
            return item
          })
        }
      } catch (error) {
        console.error('@@ getInitScriptList : ', error)
        // 'AMI Init Script를 가져오는데<br>문제가 발생했습니다. 다시 시도해주세요.'
        this.$alert(this.$t('service.AMIImage.ALERT.004'), { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },
    /**
     * Script 등록 API
     */
    async addScript ({ script, remark }) {
      try {
        const { imageId, regionName } = this.image
        const payload = {
          imageId,
          regionName,
          initScript: script,
          note: remark,
          userId: this.user.userId,
          userName: this.user.userName
        }

        this.selectedScript = null
        await API.aws.updateInitScript(payload)
        await this.getInitScriptList(this.image)
        this.isPassed(true)
        // console.log(script, remark, payload, this.image)
      } catch (error) {
        console.error('@@ addScript : ', error)
        // 'AMI Init Script를 등록하는데 문제가 발생했습니다. 다시 시도해주세요.'
        this.$alert(this.$t('service.AMIImage.ALERT.005'), { dangerouslyUseHTMLString: true, callback: () => false })
      }
    },
    selectedRow (item = null) {
      this.isEditing = false
      this.selectedScript = item.dataItem
      this.scriptContent = this.selectedScript.initScript
      this.scriptRemark = this.selectedScript.note
    },
    validator (content = this.scriptContent, remark = this.scriptRemark) {
      if (content === undefined || content === '') {
        this.$alert(this.$t('service.AMIImage.ALERT.006'), { callback: () => false }) // Init Script 를 입력해주세요.
        return false
      }
      if (remark === undefined || remark === '') {
        this.$alert(this.$t('service.AMIImage.ALERT.007'), { callback: () => false }) // 비고를 입력해주세요.
        return false
      }

      return true
    },
    /**
     * [적용] 버튼 클릭시 발생하는 이벤트
     */
    applyScript () {
      if (this.validator() === false) return

      let message = this.$t('service.AMIImage.ALERT.008') // Init Script 를 <br> 적용 하시겠습니까?

      // 변경사항이 있는 경우, 변경 내용 [저장 + 적용]
      if (this.isEditing) message = this.$t('service.AMIImage.ALERT.009')// 변경된 Init Script 를 <br> 변경 및 적용 하시겠습니까?

      this.$confirm(message, {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.BTN.change'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        // Script 적용
        let { amiScriptHistoryIdx } = this.selectedScript

        // 변경사항이 있다면 해당 변경내용을 저장 + 해당 Idx 로 Script 적용
        if (this.isEditing) {
          await this.addScript({ script: this.scriptContent, remark: this.scriptRemark })
          amiScriptHistoryIdx = this.historyData[0].amiScriptHistoryIdx
        }

        await API.aws.applyInitScript({ amiScriptHistoryIdx })

        // 성공적으로 변경되었습니다.
        this.$alert(this.$t('common.ALERT.BASE.019'), { callback: () => this.$emit('refresh') })
      }).catch(() => false)
    },
    addedItemFormatter (panel, r, c, cell) {
      const dataItem = panel.rows[r].dataItem
      if (!dataItem) return
      if (
        dataItem.amiScriptHistoryIdx === this.image.amiScriptHistoryIdx && // [적용] 된 상태의 init script Index
        this.selectedScript && this.selectedScript.amiScriptHistoryIdx !== dataItem.amiScriptHistoryIdx
      ) {
        panel.rows[r].cssClass = '-applied'
      }
    },
    initCustomGrid (grid) {
      this.grid = grid
    },
    gridRefresh (grid = this.grid) {
      const cv = grid.collectionView
      if (cv) cv.refresh()
    }
  },
  data () {
    return {
      isLocked: false,
      isEditing: false,
      selectedScript: null,
      initScriptModal: false,
      scriptContent: undefined,
      scriptRemark: undefined,
      grid: null,
      historyColumns: [
        { header: this.$t('service.AMIImage.date'), binding: 'date' }, // 일시
        { header: this.$t('service.AMIImage.remark'), binding: 'note' }, // 비고
        { header: this.$t('service.AMIImage.account'), binding: 'name' } // 작성 계정
      ],
      historyData: [],
      maskingId ({ userName, userId, date }, useDate = true) {
        const id = this.$options.filters.maskingName(userId)
        return `${userName}(${id}) ${useDate ? date : ''}`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.script-detail-wrapper {
  .title-area {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: $gap-s;
    position: relative;

    .title { margin: 0; }
    .reg-date {
      position: absolute;
      top: 19px;
      right: 160px;
      color: $input-placeholder;
      font-size: 13px;
    }
    .button { width: 140px; }
  }

  .title {
    font-weight: bold;
    font-size: 14px;
    height: 14px;
    margin-bottom: $gap-s;
  }

  .textarea {
    border-radius: 5px;
    box-sizing: border-box;
    padding: 20px 25px;
    overflow-y: auto;
    font-size: 13px;
    color: $text-black;
    background-color: $white;
    display: block;
    width: 100%;
    line-height: 1.5;
    resize: none;
    transition: 0.3s background-color ease;

    &:focus { outline: none;}
    &.-empty {
      background-color: $dark-navy;
      color: $text-lighter-gray;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .script-contents {
    height: 300px;
    margin-bottom: $gap-m;
  }
  .reference-contents {
    height: 150px;
    margin-bottom: $gap-s;
  }

  .apply-button {
    width: 100%;
    height: 50px;
    margin-bottom: 60px;
  }
}
</style>

<style lang="scss">
.wj-cells .wj-cell.-applied {
  background-color: rgba(57, 57, 75, 0.7);
  color: #9D9D9D;
}
</style>
