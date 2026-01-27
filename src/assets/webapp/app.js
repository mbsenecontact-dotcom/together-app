// app.js (version nettoyée + gestion public/private + admin)
import { auth, provider, db, SESSIONS_COLLECTION } from "./firebase.js";
import {
  doc, setDoc, updateDoc, onSnapshot, getDoc, serverTimestamp,
  collection, getDocs, addDoc, query, where, orderBy, getFirestore, arrayUnion, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, sendEmailVerification, updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ---------- Elements ---------- */
const searchInput = document.getElementById("searchCampaignInput");
const sessionsContainer = document.getElementById("sessions");
const btnToutes = document.getElementById("toutes");
const btnLectures = document.getElementById("lectures");
const btnHistorique = document.getElementById("historique");
const campaignTitle = document.getElementById("campaignTitle");
const profileEditionLink = document.getElementById("profileEdition");
const menuUserAvatar = document.getElementById("menuUserAvatar");


const filterButtons = [btnToutes, btnLectures, btnHistorique];



const UTILITAIRE_DATA = {
  prieres: [
    {
      title: "Invocation de clôture",
      description: "Doua à réciter en fin d’assemblée.",
      content: `
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.
        Allahumma la sahla illa ma ja‘altahu sahla,
        wa anta taj‘alu al-hazna idha shi’ta sahla.

      `
    },
    {
      title: "Doua de fin de lecture",
      description: "Invocation après lecture du Coran.",
      content: "assets/pdf/doua-fin-coran.pdf"
    }
    , 
    {
      title: "Seydil Hadji Omar TALL (RTA)",
      description: "Doua de fin de lecture.",
      content: "Bientôt ICI"
    }, 
    {
      title: "Seydil Hadji Malick SY (RTA)",
      description: "Doua de fin de lecture.",
      content: "Bientôt ICI"
    }, 
    {
      title: "Seydil Hadji Ibrahima NIASS (RTA)",
      description: "Doua de fin de lecture.",
      content: "Bientôt ICI"
    }, 
    {
      title: "Serigne Touba(RTA)",
      description: "Doua de fin de lecture.",
      content: "Bientôt ICI"
    }
  ],

  coran: [
    {
      title: "Juz Amma",
      description: "Dernière partie du Coran (Juz 30).",
      content: "Bientôt"
    },
    {
      title: "Juz Tabarak",
      description: "Partie 29 du Coran.",
      content: "Bientôt"
    }
  ],

  zikr: [
    {
      title: "Zikr du matin",
      description: "Formules à réciter après Fajr.",
      content: `
        SubhanAllah (33 fois)
        Alhamdulillah (33 fois)
        Allahu Akbar (34 fois)
      `
    },
    {
      title: "Zikr du soir",
      description: "Protection et rappel d’Allah.",
      content: `
        SubhanAllah (33 fois)
        Alhamdulillah (33 fois)
        Allahu Akbar (34 fois)
      `
    }
  ]
};

const PUBLICITE_DATA = {
  projets: [
    {
      title: "Soutien à une Mosquée",
      description: "Participez à la rénovation d’une mosquée locale.",
      link: "https://www.helloasso.com/associations/association-socioculturelle-cheikh-seydi-hadji-malick-sy-la-zawiya/formulaires/1",
      cta: "Faire un don",
      image: "/assets/pub/projetZawiyaParis.jpg"
    },
    {
      title: "Aide humanitaire",
      description: "Soutien alimentaire pour familles démunies.",
      link: "https://www.helloasso.com/associations/association-pour-la-mutualite-et-la-diversite-de-tours/collectes/projet-zawiya-a-tours",
      cta: "Contribuer",
      image: "/assets/pub/projetZawiyaTours.png"
    }
  ],

  ventes: [
    {
      title: "Livres Islamiques",
      description: "Sélection de livres via Amazon (affiliation).",
      link: "https://www.amazon.fr/s?k=coran",
      cta: "Voir les produits",
      image: "/assets/pub/livres.jpg"
    }
  ],

  partenaires: [
    {
      title: "Taptap Send",
      description: "Envoi d’argent sans frais vers l’Afrique.",
      image: "/assets/pub/taptap.jpg"
    },
    {
      title: "Western Union",
      description: "Transferts d’argent internationaux rapides.",
      image: "/assets/pub/western-union.jpg"
    },
    {
      title: "RIA",
      description: "Service de transfert d’argent sécurisé.",
      image: "/assets/pub/ria.jpg"
    }
  ]
};


const FORBIDDEN_WORDS = [
  // insultes générales
  "merde", "putain", "putin" , "pute" , "put" ,"con", "connard", "salope", "enculé",

  // haine / discriminations
  "juif", "sale juif", "antisémite",
  "pd", "pédé", "tapette", "homosexuel de merde", "homosexuel",
  "nègre", "bougnoule", "sale arabe",

  // violence / extrême
  "nazi", "hitler", "daech", "isis",

  // insultes religieuses
  "allah est", "islam de merde", "coran de merde",

  // autres
  "fuck", "shit", "bitch"
];



const el = {
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  pseudoInput: document.getElementById('pseudoInput'),
  emailLoginBtn: document.getElementById('emailLoginBtn'),
  emailSignupBtn: document.getElementById('emailSignupBtn'),
  //googleLogin: document.getElementById('googleLogin'),
  forgotPassword: document.getElementById('forgotPassword'),
  //authPage: document.getElementById('authPage'),
  home: document.getElementById('home'),
  dashboard: document.getElementById('dashboard'),
  sessionView: document.getElementById('sessionView'),
  sessionTitle: document.getElementById('sessionTitle'),
  sessionMeta: document.getElementById('sessionMeta'),
  sessionsDiv: document.getElementById('sessions'),
  grid: document.getElementById('grid'),
  stats: document.getElementById('stats'),
  newSessionBtn: document.getElementById('newSessionBtn'),
  homeConnectBtn: document.getElementById('homeConnectBtn'),
  closeSessionBtn: document.getElementById('closeSessionBtn'),
  sessionModal: document.getElementById('sessionModal'),
  bottomActionBtn: document.getElementById('bottomActionBtn'),
  discussionSection: document.getElementById('discussionSection'),
  juzFeedback: document.getElementById('juzFeedback'),
  zikrFeedback: document.getElementById('zikrFeedback'),
  zikrView: document.getElementById('zikrView'),

};

let allVisibleSessions = []; // cache 
let currentFilter = "toutes";      // toutes | lectures | historique
let currentTypeFilter = "coran";  // coran | zikr
let unsubscribeMessages = null;
let discussionUnlocked = false;


//let currentSessionTab = "juz"; // "juz" | "discussion"
const tabCoran = document.getElementById("tabCoran");
const tabZikr = document.getElementById("tabZikr");
const juzGrid = document.getElementById('grid');      // grille Juz dans sessionView
const zikrGrid = document.getElementById('zikrView'); // grille Zikr
const sessionView = document.getElementById('sessionView');







/* ---------- Initialization ---------- */




(async function init() {
  // by design: DO NOT auto-create default session or populate DB
  // only show sessions after login

  //setupNetworkWatcher();


  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showPage('home');
      el.sessionsDiv.innerHTML = '';
      hideBottomBar(); // 🔥 important
      return;
    }
  
    // 🔒 Email/password non vérifié
    if (
      user.providerData.some(p => p.providerId === 'password') &&
      !user.emailVerified
    ) {
      showModalFeedback('Veuillez vérifier votre email.', "info");
      await signOut(auth);
      hideBottomBar();
      return;
    }
  
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);


    // 🔒 RGPD — consentement obligatoire
    if (!snap.exists() || snap.data().consentRGPD !== true) {
      openConsentModal(user, userRef);
      hideBottomBar();
      showPage('home');
      return;
    }

  
    /* =====================================================
       ✅ À PARTIR D’ICI → UTILISATEUR VRAIMENT AUTORISÉ
       ===================================================== */
  
    showPage('dashboard');
    //document.getElementById('homeConnectBtn').style.display = 'none';
    showBottomBar();
  
    let pseudo = user.displayName;
  
    // 🟢 Google → pseudo auto
    if (!pseudo) {
      pseudo = generatePseudo();
      await updateProfile(user, { displayName: pseudo });
    }
  
    const userData = {
      uid: user.uid,
      pseudo,
      email: user.email,
      photoURL: user.photoURL || 'default.jpg',
      lastLogin: serverTimestamp()
    };
  
    if (!snap.exists()) {
      userData.createdAt = serverTimestamp();
      await setDoc(userRef, userData);
    } else {
      await setDoc(userRef, userData, { merge: true });
    }
  
    document.querySelector('#menuUserAvatar img').src =
      user.photoURL || 'default.jpg';
  
    await loadSessions();
  });

  menuUserAvatar?.addEventListener("click", (e) => {
    e.preventDefault();
    loadProfile();
    openProfileCodeModal();
  
  });
  
  // wire UI
  //document.getElementById('homeConnectBtn').addEventListener('click', () => showPage('authPage'));

  /*
  document.getElementById("homeConnectBtn").addEventListener("click", () => {
    document.getElementById("homeCard").hidden = true;
    document.getElementById("authPage").hidden = false;
  });*/



  el.newSessionBtn?.addEventListener('click', () => openCreateSessionModal());

  const menuBtn = document.getElementById('sessionMenuBtn');
  const menu = document.getElementById('sessionMenu');

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menuBtn.getAttribute('aria-expanded') === 'true';

    menuBtn.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('hidden', open);
  });

  // clic hors menu → fermer
  document.addEventListener('click', () => {
    menu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  });

  document.getElementById('menuShare').onclick = () => {
    document.getElementById('shareBtn')?.click();
  };



  document.getElementById('menuDelete').onclick = () => {

    if (!requireAdmin(currentSession)) return;

    openConfirmModal({
      title: "Supprimer la campagne",
      message: "Cette action est définitive. Toutes les données de la campagne seront supprimées.",
      confirmText: "Supprimer",
      danger: true,
      onConfirm: async () => {
        await deleteDoc(
          doc(db, SESSIONS_COLLECTION, currentSessionId)
        );
  
        showModalFeedback("Campagne supprimée", "success");
  
        sessionView.hidden = true;
        await loadSessions();
      }
    });
  };
  
  


})();


