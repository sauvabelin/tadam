import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { BulleId } from '../types'

interface ClickOrigin {
  x: number
  y: number
}

interface ModalContextType {
  openModal: BulleId | null
  clickOrigin: ClickOrigin | null
  openModalAt: (id: BulleId, x: number, y: number) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [openModal, setOpenModal] = useState<BulleId | null>(null)
  const [clickOrigin, setClickOrigin] = useState<ClickOrigin | null>(null)

  const openModalAt = useCallback((id: BulleId, x: number, y: number) => {
    setClickOrigin({ x, y })
    setOpenModal(id)
  }, [])

  const closeModal = useCallback(() => {
    setOpenModal(null)
    setClickOrigin(null)
  }, [])

  return (
    <ModalContext.Provider value={{ openModal, clickOrigin, openModalAt, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}
