
export default {
  methods: {
  },
  data () {
    return {
      vpcColumns: [
        { binding: 'vpcId', header: 'VPC ID' },
        { binding: 'vpcTag', header: 'VPC 별칭' },
        { binding: 'regionDisplayName', header: 'Region 정보' },
        { binding: 'associateSubnetCount', header: '하위 서브넷 개수' },
        { binding: 'cidrBlock', header: 'VPC 대역' },
        { binding: 'environment', header: 'VPC 망 분류' },
        { binding: 'networkAclId', header: '네트워크 ACL' },
        { binding: 'state', header: 'VPC 연결상태' },
        { binding: 'createTime', header: '생성일' },
        { binding: 'projectLocation', header: '프로젝트 위치 ' }
      ]
    }
  }
}
