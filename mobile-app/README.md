# Cordova-Builder

## 🧭 Table of contents

- [✨ About the Application](#-about-the-application)
- [🔧 Technologies](#-technologies)
- [⭐ Features](#-features)
- [📂 Files](#-files)
- [🐳 Docker](#-docker)

## ✨ About the Application

This application create a android app from your web project.

## 🔧 Technologies

<div style="display: flex;">
    <img src="https://skillicons.dev/icons?i=docker" height="75" style="margin-left: 6px; margin-right: 6px;" alt="Docker"/>
    <img src="https://skillicons.dev/icons?i=bash" height="75" style="margin-left: 6px; margin-right: 6px;" alt="Bash"/>
</div>

## ⭐ Features

- Create apk file from web project

## 📂 Files

| 🧩 **Build Step** | 📂 **Path / File** |
|:----------------:|:-------------------:|
| ⚙️ **Input**     | `config.xml`        |
| 🌐 **Web Directory** | `www/`          |
| 📦 **Output**    | `apk/app.apk`       |

## 🐳 Docker

### 🔨 Build container

```bash
sudo docker build -t cordova-builder .
```

### 🚀 Run container

#### Fedora & RHEL

```bash
sudo docker run -v {FOLDER}:/app:Z cordova
```

#### Debian & Ubuntu

```bash
sudo docker run -v {FOLDER}:/app cordova
```