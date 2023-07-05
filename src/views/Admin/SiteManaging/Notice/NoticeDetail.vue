<!--
  * 파일명 : NoticeDetail.vue
  * 파일 기능 : 공지사항 상세 조회 및 공지사항 관리(수정, 삭제) 기능
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 Update: 어드민관리 차단 페이지 추가
 -->

<template>
  <div class="notice-detail">
    <div class="detail-contents">
      <register-contents
        :title="$t('admin.NOTI.category')"
        :required="isModifying"
      >
        <el-select
          v-if="isModifying"
          class="-selection"
          v-model="modifyData.noticeType"
          :placeholder="$t('admin.NOTI.category')"
          :popper-append-to-body="false"
        >
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <span v-else>{{ typeCheck[modifyData.noticeType] || $t('admin.NOTI.unClassified') }}</span>
      </register-contents>
      <!-- /. 카테고리 -->

      <register-contents
        :title="$t('admin.NOTI.title')"
        :required="isModifying"
      >
        <el-input
          v-if="isModifying"
          maxlength="50"
          show-word-limit
          v-model="modifyData.noticeTitle"
          :placeholder="$t('config.IP.enter', { name: $t('admin.NOTI.title') })"
        />

        <span v-else>{{ modifyData.noticeTitle }}</span>
      </register-contents>
      <!-- /. 제목 -->

      <register-contents
        :title="$t('admin.NOTI.content')"
        :required="isModifying"
      >
        <cmp-editor
          ref="editor"
          :edit="isModifying"
          :set-content="modifyData.noticeContent"
        />
        <!-- @edited-contents="editContents" -->
      </register-contents>
      <!-- /. 내용 -->

      <div class="divided">
        <register-contents
          :title="$t('admin.NOTI.postState')"
          :required="isModifying"
        >
          <div
            class="flex-wrap"
            v-if="isModifying"
          >
            <el-select
              class="-selection"
              v-model="modifyData.noticePosting"
              popper-class="notice-dropdown-popper"
              :placeholder="$t('admin.NOTI.postState')"
              :popper-append-to-body="false"
              @change="setPrintExposingTime"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <sub
              v-if="!modifyData.noticePosting"
              v-html="$t('admin.NOTI.postNotice')"
              style="display: block; line-height: 1.5; margin-left: 20px; height: 30px;"
            />
            <!-- 게시 예정 시간을 설정할 경우, <br> 해당 시간에 등록한 공지사항이 사용자 페이지에 노출됩니다. -->
          </div>

          <span v-else>{{ modifyData.noticePosting ? $t('admin.NOTI.post') : $t('admin.NOTI.unPost') }}</span>
        </register-contents>
        <!-- /. 게시 상태 -->

        <register-contents :title="$t('admin.NOTI.postDate')">
          <!-- :required="isModifying" -->
          <template v-if="isModifying">
            <div class="expose-date">
              <el-checkbox
                style="margin-right: 20px;"
                v-model="usePostedTime"
                :disabled="modifyData.noticePosting"
              />
              <el-date-picker
                v-model="postTimeTemp.date"
                type="date"
                :placeholder="$t('admin.NOTI.date')"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                :picker-options="printExposeOpt"
                :disabled="!usePostedTime"
              />

              <el-select
                class="time-selector"
                v-model="postTimeTemp.hour"
                :placeholder="$t('common.TERMS.hour')"
                :popper-append-to-body="false"
                :disabled="!usePostedTime"
              >
                <el-option
                  v-for="item in hourOptions"
                  :key="`${item}_hour`"
                  :label="item"
                  :value="item"
                >
                  {{ item }}
                </el-option>
              </el-select>
              {{ $t('common.TERMS.hour') }}

              <el-select
                class="time-selector"
                v-model="postTimeTemp.minute"
                :placeholder="$t('common.TERMS.minute')"
                :popper-append-to-body="false"
                :disabled="!usePostedTime"
              >
                <el-option
                  v-for="item in minuteOptions"
                  :key="`${item}_minute`"
                  :label="item"
                  :value="item"
                />
              </el-select>
              {{ $t('common.TERMS.minute') }}
            </div>
          </template>

          <template v-else>
            <span v-if="rawInfo.noticePostedTime === 946652400000 || !rawInfo.noticePostedTime">-</span>
            <span v-else>{{ rawInfo.noticePostedTime | date }}</span>
          </template>
        </register-contents>
        <!-- /.게시 예정 시간 -->
      </div>

      <register-contents :title="$t('common.GRID.memo')">
        <el-input
          v-if="isModifying"
          type="textarea"
          v-model="modifyData.noticeMemo"
        />
        <el-input
          v-else
          type="textarea"
          readonly
          v-model="modifyData.noticeMemo"
        />
        <!-- <div v-else>
          {{ modifyData.noticeMemo }}
        </div> -->
      </register-contents>
      <!-- /.메모 -->
    </div>
    <!-- /. 공지사항 영역 -->
    <!-- ///////////// -->

    <div
      v-if="!isModifying"
      class="button-area -center -form-bottom"
    >
      <button
        class="button"
        @click="deleteDetail"
        type="is-anti"
        size="is-large"
      >
        {{ $t('common.BTN.delete') }}
      </button>
      <button
        class="button"
        @click="routeTo({ name: 'notice-list' })"
        size="is-large"
      >
        {{ $t('common.BTN.list') }}
      </button>
      <button
        class="button"
        @click="isModifying = true"
        type="is-primary"
        size="is-large"
      >
        {{ $t('common.BTN.modify') }}
      </button>
      <!-- <button
        class="button"
        @click="routeTo({ name: 'notice-modify', params: params })"
        type="is-primary"
      >
        완료
      </button> -->
    </div>

    <div
      v-else
      class="big-button-area"
    >
      <button
        class="button"
        @click="cancelModifyData"
        type="is-anti"
        size="is-large"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        @click="confirmModifyData"
        type="is-primary"
        size="is-large"
      >
        {{ $v('수정 완료') }}
      </button>
    </div>
  </div>
