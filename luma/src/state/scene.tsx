import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { contracts as baseContracts, incomingContract, SCRIPTED_CONTRACT_ID } from "../data/contracts";
import { feed as baseFeed, triggeredFeed } from "../data/feed";
import { messages as baseMessages, payments as basePayments, triggeredMessage } from "../data/messages";
import { sceneDefaults } from "../data/scenes";
import type { Contract, FeedItem, Message, OperatorStatus, Payment } from "../data/types";

// One deterministic scene store. RESET always returns exactly this initial state.

export type ContractStatus = "AVAILABLE" | "ACTIVE" | "COMPLETE";

export interface Toast {
  id: number;
  kind: "contract" | "message" | "payment";
  title: string;
  body: string;
}

export interface SceneState {
  loggedIn: boolean;
  naomiMode: boolean;
  performanceMode: boolean;
  scriptedContractId: string;
  contracts: Contract[];
  activeContractId: string | null;
  contractStatus: ContractStatus;
  passed: string[];
  payout: number;
  crossStanding: number;
  statusOverrides: Record<string, OperatorStatus>;
  messages: Message[];
  payments: Payment[];
  feed: FeedItem[];
  toast: Toast | null;
  animKey: number;
  flashKey: number;
  bunnyAlert: number;
}

export const initialState = (): SceneState => ({
  loggedIn: false,
  naomiMode: false,
  performanceMode: sceneDefaults.performanceMode,
  scriptedContractId: SCRIPTED_CONTRACT_ID,
  contracts: baseContracts,
  activeContractId: null,
  contractStatus: "AVAILABLE",
  passed: [],
  payout: sceneDefaults.payout,
  crossStanding: sceneDefaults.crossStanding,
  statusOverrides: {},
  messages: baseMessages,
  payments: basePayments,
  feed: baseFeed,
  toast: null,
  animKey: 0,
  flashKey: 0,
  bunnyAlert: 0,
});

type Action =
  | { type: "RESET"; keep?: Partial<SceneState> }
  | { type: "PATCH"; patch: Partial<SceneState> }
  | { type: "LOGIN" }
  | { type: "ACCEPT"; id: string }
  | { type: "PASS"; id: string }
  | { type: "COMPLETE" }
  | { type: "TRIGGER_CONTRACT" }
  | { type: "TRIGGER_MESSAGE" }
  | { type: "TRIGGER_PAYMENT" }
  | { type: "SET_SCRIPTED_CONTRACT"; id: string }
  | { type: "SET_STATUS"; id: string; status: OperatorStatus }
  | { type: "READ_MESSAGE"; id: string }
  | { type: "RESTART_ANIM" }
  | { type: "DISMISS_TOAST" };

let toastSeq = 1;
const feedLine = (text: string, tone: FeedItem["tone"] = "accent"): FeedItem => ({
  id: `t${Date.now()}${Math.random()}`,
  time: "NOW",
  text,
  tone,
});

function reducer(s: SceneState, a: Action): SceneState {
  switch (a.type) {
    case "RESET":
      return { ...initialState(), animKey: s.animKey + 1, ...a.keep };
    case "PATCH":
      return { ...s, ...a.patch };
    case "LOGIN":
      return { ...s, loggedIn: true };
    case "ACCEPT": {
      if (s.contractStatus === "ACTIVE") return s;
      return {
        ...s,
        activeContractId: a.id,
        contractStatus: "ACTIVE",
        flashKey: s.flashKey + 1,
        statusOverrides: { ...s.statusOverrides, cross: "CONTRACT ACTIVE" },
        feed: [feedLine(triggeredFeed.accepted), ...s.feed],
      };
    }
    case "PASS":
      return s.passed.includes(a.id) ? s : { ...s, passed: [...s.passed, a.id] };
    case "COMPLETE": {
      if (s.contractStatus === "COMPLETE") return s;
      const c = s.contracts.find((x) => x.id === (s.activeContractId ?? s.scriptedContractId));
      return {
        ...s,
        contractStatus: "COMPLETE",
        activeContractId: s.activeContractId ?? s.scriptedContractId,
        statusOverrides: { ...s.statusOverrides, cross: "AVAILABLE" },
        payments: [
          { id: "p-complete", ref: c?.ref ?? "LX-0000", date: "TODAY", amount: s.payout, status: "CLEARED", memo: "Contract compensation" },
          ...s.payments,
        ],
        feed: [feedLine(triggeredFeed.completion), ...s.feed],
      };
    }
    case "TRIGGER_CONTRACT": {
      const exists = s.contracts.some((c) => c.id === incomingContract.id);
      return {
        ...s,
        contracts: exists ? s.contracts : [incomingContract, ...s.contracts],
        bunnyAlert: s.bunnyAlert + 1,
        feed: [feedLine(triggeredFeed.newContract), ...s.feed],
        toast: { id: toastSeq++, kind: "contract", title: "NEW CONTRACT", body: `${incomingContract.subject} // ${incomingContract.city}` },
      };
    }
    case "TRIGGER_MESSAGE":
      return {
        ...s,
        messages: [{ ...triggeredMessage, id: `m${toastSeq}` }, ...s.messages],
        feed: [feedLine(triggeredFeed.message, "neutral"), ...s.feed],
        toast: { id: toastSeq++, kind: "message", title: "NEW MESSAGE", body: triggeredMessage.subject },
      };
    case "TRIGGER_PAYMENT":
      return {
        ...s,
        payments: [
          { id: `p${toastSeq}`, ref: "LX-RELEASE", date: "TODAY", amount: s.payout, status: "CLEARED", memo: "Compensation released" },
          ...s.payments,
        ],
        feed: [feedLine(triggeredFeed.payment), ...s.feed],
        toast: { id: toastSeq++, kind: "payment", title: "PAYMENT CLEARED", body: `$${s.payout.toLocaleString("en-US")}` },
      };
    case "SET_SCRIPTED_CONTRACT": {
      const c = s.contracts.find((x) => x.id === a.id);
      return { ...s, scriptedContractId: a.id, payout: c?.value ?? s.payout };
    }
    case "SET_STATUS":
      return { ...s, statusOverrides: { ...s.statusOverrides, [a.id]: a.status } };
    case "READ_MESSAGE":
      return { ...s, messages: s.messages.map((m) => (m.id === a.id ? { ...m, unread: false } : m)) };
    case "RESTART_ANIM":
      return { ...s, animKey: s.animKey + 1 };
    case "DISMISS_TOAST":
      return { ...s, toast: null };
  }
}

const STORAGE_KEY = "luma-prop-scene-v1";

function load(): SceneState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw), toast: null };
  } catch {
    /* ignore */
  }
  return initialState();
}

interface Ctx {
  state: SceneState;
  dispatch: React.Dispatch<Action>;
  /** contract currently shown on detail/active/complete screens */
  current: Contract;
  /** value to display for a contract (scripted one shows the director payout) */
  valueOf: (c: Contract) => number;
}

const SceneContext = createContext<Ctx | null>(null);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      const { toast, ...rest } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value = useMemo<Ctx>(() => {
    const id = state.activeContractId ?? state.scriptedContractId;
    const current = state.contracts.find((c) => c.id === id) ?? state.contracts[0];
    const valueOf = (c: Contract) => (c.id === state.scriptedContractId ? state.payout : c.value);
    return { state, dispatch, current, valueOf };
  }, [state]);

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene outside SceneProvider");
  return ctx;
}

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
