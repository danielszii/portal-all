import type { TestContext } from 'node:test'

// Delegates Prisma são proxies; mock.method depende de descriptors que eles não expõem.
export function mockMethod(t: TestContext, target: any, name: string, implementation: (...args: any[]) => any) {
  const original = target[name]
  const mock = t.mock.fn(implementation)
  target[name] = mock
  t.after(() => { target[name] = original })
  return mock
}
