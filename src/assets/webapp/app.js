// app.js (version nettoyée + gestion public/private + admin)
import { auth, provider, db, SESSIONS_COLLECTION } from "./firebase.js";
import {
  doc, setDoc, updateDoc, onSnapshot, getDoc, serverTimestamp,
  collection, getDocs, addDoc, query, where, orderBy, getFirestore, arrayUnion, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



import {
  signInWithPopup, signOut, onAuthStateChanged,
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

const filterButtons = [btnToutes, btnLectures, btnHistorique];

const el = {
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  pseudoInput: document.getElementById('pseudoInput'),
  emailLoginBtn: document.getElementById('emailLoginBtn'),
  emailSignupBtn: document.getElementById('emailSignupBtn'),
  googleLogin: document.getElementById('googleLogin'),
  forgotPassword: document.getElementById('forgotPassword'),
  authPage: document.getElementById('authPage'),
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
  menuLogoutBtn: document.getElementById('menuLogout'),
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

//let currentSessionTab = "juz"; // "juz" | "discussion"
const tabCoran = document.getElementById("tabCoran");
const tabZikr = document.getElementById("tabZikr");
const juzGrid = document.getElementById('grid');      // grille Juz dans sessionView
const zikrGrid = document.getElementById('zikrView'); // grille Zikr
const juzSelectionBar = document.getElementById('juzSelectionBar'); // si tu veux aussi cacher pour Zikr

const sessionView = document.getElementById('sessionView');



/*
tabCoran.onclick = () => {
  currentTypeFilter = "coran";

  tabCoran.classList.add("active");
  tabZikr.classList.remove("active");

  // Affiche uniquement la grille Juz
  juzGrid.classList.remove("hidden");
  zikrGrid.classList.add("hidden");

  // Affiche la barre de sélection Juz
  juzSelectionBar.classList.remove("hidden");

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
  juzSelectionBar.classList.add("hidden");

  applyFilter();
};

*/

tabCoran.onclick = () => {
  currentTypeFilter = "coran";

  tabCoran.classList.add("active");
  tabZikr.classList.remove("active");

// Cacher
sessionView.hidden = true;
    // Affiche uniquement la grille Juz
    //juzGrid.classList.remove("hidden");
   // zikrGrid.classList.add("hidden");
  
    // Affiche la barre de sélection Juz
    //juzSelectionBar.classList.remove("hidden");


   // réinitialise les onglets internes

  applyFilter();
};

tabZikr.onclick = () => {
  currentTypeFilter = "zikr";

  tabZikr.classList.add("active");
  tabCoran.classList.remove("active");

  // Affiche uniquement la grille Zikr
  // Affiche uniquement la grille Zikr
  zikrGrid.classList.remove("hidden");
  juzGrid.classList.add("hidden");

  // Cache la barre de sélection Juz
  //juzSelectionBar.classList.add("hidden");
   // réinitialise les onglets internes
   sessionView.hidden = true;

  applyFilter();
};

/* ---------- Helpers ---------- */
function showPage(id) {
  document.querySelectorAll('.page').forEach(s => s.hidden = true);
  document.getElementById(id).hidden = false;
}

function parseCSVemails(text) {
  if (!text) return [];
  return text.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

/* ---------- Auth handlers (email+google) ---------- */
el.googleLogin?.addEventListener('click', async () => {
  try { await signInWithPopup(auth, provider); }
  catch (e) { console.error(e); alert(e.message); }
});

el.emailSignupBtn?.addEventListener('click', async () => {
  const email = el.emailInput.value.trim();
  const password = el.passwordInput.value.trim();
  const pseudo = el.pseudoInput.value.trim();
  if (!email || !password || !pseudo) return alert('Remplissez tous les champs');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: pseudo });
    await sendEmailVerification(cred.user);
    alert('Compte créé. Vérifiez votre email avant connexion.');
    showPage('home');
  } catch (e) { console.error(e); alert(e.message); }
});

el.emailLoginBtn?.addEventListener('click', async () => {
  const email = el.emailInput.value.trim();
  const password = el.passwordInput.value.trim();
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user.providerData.some(p => p.providerId === 'password') && !cred.user.emailVerified) {
      alert('Vérifiez votre email avant connexion.');
      await signOut(auth);
    }
  } catch (e) { console.error(e); alert(e.message); }
});

