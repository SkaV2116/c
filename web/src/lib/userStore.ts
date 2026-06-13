let _uid = ''

export function setCurrentUid(uid: string) { _uid = uid }
export function getCurrentUid(): string { return _uid }

/** Returns localStorage key prefixed with current user's uid */
export function userKey(key: string): string {
  return _uid ? `${_uid}:${key}` : key
}
