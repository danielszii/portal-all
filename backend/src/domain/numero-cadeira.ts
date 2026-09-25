export function romano(numero: number): string {
  let result = ''
  for (const [valor, letra] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as const) {
    while (numero >= valor) { result += letra; numero -= valor }
  }
  return result
}

export function numeroCadeira(value: string): number | null {
  const text = value.trim().toUpperCase()
  if (/^\d+$/.test(text)) { const n = Number(text); return n > 0 && n < 4000 ? n : null }
  if (!/^[IVXLCDM]+$/.test(text) || text.length > 15) return null
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  for (let i = 0; i < text.length; i++) total += values[text[i]] < (values[text[i + 1]] ?? 0) ? -values[text[i]] : values[text[i]]
  return total > 0 && total < 4000 && romano(total) === text ? total : null
}
