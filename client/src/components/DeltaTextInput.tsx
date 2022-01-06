import { KeyboardEventHandler } from "react"


interface InsertTextDelta {
  kind: 'INSERT',
  position: number,
  text: string
}

interface DeleteTextDelta {
  kind: 'DELETE',
  position: number,
  length: number
}

interface ReplaceTextDelta {
  kind: 'REPLACE'
  position: number
  length: number
  text: string
}

export type TextDelta = InsertTextDelta | DeleteTextDelta | ReplaceTextDelta

type DeltaTextInputProps = {
  value: string
  onDelta: (value: string, delta: TextDelta) => void
} & Partial<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>>


function DeltaTextInput(props: DeltaTextInputProps) {
  const { value, onDelta } = props;

  const inputProps = { ...props };
  delete inputProps.value;
  delete inputProps.onChange;
  delete inputProps.onKeyDown;

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    let handled = false;
    if (e.key.length === 1 && !e.ctrlKey) {
      if (e.currentTarget.selectionEnd - e.currentTarget.selectionStart !== 0) {
        onDelta(e.currentTarget.value, {
          kind: 'REPLACE',
          position: e.currentTarget.selectionStart,
          length: e.currentTarget.selectionEnd - e.currentTarget.selectionStart,
          text: e.key
        });
      } else {
        onDelta(e.currentTarget.value, {
          kind: 'INSERT',
          position: e.currentTarget.selectionStart,
          text: e.key
        });
      }
      handled = true;
    } else if (e.key === 'Backspace') {
      if (e.currentTarget.selectionEnd - e.currentTarget.selectionStart === 0) {
        onDelta(e.currentTarget.value, {
          kind: 'DELETE',
          position: e.currentTarget.selectionStart - 1,
          length: 1
        });
      } else {
        onDelta(e.currentTarget.value, {
          kind: 'DELETE',
          position: e.currentTarget.selectionStart,
          length: e.currentTarget.selectionEnd - e.currentTarget.selectionStart
        });
      }
      handled = true;
    }
    if (handled) {
      e.preventDefault();
    }
  }

  return (<>
    <input
      {...inputProps}
      value={value}
      onKeyDown={onKeyDown}
    >
    </input>
  </>)
}

DeltaTextInput.defaultProps = {
  inputProps: {}
}

export default DeltaTextInput