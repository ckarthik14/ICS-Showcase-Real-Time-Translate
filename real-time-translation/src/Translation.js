import { useState } from 'react';

const Translation = () => {
    const triggerLambda = async (streamArn, communicator, customer_language, agent_language) => {
        const event = {
            "streamARN": streamArn,
            "communicator": communicator,
            "receiver": communicator === "CUSTOMER" ? "AGENT_RECEIVER" : "CUSTOMER_RECEIVER",
            "customer_language": customer_language,
            "agent_language": agent_language
        };

        console.log('Event transmitted: ' + JSON.stringify(event));

        const response = await fetch('https://oi30kkudw4.execute-api.us-east-1.amazonaws.com/dev/triggerLambda' , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        const jsonData = await response.json();
        console.log('Lambda response: ' + JSON.stringify(jsonData));
    };

    return { triggerLambda };
};

export default Translation;
