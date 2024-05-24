import boto3

def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('WebSocketConnections')

    if event['requestContext']['eventType'] == 'CONNECT':
        table.put_item(Item={'connectionId': connection_id})
    elif event['requestContext']['eventType'] == 'DISCONNECT':
        table.delete_item(Key={'connectionId': connection_id})

    return {'statusCode': 200}
