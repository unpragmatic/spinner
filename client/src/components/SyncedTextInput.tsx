import { SyncedText } from "@syncedstore/core";
import DeltaTextInput, { TextDelta } from "./DeltaTextInput";

type DeltaTextInputProps = {
    syncedText: SyncedText
} & Partial<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>>


function SyncedTextInput(props: DeltaTextInputProps) {
    const { syncedText } = props;

    const inputProps = { ...props };
    delete inputProps.syncedText;

    const onDelta = (_value: string, delta: TextDelta) => {
        if (delta.kind === 'INSERT') {
            syncedText.insert(delta.position, delta.text);
        } else if (delta.kind === 'DELETE') {
            syncedText.delete(delta.position, delta.length);
        } else if (delta.kind === 'REPLACE') {
            syncedText.delete(delta.position, delta.length);
            syncedText.insert(delta.position, delta.text);
        }
    }

    return (<>
        <DeltaTextInput
            {...inputProps}
            value={syncedText.toString()}
            onDelta={onDelta}
        />
    </>)
}

export default SyncedTextInput