el.forgotPassword?.addEventListener('click', async (ev) => {
  ev.preventDefault();
  const email = el.emailInput.value.trim();
  if (!email) return alert('Entrez votre email pour réinitialiser');
  try { await sendPasswordResetEmail(auth, email); alert('Email de réinitialisation envoyé'); } catch (e) { alert(e.message); }
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

    row.addEventListener('click', () => openSession(session));
    el.sessionsDiv.appendChild(row);
  });
}


/**
 * openSession(sessionId)
 * loads juz and attaches realtime listeners
 */
let currentSessionId = null;
let currentSession = null; // variable globale
let unsubscribers = [];
//const sessionHeader = document.getElementById('sessionHeader');
const sessionTitle = document.getElementById('sessionTitle');
const sessionMeta = document.getElementById('sessionMeta');
const stats = document.getElementById('stats');
const closeBtn = document.getElementById('closeSessionBtn');

async function openSession(session) {
  // cleanup listeners
  unsubscribers.forEach(u => u && u());
  unsubscribers = [];

  currentSession = session; // stocke la session complète
  currentSessionId = session.id;

  // Affiche l'entête
 // sessionHeader.classList.remove('hidden');

  // Personnalisation selon type de campagne
  if (session.typeCampagne === 'zikr') {
    sessionTitle.textContent = 'Série de Zikr';
    stats.style.display = 'none';
    closeBtn.textContent = 'Clôturer la série de Zikr';

    // Affiche uniquement la grille Zikr
    //document.getElementById('zikrView').classList.remove('hidden');
    //document.getElementById('grid').classList.add('hidden');
    //document.getElementById('juzSelectionBar').classList.add('hidden');
    document.getElementById('sessionView').classList.remove('hidden');
    showZikrCampaign(session);

  } else {
    sessionTitle.textContent = 'Lecture Coran';
    stats.style.display = 'block';
    closeBtn.textContent = 'Clôturer la campagne';

    // Affiche uniquement la grille Juz
   // document.getElementById('grid').classList.remove('hidden');
    //document.getElementById('zikrView').classList.add('hidden');
   // document.getElementById('juzSelectionBar').classList.remove('hidden');
   document.getElementById('sessionView').classList.remove('hidden');
   
    showCoranCampaign(session);
  }

  // Charger les métadonnées
  const metaSnap = await getDoc(doc(db, SESSIONS_COLLECTION, currentSessionId));
  if (!metaSnap.exists()) return alert('Session introuvable');
  const meta = metaSnap.data();

  sessionMeta.innerHTML = `
    <div><strong>Période :</strong> ${meta.startDate || ''} → ${meta.endDate || ''}</div>
    <div><strong>Visibilité :</strong> ${meta.isPublic ? 'Publique' : 'Privée'}</div>
    <div><strong>Statut :</strong> ${meta.status === 'closed' ? 'Clôturée' : 'Ouverte'}</div>
  `;

  // Afficher ou cacher bouton Clôturer selon statut
  const isAdmin = auth.currentUser.uid === meta.createdBy;
  const hasInviteCode = !!meta.inviteCode;
  const isClosed = meta.status === 'closed';
  closeBtn.style.display = (isAdmin && !isClosed) ? 'inline-block' : 'none';


  //Ajout du partage WhatsApp / Email
  if (isAdmin && hasInviteCode) {
    const inviteText = `Rejoins notre campagne "${meta.name}" avec ce code : ${meta.inviteCode}`;

    document.getElementById("shareWhatsappBtn")?.addEventListener("click", () => {
      const url = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
      window.open(url, "_blank");
    });

    document.getElementById("shareMailBtn")?.addEventListener("click", () => {
      const subject = `Invitation à la campagne ${meta.name}`;
      const body = inviteText;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }


  //User can Access Discussion
const canAccessDiscussion = await userCanAccessDiscussion(session);

if (canAccessDiscussion) {
  enableDiscussion();
  loadMessages(currentSessionId);
} else {
  disableDiscussion();
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
  el.sessionView.hidden = false;
  initSessionTabs(session);
  // état par défaut

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

  // Scroll automatique vers le container
  //sessionView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  sessionTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // close session button visible only to admin
  //const user = auth.currentUser;
  //const isClosed = meta.status === 'closed';
  const allFinished = arr.every(j => j && j.status === 'finished');

  // Références
  //const closeBtn = el.closeSessionBtn;
  const inviteBox = document.getElementById('showCodeInvitation');

  // --- Campagne déjà clôturée ---
  if (isClosed) {
    closeBtn.style.display = 'inline-block';
    closeBtn.classList.add('is-closed');

    if (inviteBox) {
      inviteBox.classList.add('is-closed');
    }
    return;
  }



  document.getElementById("sendMessageBtn").onclick = async () => {
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
  if (isAdmin && allFinished) {
    closeBtn.style.display = 'inline-block';
    closeBtn.classList.remove('is-closed');

    closeBtn.onclick = async () => {
      if (!confirm('Clore définitivement cette campagne ?')) return;

      await updateDoc(
        doc(db, SESSIONS_COLLECTION, sessionId),
        {
          status: 'closed',
          closedAt: serverTimestamp()
        }
      );

      alert('Campagne clôturée');

      // Griser immédiatement l’UI
      closeBtn.classList.add('is-closed');
      if (inviteBox) inviteBox.classList.add('is-closed');

      await loadSessions();
    };
  } else {
    closeBtn.style.display = 'none';
  }
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


function renderGrid(juzData) {
  el.grid.innerHTML = '';
  let finished = 0;

  juzData.forEach(j => 
    {
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
      statusLabel = `en cours / ${pseudo}`;
      statusClass = 'badge-assigned';
    }

    if (j.status === 'finished') {
      statusLabel = `terminé / ${pseudo}`;
      statusClass = 'badge-finished';
    }

        card.innerHTML = `
      <div class="juz-header">
        <label class="juz-checkbox">
          <input
            type="checkbox"
            class="juz-check"
            data-juz="${j.number}"
            ${j.status === 'finished' ? 'checked disabled' : ''}
          />
          <span class="juz-number">Juz ${j.number}</span>
        </label>

        <span class="juz-badge ${statusClass}">
          ${statusLabel}
        </span>
      </div>
    `;


    // 🖱️ clic sur la carte → toggle checkbox (sauf disabled)
    card.addEventListener('click', e => 
    {
      if (e.target.tagName === 'INPUT') return;

      const checkbox = card.querySelector('.juz-check');
      if (checkbox.disabled) return;
      
      checkbox.checked = !checkbox.checked;
      // 🔥 FORCE la mise à jour globale
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });



        el.grid.appendChild(card);
  });

  el.stats.textContent = `Terminés : ${finished} / 30`;
  setupJuzCheckboxes();
}


function setupJuzCheckboxes() {
  const checkboxes = document.querySelectorAll('.juz-check');
  const checkAll = document.getElementById('checkAllJuz');

  // Checkbox individuelle
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateJuzSelectionUI);
  });

  // Select all
  checkAll.onchange = () => {
    checkboxes.forEach(cb => {
      if (!cb.disabled) {
        cb.checked = checkAll.checked;
      }
    });
    updateJuzSelectionUI();
  };
}

function updateJuzSelectionUI() {
  const checkboxes = [...document.querySelectorAll('.juz-check')];
  const selected = checkboxes.filter(cb => cb.checked && !cb.disabled);

  // 🔘 select all
  const checkAll = document.getElementById('checkAllJuz');
  const selectable = checkboxes.filter(cb => !cb.disabled);

  checkAll.checked =
    selectable.length > 0 &&
    selectable.every(cb => cb.checked);

  // 📦 barre de sélection
  const bar = document.getElementById('juzSelectionBar');
  bar.classList.toggle('hidden', selected.length === 0);

  // 🏷️ label
  const label = document.getElementById('selectedJuzLabel');
  label.textContent = `Sélection Juz : ${selected
    .map(cb => cb.dataset.juz)
    .join(', ')}`;
}

document.getElementById('validateJuzBtn').onclick = async () => {
  const user = auth.currentUser;
  if (!user || !currentSessionId) return;

  const selected = [...document.querySelectorAll('.juz-check:checked')]
    .map(c => Number(c.dataset.juz));

  if (!selected.length) return;

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const pseudo = userSnap.data()?.pseudo || 'Utilisateur';

  const success = [];
  const refusedOther = [];

  for (const num of selected) {
    const ref = doc(db, SESSIONS_COLLECTION, currentSessionId, 'juz', String(num));
    const snap = await getDoc(ref);
    const data = snap.data();

    if (data.status === 'free') {
      await updateDoc(ref, {
        status: 'assigned',
        assignedTo: user.uid,
        assignedPseudo: pseudo,
        assignedAt: serverTimestamp()
      });
      success.push(num);
    } else {
      refusedOther.push(num);
    }
  }
const message = 'Juz Chosis :'
  showJuzFeedback({
    success,
    refusedOther, 
    message
  });
};


document.getElementById('finishJuzBtn').onclick = async () => {
  const user = auth.currentUser;
  if (!user || !currentSessionId) return;

  const selected = [...document.querySelectorAll('.juz-check:checked')]
    .map(c => Number(c.dataset.juz));

  if (!selected.length) return;

  const success = [];
  const refusedFree = [];
  const refusedOther = [];

  for (const num of selected) {
    const ref = doc(db, SESSIONS_COLLECTION, currentSessionId, 'juz', String(num));
    const snap = await getDoc(ref);
    const data = snap.data();

    if (!data) continue;

    if (data.status === 'assigned' && data.assignedTo === user.uid) {
      await updateDoc(ref, {
        status: 'finished',
        finishedAt: serverTimestamp()
      });
      success.push(num);
    } else if (data.status === 'free') {
      refusedFree.push(num);
    } else {
      refusedOther.push(num);
    }
  }
    const message = 'Juz terminés :'
  showJuzFeedback({ success, refusedFree, refusedOther , message});
};

function showJuzFeedback({ success = [], refusedFree = [], refusedOther = [] , message}) {
  const box = document.getElementById('juzFeedback');
  box.className = 'juz-feedback';

  let html = '';

  if (success.length) {
    box.classList.add('success');
    html += `✅ ${message} ${success.join(', ')}<br>`;
  }

  if (refusedFree.length || refusedOther.length) {
    box.classList.add('error');
    html += `❌ Refusés :<ul>`;
    if (refusedFree.length) {
      html += `<li>Juz non assignés : ${refusedFree.join(', ')}</li>`;
    }
    if (refusedOther.length) {
      html += `<li>Juz assignés à un autre : ${refusedOther.join(', ')}</li>`;
    }
    html += `</ul>`;
  }

  box.innerHTML = html;
}

/* ---------- UI: create session modal ---------- */
function openCreateSessionModal() {

  const modal = openModal(`
  <div class="modal-card card" style="max-width:420px;width:100%">
    <h3>Nouvelle Campagne de Lecture</h3>

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
          <input type="checkbox" id="ns_public" checked>
          <span class="slider"></span>
        </label>
        <span id="labelPublic">Publique</span>
      </div>
    </div>

    <!-- Emails invités -->
    <div id="invitedRow" style="margin-top:8px">
      <label>Invités : 
        <input id="ns_invited" placeholder="a@ex.com, b@ex.com" />
      </label>
    </div>

    <!-- Générer un code -->
    <div id="genCodeRow" style="margin-top:8px">
      <label><input id="ns_gen_code" type="checkbox" /> Un code d'invitation sera généré</label>
    </div>

    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="ns_create" class="btn btn-success">Démarrer</button>
      <button id="ns_cancel" class="btn">Annuler</button>
    </div>
  </div>`);


  document.body.appendChild(modal);

  
  // ---- Logique d'affichage des options selon "Publique" ----
  // Masquer/afficher la génération de code selon "Publique"


  const publicCheckbox = document.getElementById("ns_public");
  const invitedRow = document.getElementById("invitedRow");
  const genCodeRow = document.getElementById("genCodeRow");
  const genCodeCheckbox = document.getElementById("ns_gen_code");
  const startDate = document.getElementById("ns_start");
  const endDate = document.getElementById("ns_end");
  const labelPrivate = document.getElementById("labelPrivate");
  const labelPublic = document.getElementById("labelPublic");

const typeSelect = document.getElementById('ns_type');
const zikrBlock = document.getElementById('zikrFormulasCreate');
const addFormulaBtn = document.getElementById('addFormulaBtn');

typeSelect.addEventListener('change', () => {
  zikrBlock.style.display =
    typeSelect.value === 'zikr' ? 'block' : 'none';
});

// affichage initial (IMPORTANT)
zikrBlock.style.display =
  typeSelect.value === 'zikr' ? 'block' : 'none';

addFormulaBtn.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'zikr-formula';
  row.style.display = 'flex';
  row.style.gap = '6px';
  row.style.marginTop = '6px';

  row.innerHTML = `
    <input placeholder="Nom formule" class="zf-name" />
    <input type="number" placeholder="Objectif" class="zf-target" />
  `;

  zikrBlock.insertBefore(row, addFormulaBtn);
});




  // ---- Fermeture avec bouton Annuler ----

  modal.querySelector('#ns_cancel').onclick = () => closeModal(modal);

  // ---- Fermeture en cliquant sur le fond (même comportement que invite popup) ----
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // ----------- Dates MIN -----------

  // Date du jour au format AAAA-MM-JJ
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Interdire dates passées
  startDate.min = todayStr;
  endDate.min = todayStr;

  // ----------- Contrôle de visibilité -----------

  function updateVisibility() {
    if (publicCheckbox.checked) {
      // Publique
      invitedRow.style.display = "none";
      genCodeRow.style.display = "none";
      genCodeCheckbox.checked = false;
      genCodeCheckbox.disabled = true;
      labelPrivate.style.display = "none";
      labelPublic.style.display = "block";
    } else {
      // Privée
      invitedRow.style.display = "block";
      genCodeRow.style.display = "block";
      genCodeCheckbox.checked = true;   // obligatoire
      genCodeCheckbox.disabled = true;  // bloqué
      labelPrivate.style.display = "block";
      labelPublic.style.display = "none";
    }
  }
  updateVisibility();

  publicCheckbox.addEventListener("change", updateVisibility);


  // ----------- Validation Dates -----------

  startDate.addEventListener("change", () => {
    if (startDate.value) {
      // Fin ne peut pas être avant début
      endDate.min = startDate.value;

      // Si fin choisie trop tôt → reset
      if (endDate.value && endDate.value < startDate.value) {
        endDate.value = "";
      }
    }
  });

  endDate.addEventListener("change", () => {
    if (endDate.value && startDate.value && endDate.value < startDate.value) {
      alert("La date de fin ne peut pas être antérieure à la date de début.");
      endDate.value = "";
    }
  });

  // ---- Création de la campagne ----

