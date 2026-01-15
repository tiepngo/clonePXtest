# Netlify Proxy App

This is a Netlify app that acts as a proxy to another link. The Netlify URL will be different from the original URL.

## Setup

1. Set the `ORIGINAL_URL` environment variable to the actual URL you want to proxy to. You can do this in the Netlify dashboard under Site settings > Environment variables, or locally in a `.env` file for testing.

2. (Optional) If you want to use your own proxy server, set the following environment variables:
   - `PROXY_IP`: The IP address of your proxy server.
   - `PROXY_PORT`: The port of your proxy server.
   - `PROXY_USER`: The username for proxy authentication (optional).
   - `PROXY_PASS`: The password for proxy authentication (optional).

3. **Prepare your repository:**
   - Initialize a Git repository: `git init`
   - Add all files: `git add .`
   - Commit the changes: `git commit -m "Initial commit"`

4. **Push to a Git hosting service:**
   - Create a repository on GitHub, GitLab, or Bitbucket.
   - Add the remote: `git remote add origin <your-repo-url>`
   - Push the code: `git push -u origin main`

5. **Deploy to Netlify:**
   - Go to [Netlify](https://app.netlify.com/) and sign in.
   - Click "New site from Git".
   - Connect your Git repository.
   - Netlify will detect the `netlify.toml` and configure the build settings automatically.
   - In "Site settings" > "Environment variables", add your configuration:
     - `ORIGINAL_URL`: Your target URL (default is `https://httpbin.org/ip` for testing).
     - `PROXY_IP`, `PROXY_PORT`, `PROXY_USER`, `PROXY_PASS`: Your proxy details (if using).
   - Click "Deploy site".

6. **Access your deployed proxy:**
   - Once deployed, your site URL will be something like `https://your-site-name.netlify.app`.
   - The proxy function is available at: `https://your-site-name.netlify.app/.netlify/functions/proxy`
   - Test it by visiting that URL in your browser.

## Usage

Once deployed, the proxy will be available at:

`https://your-netlify-site.netlify.app/.netlify/functions/proxy`

Accessing this URL will redirect you to the original URL (set via `ORIGINAL_URL` environment variable), with the path and query parameters appended. If proxy settings are configured, the redirect validation (if any) will use your specified proxy server.

For example, if `ORIGINAL_URL` is set to `https://example.com`, a request to `https://your-netlify-site.netlify.app/.netlify/functions/proxy/some/path?param=value` will redirect to `https://example.com/some/path?param=value`.

## Testing the Proxy

To verify that your proxy is working, the default `ORIGINAL_URL` is set to `https://httpbin.org/ip`, which returns your IP address in JSON format.

- Without proxy: Accessing the proxy URL will redirect to httpbin.org/ip, showing Netlify's IP.
- With proxy configured: The redirect will still go to httpbin.org/ip, but if your browser or the request uses the proxy, it may show different behavior. Note: The proxy settings affect the function's internal requests, not the client's redirect.

You can change `ORIGINAL_URL` to any target URL as needed.

## Local Development

To test locally, install Netlify CLI:

```bash
npm install -g netlify-cli
```

Then run:

```bash
netlify dev
```

The function will be available at `http://localhost:8888/.netlify/functions/proxy`