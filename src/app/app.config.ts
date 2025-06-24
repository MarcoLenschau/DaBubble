// import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { routes } from './app.routes';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// import { provideAuth, getAuth } from '@angular/fire/auth';
// import { environment } from '../envenvironments/environment';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp(environment.firebase)), provideFirestore(() => getFirestore()),
//      provideAuth(() => getAuth()),]
// };


import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAuth, provideAuth, setPersistence, indexedDBLocalPersistence } from '@angular/fire/auth';
import { environment } from '../envenvironments/environment';

const app = initializeApp(environment.firebase);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => app),
    provideFirestore(() => initializeFirestore(app, {
      localCache: persistentLocalCache()
    })),
    provideAuth(() => {
      const auth = getAuth();
      setPersistence(auth, indexedDBLocalPersistence).catch(err => {
        console.warn('Auth Persistence konnte nicht aktiviert werden:', err);
      });
      return auth;
    }),]
};

