// Member functions
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().role === 'member') {
                document.getElementById('member-dashboard').style.display = 'block';
                getAvailableTeams();
                getPendingRequests(user.uid); // Fetch any pending requests made by the member
            }
        });
    }
});

// Get available teams
function getAvailableTeams() {
    db.collection('teams').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const teamData = doc.data();
            document.getElementById('available-teams').innerHTML += `
                <p>Team: ${teamData.name}</p>
                <p>Leader: ${teamData.leaderEmail}</p>
                <button onclick="requestToJoin('${doc.id}', '${auth.currentUser.uid}')">Request to Join</button>
                <hr>`;
        });
    });
}

// Send request to join a team
function requestToJoin(teamID, memberID) {
    db.collection('requests').add({
        teamID: teamID,
        memberID: memberID,
        memberEmail: auth.currentUser.email,
        status: 'pending',
        teamLeaderID: null, // This can be populated by fetching the leader of the team
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Your request to join the team has been sent.');
    });
}

// Get pending join requests by the member
function getPendingRequests(memberID) {
    db.collection('requests').where('memberID', '==', memberID).where('status', '==', 'pending').get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const requestData = doc.data();
            document.getElementById('pending-requests').innerHTML += `
                <p>Your request to join ${requestData.teamID} is still pending approval from the team leader.</p>
                <hr>`;
        });
    });
}

// Log out the user
function logoutUser() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error logging out:", error.message);
    });
}