modal.querySelector('#ns_create').onclick = async () => {
  const name = document.getElementById('ns_name').value.trim();
  const typeCampagne = document.getElementById('ns_type').value;
  const start = startDate.value || null;
  const end = endDate.value || null;
  const isPublic = publicCheckbox.checked;
  const invited = parseCSVemails(document.getElementById('ns_invited').value);
  const genCode = genCodeCheckbox.checked;

  if (!name) return alert('Donnez un nom à la campagne');

  let formules = [];

  if (typeCampagne === 'zikr') {
    document.querySelectorAll('.zikr-formula').forEach(row => {
      const fname = row.querySelector('.zf-name').value.trim();
      const target = Number(row.querySelector('.zf-target').value);

      if (fname && Number.isFinite(target) && target > 0) {
        formules.push({
          name: fname,
          objectif: target
        });
      }
    });

    if (!formules.length) {
      return alert('Ajoutez au moins une formule de Zikr avec un objectif valide');
    }
  }

  const inviteCode = genCode
    ? Math.random().toString(36).slice(2, 8).toUpperCase()
    : null;

  try {
    const sessionId = await createSession({
      name,
      typeCampagne,
      startDate: start,
      endDate: end,
      isPublic,
      invitedEmails: invited,
      inviteCode,
      formules
    });

    document.body.removeChild(modal);
    await loadSessions();
    await openSession(sessionId);

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
};


}

