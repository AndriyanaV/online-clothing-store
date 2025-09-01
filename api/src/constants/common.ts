// Place for common constants
export const MIN_PASSWORD_LEN = 6;

// Using for bcrypt hashes
export const HASH_SALT = 12;

// Using for JWT login session
export const jwtLoginExpiresInTime = "3h";
export const jwtLoginExpiresInTimeRememberMe = "30d";
export const jwtConfirmOrderExpiresInTime = "1h";

export const jwtResetPasswordExpiresInTime = "15m";
export const jwtChangeEmailExpiresInTime = "2h";

export const objectIdRegex = /^[a-f\d]{24}$/i;
