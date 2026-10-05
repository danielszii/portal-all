import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readR2Config } from '../src/config/upload.config.js'
import { prisma } from '../src/db/prisma.js'
import { mockMethod } from './mock-method.js'
import { imageFixture, pdfFixture } from './upload-fixtures.js'

const cloud = {
  R2_ACCOUNT_ID: 'a'.repeat(32), R2_ACCESS_KEY_ID: 'test-access', R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET: 'portal-test', R2_PUBLIC_URL: 'https://acervo.example.test/arquivos/',
}
const actor = { id: 'admin-test', email: 'admin@example.test' }

test('configuração R2 exige conjunto completo, identificador e URL HTTPS sem dados de autenticação', () => {
  assert.equal(readR2Config({}), null)
  assert.equal(readR2Config({ R2_ACCOUNT_ID: '  ' }), null)
  assert.equal(readR2Config({ UPLOAD_DIR: ' local ', R2_ACCOUNT_ID: 'parcial' }), null)
  assert.throws(() => readR2Config({ R2_ACCOUNT_ID: cloud.R2_ACCOUNT_ID }), /Variáveis ausentes/)
  assert.throws(() => readR2Config({ ...cloud, R2_ACCOUNT_ID: 'conta-invalida' }), /R2_ACCOUNT_ID/)
  for (const url of ['invalida', 'http://acervo.example.test', 'https://user:senha@acervo.example.test', 'https://acervo.example.test?token=x', 'https://acervo.example.test#foto']) {
    assert.throws(() => readR2Config({ ...cloud, R2_PUBLIC_URL: url }), /R2_PUBLIC_URL/)
  }
  assert.equal(readR2Config({ ...cloud, R2_PUBLIC_URL: ' https://acervo.example.test/arquivos/ ' })?.publicUrl, 'https://acervo.example.test/arquivos')
})

