import requests
import os

def handler(event, context):
    # Get the original URL from environment variable, with default
    original_base_url = os.environ.get('ORIGINAL_URL', 'https://httpbin.org/ip')
    
    # Construct the full URL by appending the path and query string
    path = event.get('path', '')
    query_string = event.get('queryStringParameters', {})
    if query_string:
        query = '&'.join([f"{k}={v}" for k, v in query_string.items()])
        full_url = f"{original_base_url}{path}?{query}"
    else:
        full_url = f"{original_base_url}{path}"
    
    # Set up proxy if configured
    proxy_ip = os.environ.get('PROXY_IP')
    proxy_port = os.environ.get('PROXY_PORT')
    proxy_user = os.environ.get('PROXY_USER')
    proxy_pass = os.environ.get('PROXY_PASS')
    
    proxies = None
    if proxy_ip and proxy_port:
        if proxy_user and proxy_pass:
            proxy_url = f"http://{proxy_user}:{proxy_pass}@{proxy_ip}:{proxy_port}"
        else:
            proxy_url = f"http://{proxy_ip}:{proxy_port}"
        proxies = {'http': proxy_url, 'https': proxy_url}
    
    # Instead of fetching, directly redirect to the original URL
    return {
        'statusCode': 302,
        'body': '',
        'headers': {
            'Location': full_url,
            'Cache-Control': 'no-cache'
        }
    }