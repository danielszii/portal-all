import { randomUUID } from 'node:crypto'
import type { Evento, Prisma } from '@prisma/client'

// Execute na mesma transação que grava o evento: sua linha serializa as edições.
export async function syncEventoFoto(tx: Prisma.TransactionClient, evento: Pick<Evento, 'id' | 'titulo' | 'foto' | 'status'>) {
  const where = { eventoId: evento.id, automatica: true }
  if (evento.status !== 'PUBLICADO' || !evento.foto) {
    await tx.galeriaFoto.deleteMany({ where })
    return
  }

  const manual = await tx.galeriaFoto.findFirst({
    where: { eventoId: evento.id, src: evento.foto, automatica: false }, select: { id: true },
  })
  if (manual) {
    // Não duplica nem assume a edição de uma foto já cadastrada manualmente.
    await tx.galeriaFoto.deleteMany({ where })
    return
  }

  // O índice parcial garante uma foto automática sem limitar as fotos manuais.
  // Prisma não oferece upsert por índice parcial; os valores continuam parametrizados.
  await tx.$executeRaw`
    INSERT INTO "GaleriaFoto" ("id", "eventoId", "src", "legenda", "textoAlternativo", "automatica")
    VALUES (${randomUUID()}, ${evento.id}, ${evento.foto}, ${evento.titulo}, ${evento.titulo}, true)
    ON CONFLICT ("eventoId") WHERE "automatica"
    DO UPDATE SET "src" = EXCLUDED."src", "legenda" = EXCLUDED."legenda",
      "textoAlternativo" = EXCLUDED."textoAlternativo"
  `
}
