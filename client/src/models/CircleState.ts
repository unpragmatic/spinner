export interface State {
  timestamp: number;
  s: [number, number];
}

export const createInitialState = (): State => ({ timestamp: performance.now(), s: [0, 0] })