function showCoranCampaign(session) {
  el.grid.classList.remove('hidden');
  el.discussionSection.classList.remove('hidden');
  document.getElementById('zikrView').classList.add('hidden');
}

function enableDiscussion() {
  el.discussionSection.classList.remove('hidden');
  
}

function disableDiscussion() {
  el.discussionSection.classList.add('hidden');
}


function showZikrCampaign(session) {
  el.grid.classList.add('hidden');
  el.discussionSection.classList.add('hidden');

  const zikrView = document.getElementById('zikrView');
  zikrView.classList.remove('hidden');

  //setupZikrInteractions();

  // A REMPLACER PAR LE CADRE DE SELECTION VALIDATION ZIKR COMME LE MEME CAS QUE SUR LES JUZ
  //document.getElementById('zikrMeta').innerHTML = `
  //  <small>
    //  📅 ${session.startDate} → ${session.endDate}
  //  </small>
  //`;
  /////////////////////////////////////////////

  const colRef = collection(
    db,
    SESSIONS_COLLECTION,
    session.id,
    'formules'
  );

  onSnapshot(colRef, snap => {
    const formules = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderZikrFormulas(formules, session.id);
  });
}


document.addEventListener("click", e => {
  if (e.target.classList.contains("toggle-contribs")) {
    const contribs = e.target.nextElementSibling;
    contribs.classList.toggle("hidden");
  }
});


