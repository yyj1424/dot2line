/**
 * "비밀번호 재설정 중" 표시. localStorage 는 같은 브라우저의 모든 탭이 공유하므로, 복구 링크를 처리한 탭 말고
 * 다른 탭에서도 비밀번호를 바꾸기 전에는 다른 화면으로 못 가게 하는 데 쓴다. 1시간 뒤 자동 만료.
 */
const KEY = 'd2l_pwd_recovery_at';
const MAX_AGE_MS = 60 * 60 * 1000;

export function markRecoveryPending(): void {
  try { window.localStorage.setItem(KEY, String(Date.now())); } catch { /* 저장소를 못 쓰는 환경 */ }
}

export function clearRecoveryPending(): void {
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function isRecoveryPending(): boolean {
  try {
    const at = Number(window.localStorage.getItem(KEY));
    if (!at) return false;
    if (Date.now() - at > MAX_AGE_MS) { window.localStorage.removeItem(KEY); return false; }
    return true;
  } catch {
    return false;
  }
}
