# Cloudflare R2 Setup Guide for Sycamore Gallery

## Prerequisites
- Cloudflare account
- R2 subscription (has a free tier)

## Step-by-Step Setup

### 1. Enable R2 in Cloudflare Dashboard
1. Login to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage** in the sidebar
3. If not enabled, click **Enable R2** and follow the setup process

### 2. Create the Bucket
1. Click **Create bucket**
2. Name it exactly: `sycamore-gallery`
3. Choose a location (recommended: closest to your users)
4. Click **Create bucket**

### 3. Get Your Account ID
1. In the R2 dashboard, you'll see your **Account ID** at the top
2. Copy this value - you'll need it for `R2_ACCOUNT_ID`

### 4. Create API Token
1. Click **Manage R2 API tokens** (or go to the API tokens section)
2. Click **Create API token**
3. Configure the token:
   - **Token name**: `Sycamore Gallery Upload`
   - **Permissions**: 
     - ✅ `Object Read`
     - ✅ `Object Write`
   - **Account resources**: 
     - ✅ Include - All accounts
   - **Zone resources**: 
     - ✅ Include - All zones (or select specific zones)
   - **Bucket resources**:
     - ✅ Include - Specific bucket: `sycamore-gallery`
4. Click **Continue to summary**
5. Click **Create token**

### 5. Save Your Credentials
After creating the token, you'll see:
- **Access Key ID** (copy this)
- **Secret Access Key** (copy this - you won't see it again!)

### 6. Configure Environment Variables
Create/update `.env.local` in your `sycamore-admin` folder:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID="your-account-id-here"
R2_ACCESS_KEY_ID="your-access-key-id-here"  
R2_SECRET_ACCESS_KEY="your-secret-access-key-here"
R2_BUCKET_NAME="sycamore-gallery"

# Other existing variables...
MONGODB_URI="mongodb+srv://admin:SDoupCGoa280Z0S8@cluster0.hbynv28.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET="your-jwt-secret-key-here"
PAYSTACK_SECRET_KEY="sk_test_85d0fedf82b1044b8034eb7d550ba571e0ea22c6"
PAYSTACK_PUBLIC_KEY="pk_test_847967189b962acc11e39b8ed4b1d11ecafe0cb3"
```

### 7. Install Required Dependencies
```bash
cd sycamore-admin
npm install @aws-sdk/client-s3 uuid
```

### 8. Configure Public Access (Optional)
If you want direct public access to files:

1. Go to your bucket settings
2. Click **Settings** tab
3. Under **Custom domains**, you can:
   - Use R2.dev subdomain (free but has usage limits)
   - Or connect a custom domain

For now, the upload API will return URLs that work through your application.

### 9. Test the Setup
1. Restart your development server
2. Go to the Gallery page in your admin dashboard
3. Try uploading a file
4. Check the Cloudflare R2 dashboard to see if files appear

## Environment Variables Summary

Replace these values with your actual Cloudflare credentials:

```env
R2_ACCOUNT_ID="abc123def456"  # From R2 dashboard
R2_ACCESS_KEY_ID="abcdef123456789"  # From API token creation
R2_SECRET_ACCESS_KEY="your-secret-key-here"  # From API token creation
R2_BUCKET_NAME="sycamore-gallery"  # Bucket name (already set)
```

## Troubleshooting

### Common Issues:
1. **403 Forbidden**: Check your API token permissions
2. **Bucket not found**: Ensure bucket name matches exactly
3. **Network errors**: Verify your Account ID is correct

### File Access:
- Files uploaded through the API will be accessible via the application
- For direct public access, you'll need to configure custom domains or R2.dev subdomain
- The current implementation stores files securely and serves them through your application

## Security Notes
- API tokens have specific permissions - never share them
- Store environment variables securely
- Consider using different buckets for different environments (dev/staging/prod)
- Files are private by default unless you configure public access

## Costs
- R2 has a generous free tier: 10 GB storage, 1 million Class A operations per month
- After free tier: $0.015/GB/month for storage
- Operations: $4.50/million Class A operations, $0.36/million Class B operations