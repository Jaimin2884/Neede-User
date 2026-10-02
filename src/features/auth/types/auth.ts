export type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  mobile: string;
  mobile_verified_at: string | null;
};

export type UpdateProfileRequest = {
  name: string;
  email: string;
};

export type UserAuthPayload = {
  token: string;
  token_type: string;
  user: AuthUser;
};

export type SendOtpResult = {
  mobile: string;
  otp: string;
  expiresIn: number;
  resendAfter: number;
};
