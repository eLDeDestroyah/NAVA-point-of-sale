export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthActionState = {
  success: boolean;
  message: string;
};
