import { SyncedText } from "@syncedstore/core";
import { useState } from "react"
import SyncedTextInput from "./SyncedTextInput";

interface MenuProps {
  options: SyncedText[]
}

function Menu(props: MenuProps) {
  const { options } = props;

  const [visible, setVisible] = useState<boolean>(false);
  return (<>
    <div
      style={{
        position: 'fixed',
        right: 0,
        height: '100%',
        width: 'min(30%, 32rem)',
        transform: visible ? 'none' : 'translateX(100%)',
        transition: '500ms ease-in-out'
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#ff0000',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem 1rem 0 1rem',
            rowGap: '0.2rem'
          }}
        >
          <fieldset>
            <legend>Options</legend>
            {options.map((option, i) => {
              return (<div key={i}>
                <SyncedTextInput
                  style={{
                    backgroundColor: 'red'
                  }}
                  syncedText={option}
                />
                <button
                  onClick={() => options.splice(i, 1)}
                >
                  Remove
                </button>
              </div>)
            })}
            <button
              onClick={() => options.push(new SyncedText(''))}
            >
              Add
            </button>
          </fieldset>
        </div>
      </div>
    </div>
    <button
      style={{
        position: 'fixed',
        right: 0,
        top: '1rem',
      }}
      onClick={() => {
        console.log(visible);
        setVisible(!visible);
      }}
    >
      {visible ? '>>' : '<<'}
    </button>
  </>)
}

export default Menu