tabCoran.onclick = () => {
  currentTypeFilter = "coran";

  tabCoran.classList.add("active");
  tabZikr.classList.remove("active");

  // Cacher
  sessionView.hidden = true;


  // réinitialise les onglets internes

  applyFilter();
};

tabZikr.onclick = () => {
  currentTypeFilter = "zikr";

  tabZikr.classList.add("active");
  tabCoran.classList.remove("active");

  // Affiche uniquement la grille Zikr
  zikrGrid.classList.remove("hidden");
  juzGrid.classList.add("hidden");

  // Cache la barre de sélection Juz
  // réinitialise les onglets internes
  sessionView.hidden = true;

  applyFilter();
};

/* ---------- Helpers ---------- */
//Afficher la discussion uniquement au clic sur le tab
function openDiscussionTab(currentSessionId) {
  if (!discussionUnlocked) return;

  el.discussionSection.classList.remove('hidden');
  loadMessages(currentSessionId);
}



async function refreshDiscussionAccess() {
  if (!currentSession) return;

  const canAccess = await userCanAccessDiscussion(currentSession);

  if (canAccess) {
    unlockDiscussion();
  } else {
    discussionUnlocked = false;
    lockDiscussion();
  }
}


function lockDiscussion() {
  el.discussionSection.classList.add('hidden');

  const input = document.getElementById("messageInput");
  const btn = document.getElementById("sendMessageBtn");

  if (input) input.disabled = true;async function refreshDiscussionAccess() {
    if (!currentSession) return;
  
    const canAccess = await userCanAccessDiscussion(currentSession);
  
    if (canAccess) {
      unlockDiscussion();
    }
  }
  if (btn) btn.disabled = true;
}

function unlockDiscussion() {
  discussionUnlocked = true;

  const input = document.getElementById("messageInput");
  const btn = document.getElementById("sendMessageBtn");

  if (input) input.disabled = false;
  if (btn) btn.disabled = false;
}


function isCampaignNameAllowed(name) {
  if (!name) return false;

  const cleanName = name.toLowerCase();

  return !FORBIDDEN_WORDS.some(word =>
    cleanName.includes(word)
  );
}


async function areAllZikrFormulasFinished(sessionId) {
  const snap = await getDocs(
    collection(db, SESSIONS_COLLECTION, sessionId, 'formules')
  );

  if (snap.empty) return false;

  return snap.docs.every(docu => {
    const f = docu.data();
    const objectif = Number(f.objectif || 0);
    const finished = Number(f.finished || 0);
    return objectif > 0 && finished === objectif;
  });
}


function openConsentModal(user, userRef) {
  const modal = openModal(`
    <div class="modal-card card" style="max-width:520px">
      <h3>Protection de vos données personnelles</h3>

      <p>
        Pour continuer à utiliser Together App, vous devez accepter
        notre politique de confidentialité.
      </p>

      <p>
        Vos données (email, pseudo, participation) sont utilisées
        uniquement pour le fonctionnement de l’application.
      </p>

      <label class="consent-checkbox" style="margin-top:12px;display:block">
        <input type="checkbox" id="retroConsent" />
        <span>
          J’accepte la collecte et l’utilisation de mes données personnelles
        </span>
      </label>

      <hr style="margin:16px 0">

      <div style="display:flex;gap:8px;margin-top:12px">
        <button id="acceptConsentBtn" class="btn btn-success">
          Accepter et continuer
        </button>
        <button id="logoutConsentBtn" class="btn">
          Me déconnecter
        </button>
      </div>
    </div>
  `);

  document.getElementById('acceptConsentBtn').onclick = async () => {
    const checked = document.getElementById('retroConsent').checked;
    if (!checked) {
      showModalFeedback(
        "Vous devez accepter la politique pour continuer",
        "error"
      );
      return;
    }

    // ✅ Sauvegarde RGPD
    await setDoc(userRef, {
      consentRGPD: true,
      consentAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    closeModal(modal);
    showModalFeedback("Merci ! Consentement enregistré ✅", "success");

    // 🔁 relancer le flux normal
    await loadSessions();
    showPage('dashboard');
    showBottomBar();
  };

  document.getElementById('logoutConsentBtn').onclick = async () => {
    await signOut(auth);
    closeModal(modal);
  };
}


function requireAdmin(session) {
  const user = auth.currentUser;

  if (!user || !session) return false;

  if (user.uid !== session.createdBy) {
    showModalFeedback("Action réservée à l’administrateur de la campagne", "error");
    return false;
  }

  return true;
}



function shareSessionInvite(meta) {
  const subject = `Invitation – ${meta.name}`;
  const text = `Rejoins notre campagne "${meta.name}" avec ce code : ${meta.inviteCode}`;

  // ✅ Partage natif (mobile + certains desktop modernes)
  if (navigator.share) {
    navigator.share({
      title: subject,
      text
    }).catch(err => {
      // utilisateur a annulé → silence
      console.log("Partage annulé", err);
    });
    return;
  }

  // 💻 Fallback universel desktop → email
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  window.location.href = mailto;
}


function showSessionsPage() {
  document.getElementById('sessionsList').hidden = false;
  document.getElementById('sessionView').hidden = true;
  hideBackBtn();          // 🔥
  // optionnel : reset scroll
  window.scrollTo({ top: 0 });
}

function showSessionPage() {
  document.getElementById('sessionsList').hidden = true;
  document.getElementById('sessionView').hidden = false;

  window.scrollTo({ top: 0 });
}


function scrollToSessionTitle() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.sessionTitle.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });
}


function showPage(id) {
  document.querySelectorAll('.page').forEach(s => s.hidden = true);
  document.getElementById(id).hidden = false;
}

function parseCSVemails(text) {
  if (!text) return [];
  return text.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

/* ---------- Auth handlers (email+google) ---------- */


// Google


// Inscription Email
el.emailSignupBtn?.addEventListener('click', async () => {
  const email = el.emailInput.value.trim();
  const password = el.passwordInput.value.trim();
  const pseudo = el.pseudoInput.value.trim();
  const consentCheckbox = document.getElementById('consentCheckbox');

  if (!email || !password || !pseudo) {
    return showModalFeedback('Remplissez tous les champs', 'error');
  }


    try {
      // 🔒 Vérification consentement AVANT création du compte
      
      if (!consentCheckbox?.checked) {
        showModalFeedback(
          "Vous devez accepter la politique de confidentialité pour continuer",
          "error"
        );
        return;
      }
    
      // ✅ Création du compte
      const cred = await createUserWithEmailAndPassword(auth, email, password);
    
      await updateProfile(cred.user, { displayName: pseudo });
      await sendEmailVerification(cred.user);
    
      // ✅ SAUVEGARDE DU CONSENTEMENT (TRÈS IMPORTANT)
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        pseudo,
        email,
        consentRGPD: true,
        consentAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    
      showModalFeedback(
        'Compte créé. Vérifiez votre email avant connexion.',
        'success'
      );
    
    } catch (e) {
      console.error(e.message);
    
      if (e.message === 'Firebase: Error (auth/email-already-in-use).') {
        showModalFeedback('Cet email est déjà utilisé', 'error');
      } else if (e.message === 'Firebase: Error (auth/invalid-email).') {
        showModalFeedback('Email incorrect', 'error');
      } else if (e.message === 'Firebase: Error (auth/weak-password).') {
        showModalFeedback('Mot de passe trop faible', 'error');
      } else {
        showModalFeedback('Erreur lors de la création du compte', 'error');
      }
    }
    
});

// Connexion Email
el.emailLoginBtn?.addEventListener('click', async () => {
  const email = el.emailInput.value.trim();
  const password = el.passwordInput.value.trim();

  if (!email || !password) {
    return showModalFeedback('Remplissez tous les champs', 'error');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
  
    // 🔒 Email/password non vérifié
    if (
      cred.user.providerData.some(p => p.providerId === 'password') &&
      !cred.user.emailVerified
    ) {
      showModalFeedback('Vérifiez votre email avant connexion.', 'error');
      await signOut(auth);
      return;
    }
  
    // 🔒 RGPD — vérification du consentement
    const userRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userRef);
  
    if (snap.exists() && snap.data().consentRGPD !== true) {
      showModalFeedback(
        "Veuillez accepter la politique de confidentialité pour continuer",
        "error"
      );
      await signOut(auth);
      return;
    }
  
    // ✅ TOUT est OK
    showModalFeedback('Connexion réussie !', 'success');
  
  } catch (e) {
    if (e.message === 'Firebase: Error (auth/invalid-credential).') {
      showModalFeedback('Mot de passe incorrect', 'error');
    } else if (e.message === 'Firebase: Error (auth/invalid-email).') {
      showModalFeedback('Email incorrect', 'error');
    } else {
      showModalFeedback('Erreur de connexion', 'error');
    }
  }
  
});

// Mot de passe oublié
el.forgotPassword?.addEventListener('click', async (ev) => {
  ev.preventDefault();
  const email = el.emailInput.value.trim();

  if (!email) {
    return showModalFeedback('Entrez votre email pour réinitialiser', 'error');
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showModalFeedback('Email de réinitialisation envoyé', 'success');
  } catch (e) {
    console.error(e);
    showModalFeedback(e.message, 'error');
  }
});

/* ---------- Session / Campaign logic ---------- */



