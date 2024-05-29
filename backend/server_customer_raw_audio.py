import websocket
import boto3
import json
import time

def on_message(ws, message):
    # Assuming the message is audio data bytes
    audio = json.loads(message)["audio_data"]
    stream_name = 'ICS_Showcase_from_customer_audio_final'
    partition_key = 'audio'

    # Initialize a Kinesis client
    kinesis_client = boto3.client('kinesis', region_name='us-east-1')

    # Send data to Kinesis
    try:
        kinesis_client.put_record(
            StreamName=stream_name,
            Data=audio,
            PartitionKey=partition_key
        )
    except Exception as e:
        print("Failed to send data to Kinesis Data Stream:", e)

def on_error(ws, error):
    print("Error:", error)

def on_close(ws, close_status_code, close_msg):
    print("### closed ###")
    # Reconnect after a delay
    time.sleep(10)  # Delay before restarting the connection
    start_websocket()

def on_open(ws):
    print("WebSocket opened")

def start_websocket():
    ws_url = 'wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=CUSTOMER_SERVER&connectionType=RAW_AUDIO'
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp(ws_url,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()

if __name__ == "__main__":
    start_websocket()
