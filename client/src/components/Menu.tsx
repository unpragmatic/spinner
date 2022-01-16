import { SyncedText } from "@syncedstore/core";
import { useState } from "react"
import { BackgroundColor, LighterShadowColor, LineColor, ShadowColor } from "../style/Style";
import SyncedTextInput from "./SyncedTextInput";

interface MenuProps {
  options: SyncedText[]
  name: string | undefined
  onNameChange: (name: string) => void
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
        width: 'min(70%, 24rem)',
        transform: visible ? 'none' : 'translateX(100%)',
        transition: '500ms ease-in-out'
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: BackgroundColor,
          boxShadow: `0px 0px 5px 0px ${ShadowColor}`,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '4rem 1rem 0 1rem',
            rowGap: '4rem'
          }}
        >
          <fieldset
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexBasis: '30rem',
              gap: '0.4rem'
            }}
          >
            <legend
              style={{
                paddingBottom: '0.8rem',
                fontSize: 22
              }}
            >
              Options
            </legend>
            {options.map((option, i) => {
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <SyncedTextInput
                    style={{
                      flex: '1 1 15rem',
                      height: '1.5rem',
                      borderBottom: `1px solid ${ShadowColor}`
                    }}
                    syncedText={option}
                  />
                  <button
                    style={{
                      flex: '0 0 2rem'
                    }}
                    onClick={() => options.splice(i, 1)}
                  >
                    -
                  </button>
                </div>
              )
            })}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <input
                style={{
                  flex: '1 1 15rem',
                  height: '1.5rem',
                  borderBottom: `1px solid ${ShadowColor}`,
                  backgroundColor: LighterShadowColor,
                  boxShadow: `0px 0px 5px 0px ${LighterShadowColor}`
                }}
                disabled={true}
              >
              </input>
              <button
                style={{
                  flex: '0 0 2rem'
                }}
                onClick={() => options.push(new SyncedText(''))}
              >
                +
              </button>
            </div>
          </fieldset>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}
          >
            <label
              htmlFor="name"
              style={{
                paddingBottom: '0.8rem',
                fontSize: 22,
                display: 'block'
              }}
            >
              Name
            </label>
            <input
              style={{
                height: '1.5rem',
                borderBottom: `1px solid ${ShadowColor}`

              }}
              onChange={(e) => props.onNameChange(e.target.value)}
              value={props.name ?? ''}
              disabled={props.name === undefined}
            >
            </input>
          </div>
        </div>
      </div>
    </div>
    <button
      style={{
        position: 'fixed',
        right: '1rem',
        top: '1rem',
        height: '1.5rem'
      }}
      onClick={() => {
        setVisible(!visible);
      }}
    >
      {visible ? '<|' : '|>'}
    </button>
  </>)
}

export default Menu