import test from 'node:test'
import assert from 'node:assert/strict'
import { readEnvConfig } from '../src/config/env.config.js'

test('configuração local mantém os padrões e normaliza a origem usada pelo CORS e CSRF', () => {
  assert.deepEqual(readEnvConfig({}), { port: 3001, nodeEnv: 'development', frontendUrl: 'http://localhost:5173' })
  assert.equal(readEnvConfig({ FRONTEND_URL: 'https://PORTAL.example:443/' }).frontendUrl, 'https://portal.example')
  assert.equal(readEnvConfig({ PORT: '65535' }).port, 65535)
})

test('configuração rejeita portas parciais e origens inadequadas antes de iniciar o servidor', () => {
  for (const PORT of ['', '3001abc', '1.5', '1e3', '-1', '0', '65536']) {
    assert.throws(() => readEnvConfig({ PORT }), /PORT/)
  }
  for (const FRONTEND_URL of ['', '*', 'null', 'javascript:alert(1)', 'ftp://portal.example',
    'https://portal.example/admin', 'https://portal.example?token=privado',
    'https://portal.example#fragmento', 'https://usuario:segredo@portal.example']) {
    assert.throws(() => readEnvConfig({ FRONTEND_URL }), error => {
      assert.ok(error instanceof Error)
      assert.match(error.message, /FRONTEND_URL/)
      assert.doesNotMatch(error.message, /segredo|privado/)
      return true
    })
  }
  assert.throws(() => readEnvConfig({ NODE_ENV: 'produciton' }), /NODE_ENV/)
})

test('produção exige a origem HTTPS explícita necessária ao cookie administrativo', () => {
  assert.throws(() => readEnvConfig({ NODE_ENV: 'production' }), /FRONTEND_URL/)
  assert.throws(() => readEnvConfig({ NODE_ENV: 'production', FRONTEND_URL: 'http://portal.example' }), /HTTPS/)
  assert.equal(readEnvConfig({ NODE_ENV: 'production', FRONTEND_URL: 'https://portal.example' }).frontendUrl, 'https://portal.example')
})
