export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return '이메일을 입력해 주세요.';
  if (email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return '영문과 숫자를 포함해 8~72자로 입력해 주세요.';
  }
}
