const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

exports.handler = async (event, context) => {
    console.log('Proxy function called', event);
    console.log('event.path:', event.path);
    // Get the original URL from environment variable, with default
    const originalBaseUrl = process.env.ORIGINAL_URL || 'https://httpbin.org/ip';
    
    // Construct the full URL by appending the path and query string
    // Remove the function path from the request path
    const functionPath = '/.netlify/functions/proxy';
    const path = (event.path || '').startsWith(functionPath) 
        ? (event.path || '').substring(functionPath.length)
        : (event.path || '');
    console.log('extracted path:', path);
    const queryString = event.queryStringParameters || {};
    const query = Object.keys(queryString).length > 0 
        ? '?' + Object.keys(queryString).map(key => `${key}=${queryString[key]}`).join('&')
        : '';
    const fullUrl = `${originalBaseUrl}${path}${query}`;
    
    console.log('Fetching from:', fullUrl);
    
    // Set up proxy agent if configured
    let agent = null;
    const proxyIp = process.env.PROXY_IP;
    const proxyPort = process.env.PROXY_PORT;
    const proxyUser = process.env.PROXY_USER;
    const proxyPass = process.env.PROXY_PASS;
    
    if (proxyIp && proxyPort) {
        const proxyUrl = proxyUser && proxyPass 
            ? `http://${proxyUser}:${proxyPass}@${proxyIp}:${proxyPort}`
            : `http://${proxyIp}:${proxyPort}`;
        agent = new HttpsProxyAgent(proxyUrl);
    }
    
    // Fetch the content
    try {
        const response = await fetch(fullUrl, { agent });
        const body = await response.text();
        
        console.log('Response status:', response.status);
        // Return the response
        return {
            statusCode: response.status,
            body: body,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        console.error('Proxy connection failed:', error);
        // Try to get current IP
        let currentIp = 'Unknown';
        try {
            const ipResponse = await fetch('https://httpbin.org/ip');
            const ipData = await ipResponse.json();
            currentIp = ipData.origin;
        } catch (ipError) {
            console.error('Failed to get current IP:', ipError);
        }
        
        // Return a warning page
        return {
            statusCode: 200,
            body: `
<!DOCTYPE html>
<html>
<head>
    <title>Proxy Connection Failed</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: red; }
        .info { background: #f0f0f0; padding: 10px; margin: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1 class="error">Proxy Connection Failed</h1>
    <p>Unable to connect to the proxy server or fetch the requested content.</p>
    <div class="info">
        <p><strong>Current IP (Netlify):</strong> ${currentIp}</p>
        <p><strong>Proxy IP:</strong> Not available (connection failed)</p>
    </div>
    <p>Please check your proxy settings and try again.</p>
    <p>Original URL: ${fullUrl}</p>
</body>
</html>`,
            headers: {
                'Content-Type': 'text/html'
            }
        };
    }
};