/*
function getZikrStatus(objectif, current) {
  if (!current || current === 0) {
    return { key: 'free', label: 'disponible' };
  }

  if (current < objectif) {
    return { key: 'assigned', label: 'en cours' };
  }

  return { key: 'finished', label: 'terminé' };
}
*/

function getZikrStatus(objectif, current, finished) {
  if (!current || current === 0) {
    return { key: 'free', label: 'disponible' };
  }

  if (finished >= objectif && objectif > 0) {
    return { key: 'finished', label: 'terminé' };
  }

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
    
    const isOwner = contributions.uid === auth.currentUser.uid;

    const contributorsHtml = contributions.length
    ? contributions.map(c => {
        const isOwner = c.uid === auth.currentUser.uid;
        const alreadyFinished = !!c.isFinished; // vrai si déjà terminé
        return `
          <div class="zikr-contributor" data-uid="${c.uid}">
            <span class="contrib-name">${c.pseudo}</span>
            <span class="contrib-value">${c.value}</span>
  
            <div class="contrib-actions">
              <button class="contrib-btn edit" ${!isOwner ? 'disabled' : ''} title="${!isOwner ? '' : 'Modifier la contribution'}" data-action="edit">✏️</button>
              <button class="contrib-btn finish" ${!isOwner || alreadyFinished ? 'disabled' : ''} title="${alreadyFinished ? 'Déjà terminé' : !isOwner ? '':'Marquer comme terminé'}">✔️</button>
            </div>
          </div>
        `;
      }).join('')
    : `<em class="no-contrib">Aucun contributeur</em>`;
  

const card = document.createElement('div');

card.className = `card juz zikr zikr-card ${status.key}`;


card.dataset.formuleId = f.id;

card.innerHTML = `
    <div class="juz-header zikr-header">
    <span class="zikr-title">
      ${f.name} (${objectif})
    </span>

    <span class="juz-badge badge-${status.key}">
      ${status.label}
    </span>
  </div>

  <div class="zikr-body">

    <button class="toggle-contribs" type="button">
      <span class="icon">👥</span>
      <span class="label">Contributeurs</span>
    </button>

    <div class="zikr-contribs hidden">
      ${contributorsHtml}
      <hr>
      <div class="zikr-total">
        Total choisi: <strong>${current}</strong>
      </div>
      <div class="zikr-total">
        Total terminé: <strong>${finished}</strong>
      </div>
      

    <div class="zikr-total">
      <input
        type="number"
        min="1"
        max="${reste}"
        placeholder="choix"
        class="zikr-input"
        data-formule-id="${f.id}"
        ${reste === 0 ? 'disabled' : ''}
      />
      <span class="zikr-reste">/ ${reste}</span>
    </div>


    </div>
  </div>
`;

card.querySelectorAll('.contrib-btn.finish')
  .forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      const row = btn.closest('.zikr-contributor');
      const uid = row.dataset.uid;

      // sécurité : seul l'utilisateur courant peut terminer
      if (uid !== auth.currentUser.uid) {
        showZikrFeedback("❌ Vous ne pouvez terminer que votre contribution", "error");
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
  contribsBox.classList.toggle('hidden');
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
    showZikrFeedback("❌ Aucune contribution trouvée", "error");
    return;
  }

  const data = snap.data();
  const value = Number(data.value || 0);
  const alreadyFinished = Number(data.finished || 0);

  if (alreadyFinished >= value) {
    showZikrFeedback("✅ Contribution déjà terminée");
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

  showZikrFeedback("🎉 Contribution marquée comme terminée");

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


document.getElementById('validateZikrChoices').addEventListener('click', async () => {

    const cards = document.querySelectorAll('.zikr-card');

    for (const card of cards) {
      const input = card.querySelector('.zikr-input');
      if (!input || input.disabled) continue;

      const value = Number(input.value);
      if (!value || value <= 0) continue;

      const formulaId = input.dataset.formuleId;

      await validateZikrFormula(
        currentSessionId,
        formulaId,
        card
      );
      updateLocalContributorUI(card, value);
    }

    // 🔄 refresh UI
    //await loadZikrFormulas(currentSessionId);
  });

//FIN

async function validateZikrFormula(sessionId, formulaId, card) {
  const user = auth.currentUser;
  if (!user) return;

  const input = card.querySelector('.zikr-input');
  const value = Number(input.value);

  if (!value || value <= 0) {
    showZikrFeedback("❌ Entrez un nombre valide", "error");
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

  const objectif = Number(data.objectif);
  const current = Number(data.current || 0);
  const reste = Number(data.reste ?? objectif - current);

  // 🛑 FORMULE DÉJÀ TERMINÉE
  if (reste <= 0) {
    showZikrFeedback("✅ Objectif déjà atteint", "error");
    input.value = '';
    return;
  }

  // 🛑 CONTRIBUTION TROP GRANDE
  if (value > reste) {
    showZikrFeedback(
      `❌ Vous ne pouvez pas dépasser le reste (${reste})`, "error"
    );
    return;
  }

  // ✅ CALCULS SÉCURISÉS
  const newCurrent = current + value;
  const newReste = objectif - newCurrent; // garanti >= 0

  // 🔄 mise à jour formule
  await updateDoc(formulaRef, {
    current: newCurrent,
    reste: newReste
  });

  // 🧠 contribution utilisateur (cumulée)
  await setDoc(
    doc(
      db,
      SESSIONS_COLLECTION,
      sessionId,
      'formules',
      formulaId,
      'contributions',
      user.uid
    ),
    {
      pseudo: user.displayName || 'Utilisateur',
      value: increment(value),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  // 🔓 débloque discussion
  await setDoc(
    doc(db, SESSIONS_COLLECTION, sessionId, 'zikrContributions', user.uid),
    { hasContributed: true },
    { merge: true }
  );

  input.value = '';
  showZikrFeedback(
    newReste === 0
      ? '🎉 Objectif atteint, barakAllahu fik'
      : '✅ Contribution enregistrée'
  );
}

function showZikrFeedback(msg, type = 'success') {
  el.zikrFeedback.textContent = msg;
  el.zikrFeedback.className = `zikr-feedback ${type}`;

  setTimeout(() => {
    el.zikrFeedback.textContent = '';
    el.zikrFeedback.className = 'zikr-feedback';
  }, 3000);
}

function openModal(html) {
  // ferme toute modale existante
  document.querySelectorAll('.modal').forEach(m => m.remove());

  document.body.style.overflow = 'hidden';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = html;

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal);
  });

  document.body.appendChild(modal);
  return modal;
}

function closeModal(modal) {
  document.body.style.overflow = '';
  modal.remove();
}

/* ---------- Popup invitation: même système que création de session ---------- */

function openInviteCodeModal() {
  const modal = openModal(`
    <div class="modal-card card">
      <h3>Campagne Privée</h3>

      <input id="inviteCodeInput" placeholder="Code d’invitation" />

      <p id="inviteError" style="color:red;min-height:20px"></p>

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="validateInviteCodeBtn" class="btn btn-success">Rejoindre</button>
        <button id="closeInviteModal" class="btn">Annuler</button>
      </div>
    </div>
  `);

  modal.querySelector('#closeInviteModal').onclick = () => closeModal(modal);

  modal.querySelector('#validateInviteCodeBtn').onclick = async () => {
    const code = document.getElementById("inviteCodeInput").value.trim();
    const errorBox = document.getElementById("inviteError");
    const user = auth.currentUser;

    if (!code) {
      errorBox.textContent = "Veuillez entrer un code.";
      return;
    }
    if (!user) {
      errorBox.textContent = "Vous devez être connecté.";
      return;
    }

    const q = query(collection(db, "sessions"), where("inviteCode", "==", code));
    const snap = await getDocs(q);

    if (snap.empty) {
      errorBox.textContent = "Code invalide.";
      return;
    }

    const sessionDoc = snap.docs[0];
    const sessionData = sessionDoc.data();

    if (sessionData.invitedEmails?.includes(user.email)) {
      errorBox.textContent = "Vous êtes déjà invité.";
      return;
    }

    await updateDoc(doc(db, "sessions", sessionDoc.id), {
      invitedEmails: arrayUnion(user.email)
    });

    errorBox.style.color = "#27ae60";
    errorBox.textContent = "Invitation acceptée 🎉";

    setTimeout(() => {
      document.body.removeChild(modal);
      loadUserSessions();
    }, 1000);
  };
}

/* ---------- Ouverture depuis le bouton ---------- */

document.getElementById("joinWithCodeBtn")
  .addEventListener("click", openInviteCodeModal);

/* ---------- Initialization ---------- */
(async function init() {
  // by design: DO NOT auto-create default session or populate DB
  // only show sessions after login
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showPage('home');
      el.sessionsDiv.innerHTML = '';
      return;
    }

    // email/password non vérifié
    if (
      user.providerData.some(p => p.providerId === 'password') &&
      !user.emailVerified
    ) {
      alert('Veuillez vérifier votre email.');
      await signOut(auth);
      return;
    }

    showPage('dashboard');
    document.getElementById('homeConnectBtn').style.display = 'none';

    document.getElementById('bottomActionBtn').style.display = 'flex';
    document.getElementById('menuLogout').style.display = 'inline-block';


    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

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

    document.querySelector('#menuUserAvatar img').src = user.photoURL || 'default.jpg';


    await loadSessions();
  });


  // wire UI
  document.getElementById('homeConnectBtn').addEventListener('click', () => showPage('authPage'));
  el.newSessionBtn?.addEventListener('click', () => openCreateSessionModal());
  el.menuLogoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    showPage('home');
    document.getElementById('homeConnectBtn').style.display = 'inline-block';
    document.getElementById('bottomActionBtn').style.display = 'none';
    document.getElementById('menuLogout').style.display = 'none';
  });

})();