async function createSession({
  name,
  typeCampagne = 'coran', // 🆕 'coran' | 'zikr'
  startDate = null,
  endDate = null,
  closeDate = null,       // 🆕 date de clôture effective
  isPublic = true,
  invitedEmails = [],
  inviteCode = null,
  formules = []           // 🆕 uniquement pour zikr
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous pour créer une session');

  const payload = {
    name,
    typeCampagne,               // 🆕
    startDate: startDate || null,
    endDate: endDate || null,
    closeDate: closeDate || null,
    isPublic: !!isPublic,
    invitedEmails: invitedEmails || [],
    inviteCode: inviteCode || null,
    createdBy: user.uid,
    adminPhotoURL: user.photoURL || 'default.jpg',
    adminPseudo: user.displayName || 'Admin',
    status: 'open',
    createdAt: serverTimestamp()
  };

  // 📌 création de la campagne
  const docRef = await addDoc(
    collection(db, SESSIONS_COLLECTION),
    payload
  );

  /* ======================================================
     📖 CAMPAGNE CORAN (EXISTANT – INCHANGÉ)
     ====================================================== */
  if (typeCampagne === 'coran') {
    for (let i = 1; i <= 30; i++) {
      const r = doc(
        db,
        SESSIONS_COLLECTION,
        docRef.id,
        'juz',
        String(i)
      );

      await setDoc(r, {
        number: i,
        status: 'free',
        assignedTo: null,
        assignedPseudo: null,
        assignedAt: null,
        finishedAt: null
      });
    }
  }

  /* ======================================================
     🧿 CAMPAGNE ZIKR (NOUVEAU)
     ====================================================== */
  if (typeCampagne === 'zikr') {
    for (const f of formules) {
      const ref = doc(
        collection(db, SESSIONS_COLLECTION, docRef.id, 'formules')
      );

      await setDoc(ref, {
        name: f.name,                 // ex: "Sourate YASSIN"
        objectif: Number(f.objectif) || 0,
        reste: Number(f.objectif) || 0,
        createdAt: serverTimestamp()
      });
    }
  }

  return docRef.id;
}


/**
 * loadSessions: only returns sessions:
 *  - public ones
 *  - OR ones where current user is creator
 *  - OR ones where current user's email is included in invitedEmails
 * If no user connected: return only public sessions.
 */
async function loadSessions() {
  allVisibleSessions = [];
  el.sessionsDiv.innerHTML = '';

  const snaps = await getDocs(collection(db, SESSIONS_COLLECTION));
  const user = auth.currentUser;
  const userEmail = user?.email?.toLowerCase() || null;

  snaps.forEach(snap => {
    const d = snap.data();

    let visible = false;
    if (d.isPublic) visible = true;
    if (user && d.createdBy === user.uid) visible = true;
    if (
      userEmail &&
      Array.isArray(d.invitedEmails) &&
      d.invitedEmails.map(x => x.toLowerCase()).includes(userEmail)
    ) visible = true;

    if (!visible) return;

    allVisibleSessions.push({
      id: snap.id,
      ...d
    });
  });

  // 🔥 UN SEUL rendu
  applyFilter();
}

async function applyFilter() {
  let list = [];
  const user = auth.currentUser;

  for (const session of allVisibleSessions) {

    // 🔹 FILTRE TYPE CAMPAGNE
    if (session.typeCampagne !== currentTypeFilter) continue;

    // 🔹 FILTRE "TOUTES"
    if (currentFilter === "toutes") {
      list.push(session);
      continue;
    }

    if (!user) continue;

    /* ==========================
       📖 CAMPAGNE CORAN
       ========================== */
    if (session.typeCampagne === "coran") {
      const juzSnap = await getDocs(
        collection(db, SESSIONS_COLLECTION, session.id, "juz")
      );
      const juzList = juzSnap.docs.map(d => d.data());

      if (
        currentFilter === "lectures" &&
        juzList.some(j =>
          j.assignedTo === user.uid &&
          session.status !== "closed"
        )
      ) {
        list.push(session);
      }

      if (
        currentFilter === "historique" &&
        juzList.some(j =>
          j.assignedTo === user.uid &&
          j.status === "finished"
        ) &&
        session.status === "closed"
      ) {
        list.push(session);
      }
    }

    /* ==========================
       🧿 CAMPAGNE ZIKR
       ========================== */
    if (session.typeCampagne === "zikr") {

      // contribution utilisateur
      const contribRef = doc(
        db,
        SESSIONS_COLLECTION,
        session.id,
        "zikrContributions",
        user.uid
      );
      const contribSnap = await getDoc(contribRef);

      if (
        currentFilter === "lectures" &&
        contribSnap.exists() &&
        session.status !== "closed"
      ) {
        list.push(session);
      }

      if (
        currentFilter === "historique" &&
        contribSnap.exists() &&
        session.status === "closed"
      ) {
        list.push(session);
      }
    }
  }

  renderSessions(list);
}


function renderSessions(list) {
  el.sessionsDiv.innerHTML = '';

  if (list.length === 0) {
    el.sessionsDiv.innerHTML = `<div class="empty-state">Aucune campagne</div>`;
    return;
  }

  list.forEach(session => {
    const row = document.createElement('div');
    row.className = 'session-row whatsapp open-session card';
    row.dataset.id = session.id;

    row.innerHTML = `
      <div class="session-avatar">
        <img src="${session.adminPhotoURL || 'default.jpg'}">
      </div>
      <div class="session-content">
        <div class="session-title">${session.name}</div>
        <div class="session-meta">
          ${session.startDate || ''} → ${session.endDate || ''}
          • ${session.isPublic ? 'Publique' : 'Privée'}
          ${session.status === 'closed' ? ' • Clôturée' : ''}
        </div>
      </div>
    `;

    // row.addEventListener('click', () => openSession(session));
    row.addEventListener('click', () => {
      showSessionPage();
      openSession(session);
    });


    el.sessionsDiv.appendChild(row);
  });
}
/*
document.getElementById('backToSessionsBtn').addEventListener('click', () => {
  showSessionsPage();
});

*/

document.getElementById('backToSessionsBtn')
  .addEventListener('click', () => {
    showPage('dashboard');   // 🔥 retour vers Campagnes
    showSessionsPage();      // affiche la liste
  });


  const globalBackBtn = document.getElementById("globalBackBtn");
  const utilitaireBackBtn = document.getElementById("utilitaireBackBtn");

  
function showBackBtn() {
  globalBackBtn.classList.remove("hidden");
  utilitaireBackBtn.classList.remove("hidden");
}

function hideBackBtn() {
  globalBackBtn.classList.add("hidden");
  utilitaireBackBtn.classList.add("hidden");
}

globalBackBtn.onclick = () => {
  showPage("dashboard");
  showSessionsPage(); 
  hideBackBtn();
};

utilitaireBackBtn.onclick = () => {
  showPage("dashboard");
  showSessionsPage(); 
  hideBackBtn();
};


/**
 * openSession(sessionId)
 * loads juz and attaches realtime listeners
 */
let currentSessionId = null;
let currentSession = null; // variable globale
let unsubscribers = [];

const sessionTitle = document.getElementById('sessionTitle');
const stats = document.getElementById('stats');


async function openSession(session) {

  // 🔥 reset discussion
if (unsubscribeMessages) {
  unsubscribeMessages();
  unsubscribeMessages = null;
}

const list = document.getElementById("messagesList");
if (list) list.innerHTML = "";

lockDiscussion(); // discussion cachée par défaut

  if (!session || !session.id) {
    throw new Error("openSession attend une session complète");
  }

  // cleanup listeners
  unsubscribers.forEach(u => u && u());
  unsubscribers = [];

  currentSession = session; // stocke la session complète
  currentSessionId = session.id;

  // Charger les métadonnées
  const metaSnap = await getDoc(doc(db, SESSIONS_COLLECTION, currentSessionId));
  if (!metaSnap.exists()) return showModalFeedback('Session introuvable', "error");
  const meta = metaSnap.data();


  const isAdmin = auth.currentUser.uid === meta.createdBy;
  const hasInviteCode = !!meta.inviteCode;
  const isClosed = meta.status === 'closed';
  sessionTitle.textContent = meta.name;

  // Personnalisation selon type de campagne
  if (session.typeCampagne === 'zikr') {
    stats.style.display = 'block'; // 👈 important

    document.getElementById('sessionView').classList.remove('hidden');
    showZikrCampaign(session);

  } else {
    stats.style.display = 'block';

    // Affiche uniquement la grille Juz
    document.getElementById('sessionView').classList.remove('hidden');

    showCoranCampaign(session);
  }



  el.sessionMeta.textContent =
    `${meta.startDate || '—'} → ${meta.endDate || '—'} • ` +
    `${meta.isPublic ? 'Publique' : 'Privée'} • ` +
    `${meta.status === 'closed' ? 'Clôturée' : 'Ouverte'}`;



  const menuShare = document.getElementById('menuShare');
  const inviteCodeValue = document.getElementById('inviteCodeValue');


  if (isAdmin && hasInviteCode) {
    inviteCodeValue.textContent = `Partager : ${meta.inviteCode}`;
    menuShare.style.display = 'flex';

    menuShare.onclick = (e) => {
      e.stopPropagation();
      shareSessionInvite(meta);
    };
  } else {
    menuShare.style.display = 'none';
  }


  //User can Access Discussion
  const canAccessDiscussion = await userCanAccessDiscussion(session);


  if (canAccessDiscussion) {
    unlockDiscussion();
  } else {
    lockDiscussion();
  }
  



  // fetch juz list (fast path 1..30)
  const arr = [];
  let missing = false;
  for (let i = 1; i <= 30; i++) {
    const r = doc(db, SESSIONS_COLLECTION, currentSessionId, 'juz', String(i));
    const s = await getDoc(r);
    if (!s.exists()) { missing = true; break; }
    arr.push(s.data());
  }
  if (missing) {
    // fallback: read whole subcollection
    const subsnap = await getDocs(collection(db, SESSIONS_COLLECTION, currentSessionId, 'juz'));
    subsnap.forEach(x => arr.push(x.data()));
    arr.sort((a, b) => (a.number || 0) - (b.number || 0));
  }
  renderGrid(arr);
  //el.sessionView.hidden = false;
  initSessionTabs(session);
  // état par défaut
  scrollToSessionTitle();

  const { onSnapshot: onSnap, query: q, collection: col } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
  const subcol = col(db, SESSIONS_COLLECTION, currentSessionId, 'juz');
  const qAll = q(subcol);
  const unsub = onSnap(qAll, snap => {
    const list = [];
    snap.forEach(d => list.push(d.data()));
    list.sort((a, b) => (a.number || 0) - (b.number || 0));
    renderGrid(list);
  }, err => console.error('subcol snap err', err));
  unsubscribers.push(unsub);


  const allFinished = arr.every(j => j && j.status === 'finished');

  // Références
  const inviteBox = document.getElementById('showCodeInvitation');

  // --- Campagne déjà clôturée ---
  if (isClosed) {

    if (inviteBox) {
      inviteBox.classList.add('is-closed');
    }

    return;
  }
  ///

  document.getElementById("sendMessageBtn").onclick = async () => {

        const canAccess = await userCanAccessDiscussion(currentSession);
    if (!canAccess) {
      showModalFeedback(
        "Vous devez d’abord participer à la campagne pour écrire un message.",
        "error"
      );
      return;
    }

    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user || !currentSessionId) return;

    await addDoc(
      collection(db, SESSIONS_COLLECTION, currentSessionId, "messages"),
      {
        text,
        authorId: user.uid,
        authorPseudo: user.displayName || "Utilisateur",
        photoURL: user.photoURL || "default.jpg",
        createdAt: serverTimestamp()
      }
    );

    input.value = "";
  };
  // --- Campagne ouverte ---
    el.closeSessionBtn.onclick = async () => {
      if (!requireAdmin(currentSession)) return;
    
      /* =========================
         🧿 CAMPAGNE ZIKR
         ========================= */
      if (currentSession.typeCampagne === 'zikr') {
        const allZikrFinished = await areAllZikrFormulasFinished(currentSessionId);
    
        if (!allZikrFinished) {
          showModalFeedback(
            "Impossible de clôturer : toutes les formules de Zikr ne sont pas encore terminées",
            "info"
          );
          return;
        }
      }
    
      /* =========================
         📖 CAMPAGNE CORAN
         ========================= */
      if (currentSession.typeCampagne === 'coran') {
        if (!allFinished) {
          showModalFeedback(
            "La campagne n’est pas encore totalement terminée",
            "info"
          );
          return;
        }
      }
    
      /* =========================
         ✅ CONFIRMATION
         ========================= */
      openConfirmModal({
        title: "Clôturer la campagne",
        message: "Cette action est définitive.",
        confirmText: "Clôturer",
        danger: true,
        onConfirm: async () => {
          await updateDoc(
            doc(db, SESSIONS_COLLECTION, currentSessionId),
            {
              status: 'closed',
              closedAt: serverTimestamp()
            }
          );
    
          showModalFeedback("Campagne clôturée", "success");
          await loadSessions();
        }
      });
    };
    
    
}



