Project Name: SocialConnect

A feature-rich social media application built with React Native and Firebase, designed to provide a seamless social networking experience for users to connect, 
share posts, and communicate in real-time.

 Features:
User Authentication: Secure Sign-up and Login functionality.

Social Feed: Real-time home feed to view posts from other users.

Interactive Posts: Ability to create, view, and interact with posts.

Real-time Updates: Integration with Firebase Firestore for instant data synchronization.

Navigation: Intuitive multi-stack navigation for a smooth user experience.

Tech Stack:
Frontend: React Native (TypeScript)

Backend/Database: Firebase (Firestore, Authentication)

State Management: [e.g., Context API / Redux / Zustand]

Navigation: React Navigation

Build Tool: Metro Bundler

Prerequisites:
Ensure you have the following installed on your system:

Node.js (LTS version recommended)

React Native CLI

Android Studio (for Android build tools and SDKs)

A physical Android device or Emulator

Getting Started
1. Clone the Repository
2. Install Dependencies

npm install

3. Set up Firebase
Place your google-services.json file in the android/app/ directory.

Configure your Firebase project in the Firebase Console.

4. Run the Application
For Android:

Connect your device via USB or start an emulator.

Ensure you have the Metro server running:

npx react-native start --reset-cache

In a separate terminal window, run:
npx react-native run-android

 Project Structure:

/src
  /components    # Reusable UI components
  /navigation    # App navigation stacks
  /screens       # Core application screens
  /services      # Firebase configuration and logic
  /types         # TypeScript definitions
App.tsx          # Application entry point

Troubleshooting:
White Screen on Launch: Ensure the Metro bundler is correctly linked to your device. Run adb reverse tcp:8081 tcp:8081.

Firestore Errors: If you see a warning regarding "Firestore Index," check your Metro terminal for a clickable link provided by Firebase
to automatically generate the required index.

Build Errors: If build errors occur, run cd android && ./gradlew clean to clear the build cache.

 License
This project is licensed under the MIT License


Developed by: App Development Intern
              Aleena Khan.
