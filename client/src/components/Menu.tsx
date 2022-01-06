import { useState } from "react"

interface MenuProps {
  options: string[]
  onOptionsChange: (options: string[]) => void
}

function Menu(props: MenuProps) {
  const { options, onOptionsChange } = props;

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
                <input
                  type='text'
                  aria-label={`Option ${i}`}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[i] = e.target.value;
                    onOptionsChange(newOptions);
                  }}
                  value={option}
                >
                </input>
                <button>
                  Remove
                </button>
              </div>)
            })}
            <button
              onClick={() => onOptionsChange([...options, ''])}
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