test('upload R2 preserva conteúdo, auditoria e tratamento de falhas sem acessar a nuvem', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'portal-r2-test-'))
  const originalDirectory = process.env.UPLOAD_DIR
  process.env.UPLOAD_DIR = directory
  const { saveUpload } = await import('../src/services/admin-upload.service.js')
  t.after(async () => {
    if (originalDirectory === undefined) delete process.env.UPLOAD_DIR
    else process.env.UPLOAD_DIR = originalDirectory
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(basename(directory).startsWith('portal-r2-test-'))
    await rm(directory, { recursive: true, force: true })
  })
  const configureCloud = (context: TestContext) => {
    const keys = [...Object.keys(cloud), 'UPLOAD_DIR']
    const original = Object.fromEntries(keys.map(key => [key, process.env[key]]))
    Object.assign(process.env, cloud)
    delete process.env.UPLOAD_DIR
    context.after(() => {
      for (const key of keys) {
        if (original[key] === undefined) delete process.env[key]
        else process.env[key] = original[key]
      }
    })
  }

  await t.test('imagens e PDFs mantêm bytes, tipo e URL pública e registram o administrador', async t => {
    configureCloud(t)
    const send = mockMethod(t, S3Client.prototype, 'send', async () => ({}))
    const destroy = mockMethod(t, S3Client.prototype, 'destroy', () => {})
    const audit = mockMethod(t, prisma.registroAuditoria, 'create', async () => ({}))
    for (const [mime, bytes, extension] of [
      ['image/png', await imageFixture(), 'png'],
      ['application/pdf', Buffer.from(await pdfFixture()), 'pdf'],
    ] as const) {
      const result = await saveUpload(bytes, mime, actor)
      const [command, options] = send.mock.calls.at(-1)!.arguments
      assert.ok(command instanceof PutObjectCommand)
      assert.equal(command.input.Bucket, cloud.R2_BUCKET)
      assert.match(command.input.Key!, new RegExp(`^[a-f0-9-]{36}\\.${extension}$`))
      assert.deepEqual(command.input.Body, bytes)
      assert.equal(command.input.ContentType, mime)
      assert.equal(command.input.CacheControl, 'public, max-age=31536000, immutable')
      assert.ok(options.abortSignal instanceof AbortSignal)
      assert.deepEqual(result, { url: cloud.R2_PUBLIC_URL + command.input.Key, contentType: mime, size: bytes.length })
      const { data } = audit.mock.calls.at(-1)!.arguments[0]
      assert.equal(data.administradorId, actor.id)
      assert.equal(data.administradorEmail, actor.email)
      assert.equal(data.acao, 'ENVIAR_ARQUIVO')
      assert.equal(data.registroId, command.input.Key)
      assert.deepEqual(data.detalhes, result)
    }
    assert.equal(send.mock.callCount(), 2)
    assert.equal(audit.mock.callCount(), 2)
    assert.equal(destroy.mock.callCount(), 2)
    assert.deepEqual(await readdir(directory), [])
  })

  await t.test('configuração parcial não grava arquivo nem registra sucesso', async t => {
    configureCloud(t)
    delete process.env.R2_BUCKET
    const send = mockMethod(t, S3Client.prototype, 'send', async () => ({}))
    const audit = mockMethod(t, prisma.registroAuditoria, 'create', async () => ({}))
    await assert.rejects(saveUpload(await imageFixture(), 'image/png', actor), /R2_BUCKET/)
    assert.equal(send.mock.callCount(), 0)
    assert.equal(audit.mock.callCount(), 0)
    assert.deepEqual(await readdir(directory), [])
  })

  await t.test('falha do provedor não confirma upload e libera o cliente', async t => {
    configureCloud(t)
    const failure = new Error('Armazenamento indisponível')
    const send = mockMethod(t, S3Client.prototype, 'send', async () => { throw failure })
    const destroy = mockMethod(t, S3Client.prototype, 'destroy', () => {})
    const audit = mockMethod(t, prisma.registroAuditoria, 'create', async () => ({}))
    await assert.rejects(saveUpload(await imageFixture(), 'image/png', actor), error => error === failure)
    assert.equal(send.mock.callCount(), 1)
    assert.equal(audit.mock.callCount(), 0)
    assert.equal(destroy.mock.callCount(), 1)
  })

  await t.test('falha de auditoria remove somente o novo objeto e preserva o erro original', async t => {
    configureCloud(t)
    const failure = new Error('Auditoria indisponível')
    const send = mockMethod(t, S3Client.prototype, 'send', async () => ({}))
    const destroy = mockMethod(t, S3Client.prototype, 'destroy', () => {})
    mockMethod(t, prisma.registroAuditoria, 'create', async () => { throw failure })
    await assert.rejects(saveUpload(await imageFixture(), 'image/png', actor), error => error === failure)
    assert.equal(send.mock.callCount(), 2)
    const put = send.mock.calls[0].arguments[0] as PutObjectCommand
    const remove = send.mock.calls[1].arguments[0] as DeleteObjectCommand
    assert.ok(remove instanceof DeleteObjectCommand)
    assert.deepEqual(remove.input, { Bucket: put.input.Bucket, Key: put.input.Key })
    assert.equal(destroy.mock.callCount(), 1)
  })

  await t.test('falha também na remoção mantém ambos os erros para diagnóstico', async t => {
    configureCloud(t)
    const auditFailure = new Error('Auditoria indisponível')
    const cleanupFailure = new Error('Remoção indisponível')
    mockMethod(t, S3Client.prototype, 'send', async command => {
      if (command instanceof DeleteObjectCommand) throw cleanupFailure
      return {}
    })
    const destroy = mockMethod(t, S3Client.prototype, 'destroy', () => {})
    mockMethod(t, prisma.registroAuditoria, 'create', async () => { throw auditFailure })
    await assert.rejects(saveUpload(await imageFixture(), 'image/png', actor), error => {
      assert.ok(error instanceof AggregateError)
      assert.deepEqual(error.errors, [auditFailure, cleanupFailure])
      assert.match(error.message, /objeto órfão/)
      return true
    })
    assert.equal(destroy.mock.callCount(), 1)
  })

  await t.test('UPLOAD_DIR explícito mantém gravação local mesmo com configuração R2 parcial', async t => {
    configureCloud(t)
    process.env.UPLOAD_DIR = directory
    delete process.env.R2_BUCKET
    const send = mockMethod(t, S3Client.prototype, 'send', async () => ({}))
    const audit = mockMethod(t, prisma.registroAuditoria, 'create', async () => ({}))
    const bytes = await imageFixture()
    const result = await saveUpload(bytes, 'image/png', actor)
    assert.match(result.url, /^\/uploads\/[a-f0-9-]{36}\.png$/)
    assert.deepEqual(await readFile(join(directory, basename(result.url))), bytes)
    assert.equal(send.mock.callCount(), 0)
    assert.equal(audit.mock.callCount(), 1)
  })
})
