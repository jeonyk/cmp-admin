export default {
  data: () => ({
    /**
     * 한글 / 영문 변경 (월)
     */
    convertMonth (month) {
      const monthString = {
        1: { ko: '1월', en: 'Jan' },
        2: { ko: '2월', en: 'Feb' },
        3: { ko: '3월', en: 'Mar' },
        4: { ko: '4월', en: 'Apr' },
        5: { ko: '5월', en: 'May' },
        6: { ko: '6월', en: 'Jun' },
        7: { ko: '7월', en: 'Jul' },
        8: { ko: '8월', en: 'Aug' },
        9: { ko: '9월', en: 'Sept' },
        10: { ko: '10월', en: 'Oct' },
        11: { ko: '11월', en: 'Nov' },
        12: { ko: '12월', en: 'Dec' }
      }[month]

      return monthString[this.$i18n.locale]
    }
  })
}
