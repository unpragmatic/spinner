export type MousePosition = [number, number];

export interface UserData {
  name: string,
  color: string,
  mousePosition: MousePosition
}

export interface Lobby {
  selfId: number;
  users: { [ userId: number]: UserData }
}

export type UserDataState = { [userId: number]: UserData };