async function userCanAccessDiscussion(session) {
  const user = auth.currentUser;
  if (!user) return false;

  // 📖 Coran = ancien comportement
  if (session.typeCampagne !== 'zikr') {
    return await userHasJuzInSession(session.id, user.uid);
  }

  // 🧿 Zikr = a contribué ?
  const snap = await getDoc(
    doc(db, SESSIONS_COLLECTION, session.id, 'zikrContributions', user.uid)
  );

  return snap.exists();
}



/* ---------- Grid rendering & click handling ---------- */
const juzDetails = {
  1: {
    description: "Introduction du Coran, fondements de la foi et appel à l’adoration sincère.",
    debut: "S. 1 / V. 1",
    fin: "S. 2 / V. 141"
  },
  2: {
    description: "Lois religieuses et identité de la communauté musulmane.",
    debut: "S. 2 / V. 142",
    fin: "S. 2 / V. 252"
  },
  3: {
    description: "Relations intercommunautaires et histoire des prophètes.",
    debut: "S. 2 / V. 253",
    fin: "S. 3 / V. 92"
  },
  4: {
    description: "Justice sociale, droits des femmes et organisation familiale.",
    debut: "S. 3 / V. 93",
    fin: "S. 4 / V. 23"
  },
  5: {
    description: "Lois familiales, héritage et protection des plus vulnérables.",
    debut: "S. 4 / V. 24",
    fin: "S. 4 / V. 147"
  },
  6: {
    description: "Responsabilité morale, obéissance divine et alliances.",
    debut: "S. 4 / V. 148",
    fin: "S. 5 / V. 81"
  },
  7: {
    description: "Fidélité aux engagements et récits des communautés passées.",
    debut: "S. 5 / V. 82",
    fin: "S. 6 / V. 110"
  },
  8: {
    description: "Unicité de Dieu et rejet de l’idolâtrie.",
    debut: "S. 6 / V. 111",
    fin: "S. 7 / V. 87"
  },
  9: {
    description: "Récits des peuples anciens et avertissements divins.",
    debut: "S. 7 / V. 88",
    fin: "S. 8 / V. 40"
  },
  10: {
    description: "Confiance en Dieu et constance face aux épreuves.",
    debut: "S. 8 / V. 41",
    fin: "S. 9 / V. 92"
  },
  11: {
    description: "Sincérité, repentir et justice divine.",
    debut: "S. 9 / V. 93",
    fin: "S. 11 / V. 5"
  },
  12: {
    description: "Histoires prophétiques et leçon de patience.",
    debut: "S. 11 / V. 6",
    fin: "S. 12 / V. 52"
  },
  13: {
    description: "Foi, persévérance et victoire de la vérité.",
    debut: "S. 12 / V. 53",
    fin: "S. 14 / V. 52"
  },
  14: {
    description: "Mission prophétique, sagesse et gratitude.",
    debut: "S. 15 / V. 1",
    fin: "S. 16 / V. 128"
  },
  15: {
    description: "Morale, récits édifiants et rappel de l’au-delà.",
    debut: "S. 17 / V. 1",
    fin: "S. 18 / V. 74"
  },
  16: {
    description: "Science divine, épreuves humaines et guidance.",
    debut: "S. 18 / V. 75",
    fin: "S. 20 / V. 135"
  },
  17: {
    description: "Prophètes, justice divine et résurrection.",
    debut: "S. 21 / V. 1",
    fin: "S. 22 / V. 78"
  },
  18: {
    description: "Foi sincère, comportement éthique et communauté.",
    debut: "S. 23 / V. 1",
    fin: "S. 25 / V. 20"
  },
  19: {
    description: "Miséricorde divine et distinction entre vérité et mensonge.",
    debut: "S. 25 / V. 21",
    fin: "S. 27 / V. 55"
  },
  20: {
    description: "Savoir, humilité et signes de la création.",
    debut: "S. 27 / V. 56",
    fin: "S. 29 / V. 45"
  },
  21: {
    description: "Responsabilité morale et préparation à l’au-delà.",
    debut: "S. 29 / V. 46",
    fin: "S. 33 / V. 30"
  },
  22: {
    description: "Éthique sociale et législation islamique.",
    debut: "S. 33 / V. 31",
    fin: "S. 36 / V. 27"
  },
  23: {
    description: "Message prophétique et miséricorde universelle.",
    debut: "S. 36 / V. 28",
    fin: "S. 39 / V. 31"
  },
  24: {
    description: "Lumière divine, purification morale et foi.",
    debut: "S. 39 / V. 32",
    fin: "S. 41 / V. 46"
  },
  25: {
    description: "Unicité de Dieu et finalité de l’existence humaine.",
    debut: "S. 41 / V. 47",
    fin: "S. 45 / V. 37"
  },
  26: {
    description: "Patience, appel à Dieu et victoire spirituelle.",
    debut: "S. 46 / V. 1",
    fin: "S. 51 / V. 30"
  },
  27: {
    description: "Jugement dernier et rappel puissant.",
    debut: "S. 51 / V. 31",
    fin: "S. 57 / V. 29"
  },
  28: {
    description: "Discipline spirituelle et règles communautaires.",
    debut: "S. 58 / V. 1",
    fin: "S. 66 / V. 12"
  },
  29: {
    description: "Courtes sourates centrées sur la foi et l’au-delà.",
    debut: "S. 67 / V. 1",
    fin: "S. 77 / V. 50"
  },
  30: {
    description: "Rappels finaux, monothéisme et destinée humaine.",
    debut: "S. 78 / V. 1",
    fin: "S. 114 / V. 6"
  }
};


function renderGrid(juzData) {
  el.grid.innerHTML = '';
  let finished = 0;

  juzData.forEach(j => {
    if (!j) return;
    if (j.status === 'finished') finished++;

    const card = document.createElement('div');
    card.className = `card juz ${j.status || 'free'}`;
    card.dataset.juzNumber = j.number;

    const pseudo = j.assignedPseudo || '';

    // 🏷️ badge statut
    let statusLabel = '';
    let statusClass = '';

    if (j.status === 'free') {
      statusLabel = 'disponible';
      statusClass = 'badge-free';
    }

    if (j.status === 'assigned') {
      //statusLabel = `en cours / ${pseudo}`;
      statusLabel = `en cours`;
      statusClass = 'badge-assigned';
    }

    if (j.status === 'finished') {
      //statusLabel = `terminé / ${pseudo}`;
      statusLabel = `terminé`;
      statusClass = 'badge-finished';
    }


    const total = j.status === 'free' ? 0 : 1;
    const finishedJ = j.status === 'finished' ? 1 : 0;
    const pendingJ = j.status === 'assigned' ? 1 : 0;

    card.innerHTML = `
    <div class="juz-header">
      <label class="juz-checkbox">
        <span class="juz-number">Juz N° ${j.number}</span>
        <span class="juz-number">${juzDetails[j.number].debut}</span>
      </label>
    </div>
  
    <div class="zikr-body">
  
      <button class="toggle-contribs" type="button" aria-expanded="false">
        <i class="fas fa-users"></i>
        <span class="juz-badge ${statusClass}">${statusLabel}</span>
        <i class="fas fa-chevron-down chevron"></i>
      </button>
  
      <div class="zikr-contribs hidden">
       
  
        
          <div class="contrib-header">
            <strong>${pseudo || "Aucun contributeur"}</strong>
          </div>

          <div class="contrib-stats">
            <div class="stat"><strong>Choisi : ${total}</strong></div>
            <div class="stat success"><strong>✔ Terminé : ${finishedJ}</strong></div>
            <div class="stat warning"><strong>⏳ En attente : ${pendingJ}</strong></div>
          </div>

          <div class="zikr-info">
            <div class="juz-actions">
              <button class="contrib-btn btn-assign">
                Choisir
              </button>
              <button class="contrib-btn btn-finish ">
                Terminer
              </button>
           </div>
          </div>

          <div class="contrib-card">
          

        </div>

    <hr>

    <table class="zikr-table zikr-totals-table">
      <tr>
        <td class="label">Juz n°</td>
        <td class="value"><strong>${j.number}</strong></td>
      </tr>
      <tr>
        <td class="label">Début Juz</td>
        <td class="value"><strong>${juzDetails[j.number].debut}</strong></td>
      </tr>
      <tr>
        <td class="label">Fin Juz</td>
        <td class="value"><strong>${juzDetails[j.number].fin}</strong></td>
      </tr>

      <!-- Input pleine largeur -->
      <tr>
        <td colspan="2">
            <p>${juzDetails[j.number].description}</p>
        </td>
      </tr>
    </table>






</div>
</div>
  `;

    const assignBtn = card.querySelector('.btn-assign');
    const finishBtn = card.querySelector('.btn-finish');

    const user = auth.currentUser;
    const isMine = j.assignedTo === user?.uid;

    // États des boutons
    if (j.status === 'free') {
      finishBtn.style.display = 'none';
    }

    if (j.status === 'assigned') {
      assignBtn.style.display = 'none';

      if (!isMine) {
        finishBtn.disabled = true;
      }
    }

    if (j.status === 'finished') {
      assignBtn.style.display = 'none';
      finishBtn.style.display = 'none';
    }


    const toggleBtn = card.querySelector('.toggle-contribs');
    const contribsBox = card.querySelector('.zikr-contribs');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';

      toggleBtn.setAttribute('aria-expanded', String(!isOpen));
      contribsBox.classList.toggle('hidden', isOpen);
    });

    assignBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();

      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const pseudo = userSnap.data()?.pseudo || 'Utilisateur';

      await updateDoc(
        doc(db, SESSIONS_COLLECTION, currentSessionId, 'juz', String(j.number)),
        {
          status: 'assigned',
          assignedTo: user.uid,
          assignedPseudo: pseudo,
          assignedAt: serverTimestamp()
        }
      );
      await refreshDiscussionAccess();

    });


    finishBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();

      const user = auth.currentUser;
      if (!user || j.assignedTo !== user.uid) return;

      await updateDoc(
        doc(db, SESSIONS_COLLECTION, currentSessionId, 'juz', String(j.number)),
        {
          status: 'finished',
          finishedAt: serverTimestamp()
        }
      );
    });

    el.grid.appendChild(card);
  });

  
  if (currentSession?.typeCampagne === 'coran') {
    el.stats.textContent = `Terminés : ${finished} / 30`;
  }
  
}

