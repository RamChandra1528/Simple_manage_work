// Team leader functions
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().role === 'leader') {
                document.getElementById('team-leader-dashboard').style.display = 'block';
                getTeamDetails(user.uid);
                getPendingRequests(user.uid);
            }
        });
    }
});

// Get team details
function getTeamDetails(leaderID) {
    db.collection('teams').where('leaderID', '==', leaderID).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const teamData = doc.data();
            document.getElementById('team-details').innerHTML = `<p>Team: ${teamData.name}</p><p>Members: ${teamData.members.join(', ')}</p>`;
        });
    });
}

// Get pending join requests
function getPendingRequests(leaderID) {
    db.collection('requests').where('teamLeaderID', '==', leaderID).where('status', '==', 'pending').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const requestData = doc.data();
            document.getElementById('pending-requests').innerHTML += `<p>${requestData.memberEmail} requested to join. <button onclick="approveRequest('${doc.id}', '${requestData.memberID}', '${requestData.teamID}')">Approve</button></p>`;
        });
    });
}

// Approve request
function approveRequest(requestID, memberID, teamID) {
    db.collection('requests').doc(requestID).update({ status: 'approved' });
    db.collection('teams').doc(teamID).update({
        members: firebase.firestore.FieldValue.arrayUnion(memberID)
    });
}
