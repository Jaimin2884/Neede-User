export const ENDPOINTS = {
  USER_AUTH_SEND_OTP: '/v1/user/auth/send-otp',
  USER_AUTH_VERIFY_OTP: '/v1/user/auth/verify-otp',
  USER_PROFILE_UPDATE: '/v1/user/profile/update',
  USER_ADDRESSES: '/v1/user/addresses',
  USER_ADDRESS_STORE: '/v1/user/addresses/store',
  userAddressUpdate: (id: number) => `/v1/user/addresses/${id}/update`,
  userAddressDelete: (id: number) => `/v1/user/addresses/${id}/delete`,
  userAddressDefault: (id: number) => `/v1/user/addresses/${id}/default`,
} as const;
