import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  onAuthStateChanged
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyCNIiRcuKvD0O81PGszjR6bNGGGCXNWC_o",
  authDomain: "juzmanager.firebaseapp.com",
  projectId: "juzmanager",
  storageBucket: "juzmanager.firebasestorage.app",
  messagingSenderId: "444689419534",
  appId: "1:444689419534:web:e0cb11f55e57354eaadb5f"
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {

  @ViewChild('webappFrame', { static: true })
  iframe!: ElementRef<HTMLIFrameElement>;

  auth!: ReturnType<typeof getAuth>;
  provider!: GoogleAuthProvider;

  constructor() {
    // 1️⃣ Initialisation Firebase
    initializeApp(firebaseConfig);

    // 2️⃣ Création des instances Auth et Provider après initialisation
    this.auth = getAuth();
    this.provider = new GoogleAuthProvider();
  }

  ngOnInit() {

    // 🔁 Demande de login depuis l’iframe


    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'GOOGLE_LOGIN') {
        await signInWithRedirect(this.auth, this.provider);
      }
    });
    

    // ✅ État Auth

    onAuthStateChanged(this.auth, (user: any) => {
      if (user) {
        this.iframe.nativeElement.contentWindow?.postMessage({
          type: 'AUTH_SUCCESS',
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          }
        }, '*');
      }
    });
    
  }
}
