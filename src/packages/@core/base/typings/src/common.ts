interface Data<T> {
  list: T[];
  total: number;
}

interface BaseResult {
  code: number;
  message: string;
  rid: string;
}

interface Result<T> extends BaseResult {
  data: Data<T>;
}

export type { BaseResult, Data, Result };
