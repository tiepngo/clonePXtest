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
    
    // Check for debug parameter
    const isDebug = queryString.debug === '1';
    
    // Set up proxy agent if configured
    let agent = null;
    const proxyIp = process.env.PROXY_IP;
    const proxyPort = process.env.PROXY_PORT;
    const proxyUser = process.env.PROXY_USER;
    const proxyPass = process.env.PROXY_PASS;
    
    let proxyInfo = 'No proxy configured';
    if (proxyIp && proxyPort) {
        const proxyUrl = proxyUser && proxyPass 
            ? `http://${proxyUser}:${proxyPass}@${proxyIp}:${proxyPort}`
            : `http://${proxyIp}:${proxyPort}`;
        console.log('Using proxy:', proxyUrl);
        agent = new HttpsProxyAgent(proxyUrl);
        proxyInfo = `Using proxy: ${proxyUrl}`;
    } else {
        console.log('No proxy configured');
    }
    
    // Fetch the content
    try {
        const response = await fetch(fullUrl, { agent });
        const body = await response.text();
        
        console.log('Response status:', response.status);
        
        if (isDebug) {
            // Return debug page
            return {
                statusCode: 200,
                body: `
<!DOCTYPE html>
<html>
<head>
    <title>Proxy Debug</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        .debug { background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Proxy Debug Information</h1>
    <div class="debug">
        <strong>Original URL:</strong> ${process.env.ORIGINAL_URL || 'https://httpbin.org/ip'}<br>
        <strong>Full URL:</strong> ${fullUrl}<br>
        <strong>Proxy Config:</strong> ${proxyInfo}<br>
        <strong>Response Status:</strong> ${response.status}<br>
        <strong>Response Headers:</strong><br>
        <pre>${Array.from(response.headers.entries()).map(([k,v]) => `${k}: ${v}`).join('\n')}</pre>
    </div>
    <h2>Response Body:</h2>
    <pre>${body}</pre>
</body>
</html>`,
                headers: {
                    'Content-Type': 'text/html'
                }
            };
        }
        
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
