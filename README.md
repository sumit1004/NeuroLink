NeuroLink – Intelligent Companion for Alzheimer’s Care
Smart, Safe, and Connected Care for Alzheimer’s Patients

Website live link:- (https://sumit1004.github.io/NeuroLink/)

📌 Overview

NeuroLink is a Web 2.0 powered care-companion system designed to support Alzheimer’s and dementia patients by improving memory assistance, safety monitoring, and daily interactions.
The system includes:

A patient-friendly mobile app (React Native + Expo)

A family/caregiver web dashboard (Web 2.0)

Smartwatch health tracking

AI-driven reminders, summaries, and face recognition

NeuroLink ensures that patients can live safer, more independent lives while keeping families informed in real-time.

🎯 Problem It Solves

Alzheimer’s patients often struggle with:

Forgetting people and relationships

Getting lost outdoors

Forgetting daily routines

Feeling confused or scared

Losing track of health conditions

Families face challenges like:

Not knowing the patient’s location

No way to monitor daily activities

Difficulty keeping health and routine updated

Fear of emergencies

NeuroLink solves these problems using a simple Web 2.0 ecosystem.

🚀 Features
👨‍⚕️ 1. Face Recognition for Known People

Patients can point the camera at someone →
The app identifies the person & shows their relationship.

📍 2. Live Location Tracking

The patient’s location is tracked in real-time and sent to the family dashboard.

❤️ 3. Smartwatch Health Monitoring

Tracks:

Heart rate

Blood pressure

Activity

If the watch is removed → family gets instant alerts.

🏠 4. Navigation to Home

A simple “Take Me Home” button shows the safest route.

💬 5. AI Chat Companion

Patients can chat with AI for:

Questions

Emotional support

Reminders

📝 6. Notes & Memory Log

Patients can write and save notes they want to remember.

📅 7. Family Dashboard (Web 2.0)

Families can:

Upload known people

Add routines & tasks

View all conversations

Track health and location

Receive alerts

Manage mood logs

Monitor smartwatch data

📞 8. Daily Summary

AI generates a recap:

Who the patient met

What they talked about

Where they went

Mood tracking

🛠 Tech Stack
Frontend

React Native (Expo)

HTML / CSS / JavaScript (Web Dashboard)

Backend / Cloud

Firebase (Auth, Realtime DB, Storage)

Supabase (optional)

BLE (react-native-ble-plx)

AI / ML

On-device face recognition (TensorFlow Lite / ML Kit)

AI chat summaries

Smartwatch Integration

BLE-based health reading

Auto-sync to cloud

Watch removal alerts

🧠 Architecture
```
Patient Mobile App (React Native)
     |
     | BLE + Camera + GPS
     ↓
Firebase Realtime Database
     |
     ↓
Family Web Dashboard (Web 2.0)
```

Everything syncs through the cloud in real-time.

🧩 Challenges I Ran Into
🔸 BLE not working in Expo Go

Solution: Used Expo custom dev client + local Android Studio build.

🔸 Firebase not saving data

Solution: Fixed patient ID generation + AsyncStorage + real-time listeners.

🔸 EAS build failing

Solution: Built local APK via Android Studio using expo prebuild.

🔸 Missing Android SDK

Solution: Installed full SDK using SDK Manager & set system variables.

🔸 Face recognition errors

Solution: Switched to ML Kit/TFLite for fast mobile-friendly detection.

🧪 Screenshots (Add yours here)
```
/screenshots
    dashboard.png
    patient-home.png
    face-recognition.png
    smartwatch.png
    location.png
```
🔧 Installation & Setup
📱 Install and run mobile app
```
npm install
expo prebuild
npm run android
```
🌐 Run Web Dashboard
```
open index.html
```
🔥 Setup Firebase
```
Inside firebase.js:

export const database = getDatabase(app);
```

Add your config.
```
📦 Build APK (Local Build)
npx expo prebuild
open android/ in Android Studio
Build → Build APK(s)
```

APK file:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
🔮 Future Improvements
Medicine reminder system
Fall detection using sensors
Complete offline mode for outdoor use

Direct video calling

Doctor dashboard with health analytics

AI-based emotion detection

🙌 Team / Contribution

Sumit Kumar	Leader • App & Web Developer

Arman Mishra	Research & Presentation

Priyanshu Pandey	AI Agent & Automation

Soumodeep Santra	UI/UX Designer


