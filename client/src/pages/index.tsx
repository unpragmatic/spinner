import { useEffect, useRef, useState } from "react"
import Menu from "../components/Menu";
import Spinner from "../components/Spinner"

function HomePage() {
  // const [socket, setSocket] = useState(undefined);
  const [rads, setRads] = useState(0);
  const [options, setOptions] = useState<string[]>(['tetris']);
  
  const socketRef = useRef<WebSocket>(undefined);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;
    socketRef.current.addEventListener('message', (event) => {
      console.log(`Message from server: ${event.data}`);
    });

    return () => socket.close();
  }, []);

  // useEffect(function() {
  //   const interval = setInterval(function() {
  //     setRads(2*Math.PI * Math.random());
  //   }, 500)

  //   return () => clearInterval(interval);
  // }, [])

  const angularVelocityRef = useRef<number>(0);
  const lastAnimationFrame = useRef<number | undefined>();
  const lastAnimationTimestamp = useRef<DOMHighResTimeStamp | undefined>();
  const step = (timestamp) => {
    if (lastAnimationTimestamp.current === undefined) {
      lastAnimationTimestamp.current = timestamp;
    }

    const delta = timestamp - lastAnimationTimestamp.current;
    setRads(rads => 
      rads + (angularVelocityRef.current * delta)
    );

    angularVelocityRef.current += (-angularVelocityRef.current * delta * (1/1000));

    lastAnimationFrame.current = requestAnimationFrame(step);
    lastAnimationTimestamp.current = timestamp;
  };

  useEffect(() => {
    lastAnimationFrame.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(lastAnimationFrame.current);
  }, [])


  return (
    <div>
      <Menu
        options={options}
        onOptionsChange={setOptions}
      />
      <Spinner
        rads={rads}
        options={options}
        onThetaUpdate={(delta) => {
          console.log(delta);
          
          if (socketRef.current !== undefined && socketRef.current.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({
              type: 'deltaTheta',
              deltaTheta: delta.rads
            })
            socketRef.current.send(msg);
          }
          setRads(rads => rads + delta.rads);
        }}
        onDeltaThetaUpdate={(delta) => {
          angularVelocityRef.current = delta.deltaRads / delta.dt;
          if (socketRef.current !== undefined && socketRef.current.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({
              type: 'dTheta',
              dTheta: (delta.deltaRads / delta.dt)
            })
            socketRef.current.send(payload);
          }
        }}
      />
      <button
        onClick={() => {
          angularVelocityRef.current = (2*Math.PI / 500) * (((options.length * 3) * Math.random()));
        }}
      >
        Spin
      </button>
    </div>
  )
}

export default HomePage