export function lerp(a: number, b: number, s: number): number {
    return a*s + (1-s)*b;
}