/* ---------- UI: create session modal ---------- */
function openCreateSessionModal(session = null){

  const isEditMode = !!session;

  const modal = openModal(`
    <div class="modal-card card" style="max-width:420px;width:100%">
      <h3>${isEditMode ? "Modifier la campagne" : "Nouvelle Campagne"}</h3>

      <input id="ns_name" placeholder="Nom de la campagne" />
      <label style="margin-top:8px;display:block">
    Type de campagne :
    <select id="ns_type">
      <option value="coran">Lecture Coran</option>
      <option value="zikr">Série de Zikr</option>
    </select>
  </label>
  
  <div id="zikrFormulasCreate" style="display:none;margin-top:10px">
    <h4>Formules de Zikr</h4>
  
    <div class="zikr-formula">
      <input placeholder="Nom formule" class="zf-name" />
      <input type="number" placeholder="Objectif" class="zf-target" />
    </div>
  
    <button id="addFormulaBtn" class="btn small" style="margin-top:6px">
      + Ajouter une formule
    </button>
  </div>
  
  
      <div style="display:flex;gap:8px;margin-top:6px">
        <label style="flex:1">Début: <input id="ns_start" type="date" /></label>
        <label style="flex:1">Fin: <input id="ns_end" type="date" /></label>
      </div>
  
      <div style="margin-top:8px">
        
        <div class="visibility-switch">
        <label>Visibilité :</label>
        <span id="labelPrivate">Privée</span>
          <label class="switch">
            <input type="checkbox" id="ns_public">
            <span class="slider"></span>
          </label>
          <span id="labelPublic">Publique</span>
        </div>
      </div>
  
      <!-- Emails invités -->
      <div id="invitedRow" style="margin-top:8px">
        <label><input id="ns_invited" placeholder="Invités: mame@ex.com, astou@ex.com" />
        </label>
      </div>
  
      <!-- Générer un code -->
      <div id="genCodeRow" style="margin-top:8px">
        <label> Un code d'invitation sera généré</label>
      </div>
  
      <hr style="margin:16px 0">
      
      <div style="display:flex;gap:8px;margin-top:12px">
        <button id="ns_create" class="btn btn-success">
          ${isEditMode ? "Enregistrer" : "Démarrer"}
        </button>
        <button id="ns_cancel" class="btn">Annuler</button>
      </div>
    </div>`);

    if (isEditMode) {
      modal.querySelector('#ns_name').value = session.name || '';
      modal.querySelector('#ns_type').value = session.typeCampagne || 'coran';
      modal.querySelector('#ns_start').value = session.startDate || '';
      modal.querySelector('#ns_end').value = session.endDate || '';
      modal.querySelector('#ns_public').checked = !!session.isPublic;
      modal.querySelector('#ns_type').disabled = true;
    
      if (Array.isArray(session.invitedEmails)) {
        modal.querySelector('#ns_invited').value =
          session.invitedEmails.join(', ');
      }
    }
    
  // ----- Références DOM (TOUJOURS AVANT utilisation) -----
  const startDate = modal.querySelector("#ns_start");
  const endDate = modal.querySelector("#ns_end");
  const publicCheckbox = modal.querySelector("#ns_public");
  const invitedInput = modal.querySelector("#ns_invited");

  const typeSelect = modal.querySelector("#ns_type");
  const zikrBlock = modal.querySelector("#zikrFormulasCreate");
  const addFormulaBtn = modal.querySelector("#addFormulaBtn");


  // État initial : privé
  invitedInput.disabled = false;

  publicCheckbox.addEventListener("change", () => {
    const isPublic = publicCheckbox.checked;

    // Si public → pas d’invités manuels
    invitedInput.disabled = isPublic;
    // Nettoyage si on repasse en public
    if (isPublic) {
      invitedInput.value = "";
    }
  });

  addFormulaBtn.addEventListener("click", () => {
    const container = zikrBlock.querySelector(".zikr-formula").parentNode;

    const div = document.createElement("div");
    div.className = "zikr-formula";
    div.innerHTML = `
      <input placeholder="Nom formule" class="zf-name" />
      <input type="number" placeholder="Objectif" class="zf-target" />
    `;

    container.insertBefore(div, addFormulaBtn);
  });

  function updateCampagneTypeUI() {
    const isZikr = typeSelect.value === "zikr";
    zikrBlock.style.display = isZikr ? "block" : "none";
  }

  // Initialisation (important)
  updateCampagneTypeUI();

  // Écoute du changement
  typeSelect.addEventListener("change", updateCampagneTypeUI);


  // ===== INIT UI DATES (UNE FOIS) =====
  const today = new Date().toISOString().split("T")[0];
  startDate.min = today;
  endDate.min = today;
  endDate.disabled = true;

  startDate.addEventListener("change", () => {
    endDate.min = startDate.value;
    endDate.disabled = false;

    if (endDate.value && endDate.value < startDate.value) {
      endDate.value = startDate.value;
    }
  });

  // Empêcher saisie clavier
  [startDate, endDate].forEach(input => {
    input.addEventListener("keydown", e => e.preventDefault());
  });


  // ----- Bouton CRÉER -----
  modal.querySelector('#ns_create').onclick = async () => {
    try {
      const name = modal.querySelector('#ns_name').value.trim();
      const typeCampagne = modal.querySelector('#ns_type').value;

      if (!name) {
        showModalFeedback('Donnez un nom à la campagne', 'error');
        return;
      }


      if (!isCampaignNameAllowed(name)) {
        showModalFeedback("Le nom de la campagne contient des termes inappropriés.\n" +
          "Merci de choisir un nom respectueux.", 'info');
        return;
      }
      

      let formules = [];

      if (!isEditMode && typeCampagne === 'zikr') {
        modal.querySelectorAll('.zikr-formula').forEach(row => {
          const fname = row.querySelector('.zf-name').value.trim();
          const target = Number(row.querySelector('.zf-target').value);

          if (fname && target > 0) {
            formules.push({ name: fname, objectif: target });
          }
        });

        if (!formules.length) {
          showModalFeedback('Ajoutez au moins une formule de Zikr valide', "error");
          return;
        }
      }

      const isPublic = publicCheckbox.checked;
      const inviteCode = !isPublic
        ? Math.random().toString(36).slice(2, 8).toUpperCase()
        : null;
      const start = startDate.value;
      const end = endDate.value;



      if (!start || !end) {
        showModalFeedback(
          "Veuillez renseigner les dates de début et de fin",
          "error"
        );
        return;
      }


      let sessionId = null;

      if (isEditMode) {
         await updateDoc(
          doc(db, SESSIONS_COLLECTION, session.id),
          {
            name,
            startDate: start,
            endDate: end,
            isPublic,
            invitedEmails: parseCSVemails(invitedInput.value),
            updatedAt: serverTimestamp()
          }
        );
        sessionId = session.id; // 👈 CRUCIAL
        showModalFeedback("Campagne mise à jour", "success");
      } else {
        sessionId = await createSession({
          name,
          typeCampagne,
          startDate: start || null,
          endDate: end || null,
          isPublic,
          invitedEmails: parseCSVemails(invitedInput.value),
          inviteCode,
          formules
        });
      }


      closeModal(modal);
      await loadSessions();

      const session = allVisibleSessions.find(s => s.id === sessionId);

      if (!session) {
        showModalFeedback("Session introuvable après création", "error");
        return;
      }

      await openSession(session);

      // 🔔 Feedback APRÈS ouverture (UX parfaite)
      if (inviteCode) {
        showModalFeedback(
          `🎟️ Code d’invitation : ${inviteCode}\n` +
          `Partagez-le aux personnes à inviter.`,
          "info",
          5000 // plus long
        );
      }

    } catch (e) {
      showModalFeedback(e.message, "system");
    }
  };

  if (isEditMode && session.status === 'closed') {
    modal.querySelector('#ns_create').disabled = true;
  }
  
  // ----- Annuler -----
  modal.querySelector('#ns_cancel').onclick = () => closeModal(modal);
}

document.getElementById('menuEdit').onclick = () => {
  if (!requireAdmin(currentSession)) return;

  if (currentSession.status === 'closed') {
    showModalFeedback("Impossible de modifier une campagne clôturée", "info");
    return;
  }

  openCreateSessionModal(currentSession);
};

document.getElementById('openPrivacyInfo').addEventListener('click', (e) => {
  e.preventDefault();

 const modal = openModal(`
    <div class="modal-card card" style="max-width:520px">
      <h3>Protection de vos données personnelles</h3>

      <p>
        Dans le cadre de l’utilisation de Together App, nous collectons et utilisons
        certaines données personnelles nécessaires au bon fonctionnement du service,
        notamment votre adresse e-mail, votre pseudo et votre mot de passe.
      </p>

      <p>
        À terme, avec votre accord, des données de localisation pourront être utilisées
        afin d’améliorer certaines fonctionnalités liées à la position géographique.
      </p>

      <p>
        Vos données sont utilisées exclusivement dans le cadre de l’application,
        ne sont ni revendues ni partagées à des tiers, et sont protégées conformément
        à la réglementation en vigueur.
      </p>

      <hr style="margin:16px 0">

      <button class="btn btn-success" id="closePrivacyModal">
        J’ai compris
      </button>
    </div>
  `);


  modal.querySelector('#closePrivacyModal').onclick = () => closeModal(modal);
});




