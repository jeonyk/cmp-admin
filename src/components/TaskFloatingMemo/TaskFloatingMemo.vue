<template>
  <div class="task-floating-memo">
    <a
      class="task-floating-memo-button"
      @click="active = true"
    >
      <span
        v-if="memoLength"
        class="count-icon"
      >{{ memoLength }}</span>
      <i class="-memo-icon" />
    </a>
    <!-- /. [아이콘] -->

    <el-dialog
      :title="$v('메모')"
      :visible="active"
      width="880px"
      @close="active = false"
    >
      <div
        class="task-memo"
        v-loading="uploading"
      >
        <div
          ref="memoScroll"
          class="scroll-area"
        >
          <p
            v-if="!memoData || !memoData.length"
            class="memo-list -empty"
          >
            {{ $v('등록된 메모가 없습니다.') }}
          </p>

          <ul
            v-else
            class="memo-list"
          >
            <li
              v-for="(comment, index) in memoData"
              :key="comment.orderNo + index"
              :class="['memo-item', { '-is-me' : comment.isMe }]"
            >
              <div
                class="comment-icon"
                v-if="!comment.isMe"
              >
                <i
                  :class="{ 'is-user-photo': comment.userPhoto }"
                  :style="comment.userPhoto ? { backgroundImage: `url(${comment.userPhoto})` } : {}"
                />
              </div>
              <!-- /. 아이콘 -->

              <div class="comment-content">
                <p class="indiv-info">
                  <strong class="indiv-info-id"> {{ comment.userName }} </strong>
                  <span class="indiv-info-date"> {{ comment.createdTime | date }} </span>
                </p>
                <!-- /. 개인정보 -->
                <p
                  class="-contents"
                  v-html="comment.memo"
                />
                <!-- /. 댓글 내용 -->
              </div>
              <!-- /. 댓글 -->
            </li>
          </ul>
        </div>

        <article class="input-area">
          <h3>{{ $v('메모 쓰기') }}</h3>
          <div class="input-area-text">
            <el-input
              ref="memo"
              type="textarea"
              :rows="4"
              v-model="text"
              :placeholder="$v('내용을 입력해주세요.')"
              @keyup.native.enter="sendMemo(text)"
            />
            <button
              class="button"
              type="is-primary"
              size="is-large"
              @click="sendMemo(text)"
            >
              {{ $v('작성') }}
            </button>
          </div>
        </article>

        <div class="modal-button-area -center">
          <button
            class="button"
            type="is-anti"
            @click="active = false"
          >
            {{ $v('확인') }}
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  name: 'TaskFloatingMemo',
  props: {
    data: {
      type: [Object, Array],
      default: () => []
    },
    orderNo: {
      type: String,
      default: undefined
    }
  },
  watch: {
    active (active) {
      if (active) this.initialize()
    },
    memoUsers (users) {
      if (users && users.length) {
        this.getUserAvatar(users)
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    memoUsers () {
      const result = []
      if (this.memoData?.length === undefined) return

      this.memoData.forEach(memo => {
        if (memo.children && memo.children.length) {
          result.push(...memo.children.map(child => child.userId))
        }
        result.push(memo.userId)
      })
      return [...new Set(result)]
    },
    memoLength () {
      return this.memoData && this.memoData.length
    }
  },
  mounted () { // 페이지 진입 시 메모 count 표시 필
    this.initialize()
  },
  methods: {
    /**
     * 모달 오픈 후 초기 기능 정의
     */
    initialize () {
      this.text = undefined
      this.getMemoList(this.orderNo)

      this.$nextTick(() => {
        // 자동 focus 이벤트 실행
        if (!this.$refs.memo) return
        this.$refs.memo.$el.querySelector('textarea').focus()

        // 스크롤 하단으로 이동
        const scroll = this.$refs.memoScroll
        if (!scroll) return

        setTimeout(() => {
          if (!this.memoData.length) return

          const lists = scroll.querySelectorAll('li')
          const bottom = lists[lists.length - 1]
          scroll.scrollTo(0, bottom?.offsetTop)
        }, 100)
      })
    },

    /**
     * 메모 목록 호출
     * @param {String} orderNo
     */
    async getMemoList (orderNo = this.orderNo) {
      try {
        const response = await API.work_v3.getMemoList(orderNo)

        await this.getUserAvatar(response) // 이미지
        this.memoData = await this.setMemoData(response)
      } catch (error) {
        console.error('@@ TaskFloatingMemo > getMemoList', error)
      }
    },

    async getUserAvatar (users) {
      try {
        const getUserId = users.map(({ userId }) => userId)
        const userIds = [...new Set(getUserId)]

        for (let i = 0; i < userIds.length; i++) {
          const userId = userIds[i]
          const [data] = await API.iam.getUserInfo({ isAdmin: true, userId })

          const userPhoto = data.userPhoto
          this.$set(this.userPhotoInfos, userId, userPhoto)
        }
      } catch (error) {
        console.error('@@ TaskFloatingMemo > getUserAvatar', error)
      }
    },
    setMemoData (users) {
      return users.map(user => {
        user.userPhoto = this.userPhotoInfos[user.userId]
        user.isMe = this.user.userId === user.userId
        return user
      })
    },
    /**
     * 메모 등록
     * @param {String} memo 메모 텍스트
     * @param {Number} parentMemoIdx 부모 인덱스 (이제 답글 기능이 없어서 사용안할듯)
     */
    async sendMemo (memo = this.text, parentMemoIdx = undefined) {
      if (this.uploading || !memo) return

      const user = this.user
      const orderNo = this.orderNo
      const memoData = {
        memo,
        memoType: 'ADMIN', // 🟨
        userId: user.userId,
        userName: user.userName,
        orderNo
      }

      try {
        this.uploading = true

        // const insert = await API.work.insertMemo(memoData)
        await API.work_v3.createMemo(memoData)
        this.initialize()
      } catch (error) {
        console.error('@@@ sendMemo Error', error)
      } finally {
        setTimeout(() => (this.uploading = false), 50)
      }
    }

  },
  data: () => ({
    active: false, // 모달 on/off
    text: undefined, // 텍스트 value
    uploading: false, // 중복 등록 안되도록 차단하는 데이터
    userPhotoInfos: {},
    memoData: []
  })
}
</script>

<style lang="scss" scoped>
.task-floating-memo{

  &-button {
    z-index: 999;
    position: fixed;
    right: $gap-m;
    bottom: $gap-m;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $primary;

    .-memo-icon {
      width: 40px;
      height: 40px;
      background: url('../../assets/images/floating-memo-icon.svg') no-repeat center center;
      background-size: cover;
    }
  }

.task-memo {
  position: relative;
  height: 800px;

  .scroll-area {
    height: calc(100% - 330px);
    overflow-y: auto;
    margin-bottom: 25px;
  }

  .input-area {
    padding: $gap;
    background-color: #070A20;

    > h3 {
      margin-bottom: $gap-s;
    }

    &-text {
      display: flex;
      align-items: flex-end;
      flex-direction: column;
      margin-bottom: $gap-s;

      button { margin-top: $gap-s; }
    }
  }
}

.memo {
  &-list {
    &.-empty {
      color: $input-placeholder;
      text-align: center;
      line-height: 42px;
    }
  }

  &-item {
    min-height: 50px;
    display: flex;
    align-items: flex-start;
    padding: $gap-m 0;
    border-bottom: 1px solid $dark-slate;

    .comment-icon {
     text-align: center;

      i {
        display: inline-block;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background-color: $dark-slate;
        background-position: center;
        background-size: 25px 25px;
        background-repeat: no-repeat;
        background-image: url('../../assets/images/floating-memo-profile-icon.svg');

        &.is-user-photo { border-radius: 9999px; }
      }
    }

    .comment-content {
      margin: 0 $gap-s;
      flex: 1 1 auto;
      font-size: 12px;

      .indiv-info {
        display: flex;
        align-items: center;
        &-id {
          color: $title-color;
          display: inline-block;
          min-width: 40px;
          margin-right: $gap-s;
        }
        &-date {
          color: #b4b4b4;
          display: inline-block;
        }
      }

      > .-contents {
        display: inline-block;
        padding: 15px $gap;
        word-break: break-all;
        margin-top: 15px;
        line-height: 1.3;
        background-color: $panel-item-bg;
        border-radius: 0 $radius-m $radius-m $radius-m;

        // 자동변경된 내역
        .auto-change-memo {
          margin: $gap 0 5px 0;
          color: $primary;
          font-size: 15px;
          line-height: 15px;
          height: 15px;
        }
        .auto-change-lists {
          line-height: 1.8;
          margin-top: 3px;
          display: flex;
          align-items: flex-start;
          &:first-child { margin-top: $gap; }

          .-item-title {
            color: $light-gray;
            background: $black;
            line-height: $gap;
            height: $gap;
            padding: 0 5px;
            text-align: center;
            white-space: pre-wrap;
            border-radius: 2px;
            display: inline-block;
            white-space: nowrap;
          }
          .-detail-cont {
            display: inline-block;
            margin-left: $gap-s;
            height: 100%;
          }
        }
      }
    }

    &.-is-me {
      .comment-content {
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        flex-direction: column;

        .indiv-info {
          justify-content: flex-end;
          .indiv-info-id { display: none; }
        }

        > .-contents {
          background-color: $primary;
          border-radius: $radius-m 0 $radius-m $radius-m;
        }
      }
    }

  }
}

  .comment-reply {
    padding-left: 50px;
    position: relative;

    &.-mini {
      padding-left: 40px;
      &:before {
        width: 13px; height: 13px;
        top: 13px; left: 13px;
      }

    }
  }
  .comment-area {
    position: absolute;
    bottom: -40px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding: 0 $gap;
    height: 50px;
    background-color: $white;
    > .icon-bubble {
      display: inline-block;
      margin-right: $gap-s;
      width: 24px;
      height: 22px;
      background-position: center center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url('../../assets/images/icon-bubble@3x.png');
    }
    .new-comment-input {
      border: none;
       .el-input__inner {
        line-height: 28px;
        border: 0 ;
        padding: 0;
        padding-right: $gap-s;
      }
    }
  }

  .comment-wrap {
    display: flex;
    align-items: center;
    .mdi-send {
      margin-left: $gap-s;
      background: $primary;
      width: 15px; height: 15px;
      display: block;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius;
      color: $white;
      cursor: pointer;
      transition: .2s ease;
      &:hover {
        background: darken($primary, 5%);
      }
      &::before {
        font-size: 15px;
      }
    }
  }
}

.count-icon {
  display:inline-block;
  position:absolute;
  top:-5px;
  right:-5px;
  min-width: 20px;
  width:auto;
  height:20px;
  text-align: center;
  background: #FA5657;
  color:#fff;
  border-radius: 50%;
  padding: 5px;
}

</style>
