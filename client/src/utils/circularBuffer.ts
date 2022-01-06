

export interface CircularBuffer<T> {
    push: (item: T) => void,
    getData: () => T[]
}

export function createCircularBuffer<T>(size: number): CircularBuffer<T> {
    const data: T[] = [];
    let writeIdx = 0;

    const push = (item: T) => {
        data[writeIdx] = item;
        writeIdx = (writeIdx + 1) % size;
    }

    const getData = () => [...data.slice(writeIdx), ...data.slice(0, writeIdx)];

    return {
        push,
        getData
    }
}