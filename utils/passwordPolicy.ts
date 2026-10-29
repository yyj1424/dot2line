/**
 * 비밀번호 규정 — 가입(signup)·고객사 초대(invite)·변경(update-password) 화면이 같은 규정을 쓴다.
 * 영문 + 숫자 + 특수문자를 모두 포함하고 8자 이상.
 *
 * 이 검사는 화면 안내용이다. 브라우저에서 Supabase로 바로 가입·변경할 수 있기 때문에
 * 실제 강제는 Supabase 대시보드(Authentication → Password requirements)의 같은 규정이 맡는다.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = '영문, 숫자, 특수문자를 모두 포함하여 8자 이상 입력하세요.';

export function validatePassword(pwd: string): string | null {
  if (pwd.length < PASSWORD_MIN_LENGTH) return `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[^a-zA-Z0-9\s]/.test(pwd)) {
    return '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.';
  }
  if (/\s/.test(pwd)) return '비밀번호에는 공백을 사용할 수 없습니다.';
  return null;
}
