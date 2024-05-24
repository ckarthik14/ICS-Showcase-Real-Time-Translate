import boto3

# Create a Kinesis Video client
client = boto3.client('kinesisvideo')

# Get the data endpoint for PUT_MEDIA
response = client.get_data_endpoint(
    APIName='PUT_MEDIA',
    StreamName='ICS_Showcase_from_customer'
)

# The endpoint URL for subsequent PUT_MEDIA calls
data_endpoint = response['DataEndpoint']

# Now you would typically use this endpoint with a Producer SDK
print(data_endpoint)
