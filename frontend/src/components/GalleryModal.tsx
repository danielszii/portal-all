import { X } from 'lucide-react'
import { useDialog } from '@/hooks/useDialog'
import type { GaleriaFoto } from '@/types'
export default function GalleryModal({ fotos, index, onIndex, onClose }: { fotos: GaleriaFoto[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const dialog = useDialog(onClose)
  const foto = fotos[index]
  if (!foto) return null
  return <div ref={dialog} tabIndex={-1} className="lightbox" role="dialog" aria-modal="true" aria-label="Galeria de eventos" onClick={onClose}>
    <button className="lightbox-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
    <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
      <img src={foto.src.replace('w=800', 'w=1400')} alt={foto.legenda} />
      <p className="lightbox-legenda">{foto.legenda}</p>
      <div className="lightbox-nav">
        <button onClick={() => onIndex((index + fotos.length - 1) % fotos.length)} aria-label="Anterior">← Anterior</button>
        <span>{index + 1} / {fotos.length}</span>
        <button onClick={() => onIndex((index + 1) % fotos.length)} aria-label="Próxima">Próxima →</button>
      </div>
    </div>
  </div>
}
