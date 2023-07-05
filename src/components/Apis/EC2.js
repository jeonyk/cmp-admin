import axios from 'axios'

const EC2_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/ec2'

const EBS_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/ebs'
const VPC_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/vpc'
const SUBNET_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/subnet'
const SECURITY_GROUP_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/security-group/ec2'

const TEST_URL = 'http://192.168.11.74:8080/api/cmp/v1/aws/mock'

export default {
  getEC2List: async (payload) => {
    try {
      const response = await axios.get(
        EC2_URL, {
          params: payload
        }
      )
      return response.data
    } catch (error) {
      console.error('Get EC2 Info Error : ', error)
      throw error
    }
  },
  getEC2Detail: async (instanceId) => {
    try {
      const response = await axios.get(
        EC2_URL + `/${instanceId}`
      )
      return response.data
    } catch (error) {
      console.error('Get EC2 Info Error : ', error)
      throw error
    }
  },
  getEC2TestList: async () => {
    try {
      const response = await axios.get(
        TEST_URL
      )
      return response.data
    } catch (error) {
      console.error('Get EBS Info Error : ', error)
      throw error
    }
  },

  // ~~~~~~~~~~~~~~~~~~~ 임시 ~~~~~~~~~~~~~~~~~~
  getVPCDetail: async (vpcId) => {
    try {
      const response = await axios.get(
        VPC_URL + `/${vpcId}`
      )
      return response.data
    } catch (error) {
      console.error('Get VPC Info Error : ', error)
      throw error
    }
  },
  getSubnetDetail: async (subnetId) => {
    try {
      const response = await axios.get(
        SUBNET_URL + `/${subnetId}`
      )
      return response.data
    } catch (error) {
      console.error('Get Subnet Info Error : ', error)
      throw error
    }
  },
  // 인스턴스의 보안 그룹 조회
  getInstanceSgDetail: async (instanceId) => {
    try {
      const response = await axios.get(
        SECURITY_GROUP_URL + `/${instanceId}`
      )
      return response.data
    } catch (error) {
      console.error('Get SecurityGroup Info Error : ', error)
      throw error
    }
  },
  // EBS 조회
  getEBSList: async (payload) => {
    try {
      const response = await axios.get(
        EBS_URL, {
          params: payload
        }
      )
      return response.data
    } catch (error) {
      console.error('Get EBS Info Error : ', error)
      throw error
    }
  }

}
