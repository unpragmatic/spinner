import { useRef } from "react"
import { BackgroundColor, FontColor, LineColor, StrokeWidth } from "../style/Style";
// import styles from './Spinner.module.css'

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
    const [circleXPercentage, circleYPercentage] = [1 / 2, 0.5];
    const [circleX, circleY] = [svgWidth * circleXPercentage, svgHeight * circleYPercentage];
    const circleRadius = 80;
    const svgRef = useRef<SVGSVGElement>();

    const lines = options.map((option, i) => {
        const angleDelta = (2 * Math.PI) / options.length;
        const angle = angleDelta * i;
        const x2 = circleX + (circleRadius * Math.sin(angle));

        const y2 = circleY + (circleRadius * Math.cos(angle));
        return (
            <line
                key={`${i}_${option}`}
                x1={circleX}
                y1={circleY}
                x2={x2}
                y2={y2}
                stroke={LineColor}
                strokeWidth={StrokeWidth}
            />
        )
    });

    const text = options.map((option, i) => {
        const angleDelta = (2 * Math.PI) / options.length;
        const angle = angleDelta * (i + 0.5);
        const percentageDisplacement = 0.85;
        const x = circleX + (circleRadius * Math.sin(angle) * percentageDisplacement);
        const y = circleY + (circleRadius * Math.cos(angle) * percentageDisplacement);

        const textRotationDegrees = -((angle / (2 * Math.PI)) * 360) + 180;

        return (
            <text
                key={`${i}_${option}`}
                x={x}
                y={y}
                style={{
                    textAnchor: 'middle',
                    dominantBaseline: 'middle',
                    fontSize: 7,
                    fill: FontColor
                }}
                transform-origin={`${x} ${y}`}
                transform={`rotate(${textRotationDegrees})`}
            >
                {options[i]}
            </text>
        )
    });

    const radianToPointOnCircle = (radians: number, radius?: number): [x: number, y: number] => {
        if (radius === undefined) {
            radius = circleRadius;
        }

        return [circleX + (radius * Math.sin(radians)), circleY + (radius * Math.cos(radians))];
    }

    const indicatorWidthInRadians = 2 * Math.PI * (1 / 100);
    const indicator = <path
        fill="#42addb"
        d={`
            M ${radianToPointOnCircle(-(indicatorWidthInRadians / 2) + Math.PI).join(' ')}
            A ${circleRadius} ${circleRadius} 0 0 1 ${radianToPointOnCircle((indicatorWidthInRadians / 2) + Math.PI).join(' ')}
            L ${radianToPointOnCircle(Math.PI, circleRadius * 0.9)}
        `}
        shapeRendering='geometricPrecision'
    />

    const mouseMovements = useRef<MouseMovement[]>([]);
    const deltaThetas = useRef<DeltaTheta[]>([]);
    const mouseDown = useRef<boolean>(false);

    const calculateDeltaRadians = (mm0: MouseMovement, mm1: MouseMovement): number => {
        const [x0, y0] = [mm0.x - circleX, mm0.y - circleY];
        const [x1, y1] = [mm1.x - circleX, mm1.y - circleY];
        const dp = (x0 * x1) + (y0 * y1);
        const [m0, m1] = [Math.hypot(x0, y0), Math.hypot(x1, y1)];
        // Correct for floating point errors causing value to be greater than 1
        const cos = Math.min(dp / (m0 * m1), 1);
        const angle = Math.acos(cos);

        if (isNaN(angle)) {
            console.log(`NAN: ${[m0, m1, dp, dp / (m0 * m1)]}`);
            return 0;
        }
        const direction = (x0 * y1) - (x1 * y0);

        return direction >= 0 ? angle : -angle;
    }

    return (<>
        <svg
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMin"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            xmlns="http://www.w3.org/2000/svg"
            ref={svgRef}
            style={{
                backgroundColor: BackgroundColor
            }}
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
                const lookbackThresholdMilliseconds = 10;
                let totalLookback = 0
                let totalDelta = 0
                for (let i = deltaThetas.current.length - 1; i >= 0 && totalLookback < lookbackThresholdMilliseconds; i--) {
                    const currentDeltaTheta = deltaThetas.current[i];
                    totalDelta += currentDeltaTheta.rads;
                    totalLookback += currentDeltaTheta.dt;
                }

                // At least 1% change to be considered significant enough to spin.
                if (Math.abs(totalDelta) > 2 * Math.PI * (1 / 100)) {
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
                    const rads = calculateDeltaRadians(mm0, mm1);
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
                    transformOrigin: `${circleXPercentage * 100}% ${circleYPercentage * 100}%`
                }}
            >
                <circle
                    cx={circleX} cy={circleY} r={circleRadius}
                    stroke={LineColor}
                    strokeWidth={StrokeWidth}
                    fill={BackgroundColor}
                />
                {lines}
                {text}
            </g>
            {indicator}
        </svg>
    </>)
}

Spinner.defaultProps = {
    onThetaUpdate: () => { },
    onDeltaThetaUpdate: () => { }
}

export default Spinner 