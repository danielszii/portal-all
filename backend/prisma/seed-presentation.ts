import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { acervoColors as colors } from '../src/domain/acervo.js'

if (process.env.SEED_PRESENTATION !== 'true') {
  throw new Error('Carga de apresentação: defina SEED_PRESENTATION=true explicitamente.')
}

const requiredR2 = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const
for (const key of requiredR2) if (!process.env[key]) throw new Error(`Variável obrigatória ausente: ${key}`)

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL })
const memberNames = [
  'Helena Alves', 'Rafael Nogueira', 'Clara Monteiro', 'Augusto Ribeiro', 'Marina Freitas',
  'Daniel Carvalho', 'Lúcia Andrade', 'Tomás Bezerra', 'Isabel Moura', 'Caio Fernandes',
  'Teresa Lima', 'Miguel Barros', 'Cecília Duarte', 'Artur Oliveira', 'Beatriz Sampaio',
  'Joaquim Castro', 'Laura Benevides', 'Vicente Araújo', 'Camila Rocha', 'Samuel Macedo',
  'Elisa Queiroz', 'Gabriel Teixeira', 'Natália Sales', 'Henrique Holanda', 'Marta Pinheiro',
  'Leandro Chaves', 'Sílvia Farias', 'Pedro Linhares', 'Rita Cavalcante', 'Antônio Paiva',
  'Lorena Correia', 'Eduardo Maia', 'Alice Fontenele', 'Bruno Damasceno', 'Mônica Viana',
  'Fábio Gadelha', 'Renata Coutinho', 'André Sabóia', 'Patrícia Guerra', 'Otávio Leal',
]
const patronNames = [
  'José de Alencar', 'Rachel de Queiroz', 'Patativa do Assaré', 'Antônio Sales', 'Juvenal Galeno',
  'Adolfo Caminha', 'Rodolfo Teófilo', 'Moreira Campos', 'Cecília Meireles', 'Carlos Drummond de Andrade',
  'Machado de Assis', 'Aluísio Azevedo', 'Castro Alves', 'Olavo Bilac', 'Lima Barreto',
  'Euclides da Cunha', 'João Cabral de Melo Neto', 'Graciliano Ramos', 'Jorge Amado', 'Clarice Lispector',
  'Guimarães Rosa', 'Ariano Suassuna', 'Manuel Bandeira', 'Vinicius de Moraes', 'Mário Quintana',
  'Cora Coralina', 'Lygia Fagundes Telles', 'Conceição Evaristo', 'Ferreira Gullar', 'Monteiro Lobato',
  'Gonçalves Dias', 'Cruz e Sousa', 'Augusto dos Anjos', 'Joaquim Nabuco', 'Nísia Floresta',
  'Gilberto Freyre', 'José Lins do Rego', 'Rubem Braga', 'Paulo Leminski', 'Carolina Maria de Jesus',
]
const bookTitles = [
  'Memórias do Vale', 'Vozes do Jaguaribe', 'Cadernos de Limoeiro', 'Entre Letras e Afetos',
  'Crônicas da Cidade', 'Poemas para o Amanhã', 'Retratos da Nossa Terra', 'Caminhos da Palavra',
  'O Tempo e a Memória', 'Contos ao Entardecer', 'Inventário de Sonhos', 'Janelas do Sertão',
  'A Palavra que Fica', 'Histórias de Nossa Gente', 'Versos do Vale', 'Travessias Literárias',
  'Almanaque Cultural', 'Antologia das Cadeiras', 'Escritos da Academia', 'Letras Limoeirenses',
]
const photo = (index: number) => `/images/membros/retrato-institucional-beca-${String(index % 11 + 1).padStart(2, '0')}.webp`
const eventPhotos = [
  '/images/eventos/sessao-solene.webp', '/images/eventos/sarau-literario.webp',
  '/images/eventos/lancamento-livro.webp', '/images/eventos/roda-leitura.webp',
]
const events = [
  ['sessao-solene-2026', 'Sessão Solene de Aniversário', 'Sessão Solene', '2026-06-20T19:00:00-03:00', 'Auditório da Academia', 'Celebração da trajetória institucional, com homenagens aos membros e patronos.', 0],
  ['sarau-inverno-2026', 'Sarau de Inverno', 'Sarau', '2026-07-18T19:30:00-03:00', 'Pátio Cultural', 'Encontro de poesia, música e leitura dedicado à produção literária regional.', 1],
  ['lancamento-antologia-2026', 'Lançamento da Antologia do Vale', 'Lançamento', '2026-08-22T18:30:00-03:00', 'Biblioteca Municipal', 'Lançamento demonstrativo de antologia coletiva seguido de sessão de autógrafos.', 2],
  ['roda-leitura-setembro-2026', 'Roda de Leitura: Memória e Cidade', 'Roda de leitura', '2026-09-19T16:00:00-03:00', 'Biblioteca da Academia', 'Leitura compartilhada e conversa sobre memória, identidade e patrimônio cultural.', 3],
  ['sarau-primavera-2026', 'Sarau da Primavera', 'Sarau', '2026-10-24T19:00:00-03:00', 'Pátio Cultural', 'Noite aberta de poesia, crônica e música com participação da comunidade.', 1],
  ['oficina-cronica-2026', 'Oficina de Crônica Literária', 'Oficina', '2026-11-14T14:00:00-03:00', 'Sala de Formação', 'Atividade formativa sobre observação do cotidiano e construção da crônica.', 3],
  ['encontro-autores-2026', 'Encontro de Autores do Vale', 'Encontro', '2026-12-05T18:00:00-03:00', 'Auditório da Academia', 'Conversa com escritores sobre publicação, leitura e circulação de obras regionais.', 0],
  ['abertura-calendario-2027', 'Abertura do Calendário Cultural 2027', 'Sessão Solene', '2027-02-06T19:00:00-03:00', 'Auditório da Academia', 'Apresentação da programação anual e recepção de parceiros culturais.', 2],
] as const
const news = [
  ['Institucional', 'Academia apresenta novo portal cultural', 'A plataforma reúne acervo, cadeiras, agenda, notícias e memória institucional em um só lugar.'],
  ['Acervo', 'Acervo digital ganha vinte publicações demonstrativas', 'A nova área facilita a consulta a livros, antologias, revistas e documentos históricos.'],
  ['Agenda', 'Programação cultural do semestre é divulgada', 'Saraus, oficinas, rodas de leitura e encontros com autores integram o calendário.'],
  ['Literatura', 'Projeto valoriza escritores do Vale do Jaguaribe', 'A iniciativa amplia a visibilidade da produção literária e da memória regional.'],
  ['Institucional', 'Cadeiras e patronos recebem nova apresentação digital', 'Perfis organizados permitem conhecer titulares, patronos, obras e sucessões.'],
  ['Formação', 'Oficina de crônica abre calendário formativo', 'A atividade propõe exercícios de escrita inspirados no cotidiano e na cidade.'],
  ['Acervo', 'Portal facilita leitura e acesso a publicações', 'Obras podem ser localizadas por título, autoria, categoria e ano de publicação.'],
  ['Memória', 'Galeria preserva registros de encontros culturais', 'Fotografias de sessões, saraus e lançamentos passam a integrar o portal.'],
  ['Literatura', 'Roda de leitura aproxima gerações de leitores', 'Encontro promoveu conversa sobre livros, pertencimento e experiências de leitura.'],
  ['Agenda', 'Sarau da Primavera recebe inscrições', 'Poetas, cronistas e músicos poderão compartilhar trabalhos autorais com o público.'],
  ['Institucional', 'Diretoria apresenta plano de atividades culturais', 'O planejamento prioriza acervo, formação de leitores e intercâmbio entre autores.'],
  ['Comunidade', 'Academia amplia canais de comunicação com o público', 'O portal oferece agenda atualizada, busca integrada e formulário de contato institucional.'],
] as const

