import { useRef } from "react";

interface SpinnerProps {
    options: string[]
    rads: number
    onThetaUpdate: (deltaTheta: DeltaTheta) => void
    onDeltaThetaUpdate: (deltaDeltaTheta: DeltaDeltaTheta) => void
}


function ConvertClientToSVGCoords(svg: SVGSVGElement, x: number, y: number): [x: number, y: number] {
    let p = svg.createSVGPoint();
    [p.x, p.y] = [x, y];
    p = p.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
}

interface MouseMovement {
    timestamp: number
    x: number
    y: number
}

interface DeltaTheta {
    dt: number
    rads: number
}

interface DeltaDeltaTheta {
    dt: number
    deltaRads: number
}

function Spinner(props: SpinnerProps) {
    const { options, rads } = props;
    const [svgWidth, svgHeight] = [256, 256];
    const [circleX, circleY] = [svgWidth / 2, svgHeight / 2];
    const circleRadius = 80;
    const svgRef = useRef<SVGSVGElement>();

    const lines = options.map((option, i) => {
        const angleDelta = (2 * Math.PI) / options.length;
        const angle = angleDelta * i;
        const x2 = circleX + (circleRadius * Math.sin(angle));
        
        const y2 = circleY + (circleRadius * Math.cos(angle));
        return (
            <line
                key={option}
                x1={circleX}
                y1={circleY}
                x2={x2}
                y2={y2}
                stroke="#000000"
            />
        )
    });

    const text = options.map((option, i) => {
        const angleDelta = (2 * Math.PI) / options.length;
        const angle = angleDelta * (i + 0.5);
        const x = circleX + (circleRadius * Math.sin(angle) * 0.9);
        const y = circleY + (circleRadius * Math.cos(angle) * 0.9);

        const textRotationDegrees = -((angle / (2 * Math.PI)) * 360) + 180;

        return (
            <text
                key={option}
                x={x}
                y={y}
                style={{
                    textAnchor: 'middle',
                    dominantBaseline: 'middle',
                    fontSize: 7,
                }}
                transform-origin={`${x} ${y}`}
                transform={`rotate(${textRotationDegrees})`}
            >
                {options[i]}
            </text>
        )
    });

    const mouseMovements = useRef<MouseMovement[]>([]);
    const deltaThetas = useRef<DeltaTheta[]>([]);
    const mouseDown = useRef<boolean>(false);

    const svgCoordsToAngle = (x: number, y: number): number => {
        // const radius = Math.hypot((x - circleX), (y - circleY));
        return Math.atan((y - circleY) / (x - circleX));
    };

    const calculateRads = (mm0: MouseMovement, mm1: MouseMovement): number => {
        const [x0, y0] = [mm0.x - circleX, mm0.y - circleY];
        const [x1, y1] = [mm1.x - circleX, mm1.y - circleY];
        const dp = (x0 * x1) + (y0 * y1);
        const [m0, m1] = [Math.hypot(x0, y0), Math.hypot(x1, y1)];
        // Correct for floating point errors causing value to be greater than 1
        const cos = Math.min(dp / (m0*m1), 1); 
        const angle = Math.acos(cos);

        if (isNaN(angle)) {
            console.log(`NAN: ${[m0, m1, dp, dp / (m0*m1)]}`);
        }
        const direction = (x0 * y1) - (x1 * y0);

        return direction >= 0 ? angle : -angle;
    }

    return (<>
        <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            xmlns="http://www.w3.org/2000/svg"
            ref={svgRef}
            onMouseDown={(e) => {
                props.onDeltaThetaUpdate({
                    dt: 1,
                    deltaRads: 0
                });
                mouseDown.current = true;
                mouseMovements.current = [];
                deltaThetas.current = [];
            }}
            onMouseUp={(e) => {
                const lookbackThreshold = 50;
                let totalLookback = 0
                let totalDelta = 0
                for (let i = deltaThetas.current.length - 1; i >= 0 && totalLookback < lookbackThreshold; i--) {
                    const currentDeltaTheta = deltaThetas.current[i];
                    totalDelta += currentDeltaTheta.rads;
                    totalLookback += currentDeltaTheta.dt;
                }

                // At least 1% change to be considered significant enough to spin.
                if (Math.abs(totalDelta) > 2*Math.PI * (1/100)) {
                    props.onDeltaThetaUpdate({
                        dt: totalLookback,
                        deltaRads: totalDelta
                    });
                }

                mouseDown.current = false;
                mouseMovements.current = [];
                deltaThetas.current = [];
            }}
            onMouseMove={(e) => {
                if (!mouseDown.current) { return; }
                const [x, y] = ConvertClientToSVGCoords(svgRef.current, e.clientX, e.clientY);
                const mm1 = {
                    timestamp: e.timeStamp,
                    x, y
                }
                mouseMovements.current.push(mm1);

                if (mouseMovements.current.length - 2 >= 0) {
                    const mm0 = mouseMovements.current[mouseMovements.current.length - 2];
                    const rads = calculateRads(mm0, mm1);
                    const deltaTheta = {
                        dt: mm1.timestamp - mm0.timestamp,
                        rads: rads
                    }
                    deltaThetas.current.push(deltaTheta);
                    props.onThetaUpdate(deltaTheta);
                }
            }}
        >
            <g
                style={{
                    transform: `rotate(${rads}rad)`,
                    transformOrigin: 'center'
                }}
            >
                <circle
                    cx={circleX} cy={circleY} r={circleRadius}
                    stroke="#000000" fill="#ffffff"
                />
                {lines}
                {text}
            </g>
            <polygon points="117,48 138,48 128,60" style={{ fill: '#a22b2b' }} />
        </svg>
    </>)
}

Spinner.defaultProps = {
    onThetaUpdate: () => {},
    onDeltaThetaUpdate: () => {}
}

export default Spinner 