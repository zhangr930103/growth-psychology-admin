import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户ID
   */
  id: number;
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;
  /**
   * accessToken (实际接口中返回空字符串，token通过登录接口获取)
   */
  token: string;
}

export type { UserInfo };