document.addEventListener("click", async (e) => {
  if (e.target.id !== "validateInviteCodeBtn") return;

  const code = document.getElementById("inviteCodeInput").value.trim();
  const errorBox = document.getElementById("inviteError");
  const user = auth.currentUser;

  if (!code) {
    errorBox.textContent = "Veuillez entrer un code.";
    return;
  }

  if (!user) {
    errorBox.textContent = "Vous devez être connecté.";
    return;
  }

  const q = query(collection(db, "sessions"), where("inviteCode", "==", code));
  const snap = await getDocs(q);

  if (snap.empty) {
    errorBox.textContent = "Code invalide.";
    return;
  }

  const sessionDoc = snap.docs[0];
  const sessionData = sessionDoc.data();

  if (sessionData.invitedEmails?.includes(user.email)) {
    errorBox.textContent = "Vous êtes déjà invité dans cette session.";
    return;
  }

  await updateDoc(doc(db, "sessions", sessionDoc.id), {
    invitedEmails: arrayUnion(user.email)
  });

  errorBox.style.color = "#27ae60";
  errorBox.textContent = "Invitation acceptée 🎉";

  setTimeout(() => {
    loadSessions();
    inviteModal.hidden = true;
    inviteModal.innerHTML = "";
  }, 1200);
});


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