function showCoranCampaign(session) {
  el.grid.classList.remove('hidden');
  el.discussionSection.classList.remove('hidden');
  document.getElementById('zikrView').classList.add('hidden');
}




function showZikrCampaign(session) {
  el.grid.classList.add('hidden');
  el.discussionSection.classList.add('hidden');

  const zikrView = document.getElementById('zikrView');
  zikrView.classList.remove('hidden');


  const colRef = collection(
    db,
    SESSIONS_COLLECTION,
    session.id,
    'formules'
  );

  const unsub = onSnapshot(colRef, snap => {
    const formules = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  
    // 📊 STATS ZIKR
    const total = formules.length;
    const finished = formules.filter(f =>
      Number(f.objectif || 0) > 0 &&
      Number(f.finished || 0) === Number(f.objectif || 0)
    ).length;
  
    el.stats.textContent = `Terminés : ${finished} / ${total}`;
  
    renderZikrFormulas(formules, session.id);
  });
  

  // 🔥 IMPORTANT : enregistrer pour cleanup
  unsubscribers.push(unsub);
}


function getZikrStatus(objectif, current, finished) {
  // Rien choisi
  if (!current || current === 0) {
    return { key: 'free', label: 'disponible' };
  }

  // Tout choisi MAIS pas tout terminé
  if (current === objectif && finished < objectif) {
    return { key: 'assigned', label: 'en cours' };
  }

  // Tout choisi ET tout terminé
  if (current === objectif && finished === objectif) {
    return { key: 'finished', label: 'terminé' };
  }

  // Cas général : en cours
  return { key: 'assigned', label: 'en cours' };
}

async function renderZikrFormulas(formules, sessionId) {
  const container = document.getElementById('zikrFormulas');
  container.innerHTML = '';

  for (const f of formules) {
    const objectif = Number(f.objectif) || 0;
    const current = Number(f.current || 0);

    const finished = Number(f.finished || 0);
    const reste = Math.max(0, objectif - current);



    const status = getZikrStatus(objectif, current, finished);


    // 🔥 contributions
    const contribSnap = await getDocs(
      collection(
        db,
        SESSIONS_COLLECTION,
        sessionId,
        'formules',
        f.id,
        'contributions'
      )
    );

    //const contributions = contribSnap.docs.map(d => d.data());

    const contributions = contribSnap.docs.map(d => ({
      uid: d.id,        // 🔥 UID réel
      ...d.data()
    }));

    const contributorsHtml = contributions.length
      ? `
  <table class="zikr-table zikr-contribs-table">
    ${contributions.map(c => {
        const total = Number(c.value || 0);
        const finishedC = Number(c.finished || 0);
        const pending = Math.max(0, total - finishedC);
        const isOwner = c.uid === auth.currentUser.uid;

        return `
        <tr class="zikr-contributor" data-uid="${c.uid}">
          <td class="label contrib-name">
            ${c.pseudo}
          </td>

          <td class="value contrib-value">
            <div class="contrib-stats">
              <div class="stat">Choisi : <strong>${total}</strong></div>
              <div class="stat success">✔ Terminé : ${finishedC}</div>
              <div class="stat warning">⏳ En attente : ${pending}</div>
            </div>
          </td>


          <td class="value contrib-actions">
            <button class="contrib-btn btn-finish"
              ${!isOwner || pending === 0 ? 'disabled' : ''}>
              Terminer
            </button>
          </td>
        </tr>
      `;
      }).join('')}
  </table>
`
      : `<em class="no-contrib">Aucun contributeur</em>`;


    const card = document.createElement('div');

    card.className = `card juz zikr zikr-card ${status.key}`;


    card.dataset.formuleId = f.id;


    card.innerHTML = `
<div class="juz-header zikr-header">
  <span class="zikr-title">
    ${f.name} (${objectif})
  </span>
</div>

<div class="zikr-body">

  <button class="toggle-contribs" type="button" aria-expanded="false">
    <i class="fas fa-users"></i>
    <span class="juz-badge badge-${status.key}">${status.label}</span>
    <i class="fas fa-chevron-down chevron"></i>
  </button>

  <div class="zikr-contribs hidden">
    ${contributorsHtml}
    
    <hr>

    <!-- Tableau sans bordure -->
    <table class="zikr-table zikr-totals-table">
      <tr>
        <td class="label">Total déjà choisi</td>
        <td class="value"><strong>${current}</strong></td>
      </tr>
      <tr>
        <td class="label">Total déjà terminé</td>
        <td class="value"><strong>${finished}</strong></td>
      </tr>
      <tr>
        <td class="label">Reste à choisir</td>
        <td class="value"><strong>${reste}</strong></td>
      </tr>

      <!-- Input pleine largeur -->
<tr>
  <td colspan="2">
    <div class="zikr-input-wrapper">
      <input
        type="number"
        min="1"
        max="${reste}"
        placeholder="Choix"
        class="zikr-input"
        data-formule-id="${f.id}"
        ${reste === 0 ? 'disabled' : ''}
      />

      <button
        class="zikr-validate-btn"
        ${reste === 0 ? 'disabled' : ''}
      >
        Valider
      </button>
    </div>
  </td>
</tr>


    </table>

  </div>
</div>
`;


    const input = card.querySelector('.zikr-input');
    const validateBtn = card.querySelector('.zikr-validate-btn');

    validateBtn.addEventListener('click', async (e) => {
      e.stopPropagation();

      const raw = input.value.trim();
      const value = Number(raw);

      // ❌ Champ vide
      if (!raw) {
        showModalFeedback("Veuillez entrer un nombre", "error");
        return;
      }

      // ❌ Pas un nombre
      if (Number.isNaN(value)) {
        showModalFeedback("Valeur invalide", "error");
        return;
      }

      // ❌ Négatif ou zéro
      if (value <= 0) {
        showModalFeedback("Le nombre doit être supérieur à zéro", "error");
        return;
      }
      const myContrib = contributions.find(
        c => c.uid === auth.currentUser.uid
      );

      /*  A RETRAVAILLER
      if (myContrib && myContrib.finished >= myContrib.value) {
        showModalFeedback(
          `ℹ️ Votre précédente contribution est terminée.
  Une nouvelle contribution va être ajoutée.`,
          "info",
          4500
        );
      }*/


      // ✅ OK → validation Firestore
      await validateZikrFormula(
        currentSessionId,
        f.id,
        card
      );

      input.value = '';
    });


      card.querySelectorAll('.contrib-btn.btn-finish')
  .forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      const row = btn.closest('.zikr-contributor');
      const uid = row.dataset.uid;

      if (uid !== auth.currentUser.uid) {
        showModalFeedback("❌ Vous ne pouvez terminer que votre contribution", "error");
        return;
      }

      const formulaId = card.dataset.formuleId;
      await finishZikrContribution(currentSessionId, formulaId, card);
    });
  });


    // 🔽 toggle contributeurs

    const toggleBtn = card.querySelector('.toggle-contribs');
    const contribsBox = card.querySelector('.zikr-contribs');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      const isOpen = !contribsBox.classList.contains('hidden');

      contribsBox.classList.toggle('hidden');
      toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    });



    container.appendChild(card);
  }
}

async function finishZikrContribution(sessionId, formulaId, card) {
  const user = auth.currentUser;
  if (!user) return;

  const contribRef = doc(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    'formules',
    formulaId,
    'contributions',
    user.uid
  );

  const snap = await getDoc(contribRef);
  if (!snap.exists()) {
    showModalFeedback("❌ Aucune contribution trouvée", "error");
    return;
  }

  const data = snap.data();
  const value = Number(data.value || 0);
  const alreadyFinished = Number(data.finished || 0);

  if (alreadyFinished >= value) {
    showModalFeedback("✅ Contribution déjà terminée");
    return;
  }

  const toFinish = value - alreadyFinished;

  // 🔥 1️⃣ marquer la contribution comme terminée
  await updateDoc(contribRef, {
    finished: increment(toFinish),
    isFinished: true,
    updatedAt: serverTimestamp()
  });

  // 🔥 2️⃣ incrémenter le total terminé de la formule
  const formulaRef = doc(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    'formules',
    formulaId
  );

  await updateDoc(formulaRef, {
    finished: increment(toFinish)
  });

  showModalFeedback("🎉 Contribution marquée comme terminée", "success");

  // UX locale
  updateLocalFinishedUI(card, toFinish);
}

function updateLocalFinishedUI(card, value) {
  const row = card.querySelector(
    `.zikr-contributor[data-uid="${auth.currentUser.uid}"]`
  );

  if (row) {
    row.classList.add('finished');
  }
}


function updateLocalContributorUI(card, value) {
  const uid = auth.currentUser.uid;
  let row = card.querySelector(`.zikr-contributor[data-uid="${uid}"]`);

  if (!row) {
    row = document.createElement('div');
    row.className = 'zikr-contributor';
    row.dataset.uid = uid;
    row.innerHTML = `
      <span class="contrib-name">${auth.currentUser.displayName}</span>
      <span class="contrib-value">${value}</span>
    `;
    card.querySelector('.zikr-contribs').prepend(row);
  } else {
    row.querySelector('.contrib-value').textContent = value;
  }
}

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});



//FIN