</template>
<script>
import API, { CMPEditor } from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'
import Dayjs from 'dayjs'

export default {
  name: 'NoticeDetail',
  components: {
    'cmp-editor': CMPEditor
  },
  async created () {
    await this.getNoticeInfo()
    this.setHourOptions()
    this.uneditContents = this.modifyData.noticeContent
  },
  computed: {
    ...mapGetters(['user'])
  },
  watch: {
    postTimeTemp: {
      deep: true,
      handler (time) {
        const timestamp = new Date(`${time.date} ${time.hour}:${time.minute}:00`).getTime()
        if (timestamp) this.modifyData.noticePostedTime = timestamp
      }
    }
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    setHourOptions () {
      for (let i = 0; i < 24; i++) this.hourOptions.push(i)
      for (let i = 0; i < 60; i++) if (!(i % 10)) this.minuteOptions.push(i)
    },
    setPrintExposingTime (status) {
      if (status) {
        this.usePostedTime = false
      } else {
        this.postTimeTemp = { date: undefined, hour: undefined, minute: undefined }
        this.modifyData.noticePostedTime = undefined
      }
      this.$forceUpdate()
    },
    validateRequiredData (data = this.modifyData) {
      const keys = Object.keys(data)
      const rawTextContent = document.querySelector('.ProseMirror').textContent.trim()
      const isEmpty = keys.filter(key => {
        if (
          key !== 'noticeMemo' && key !== 'noticePostedTime' &&
          (
            data[key] === undefined ||
            (typeof data[key] === 'string' && !data[key].trim()) ||
            (key === 'noticeContent' && !rawTextContent)
          )
        ) return true
      })
      for (const key of isEmpty) {
        const alertMsg = {
          noticeType: this.$t('common.ALERT.IND.005'), // 카테고리를 입력해주세요.
          noticeTitle: this.$t('common.ALERT.BASE.054'), // 제목을 입력해주세요.
          noticeContent: this.$t('common.ALERT.BASE.027'), // 내용을 입력해주세요.
          noticePosting: this.$t('common.ALERT.NOTICE.007') // 게시 상태를 입력해주세요.
        }[key]

        this.$alert(alertMsg, '알림', { confirmButtonText: this.$t('common.BTN.confirm'), callback: () => false })
        return false
      }

      // 게시시간 validate
      const validatePrintDate = this.validatePrintDate()

      return validatePrintDate && true
    },
    validatePrintDate () {
      if (this.modifyData.noticePosting) { // [게시]로 선택되었을 경우
        this.modifyData.noticePostedTime = new Date().getTime()
        return true
      } else {
        if (!this.usePostedTime) {
          this.modifyData.noticePostedTime = null
          return true
        }

        // 게시 예정 시간을 설정한 경우
        const temp = this.postTimeTemp
        if (temp.date && temp.hour !== undefined && temp.minute !== undefined) {
          const timestamp = +new Date(`${temp.date} ${temp.hour}:${temp.minute}:00`)

          if (timestamp < +new Date()) {
            this.$alert(this.$t('common.ALERT.NOTICE.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm'), callback: () => false })
            return false
          } else {
            this.modifyData.noticePostedTime = timestamp
            return true
          }
        } else {
          this.$alert(this.$t('common.ALERT.NOTICE.002'), '알림', { confirmButtonText: this.$t('common.BTN.confirm'), callback: () => false })
          return false
        }
      }
    },
    editContents (data) {
      this.modifyData.noticeContent = JSON.stringify(data)
    },
    // 수정 완료
    confirmModifyData (index, list) {
      const validator = this.validateRequiredData(this.modifyData)

      if (validator) {
        this.message(this.$t('common.CONFIRM.BASE.024'), () => this.modifyNotice())
      }
    },
    async modifyNotice () {
      this.modifyData.isDelete = false
      this.modifyData.noticeStatus = '상태상태'

      const contentJson = this.$refs?.editor?.json
      const noticeContent = (contentJson && JSON.stringify(contentJson)) || this.modifyData.noticeContent

      const param = {
        noticeIdx: this.modifyData.noticeIdx,
        noticeTitle: this.modifyData.noticeTitle,
        // noticeContent: this.modifyData.noticeContent,
        noticeContent,
        noticeType: this.modifyData.noticeType,
        noticeMemo: this.modifyData.noticeMemo,
        noticeStatus: this.modifyData.noticeStatus,
        noticePosting: this.modifyData.noticePosting,
        noticePostedTime: this.modifyData.noticePostedTime,
        isDelete: this.modifyData.isDelete,
        updateUser: this.user.userId
      }

      const response = await API.config.modifyNotice(param)

      if (response) {
        this.$alert(this.$t('common.ALERT.NOTICE.005'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.routeTo({ name: 'notice-list' })
        })
      } else {
        this.$alert(this.$t('common.ALERT.NOTICE.004'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
          // callback: () => this.routeTo({ name: 'notice-list' })
        })
      }
    },
    async getNoticeInfo () {
      try {
        const noticeIdx = this.$route.params.noticeIdx
        const response = await API.config.getNoticeInfo({ noticeIdx })
        const codeList = await API.config.getCodeList({ codeType: 'NOTICE' })

        codeList
          .map(code => ({ val: code.codeVal, name: code.codeName }))
          .forEach(code => (this.typeCheck[code.val] = code.name))

        this.modifyData = response[0]
        this.uneditContents = { ...response[0] }
        this.rawInfo = { ...response[0] }
        this.categoryOptions = codeList.map(code => ({ label: code.codeName, value: code.codeVal }))
        const dateParse = Dayjs(this.rawInfo.noticePostedTime)

        if (!Object.keys(this.typeCheck).includes(this.rawInfo.noticeType)) {
          this.modifyData.noticeType = ''
        }

        this.postTimeTemp = {
          // date: undefined,
          // hour: undefined,
          // minute: undefined
          date: dateParse.isValid() ? dateParse.format('YYYY-MM-DD') : undefined,
          hour: dateParse.isValid() ? dateParse.get('hour') : undefined,
          minute: dateParse.isValid() ? dateParse.get('minute') : undefined
        }
      } catch (error) {
        this.$alert(this.$t('common.ALERT.NOTICE.006'))
        return this.$router.push({ name: 'notice' })
      }
    },
    // 수정 취소
    cancelModifyData () {
      return this.message(this.$t('common.CONFIRM.BASE.011'), () => this.routeTo({ name: 'notice-list' }))
    },
    // 삭제
    deleteDetail (index, list) {
      this.message(this.$t('common.CONFIRM.BASE.032'), () => {
        this.deleteNotice(this.$route.params.noticeIdx)
      })
    },
    async deleteNotice (noticeIdx) {
      const response = await API.config.deleteNotice({ noticeIdx })
      if (response) {
        this.$alert(this.$t('common.ALERT.BASE.013'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.routeTo({ name: 'notice-list' })
        })
      }
    },
    message (message, action) {
      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(action)
        .catch(() => false)
    }
  },
  data () {
    return {
      typeCheck: {},
      postTimeTemp: {
        date: undefined,
        hour: undefined,
        minute: undefined
      },
      params: undefined,
      modifyData: {
        noticeIdx: '',
        noticeTitle: '',
        noticeContent: '',
        noticeType: '',
        noticeMemo: '',
        noticeStatus: '',
        noticePosting: '',
        noticePostedTime: '',
        isDelete: '',
        updateUser: ''
      },
      printExposeOpt: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() < new Date(today)
        }
      },
      isModifying: false,
      rawInfo: {},
      uneditContents: '',
      categoryOptions: [],
      usePostedTime: false,
      statusOptions: [
        { label: '게시', value: true },
        { label: '비게시', value: false }
      ],
      hourOptions: [],
      minuteOptions: []
    }
  }
}
</script>
<style lang="scss" scoped>
.notice-detail {
  .detail-contents {
    border-top: 1px solid $border-color;
  }
  .button-area {
    margin-top: $gap;
  }
  .-selection {
    width: 200px;
  }
  .time-selector {
    width: 100px;
    margin-left: $gap-s;
    // margin-right: $gap-s;
  }
}

.divided {
  display: flex;
  > * {
    flex: 0 0 50%;
  }
}
.notice-contents {
  min-height: 500px;
}
</style>

<style lang="scss">
.notice-detail {
  .el-textarea {
    textarea:read-only{
      border:none;
      &:focus { // readonly 상태에서 클릭시 transparent 방지;
        background-color:#1F1E32 !important;
        color:#e1e1e1;
      }
    }
  }

  .notice-dropdown-popper {
    left: 0 !important;
  }
}
</style>