function refreshGrid() {
  //el.sessionView.style.display = 'none';
  sessionView.hidden = true;
  applyFilter();
}


const scrollTopBtn = document.getElementById("scrollTopBtn");



if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    scrollTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}



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
      <h3>Mon profil</h3>

        <div class="profile-avatar">
          <img id="profileAvatarImg" src="default.jpg" class="avatar-sm">
          <input type="file" id="profileAvatarInput" accept="image/*">
        </div>

        <label>Pseudo</label>
        <input id="profilePseudo" maxlength="14" />

      <p id="profileError" style="color:red;min-height:20px"></p>

      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="saveProfileBtn" class="btn btn-success">Enregistrer</button>
        <button id="closeProfileModal" class="btn">Annuler</button>
      </div>
    </div>
  `);

  modal.querySelector('#closeProfileModal').onclick = () => closeModal(modal);

  modal.querySelector('#saveProfileBtn').onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    let pseudo = sanitizePseudo(
      document.getElementById('profilePseudo').value
    );

    if (!pseudo) {
      alert("Pseudo invalide");
      return;
    }

    const avatarFile =
      document.getElementById('profileAvatarInput').files[0];

    let photoURL = user.photoURL || 'default.jpg';

    if (avatarFile) {
      // 🔥 si tu ajoutes Firebase Storage plus tard
      // photoURL = await uploadAvatar(...)
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

    alert('Profil mis à jour ✅');
  };
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


function loadMessages(sessionId) {
  const list = document.getElementById("messagesList");
  list.innerHTML = "";

  const q = query(
    collection(db, SESSIONS_COLLECTION, sessionId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snap => {
    list.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

      const div = document.createElement("div");
      div.className = "message";
      div.innerHTML = `
        <div class="message-header">
          <img src="${m.photoURL || 'default.jpg'}" />
          <strong>${m.authorPseudo}</strong>
          <small>${m.createdAt?.toDate().toLocaleTimeString()}</small>
        </div>
        <div class="message-text">${m.text}</div>
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

  tabDiscussion.onclick = () => {
    discussion.classList.remove("hidden");
    grid.classList.add("hidden");
    zikrView.classList.add("hidden");

    tabDiscussion.classList.add("active");
    tabJuz.classList.remove("active");
    tabFormula.classList.remove("active");
  };
}
