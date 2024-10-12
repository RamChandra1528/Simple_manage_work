// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ----------------------- Register User -------------------------
document.getElementById('register-form').addEventListener('submit', registerUser);

function registerUser(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  // Firebase Authentication - Register User
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Save user details to Firestore database
      return db.collection('users').doc(user.uid).set({
        email: email,
        role: role,  // Either 'leader' or 'member'
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert("Registration successful. Please log in.");
      window.location.href = "login.html";  // Redirect to login page
    })
    .catch((error) => {
      console.error("Error during registration:", error.message);
      alert(error.message);
    });
}

// ------------------------ Login User --------------------------
document.getElementById('login-form').addEventListener('submit', loginUser);

function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Firebase Authentication - Log in User
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Retrieve user role from Firestore to determine dashboard redirection
      return db.collection('users').doc(user.uid).get();
    })
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();

        if (userData.role === 'leader') {
          window.location.href = "leader_dashboard.html";  // Redirect to team leader's dashboard
        } else if (userData.role === 'member') {
          window.location.href = "member_dashboard.html";  // Redirect to member's dashboard
        } else {
          alert("Invalid user role.");
        }
      } else {
        alert("No user data found.");
      }
    })
    .catch((error) => {
      console.error("Login error:", error.message);
      alert(error.message);
    });
}

// ------------------------ Logout User -------------------------
function logoutUser() {
  auth.signOut().then(() => {
    alert("Logged out successfully.");
    window.location.href = "login.html";  // Redirect to login page
  }).catch((error) => {
    console.error("Logout error:", error.message);
    alert(error.message);
  });
}

// ---------------------- Auth State Listener -------------------
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    const userId = user.uid;

    db.collection('users').doc(userId).get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        // Display user-specific content or information on the dashboard
        document.getElementById('user-info').innerText = `Welcome, ${userData.email}! Role: ${userData.role}`;
      }
    }).catch((error) => {
      console.error("Error fetching user data:", error.message);
    });
  } else {
    // No user is signed in
    console.log("No user is signed in.");
  }
});

// --------------------- Team Creation -------------------
function createTeam(teamName) {
  const userId = auth.currentUser.uid;

  db.collection('teams').add({
    name: teamName,
    leaderID: userId,
    members: [userId],  // Leader is the first member
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then((docRef) => {
    alert(`Team created with ID: ${docRef.id}`);
  }).catch((error) => {
    console.error("Error creating team:", error.message);
  });
}

// --------------------- Join a Team Request -------------------
function sendJoinRequest(teamID) {
  const userId = auth.currentUser.uid;

  // Check if the user is already a member of the team
  db.collection('teams').doc(teamID).get().then((teamDoc) => {
    if (teamDoc.exists) {
      const teamData = teamDoc.data();

      if (teamData.members.includes(userId)) {
        alert("You are already a member of this team.");
      } else {
        // Send join request
        db.collection('requests').add({
          teamID: teamID,
          memberID: userId,
          status: "pending",
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          alert("Join request sent to the team leader.");
        })
        .catch((error) => {
          console.error("Error sending join request:", error.message);
        });
      }
    } else {
      alert("Team does not exist.");
    }
  }).catch((error) => {
    console.error("Error fetching team:", error.message);
  });
}

// --------------------- Accept/Reject Join Request -------------------
function handleJoinRequest(requestID, accept) {
  const requestRef = db.collection('requests').doc(requestID);

  requestRef.get().then((doc) => {
    if (doc.exists) {
      const requestData = doc.data();

      if (accept) {
        // Accept the request and add the member to the team
        db.collection('teams').doc(requestData.teamID).update({
          members: firebase.firestore.FieldValue.arrayUnion(requestData.memberID)
        }).then(() => {
          // Update request status
          requestRef.update({ status: "accepted" });
          alert("Request accepted and member added to the team.");
        }).catch((error) => {
          console.error("Error updating team:", error.message);
        });
      } else {
        // Reject the request
        requestRef.update({ status: "rejected" });
        alert("Request rejected.");
      }
    } else {
      alert("Join request not found.");
    }
  }).catch((error) => {
    console.error("Error handling join request:", error.message);
  });
}
