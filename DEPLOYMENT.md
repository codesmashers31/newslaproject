# SLA Project - Deployment Guide

This guide outlines the step-by-step process to deploy the **Frontend** to Vercel, the **Backend** to Render, and build the **Mobile application**.

---

## 1. Backend Deployment (Render Web Service)

Deploy the backend as a **Web Service** on Render.

### Render Configuration Settings:
* **Runtime**: `Node`
* **Root Directory**: `backend`
* **Build Command**: `npm install`
* **Start Command**: `node server.js`

### Environment Variables (`env`):
Set the following variables in the Render dashboard under **Environment**:
* `NODE_ENV`: `production`
* `PORT`: `5000` (Render handles this dynamically)
* `MONGODB_URI`: *Your MongoDB Atlas connection string*
* `JWT_SECRET`: *A secure random string (e.g. your jwt secret)*

> [!NOTE]
> **File Uploads (Photos & Resumes)**: Render Web Services have transient filesystems. To persist uploads:
> 1. In Render, add a **Persistent Disk** (size `1 GB` is plenty) to your Web Service.
> 2. Mount Path: `/opt/render/project/src/backend/uploads`

---

## 2. Frontend Deployment (Vercel)

Deploy the frontend to **Vercel** for high-performance static hosting.

### Vercel Configuration Settings:
1. Import your project repository into Vercel.
2. Under **Project Settings**, configure:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://your-backend-service.onrender.com/api` (Replace with your actual Render backend URL)
4. Click **Deploy**.

> [!TIP]
> We have added a [vercel.json](file:///e:/slaproject/frontend/vercel.json) file to the `frontend` folder containing a rewrite rule:
> ```json
> {
>   "rewrites": [
>     { "source": "/(.*)", "destination": "/index.html" }
>   ]
> }
> ```
> Vercel will automatically detect this rule and rewrite all nested routing paths (e.g., `/admin/students`) to `index.html`, resolving any client-side routing 404 errors.

---

## 3. Mobile App Build (Expo & EAS)

To build the standalone `.apk` (Android) or `.ipa` (iOS) application using EAS (Expo Application Services):

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Log in & Configure
```bash
# Log in to your Expo developer account
eas login

# Initialize EAS project (run inside the 'mobile' directory)
eas build:configure
```

### Step 3: Configure environment variables in `eas.json`
Open the generated `mobile/eas.json` file and define the production backend API URL in the production profile environment:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-service.onrender.com/api"
      }
    }
  }
}
```

### Step 4: Run Build Command
Run these commands inside the `mobile` folder:
* **For Android (.apk)**:
  ```bash
  eas build --platform android --profile production
  ```
* **For iOS (.ipa)**:
  ```bash
  eas build --platform ios --profile production
  ```
EAS will build the mobile app in the cloud and provide a download link when finished.
