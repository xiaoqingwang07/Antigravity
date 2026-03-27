import { createContext, useContext } from 'react'
import { pantryStore, PantryStore } from './pantryStore'

export interface RootStore {
  pantryStore: PantryStore
}

export const rootStore: RootStore = {
  pantryStore,
}

export const StoreContext = createContext<RootStore>(rootStore)

export function useStores(): RootStore {
  return useContext(StoreContext)
}

export function usePantryStore(): PantryStore {
  return useContext(StoreContext).pantryStore
}
