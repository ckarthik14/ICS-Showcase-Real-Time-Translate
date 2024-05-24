import { useState } from 'react';

const Translation = () => {
    const [data, setData] = useState({});

    const startTranslation = async (translationParams) => {
        const event = {
            streamARN: contactAttributes.streamARN,
            startFragmentNum: contactAttributes.startFragmentNum,

            // Just some unique ID to distinguish the call. Required for translation to work correctly
            connectContactId: contactAttributes.connectContactId,
            transcribeCall: "false",
            saveCallRecording: "false",
            transcribeLanguageCode: "en-US",
            translateFromLanguageCode: "en",
            translateToLanguageCode: "es",
            pollyLanguageCode: "es-ES",
            pollyVoiceId: "Lucia",
            streamAudioFromCustomer: "true",
            streamAudioToCustomer: "false",
            customerPhoneNumber: contactAttributes.customerPhoneNumber,
        };

        console.log('Event transmitted: ' + JSON.stringify(event));

        const response = await fetch('https://jei62447y0.execute-api.us-east-1.amazonaws.com/dev/triggerLambda', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        const jsonData = await response.json();
        console.log('Lambda response: ' + JSON.stringify(jsonData));
        setData(jsonData);
    };

    return { data, triggerFromCustomerTranslation };
};

export default useLambdaTrigger;