async function presentationPdf() {
  const document = await PDFDocument.create()
  const page = document.addPage([595, 842])
  const font = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  page.drawText('Academia Limoeirense de Letras', { x: 72, y: 730, size: 22, font: bold, color: rgb(0.05, 0.12, 0.25) })
  page.drawText('Documento demonstrativo para apresentação do portal.', { x: 72, y: 690, size: 13, font })
  page.drawText('O conteúdo oficial substituirá este arquivo posteriormente.', { x: 72, y: 666, size: 11, font })
  const bytes = await document.save()
  const key = 'apresentacao/acervo-demonstrativo.pdf'
  const client = new S3Client({
    region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  })
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!, Key: key, Body: bytes, ContentType: 'application/pdf',
    CacheControl: 'public, max-age=3600',
  }))
  return `${process.env.R2_PUBLIC_URL!.replace(/\/+$/, '')}/${key}`
}

try {
  const pdfUrl = await presentationPdf()
  await prisma.$transaction(async tx => {
    await tx.instituicao.upsert({ where: { id: 'all' }, update: {}, create: {
      id: 'all', nome: 'Academia Limoeirense de Letras', fundacaoAno: 1998,
      historia: 'Fundada para reunir escritores, pesquisadores e agentes culturais, a Academia atua na preservação da memória literária e na promoção da leitura em Limoeiro do Norte e no Vale do Jaguaribe.',
      missao: 'Preservar a memória, valorizar a literatura regional, incentivar novos leitores e promover o intercâmbio cultural entre gerações.',
      endereco: 'Centro, Limoeiro do Norte — CE', email: 'contato@academialimoeirense.org.br', telefone: '(88) 99999-0000',
      sedeTexto: 'Espaço de encontro, pesquisa, formação e celebração da cultura literária regional.',
      trajetoriaTexto: 'Ao longo de sua trajetória, a instituição promove sessões solenes, publicações, saraus, oficinas e a preservação de acervos.',
      horarioAtendimento: 'Segunda a sexta, das 8h às 12h e das 14h às 17h.',
    } })
    for (let index = 0; index < 40; index++) {
      const numero = index + 1
      const patronoId = `apresentacao-patrono-${numero}`
      const academicoId = `apresentacao-academico-${numero}`
      const cadeiraId = `apresentacao-cadeira-${numero}`
      await tx.patrono.upsert({ where: { id: patronoId }, update: {}, create: {
        id: patronoId, nome: patronNames[index], biografia: `Patrono da cadeira ${numero}. Texto biográfico demonstrativo para apresentação do portal.`,
      } })
      await tx.academico.upsert({ where: { id: academicoId }, update: {}, create: {
        id: academicoId, nome: memberNames[index], fotoUrl: photo(index),
        biografia: `Membro demonstrativo da cadeira ${numero}, com atuação dedicada à literatura, à cultura e à preservação da memória regional.`,
      } })
      const cadeira = await tx.cadeira.upsert({ where: { numero }, update: {}, create: { id: cadeiraId, numero, patronoId } })
      if (cadeira.id !== cadeiraId) continue
      await tx.ocupacaoCadeira.upsert({ where: { id: `apresentacao-ocupacao-${numero}` }, update: {}, create: {
        id: `apresentacao-ocupacao-${numero}`, cadeiraId, academicoId, fundador: true, vigente: true,
        inicioAno: 1997 + numero, periodoTexto: `${1997 + numero}–presente`,
      } })
      for (let work = 1; work <= 2; work++) {
        await tx.obra.upsert({ where: { id: `apresentacao-obra-${numero}-${work}` }, update: {}, create: {
          id: `apresentacao-obra-${numero}-${work}`, academicoId,
          titulo: work === 1 ? `Caminhos da Palavra ${numero}` : `Memórias do Vale ${numero}`,
          ano: String(2010 + ((numero + work) % 16)), tipo: work === 1 ? 'Poesia' : 'Crônica',
        } })
      }
      if (numero <= 12) await tx.producaoLiteraria.upsert({ where: { id: `apresentacao-texto-${numero}` }, update: {}, create: {
        id: `apresentacao-texto-${numero}`, academicoId, titulo: `Palavras do Vale ${numero}`, tipo: numero % 2 ? 'Poema' : 'Crônica',
        texto: 'Entre a memória e o rio, a palavra encontra seu caminho. Este texto demonstrativo apresenta como a produção literária dos membros será organizada no portal.',
        status: 'PUBLICADO', publicadoEm: new Date('2026-01-15T12:00:00-03:00'),
      } })
    }

    await tx.gestao.upsert({ where: { id: 'apresentacao-gestao-2026-2028' }, update: {}, create: { id: 'apresentacao-gestao-2026-2028', inicioAno: 2026, fimAno: 2028 } })
    for (const [index, cargo] of ['Presidência', 'Vice-presidência', 'Secretaria-geral', 'Tesouraria', 'Diretoria cultural'].entries()) {
      await tx.mandatoDiretoria.upsert({ where: { id: `apresentacao-mandato-${index + 1}` }, update: {}, create: {
        id: `apresentacao-mandato-${index + 1}`, gestaoId: 'apresentacao-gestao-2026-2028',
        academicoId: `apresentacao-academico-${index + 1}`, cargo,
        inicioEm: new Date('2026-01-01T12:00:00-03:00'), fimEm: new Date('2028-12-31T12:00:00-03:00'),
      } })
    }

    for (const [index, event] of events.entries()) {
      const [slug, titulo, tipo, inicio, local, descricao, imageIndex] = event
      const id = `apresentacao-evento-${slug}`
      await tx.evento.upsert({ where: { id }, update: {}, create: {
        id, titulo, tipo, inicioEm: new Date(inicio), local, descricao, foto: eventPhotos[imageIndex], status: 'PUBLICADO',
      } })
      if (index < 4) {
        await tx.galeriaFoto.upsert({ where: { id: `apresentacao-foto-${index + 1}-a` }, update: {}, create: {
          id: `apresentacao-foto-${index + 1}-a`, eventoId: id, src: eventPhotos[imageIndex],
          legenda: `${titulo} — registro demonstrativo`, textoAlternativo: `Público durante ${titulo.toLowerCase()}`,
          credito: 'Imagem demonstrativa gerada por IA', ordem: index * 2, automatica: true,
        } })
        await tx.galeriaFoto.upsert({ where: { id: `apresentacao-foto-${index + 1}-b` }, update: {}, create: {
          id: `apresentacao-foto-${index + 1}-b`, eventoId: id, src: eventPhotos[(imageIndex + 1) % eventPhotos.length],
          legenda: `Momento cultural de ${titulo.toLowerCase()}`, textoAlternativo: `Atividade cultural com participantes de ${titulo.toLowerCase()}`,
          credito: 'Imagem demonstrativa gerada por IA', ordem: index * 2 + 1,
        } })
      }
    }

    for (const [index, item] of news.entries()) {
      const [categoria, titulo, lede] = item
      await tx.noticia.upsert({ where: { id: 9001 + index }, update: {}, create: {
        id: 9001 + index, categoria, titulo, lede, img: eventPhotos[index % eventPhotos.length],
        conteudo: `${lede}\n\nEste conteúdo demonstrativo mostra a apresentação completa de uma notícia no portal, com contexto institucional, informações para o público e integração com a agenda cultural.`,
        status: 'PUBLICADO', publicadoEm: new Date(`2026-${String((index % 9) + 1).padStart(2, '0')}-15T12:00:00-03:00`),
      } })
    }
    await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('"Noticia"', 'id'), COALESCE((SELECT MAX(id) FROM "Noticia"), 1), true)`

    for (let index = 0; index < 20; index++) {
      const numero = index + 1
      await tx.acervoItem.upsert({ where: { id: `apresentacao-livro-${numero}` }, update: {}, create: {
        id: `apresentacao-livro-${numero}`, titulo: bookTitles[index], edicao: `Edição demonstrativa ${numero}`,
        ano: 2005 + index, cor: colors[index % colors.length], autoriaTexto: memberNames[index], categoria: 'Livro',
        paginas: 80 + index * 8, descricao: 'Publicação demonstrativa preparada para a apresentação do portal. Será substituída pelo acervo oficial.',
        pdfUrl, status: 'PUBLICADO',
      } })
    }
  }, { timeout: 60_000 })

  const [chairs, books, newsCount, eventsCount, gallery, works, texts] = await prisma.$transaction([
    prisma.cadeira.count(), prisma.acervoItem.count({ where: { categoria: 'Livro' } }), prisma.noticia.count(), prisma.evento.count(),
    prisma.galeriaFoto.count(), prisma.obra.count(), prisma.producaoLiteraria.count(),
  ])
  console.log(`Carga concluída: ${chairs} cadeiras, ${books} livros, ${newsCount} notícias, ${eventsCount} eventos, ${gallery} fotos, ${works} obras e ${texts} textos.`)
} finally {
  await prisma.$disconnect()
}
