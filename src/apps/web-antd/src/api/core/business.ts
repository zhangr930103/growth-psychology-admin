import type { BaseResult, Result } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取菜单列表
 */
export interface MenuList {
  /**
   * id
   */
  id?: number;
  /**
   * 上级id
   */
  pid?: number;
  /**
   * 菜单名称
   */
  name?: string;
  /**
   * 路由地址
   */
  path?: string;
  /**
   * 标识
   */
  mark?: string;
  /**
   * 菜单图标
   */
  icon?: string;
  sort?: number;
  show?: number;
  type?: number;

  /**
   * 行业名称
   */
  component?: string;

  /**
   * 超管账号
   */
  children?: [];
}

export async function getMenuTreeApi() {
  return requestClient.post<Result<MenuList>>('/menu/tree');
}
export async function getMenulistApi() {
  return requestClient.post<Result<MenuList>>('/menu/list');
}

/**
 * 新增菜单
 */
export async function addMenu(data: any) {
  return requestClient.post<Result<BaseResult>>('/menu/create', data);
}

/**
 * 编辑菜单
 */
export async function editMenu(data: any) {
  return requestClient.post<Result<BaseResult>>('/menu/edit', data);
}

/**
 * 删除菜单
 */
export async function deleteMenuApi(id: number) {
  return requestClient.post('/menu/delete', { id });
}

/**
 * 获取行业列表
 */
export interface Datum {
  created_at: number;
  deleted_at: null;
  id?: number;
  /**
   * 行业名称
   */
  name?: string;
  updated_at: number;
}

export async function getIndustryApi() {
  return requestClient.post<Result<Datum>>('/industry/list');
}

