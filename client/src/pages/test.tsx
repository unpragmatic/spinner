import { SyncedText } from "@syncedstore/core";

import SyncedTextInput from "../components/SyncedTextInput";
import { useSyncedOptions } from "../services/SyncedOptions";


function TestPage() {
    const options = useSyncedOptions();

    return (
        <div style={{
            width: '100%',
            height: '100%'
        }}>
            {options &&

                options.map((text, idx) => <>
                    <SyncedTextInput syncedText={text} />
                    <button onClick={() => options.splice(idx, 1)}>Remove</button>
                </>)
            }
            {
                options && <button
                    onClick={() => options.push(new SyncedText(''))}
                >
                    Add
                </button>
            }
        </div>
    )
}

export default TestPage