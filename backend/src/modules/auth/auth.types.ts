export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    userType: 'ADMIN' | 'USER';
    roles: string[];
    permissions: string[];
    institutionId?: string;
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordResult {
  message: string;
  resetToken?: string; // Included in non-production for easy testing
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName: string;
  userType: 'ADMIN' | 'USER';
  roles: string[];
  permissions: string[];
  institutionId?: string;
}
