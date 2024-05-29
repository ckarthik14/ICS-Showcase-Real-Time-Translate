import boto3
from botocore.exceptions import ClientError

def delete_all_items():
    # Initialize a session using Amazon DynamoDB
    session = boto3.Session()
    dynamodb = session.resource('dynamodb')
    
    # Select your table
    table = dynamodb.Table('ICS_Showcase_Call_Handler')
    
    # Scan the table to get all items
    response = table.scan()
    data = response.get('Items', [])
    
    # Loop through each item and delete it if it doesn't match the condition
    with table.batch_writer() as batch:
        for item in data:
            # Check the connectionType value
            if item.get('communicator') not in ['CUSTOMER_SERVER', 'AGENT_SERVER']:
                batch.delete_item(Key={'connectionId': item['connectionId']})
                # If you have a sort key, add it here as well
                # batch.delete_item(Key={'your_primary_key': item['your_primary_key'], 'your_sort_key': item['your_sort_key']})
    
    print(f"All items in the table ICS_Showcase_Call_Handler have been deleted, except those with connectionType 'CUSTOMER_SERVER' or 'AGENT_SERVER'.")

if __name__ == "__main__":
    delete_all_items()