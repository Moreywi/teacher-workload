const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'

export function generatePassword(length = 8): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}