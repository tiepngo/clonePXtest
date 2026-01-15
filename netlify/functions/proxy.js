exports.handler = async (event, context) => {
    console.log('Proxy function called', event);
    // Get the original URL from environment variable, with default
    const originalBaseUrl = process.env.ORIGINAL_URL || 'https://httpbin.org/ip';
    
    // Construct the full URL by appending the path and query string
    const path = event.path || '';
    const queryString = event.queryStringParameters || {};
    const query = Object.keys(queryString).length > 0 
        ? '?' + Object.keys(queryString).map(key => `${key}=${queryString[key]}`).join('&')
        : '';
    const fullUrl = `${originalBaseUrl}${path}${query}`;
    
    console.log('Redirecting to:', fullUrl);
    // Redirect to the original URL
    return {
        statusCode: 302,
        body: '',
        headers: {
            Location: fullUrl,
            'Cache-Control': 'no-cache'
            }
    };
};
