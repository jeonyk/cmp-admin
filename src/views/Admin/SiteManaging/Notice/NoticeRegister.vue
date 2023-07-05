<!--
  * 파일명 : NoticeRegister.vue
  * 파일 기능 : 공지사항 등록 에디터
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
        required
        for-editor
      >
        <el-select
          class="-selection"
          v-model="noticeData.noticeType"
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
      </register-contents>
      <!-- /. 카테고리 -->

      <register-contents
        :title="$t('admin.NOTI.title')"
        required
        for-editor
      >
        <el-input
          v-model="noticeData.noticeTitle"
          maxlength="50"
          show-word-limit
        />
      </register-contents>

      <register-contents
        :title="$t('admin.NOTI.content')"
        required
        for-editor
      >
        <cmp-editor @edited-contents="contents" />
      </register-contents>

      <div class="divided">
        <register-contents
          :title="$t('admin.NOTI.postState')"
          required
          for-editor
        >
          <div class="flex-wrap">
            <!-- v-model="noticeData.noticeStatus" -->
            <el-select
              v-model="noticeData.noticePosting"
              class="-selection"
              popper-class="notice-dropdown-popper"
              :placeholder="$t('admin.NOTI.postState')"
              :popper-append-to-body="false"
              @change="setPrintExposingTime"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="$t(item.keyPath) || item.label"
                :value="item.value"
              />
            </el-select>
            <sub
              v-if="!noticeData.noticePosting"
              v-html="$t('admin.NOTI.postNotice')"
              style="display: block; line-height: 1.5; margin-left: 20px; height: 30px;"
            >
              <!-- 게시 예정 시간을 설정할 경우, <br> 해당 시간에 등록한 공지사항이 사용자 페이지에 노출됩니다. -->
            </sub>
          </div>
        </register-contents>
        <!-- /.게시 상태 -->

        <register-contents
          :title="$t('admin.NOTI.postDate')"
          for-editor
        >
          <div class="expose-date">
            <el-checkbox
              style="margin-right: 20px;"
              v-model="usePostedTime"
              :disabled="noticeData.noticePosting"
            />
            <el-date-picker
              class="-selection"
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
            {{ $t('common.TERMS.h') }}

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
            {{ $t('common.TERMS.m') }}
          </div>
        </register-contents>
        <!-- /.게시 예정 시간 -->
      </div>

      <register-contents :title="$t('common.GRID.memo')">
        <el-input
          type="textarea"
          v-model="noticeData.noticeMemo"
        />
      </register-contents>
      <!-- /.메모 -->
    </div>

    <div class="button-area -center -form-bottom">
      <button
        class="button"
        @click="$router.push({ name: 'notice-list' })"
        type="is-anti"
        size="is-large"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        @click="confirmRegisterData"
        type="is-primary"
        size="is-large"
      >
        {{ $t('common.BTN.finEnroll') }}
      </button>
    </div>
  </div>
</template>

<script>
import API, { CMPEditor } from '@sd-fe/cmp-core'

export default {
  name: 'NoticeRegister',
  components: {
    'cmp-editor': CMPEditor
  },
  created () {
    this.setHourOptions()
    this.getCodeList()
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    contents (json) {
      this.noticeData.noticeContent = JSON.stringify(json)
    },
    async getCodeList () {
      try {
        const response = await API.config.getCodeList({ codeType: 'NOTICE' })

        if (response) {
          const filters = response.map(resp => { return { value: resp.codeVal, label: resp.codeName } })
          this.categoryOptions = [...filters]
        }
      } catch (error) {
        console.error('@@ getCodeList :: ', 'error')
      }
    },
    /**
     * @function - 처음 렌더링 시 시/분 options를 지정해줍니다.
     */
    setHourOptions () {
      for (let i = 0; i < 24; i++) this.hourOptions.push(i)
      for (let i = 0; i < 60; i++) if (!(i % 10)) this.minuteOptions.push(i)
    },
    setPrintExposingTime (status) {
      if (status) {
        const date = new Date()
        this.postTimeTemp = { date, hour: date.getHours(), minute: date.getMinutes() }
        this.usePostedTime = false
      } else {
        this.postTimeTemp = { date: undefined, hour: undefined, minute: undefined }
        this.noticeData.noticePostedTime = undefined
      }
      this.$forceUpdate()
    },
    validateRequiredData (data = this.noticeData) {
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

        this.$alert(alertMsg, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return false
      }

      // 게시시간 validate
      const validatePrintDate = this.validatePrintDate()

      return validatePrintDate && true
    },
    validatePrintDate () {
      if (this.noticeData.noticePosting) { // [게시]로 선택되었을 경우
        this.noticeData.noticePostedTime = new Date().getTime()
        return true
      } else {
        if (!this.usePostedTime) return true

        // 게시 예정 시간을 설정한 경우
        const temp = this.postTimeTemp
        if (temp.date && temp.hour !== undefined && temp.minute !== undefined) {
          const timestamp = +new Date(`${temp.date} ${temp.hour}:${temp.minute}:00`)

          if (timestamp < +new Date()) {
            this.$alert(this.$t('common.ALERT.NOTICE.001'), '알림', { confirmButtonText: this.$t('common.BTN.confirm'), callback: () => false })
            return false
          } else {
            this.noticeData.noticePostedTime = timestamp
            return true
          }
        } else {
          this.$alert(this.$t('common.ALERT.NOTICE.002'), '알림', { confirmButtonText: this.$t('common.BTN.confirm'), callback: () => false })
          return false
        }
      }
    },
    async confirmRegisterData (index, list) {
      const validator = this.validateRequiredData(this.noticeData)

      if (validator) {
        // console.log(this.noticeData)
        this.$confirm(this.$t('common.CONFIRM.BASE.022'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => this.postNotice(this.noticeData))
          .catch(false)
      }
    },
    async postNotice (payload) {
      const response = await API.config.postNotice(payload)
      if (response) {
        this.$alert(this.$t('common.ALERT.BASE.050'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.routeTo({ name: 'notice-list' })
        })
      } else {
        this.$alert(this.$t('common.ALERT.NOTICE.003'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
          // callback: () => this.routeTo({ name: 'notice-list' })
        })
      }
    }
  },
  data () {
    return {
      categoryOptions: [
        // { label: '신규', value: 'notice_new' },
        // { label: '점검', value: 'notice_inspection' },
        // { label: '안내', value: 'notice_guide' },
        // { label: '장애', value: 'notice_issue' }
      ],
      usePostedTime: false,
      statusOptions: [
        { label: '게시', value: true, keyPath: 'admin.NOTI.post' },
        { label: '비게시', value: false, keyPath: 'admin.NOTI.unPost' }
      ],
      contentTemp: undefined,
      hourOptions: [],
      minuteOptions: [],
      postTimeTemp: { // 게시 예정 시간 가공
        date: undefined,
        hour: undefined,
        minute: undefined
      },
      printExposeOpt: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() < new Date(today)
        }
      },

      noticeData: {
        createUser: 'Admin',
        noticeType: '', // 카테고리
        noticeTitle: '', // 제목
        noticeContent: '', // 내용
        noticePosting: false, // 게시 상태
        noticePostedTime: undefined, // 게시 예정 시간
        noticeStatus: 'SAMPLE',
        noticeMemo: '' // 메모
      }
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
    margin-left: $gap-m;
    margin-right: $gap-s;
  }

  &::v-deep {
    .notice-dropdown-popper {
      left: 0 !important;
    }
  }
}

.divided {
  display: flex;
  > * {
    flex: 0 0 50%;
  }
}
</style>
