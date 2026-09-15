import { PrismaClient } from '@prisma/client'
import { cadeirasData } from '../src/data/cadeiras.data.js'
import { eventosData, galeriaData } from '../src/data/eventos.data.js'
import { noticiasData } from '../src/data/noticias.data.js'
import { acervoData } from '../src/data/acervo.data.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando o povoamento do banco de dados (seed)...')

  // Limpar dados existentes
  await prisma.producaoLiteraria.deleteMany()
  await prisma.obra.deleteMany()
  await prisma.sucessao.deleteMany()
  await prisma.cadeira.deleteMany()
  await prisma.evento.deleteMany()
  await prisma.galeriaFoto.deleteMany()
  await prisma.noticia.deleteMany()
  await prisma.acervoItem.deleteMany()
  await prisma.contatoMensagem.deleteMany()

  // Povoar Cadeiras com relacionamentos
  for (const c of cadeirasData) {
    await prisma.cadeira.create({
      data: {
        number: c.number,
        patron: c.patron,
        founder: c.founder,
        holder: c.holder,
        image: c.image,
        status: c.status,
        bio: c.bio,
        bioExtra: c.bioExtra,
        posse: c.posse,
        patronoBio: c.patronoBio,
        obras: c.obras ? { create: c.obras.map(o => ({ titulo: o.titulo, ano: o.ano, tipo: o.tipo })) } : undefined,
        sucessoes: c.sucessao ? { create: c.sucessao.map(s => ({ nome: s.nome, periodo: s.periodo, status: s.status })) } : undefined,
        producoes: c.producao ? { create: c.producao.map(p => ({ titulo: p.tipo as any, tipo: p.tipo, texto: p.texto })) } : undefined,
      }
    })
  }

  // Povoar Eventos
  for (const e of eventosData) {
    await prisma.evento.create({
      data: {
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        data: e.data,
        hora: e.hora,
        local: e.local,
        descricao: e.descricao,
        foto: e.foto,
        passado: e.passado || false,
      }
    })
  }

  // Povoar Galeria
  for (const g of galeriaData) {
    await prisma.galeriaFoto.create({
      data: {
        src: g.src,
        legenda: g.legenda,
      }
    })
  }

  // Povoar Notícias
  for (const n of noticiasData) {
    await prisma.noticia.create({
      data: {
        id: n.id,
        data: n.data,
        categoria: n.categoria,
        titulo: n.titulo,
        lede: n.lede,
        img: n.img,
        conteudo: n.conteudo,
      }
    })
  }

  // Povoar Acervo
  for (const a of acervoData) {
    await prisma.acervoItem.create({
      data: {
        title: a.title,
        tomo: a.tomo,
        year: a.year,
        color: a.color,
        author: a.author,
        type: a.type,
        pages: a.pages,
        desc: a.desc,
        pdf: a.pdf,
      }
    })
  }

  console.log('✅ Banco de dados povoado com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed do banco de dados:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
