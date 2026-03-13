# Gossip with Go 
A modern, feature-rich web forum built with Go and React/TypeScript.

## Overview
This project is a web forum application inspired by Reddit, developed as part of the CVWO AY2025/26 Assignment. It provides a platform for users to engage in topic-based discussions, share multimedia posts, and interact through a structured comment system.

## Tech Stack
Frontend: React, TypeScript, Material UI (MUI)
Backend: Go (Golang)
Authentication: Token-based Authentication using JSON Web Tokens (JWT)
Database: MySQL
API Style: RESTful API

##  Key Features
Account-based Authentication (Level 5): Secure registration and login system using JWT for stateless session management.
Comprehensive CRUD: Full Create, Read, Update, and Delete capabilities for Topics, Posts, and Comments.
Advanced Social Features: - Toggle-based Like/Dislike system for posts.Share,comment for post.
  Nested Comment Replies: Threaded conversations with visual indentation logic.
  Engagement Tools: Comment Likes and Author-exclusive Comment Pinning.
Multimedia Support: Ability to attach Image URLs to posts for richer content.
Robust Access Control: Author-only permissions enforced for editing and deleting content.
Guest Experience: Read-only access and search topic and share post functionality for unauthenticated users.

### AI Usage
Use of Gemini AI to learn more about how JWT works

##  Getting Started

### Prerequisites
- Go (Latest version)
- Node.js & npm
- MySQL Server

### Installation & Setup

1. Clone the repository:
   ```bash
    git clone https://github.com/Momo1811/gossip-with-go.git
    cd gossip-with-go
   ```

### 2.Database Setup
Create a database
Import schema.sql : mysql -u root -p gossip_db < schema.sql
Configure Credentials


### 3.Backend Configuration

```bash
go mod tidy
go run .
```

### 4.Frontend Configuration

```bash
cd frontend 
npm install 
npm start
```

##Deployment
The application is live and can be accessed via the link below:
 **Frontend (Live demo):**  https://gossip-with-go-fe.onrender.com
 **Backend  API:** https://gossip-with-go-n9z1.onrender.com

### Important Note (How to use):
Since the backend is hosted on a free instance, it may "sleep" after inactivity. To ensure the app works correctly, please follow these steps:

1. **Wake the Backend:** Click the Backend Link above first. 
   * (You might see a "Not Found" or a blank page—don't worry, this is normal and you can ignore it. It is just to wake up the server).
2. **Access the App:** Once the backend is awake, open the Frontend Link to start using the forum.
3. **Wait a Moment:** If the site doesn't load data immediately, please give it about 20-40 seconds to spin up.

## Author
-**Name:** Myint Mo Phoo
-**Date:** March 2026
-**Context:** CVWO AY2025/26 Assignment Submission