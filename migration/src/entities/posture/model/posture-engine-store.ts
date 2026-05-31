import { create } from 'zustand'
import type {
  CameraDiagnosticEvent,
  CameraOwnershipState,
  EngineStateEvent,
  MeasurementSession,
  PostureEngineResult,
  PostureWarningEvent,
} from './posture-types'
import {
  createEmptyEngineState,
  createEmptyOwnershipState,
} from './posture-types'

interface PostureEngineStore {
  session: MeasurementSession | null
  latestResult: PostureEngineResult | null
  restoredResult: PostureEngineResult | null
  engineState: EngineStateEvent
  ownership: CameraOwnershipState
  warning: PostureWarningEvent | null
  cameraDiagnostics: CameraDiagnosticEvent[]
  isHydratedFromCache: boolean
  setSession: (session: MeasurementSession | null) => void
  setLatestResult: (result: PostureEngineResult | null) => void
  setRestoredResult: (result: PostureEngineResult | null) => void
  setEngineState: (state: EngineStateEvent) => void
  setOwnership: (state: Partial<CameraOwnershipState>) => void
  setWarning: (warning: PostureWarningEvent | null) => void
  appendCameraDiagnostic: (event: CameraDiagnosticEvent) => void
  setCameraDiagnostics: (events: CameraDiagnosticEvent[]) => void
  markHydratedFromCache: () => void
  reset: () => void
}

const initialState = {
  session: null,
  latestResult: null,
  restoredResult: null,
  engineState: createEmptyEngineState(),
  ownership: createEmptyOwnershipState(),
  warning: null,
  cameraDiagnostics: [],
  isHydratedFromCache: false,
}

export const usePostureEngineStore = create<PostureEngineStore>()(set => ({
  ...initialState,
  setSession: session => set({ session }),
  setLatestResult: latestResult =>
    set(state => ({
      latestResult,
      restoredResult:
        latestResult?.engineMode === 'background'
          ? latestResult
          : state.restoredResult,
      session:
        state.session && latestResult
          ? {
              ...state.session,
              lastResultAt: latestResult.timestamp,
              latestResultId: latestResult.resultId,
              mode: latestResult.engineMode,
            }
          : state.session,
    })),
  setRestoredResult: restoredResult => set({ restoredResult }),
  setEngineState: engineState =>
    set(state => ({
      engineState,
      ownership: {
        ...state.ownership,
        owner: engineState.cameraOwner,
        updatedAt: engineState.updatedAt,
        lockState:
          engineState.engineStatus === 'switching'
            ? state.ownership.requestedOwner === 'react'
              ? 'acquiring'
              : 'releasing'
            : engineState.cameraOwner === 'none'
              ? 'free'
              : 'held',
      },
    })),
  setOwnership: ownership =>
    set(state => ({
      ownership: {
        ...state.ownership,
        ...ownership,
      },
    })),
  setWarning: warning => set({ warning }),
  appendCameraDiagnostic: event =>
    set(state => ({
      cameraDiagnostics: [...state.cameraDiagnostics, event].slice(-50),
    })),
  setCameraDiagnostics: events =>
    set({
      cameraDiagnostics: events.slice(-50),
    }),
  markHydratedFromCache: () => set({ isHydratedFromCache: true }),
  reset: () => set(initialState),
}))
