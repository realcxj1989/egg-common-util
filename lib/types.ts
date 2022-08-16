export interface Code {
  message: string;
  description?: string;
  code?: number;
}

export interface CodeEnum {
  [key: string]: Code;
}