async function validateZikrFormula(sessionId, formulaId, card) {
  const user = auth.currentUser;
  if (!user) return;

  const input = card.querySelector('.zikr-input');
  const raw = input.value.trim();
  const value = Number(raw);

  // ❌ validations UI
  if (!raw || Number.isNaN(value) || value <= 0) {
    showModalFeedback("❌ Entrez un nombre valide", "error");
    return;
  }

  const formulaRef = doc(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    'formules',
    formulaId
  );

  const snap = await getDoc(formulaRef);
  if (!snap.exists()) return;

  const data = snap.data();

  const objectif = Number(data.objectif || 0);
  const current = Number(data.current || 0);
  const finished = Number(data.finished || 0);
  const reste = Math.max(0, objectif - current);

  // 🛑 objectif déjà entièrement terminé
  if (current === objectif && finished === objectif) {
    showModalFeedback("✅ Cette formule est déjà totalement terminée", "info");
    input.value = '';
    return;
  }

  // 🛑 dépassement
  if (value > reste) {
    showModalFeedback(
      `❌ Vous ne pouvez pas dépasser le reste (${reste})`,
      "error"
    );
    return;
  }

  // ℹ️ info si l'utilisateur recommence après une validation
  const contribRef = doc(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    'formules',
    formulaId,
    'contributions',
    user.uid
  );

  const contribSnap = await getDoc(contribRef);
  if (contribSnap.exists() && contribSnap.data()?.isFinished) {
    showModalFeedback(
      "ℹ️ Vous avez déjà validé une contribution. Une nouvelle contribution démarre.",
      "info",
      4000
    );
  }

  // ✅ calculs
  const newCurrent = current + value;
  const newReste = objectif - newCurrent;

  // 🔄 mise à jour formule
  await updateDoc(formulaRef, {
    current: newCurrent,
    reste: newReste
  });

  // 🧠 contribution utilisateur (cumulée, réouvrable)
  await setDoc(
    contribRef,
    {
      pseudo: user.displayName || 'Utilisateur',
      value: increment(value),
      isFinished: false, // 🔥 nouvelle contribution
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  // 🔓 accès discussion
  await setDoc(
    doc(db, SESSIONS_COLLECTION, sessionId, 'zikrContributions', user.uid),
    { hasContributed: true },
    { merge: true }
  );

  input.value = '';

  showModalFeedback(
    newReste === 0
      ? "📌 Objectif entièrement choisi. En attente des validations."
      : `✅ Contribution enregistrée.
  Il reste ${newReste} à choisir.`,
    "success",
    4000
  );

  await refreshDiscussionAccess();

}

function showModalFeedback(
  message,
  type = "info",
  duration = 2500
) {
  // Supprime l'ancien feedback
  const old = document.querySelector('.modal-feedback');
  if (old) old.remove();

  // Types autorisés
  const types = {
    success: { class: "success", icon: "✔️" },
    error: { class: "error", icon: "❌" },
    system: { class: "system", icon: "⚠️" },
    info: { class: "info", icon: "ℹ️" }
  };

  const conf = types[type] || types.info;

  // Création
  const feedback = document.createElement('div');
  feedback.className = `modal-feedback ${conf.class}`;
  feedback.innerHTML = `
    <span class="icon">${conf.icon}</span>
    <span class="message">${message}</span>
  `;

  document.body.appendChild(feedback);

  // Animation entrée
  requestAnimationFrame(() => {
    feedback.classList.add('show');
  });

  // Sortie
  setTimeout(() => {
    feedback.classList.remove('show');
    feedback.addEventListener(
      'transitionend',
      () => feedback.remove(),
      { once: true }
    );
  }, duration);
}

function openModal(html) {
  // ferme toute modale existante
  document.querySelectorAll('.modal').forEach(m => m.remove());

  //document.body.style.overflow = 'hidden';
  document.body.classList.add("modal-open");

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = html;

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal);
  });

  document.body.appendChild(modal);

  // déclenche l'animation après le rendu
  requestAnimationFrame(() => {
    modal.classList.add('open');
  });

  return modal;
}

function closeModal(modal) {
  // joue l'animation de sortie
  modal.classList.remove('open');
  modal.querySelector('.modal-card').addEventListener('transitionend', () => {
    //document.body.style.overflow = '';
    document.body.classList.remove("modal-open");
    modal.remove();
  }, { once: true });
}


/* ---------- Popup invitation: même système que création de session ---------- */

function openInviteCodeModal() {
  const modal = openModal(`
    <div class="modal-card card">
      <h3>Campagne Privée</h3>

      <input id="inviteCodeInput" placeholder="Code d’invitation" />

      <p id="inviteError" style="color:red;min-height:20px"></p>

      <hr style="margin:16px 0">

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="validateInviteCodeBtn" class="btn btn-success">Rejoindre</button>
        <button id="closeInviteModal" class="btn">Annuler</button>
      </div>
    </div>
  `);

  modal.querySelector('#closeInviteModal').onclick = () => closeModal(modal);

  modal.querySelector('#validateInviteCodeBtn').onclick = async () => {
    const code = document.getElementById("inviteCodeInput").value.trim();
    //const errorBox = document.getElementById("inviteError");
    const user = auth.currentUser;

    if (!code) {

      showModalFeedback("Veuillez entrer un code.");
      return;
    }
    if (!user) {
      //errorBox.textContent = "Vous devez être connecté.";
      showModalFeedback("Vous devez être connecté.");
      return;
    }

    const q = query(collection(db, "sessions"), where("inviteCode", "==", code));
    const snap = await getDocs(q);

    if (snap.empty) {
      showModalFeedback("Code invalide.");
      return;
    }

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();

    if (sessionData.invitedEmails?.includes(user.email)) {
      showModalFeedback("Vous êtes déjà invité.");
      return;
    }

    await updateDoc(doc(db, "sessions", sessionDoc.id), {
      invitedEmails: arrayUnion(user.email)
    });


    showModalFeedback("Invitation acceptée 🎉");


    setTimeout(() => {
      document.body.removeChild(modal);
      loadSessions();
    }, 1000);
  };
}

/* ---------- Ouverture depuis le bouton ---------- */

document.getElementById("joinWithCodeBtn")
  .addEventListener("click", openInviteCodeModal);



searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();

  [...sessionsContainer.children].forEach(session => {
    const text = session.innerText.toLowerCase();
    session.style.display = text.includes(term) ? "block" : "none";
  });
});


/* ---------- Filtres campagnes ---------- */

function setActiveFilter(activeBtn) {
  filterButtons.forEach(btn => btn.classList.remove("active"));
  activeBtn.classList.add("active");

  if (activeBtn === btnToutes) {
    campaignTitle.textContent = "Toutes les campagnes...";
    currentFilter = "toutes";
  }

  if (activeBtn === btnLectures) {
    campaignTitle.textContent = "Mes campagnes en cours...";
    currentFilter = "lectures";
  }

  if (activeBtn === btnHistorique) {
    campaignTitle.textContent = "Mon historique de participation...";
    currentFilter = "historique";
  }

  applyFilter();
}

// événements
btnToutes.addEventListener("click", () => { setActiveFilter(btnToutes); refreshGrid(); });
btnLectures.addEventListener("click", () => { setActiveFilter(btnLectures); refreshGrid(); });
btnHistorique.addEventListener("click", () => { setActiveFilter(btnHistorique); refreshGrid(); });

// état initial
setActiveFilter(btnToutes);


/// PUB
/*
document.getElementById("publicite").addEventListener("click", () => {
  showPage("publicitePage");
  renderPublicite("projets");
});*/

document.getElementById("publicite").addEventListener("click", () => {
  showPage("publicitePage");
  showBackBtn();          // 🔥
  renderPublicite("projets");
});


document.getElementById("utilitaire").addEventListener("click", () => {
  showPage("utilitairePage");
  showBackBtn();          // 🔥
  renderUtilitaire("prieres");
});

const tabProjets = document.getElementById("tabProjets");
const tabVentes = document.getElementById("tabVentes");
const tabPartenaires = document.getElementById("tabPartenaires");

[tabProjets, tabVentes, tabPartenaires].forEach(tab => {
  tab.addEventListener("click", () => {
    [tabProjets, tabVentes, tabPartenaires].forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    if (tab === tabProjets) renderPublicite("projets");
    if (tab === tabVentes) renderPublicite("ventes");
    if (tab === tabPartenaires) renderPublicite("partenaires");
  });
});

/*
function renderPublicite(type) {
  const container = document.getElementById("publiciteContent");
  container.innerHTML = "";

  const data = PUBLICITE_DATA[type] || [];

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "pub-card-wa";

    card.innerHTML = `
      <div class="pub-img-wrapper">
        <img src="${item.image}" alt="${item.title}">
        <div class="pub-overlay-text">
          ${item.description}
        </div>
      </div>
    `;

    card.onclick = () => {
      if (item.link) window.open(item.link, "_blank");
    };

    container.appendChild(card);
  });
}
*/
function renderPublicite(type) {
  const container = document.getElementById("publiciteContent");
  container.innerHTML = "";

  const data = PUBLICITE_DATA[type] || [];

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "pub-card";

    card.innerHTML = `
      <div class="pub-image">
        <img src="${item.image}" alt="${item.title}">
      </div>

      <div class="pub-body">
        <h4>${item.title}</h4>
        <p>${item.description}</p>

        ${item.cta ? `
          <button class="btn btn-primary">
            ${item.cta}
          </button>
        ` : ""}
      </div>
    `;

    if (item.link) {
      card.onclick = () => window.open(item.link, "_blank");
    }

    container.appendChild(card);
  });
}

/// FIN PUB

//UTILITAIRE
/*
function renderUtilitaire(type) {
  const container = document.getElementById("utilitaireContent");
  container.innerHTML = "";

  const data = UTILITAIRE_DATA[type] || [];

  if (!data.length) {
    container.innerHTML = `<div class="empty-state">Aucun contenu disponible</div>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "util-card";

    card.innerHTML = `
      <div class="util-body">
        <h4>${item.title}</h4>
        <p>${item.description}</p>

        <a href="${item.pdf}" 
           target="_blank"
           class="btn btn-primary">
           Ouvrir le document
        </a>
      </div>
    `;

    container.appendChild(card);
  });

  container.scrollTo({ left: 0, behavior: "instant" });
}
*/

function renderUtilitaire(type) {
  const container = document.getElementById("utilitaireContent");
  container.innerHTML = "";

  const data = UTILITAIRE_DATA[type] || [];

  if (!data.length) {
    container.innerHTML = `<div class="empty-state">Aucun contenu disponible</div>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "util-card";

    card.innerHTML = `
      <div class="util-body">
        <h4>${item.title}</h4>
        <p class="util-desc">${item.description}</p>

        <div class="util-text">
          ${item.content.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  container.scrollTo({ left: 0, behavior: "instant" });
}

document.querySelectorAll(".util-tabs .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".util-tabs .tab-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    renderUtilitaire(btn.dataset.type);
  });
});

