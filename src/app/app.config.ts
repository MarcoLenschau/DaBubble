import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "dabubble-78e7f", appId: "1:245552915538:web:0de528037a152f6b58ab8b", storageBucket: "dabubble-78e7f.firebasestorage.app", apiKey: "AIzaSyDIEYY0u607-Lf9mnEYF3pFVh3BFNZ3k2c", authDomain: "dabubble-78e7f.firebaseapp.com", messagingSenderId: "245552915538" })), provideFirestore(() => getFirestore())]
};
