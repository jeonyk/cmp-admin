/**
 * deprecated
 */

/**
  * 파일명 : User.store.js
  * 파일 기능 :
  * 작성자 : 이성수
  * 최종 작성일 : 2020-10-31
  * License By Shinsegae I&C
  * 2020-10-31 change : alert => this.$alert
 **/

// import VueCookies from 'vue-cookies'
// import i18n from '@/i18n'

// export default {
//   state: {
//     token: '',
//     authed: null
//   },
//   getters: {
//     token: state => {
//       return state.token
//     },
//     authed: state => {
//       return state.authed
//     }
//   },
//   actions: {
//     login ({ commit, state, dispatch }, loginParam) {
//       console.log('test')
//       if (
//         loginParam.userId === 'admin' &&
//         loginParam.userPassword === 'growth2014!'
//       ) {
//         const token =
//           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHcm93dGhTb2Z0IiwiYXVkIjoiYWRtaW4iLCJpYXQiOjE1OTU0ODAyMjZ9.RcMeRQl-ZDrd3uGvKQQbuAEql1-OfrEkgjL6VIG0FD0'
//         commit('setAuthed', true)
//         VueCookies.set('Authorization', token)
//         commit('setToken', token)
//       } else {
//         VueCookies.remove('Authorization')
//         this.$alert(i18n.t('common.ALERT.LOGIN.002'))
//       }
//     }
//   },
//   mutations: {
//     setToken (state, payload) {
//       state.token = payload
//     },
//     setAuthed (state, payload) {
//       state.authed = payload
//     }
//   }
// }
