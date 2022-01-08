import { useRef } from "react";
import { Lobby, MousePosition } from "../models/Lobby";
import { useIntervalLoop } from "../utils/useIntervalLoop";


interface MouseOverlayProps {
    lobby: Lobby,
    onMouseMove: (mousePosition: MousePosition) => void,
    children: any
}

function MouseOverlay(props: MouseOverlayProps) {
    const { lobby, onMouseMove, children } = props;
    const divRef = useRef<HTMLDivElement>();
    const mousePositionRef = useRef<MousePosition>([0, 0])
    const mousePositionChangedRef = useRef<boolean>(false);

    useIntervalLoop(() => {
        if (mousePositionChangedRef.current) {
            onMouseMove(mousePositionRef.current);
            mousePositionChangedRef.current = false;
        }
    }, (1000 / 10))

    useIntervalLoop(() => console.log(lobby), (5000))

    const otherMouseCursors = Object.entries(lobby.users)
        .filter(([userId, _userData]) => Number(userId) !== lobby.selfId)
        .map(([userId, userData]) => {
            const [divWidth, divHeight] = [divRef.current.clientWidth, divRef.current.clientHeight]
            return <div
                key={`${userId}_${userData.name}`}
                style={{
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'red',
                    left: `${Math.round(userData.mousePosition[0] * divWidth)}px`,
                    top: `${Math.round(userData.mousePosition[1] * divHeight)}px`
                }}
            >
                { userData.name }
            </div>
        })
    


    return <div
        ref={divRef}
        style={{
            width: '100%',
            height: '100%'
        }}
        onMouseMove={(e) => {
            const [width, height] = [divRef.current.clientWidth, divRef.current.clientHeight];
            mousePositionRef.current = [e.clientX / width, e.clientY / height];
            mousePositionChangedRef.current = true;
        }}
    >
        {children}
        { otherMouseCursors }
    </div>
}

export default MouseOverlay;