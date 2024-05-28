import websocket
import boto3
import json

from base64 import b64encode, b64decode

def on_message(ws, message):
    # Assuming the message is audio data bytes
    audio = json.loads(message)["audio_data"]

    stream_name = 'ICS_Showcase_from_customer_audio'
    partition_key = 'audio'  # This should be specific to your use case

    # Initialize a Kinesis client
    kinesis_client = boto3.client('kinesis')

    # Send data to Kinesis
    try:
        response = kinesis_client.put_record(
            StreamName=stream_name,
            Data=audio,  # base64 audio
            PartitionKey=partition_key
        )
        print("Successfully sent data to Kinesis Data Stream:", response)
    except Exception as e:
        print("Failed to send data to Kinesis Data Stream:", e)

def on_error(ws, error):
    print("Error:", error)

def on_close(ws, close_status_code, close_msg):
    print("### closed ###")

def on_open(ws):
    print("WebSocket opened")

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws_url = 'wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=CUSTOMER_SERVER&connectionType=RAW_AUDIO'  # Modify this to your WebSocket server URL
    ws = websocket.WebSocketApp(ws_url,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)

    # Run the WebSocket client
    ws.run_forever()
