import API from '@sd-fe/cmp-core'

export default {
  methods: {
    /**
     * AccessKey 체크
     */
    async checkKey (payload) {
      // 사용 가능한 키
      // "accessKey": "AKIASACQEW6OY3FXDGNU",
      // "secretKey": "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"
      try {
        const response = await API.work.checkKey(payload)

        // AccessKey 저장
        if (response === true) await this.saveKey(payload)
        return response
      } catch (error) {
        console.error('@@ checkKey : ', error)
      } finally {
        this.publicProject.loading = false
      }
    },

    /**
     * [계정 등록] > [비밀번호 입력] > [확인] 눌렀을 때 발생 이벤트
     */
    async confirmPw (password = this.accountPw) {
      try {
        const { data: passed } = await API.aws.checkPassword({ password, isAdmin: true, userId: this.user.userId })

        if (passed) this.hiddenAccessKey = false
        else this.failMessage = this.$v('비밀번호가 틀렸습니다. 재확인 후 입력 바랍니다.')
      } catch (error) {
        console.error('@@ confirmPw : ', error)
      }
    }

  }
}