// Chargement initial
renderUtilitaire("prieres");

//FIN UTILITAIRE 

function refreshGrid() {
  //el.sessionView.style.display = 'none';
  sessionView.hidden = true;
  applyFilter();
}


const scrollTopBtn = document.getElementById('scrollTopBtn');
//const scrollDownBtn = document.getElementById('scrollDownBtn');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const max = document.body.scrollHeight - window.innerHeight;


  // bouton bas → visible si on a scrollé
  scrollTopBtn.style.display = y > 100 ? 'flex' : 'none';
});

// ⬆️ remonter
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});




async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById('profilePseudo').value = data.pseudo || '';
  document.getElementById('profileAvatarImg').src =
    data.photoURL || 'default.jpg';
}

function generatePseudo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizePseudo(value) {
  return value
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 14);
}

profileEditionLink?.addEventListener("click", (e) => {
  e.preventDefault();
  loadProfile();
  openProfileCodeModal();

});


function openProfileCodeModal() {

  const modal = openModal(`
      <div class="modal-card card">

          <button id="logoutFromProfile" class="logout-icon" title="Déconnexion">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
      >
        <!-- Porte -->
        <path d="M3 2h10v2H5v16h8v2H3z"/>
        <!-- Flèche -->
        <path d="M13 12l-4-4v3H7v2h2v3z"/>
        <!-- Personne -->
        <circle cx="17" cy="6" r="2"/>
        <path d="M15 22v-6l-2-2 1-1 3 3v6z"/>
      </svg>
    </button>
        <h3>Mon profil</h3>
      
        <div class="profile-avatar">
          <img id="profileAvatarImg" src="default.jpg" style="cursor:pointer">
          <label for="profileAvatarInput" class="change-avatar-btn">📷</label>
          <input type="file" id="profileAvatarInput" accept="image/*">
        </div>
      
        <label>Pseudo</label>
        <input id="profilePseudo" maxlength="14" />
      
        <p id="profileError"></p>

        <hr style="margin:16px 0">
      
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button id="saveProfileBtn" class="btn btn-success">Enregistrer</button>
          <button id="closeProfileModal" class="btn">Annuler</button>
        </div>

      </div>
    `);

  const avatarInput = modal.querySelector('#profileAvatarInput');
  const avatarImg = modal.querySelector('#profileAvatarImg');

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    avatarImg.src = previewURL;
  });
  avatarImg.onclick = () => avatarInput.click();


  modal.querySelector('#closeProfileModal').onclick = () => closeModal(modal);

  modal.querySelector('#saveProfileBtn').onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    let pseudo = sanitizePseudo(
      document.getElementById('profilePseudo').value
    );

    if (!pseudo) {
      showModalFeedback("Pseudo invalide");
      return;
    }

    const avatarInput = document.getElementById('profileAvatarInput');
    const avatarFile = avatarInput.files[0];

    let photoURL = user.photoURL || 'default.jpg';

    if (avatarFile) {
      // ⚠️ temporaire : image locale (sera remplacée par Firebase Storage plus tard)
      photoURL = document.getElementById('profileAvatarImg').src;
    }

    await updateProfile(user, {
      displayName: pseudo,
      photoURL
    });

    await updateDoc(doc(db, 'users', user.uid), {
      pseudo,
      photoURL,
      updatedAt: serverTimestamp()
    });

    showModalFeedback('Profil mis à jour ✅');
  };

  
  modal.querySelector('#logoutFromProfile').onclick = () => {
    const modalConfirm = openModal(`
      <div class="modal-card card">
        <h3>Déconnexion</h3>
        <p>Vous voulez vous déconnecter ?</p>
  
        <hr style="margin:16px 0">

        <div style="display:flex;gap:8px;margin-top:16px;">
          <button id="confirmLogout" class="btn btn-danger">Me déconnecter</button>
          <button id="cancelLogout" class="btn">Annuler</button>
        </div>
      </div>
    `);
  
    document.getElementById('confirmLogout').onclick = async () => {
      
  
      await signOut(auth);
      showModalFeedback('Déconnexion réussie!', 'success');

      refreshMenuUserAvatar(); // 👈 ici

      closeModal(modalConfirm);
      showPage('home');

      document.getElementById('homeConnectBtn').style.display = 'inline-block';
      hideBottomBar();
     

    };
  
    document.getElementById('cancelLogout').onclick  = () => closeModal(modalConfirm);
  };
  
  

}


function openConfirmModal({
  title = "Confirmation",
  message = "Êtes-vous sûr ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  danger = false,
  onConfirm
}) {
  const modal = openModal(`
    <div class="modal-card card">
      <h3>${title}</h3>
      <p style="margin-top:8px">${message}</p>

      <hr style="margin:16px 0">

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="confirmOk" class="btn ${danger ? 'btn-danger' : 'btn-success'}">
          ${confirmText}
        </button>
        <button id="confirmCancel" class="btn">
          ${cancelText}
        </button>
      </div>
    </div>
  `);
  

  modal.querySelector('#confirmCancel').onclick = () => closeModal(modal);

  modal.querySelector('#confirmOk').onclick = async () => {
    closeModal(modal);
    await onConfirm?.();
  };
}


function refreshMenuUserAvatar(user) {
  const avatarImg = document.querySelector('#menuUserAvatar img');
  if (!avatarImg) return;

  if (user && user.photoURL) {
    avatarImg.src = user.photoURL;
  } else {
    avatarImg.src = 'default.jpg'; // avatar par défaut
  }
}


async function userHasJuzInSession(sessionId, userId) {
  const snap = await getDocs(
    query(
      collection(db, SESSIONS_COLLECTION, sessionId, "juz"),
      where("assignedTo", "==", userId)
    )
  );
  return !snap.empty;
}


function formatMessageDate(ts) {
  if (!ts) return "";
  const d = ts.toDate();
  const now = new Date();

  const diffTime = now - d;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const options = { day: 'numeric', month: 'short' };
  const weekday = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return weekday[d.getDay()];
  return `${weekday[d.getDay()]} ${d.toLocaleDateString('fr-FR', options)}`;
}


async function loadMessages(sessionId) {

  // 🔒 sécurité
  if (!(await userCanAccessDiscussion(currentSession))) return;

  // 🔥 nettoyer ancien listener
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  const list = document.getElementById("messagesList");
  list.innerHTML = "";

  const q = query(
    collection(db, SESSIONS_COLLECTION, sessionId, "messages"),
    orderBy("createdAt", "asc")
  );

  let lastDate = "";

  unsubscribeMessages = onSnapshot(q, snap => {
    list.innerHTML = "";
    lastDate = "";

    snap.forEach(doc => {
      const m = doc.data();
      const isMe = auth.currentUser?.uid === m.authorId;

      const dateStr = formatMessageDate(m.createdAt);
      let dateBadge = "";
      if (dateStr !== lastDate) {
        dateBadge = `<div class="date-badge">${dateStr}</div>`;
        lastDate = dateStr;
      }

      const div = document.createElement("div");
      div.className = `message ${isMe ? "me" : "other"}`;
      div.innerHTML = `
        ${dateBadge}
        <div class="message-body">
          ${!isMe ? `<img src="${m.photoURL || 'default.jpg'}">` : ""}
          <div class="message-content">
            <strong>${m.authorPseudo}</strong>
            <div class="message-text">${m.text}</div>
            <small class="message-time">
              ${m.createdAt?.toDate().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </small>
          </div>
        </div>
      `;
      list.appendChild(div);
    });

    list.scrollTop = list.scrollHeight;
  });
}

function initSessionTabs(session) {
  const tabJuz = document.getElementById("tabJuz");
  const tabFormula = document.getElementById("tabFormula");
  const tabDiscussion = document.getElementById("tabDiscussion");

  const grid = document.getElementById("grid");
  const zikrView = document.getElementById("zikrView");
  const discussion = document.getElementById("discussionSection");

  if (!tabDiscussion) return;

  // 🔄 reset visibilité & états
  [tabJuz, tabFormula, tabDiscussion].forEach(t => {
    t?.classList.remove("active");
    t?.classList.remove("hidden");
  });

  [grid, zikrView, discussion].forEach(v => {
    v?.classList.add("hidden");
  });

  /* =====================================================
     📖 CAMPAGNE CORAN
     ===================================================== */
  if (session.typeCampagne === 'coran') {
    tabFormula.classList.add("hidden");

    tabJuz.classList.add("active");
    grid.classList.remove("hidden");
  }

  /* =====================================================
     🧿 CAMPAGNE ZIKR
     ===================================================== */
  if (session.typeCampagne === 'zikr') {
    tabJuz.classList.add("hidden");

    tabFormula.classList.add("active");
    zikrView.classList.remove("hidden");
  }

  /* =====================================================
     🎯 EVENTS
     ===================================================== */

  tabJuz.onclick = () => {
    if (tabJuz.classList.contains('hidden')) return;

    grid.classList.remove("hidden");
    zikrView.classList.add("hidden");
    discussion.classList.add("hidden");

    tabJuz.classList.add("active");
    tabFormula.classList.remove("active");
    tabDiscussion.classList.remove("active");
  };

  tabFormula.onclick = () => {
    if (tabFormula.classList.contains('hidden')) return;

    zikrView.classList.remove("hidden");
    grid.classList.add("hidden");
    discussion.classList.add("hidden");

    tabFormula.classList.add("active");
    tabJuz.classList.remove("active");
    tabDiscussion.classList.remove("active");
  };


  tabDiscussion.onclick = async () => {

    // 🔒 vérification accès
    const canAccess = await userCanAccessDiscussion(currentSession);
    if (!canAccess) return;
  
    discussion.classList.remove("hidden");
    grid.classList.add("hidden");
    zikrView.classList.add("hidden");
  
    tabDiscussion.classList.add("active");
    tabJuz.classList.remove("active");
    tabFormula.classList.remove("active");
  
    // 🔄 charger messages AU MOMENT DU CLIC
    openDiscussionTab(currentSession.id);
  };
  
}


function showBottomBar() {
  el.bottomActionBtn.style.display = 'flex';
}

function hideBottomBar() {
  el.bottomActionBtn.style.display = 'none';
}


/*
const consentCheckbox = document.getElementById('consent');

if (!consentCheckbox.checked) {
  showModalFeedback(
    "❌ Vous devez accepter l’utilisation de vos données personnelles pour continuer.",
    "error"
  );
  return;
}
*/