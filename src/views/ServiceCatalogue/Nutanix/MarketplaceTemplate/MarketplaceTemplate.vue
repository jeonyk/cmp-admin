<!--
  * 파일명 : MarketplaceTemplate.vue
  * 파일 기능 : 서비스 카탈로그 > 마켓플레이스 Wrapper
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-09-18
  * License By Shinsegae I&C
  * 2020-09-18 add: 마켓플레이스 수정 및 조직도 추가
 -->

<template>
  <div class="marketplace-page">
    <router-view />
    <!-- <marketplace-contents
      :filtered-data="osTypeData"
    /> -->
  </div>
</template>
<script>
// import MarketPlaceContents from './MarketplaceList/MarketPlaceContents'

export default {
  name: 'MarketplaceTemplate',
  components: {
    // 'marketplace-contents': MarketPlaceContents
  },
  methods: {

  },
  data () {
    return {
      osTypeData: [
        { id: 'jeus', name: 'JEUS7-RHEL7', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'JEUS는 웹 환경에서 애플리케이션을 개발하고 운영할 수 있는 플랫폼인 웹 애플리케이션 서버입니다.웹 애플리케이션 서버는 프로그램 실행 환경과 데이터베이스 접속 기능을 제공합니다.또한 여러 개의 트랜잭션을 효율적으로 관리하며, 업무를 처리하는 비즈니스 로직을 수행합니다. JEUS는 세계 상용 최초로 국제 표준인 J2EE 1.4, Java EE 5, Java EE 6와 Java EE 7을 인증 받으며 세계적으로 기술력을 인정 받은 제품입니다. 국제적으로 기술에 대한 리더쉽과 국내적으로 시장 1위 제품이라는 성과를 보여주고 있습니다. 어플리케이션의 트랜잭션 관리, 세션 유지, 부하 분산 등 다양한 기능을 제공합니다. 또한 계층화 된 구조로 유연성과 기능 확장성이 우수해 비즈니스 로직을 쉽고 효과적으로 구현할 수 있습니다.', images: require('@/assets/images/jeus_logo.png') },
        { id: 'test1', name: 'WEBTOB5-RHEL7', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/marketplace_ico_01.svg') },
        { id: 'test2', name: 'WordPress Certified by Bitnami and Automattic', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/marketplace_ico_02.svg') },
        { id: 'test3', name: 'GitLab Community Edition', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/marketplace_ico_03.svg') },
        { id: 'test4', name: 'Redmine Certified by Bitnami', versionDt: 'Ver 2020.03.18', date: '13:54:04', subTitle: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)', desc: 'WebtoB는 웹의 HTTP를 사용하여 웹 페이지가 들어 있는 파일을 사용자들에게 제공하는 웹 서버 입니다.WebtoB는 기존 웹서버가 가지고 있는 구조적인 문제를 혁신적으로 개선하여 성능 및 안정성에서 탁월한 기능을 제공하는 차세대 웹서버 제품입니다. 웹 상에서의 대규모 트랜잭션 처리에 적합하도록 설계되어 처리 속도 지연, 서버 다운 등 웹 시스템상의 문제들을 효과적으로 해결합니다. 웹서버로서의 기본 기능 외에 보안, 장애 대응, 대용량 처리 시 강력한 성능을 제공합니다.', images: require('@/assets/images/marketplace_ico_01.svg') }
      ]
    }
  }
}
</script>
