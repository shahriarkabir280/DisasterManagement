// Fetch data when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    fetchRescueTeams(); // Automatically fetch all rescue team data
  });
  
  // Function to fetch all rescue team data from the backend
  function fetchRescueTeams() {
    const url = '/rescueteams/api';
  
    fetch(url)
      .then(response => response.json())
      .then(data => {
        populateRescueTeamsTable(data); // Populate the table with rescue team data
      })
      .catch(error => console.error('Error fetching data:', error));
  }
  
  // Function to populate the table with fetched data
  function populateRescueTeamsTable(data) {
    const tableBody = document.querySelector('#rescueTeamsTable tbody');
    tableBody.innerHTML = ''; // Clear the table before appending new data
  
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(team => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', team.TeamID); // Store the team ID in the row
  
        row.innerHTML = `
          <td>${team.TeamID}</td>
          <td>${team.TeamName}</td>
          <td>${team.TeamType}</td>
          <td>${team.ContactNumber}</td>
          <td>${team.AssignedArea}</td>
          <td>
            <button class="editButton" onclick="editRescueTeam(${team.TeamID})">Edit</button>
            <button class="deleteButton" onclick="deleteRescueTeam(${team.TeamID})">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = '<tr><td colspan="6">No data found</td></tr>';
    }
  }
  
  // Fetch data based on search query
  document.getElementById('fetchRescueTeamsData').addEventListener('click', fetchFilteredRescueTeams);
  
  function fetchFilteredRescueTeams() {
    let searchQuery = document.getElementById('searchRescueTeams').value.trim();
    searchQuery = searchQuery ? encodeURIComponent(searchQuery) : '';
  
    const url = `/rescueteams/api/search?query=${searchQuery}`;
  
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        populateRescueTeamsTable(data);
      })
      .catch(error => console.error('Error fetching data:', error));
  }
  

  // Open Modal
document.getElementById('addRescueTeam').addEventListener('click', function () {
    document.getElementById('addRescueTeamModal').style.display = 'block';
});

// Close Modal
document.getElementById('closeAddModal').addEventListener('click', function () {
    document.getElementById('addRescueTeamModal').style.display = 'none';
});

// Handle Form Submission
document.getElementById('addRescueTeamForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    let data = Object.fromEntries(formData);

    console.log("Data sent:", data);

    fetch('/rescueteams/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message);
        document.getElementById('addRescueTeamModal').style.display = 'none';
        fetchRescueTeams(); // Refresh the table
    })
    .catch(error => console.error('Error adding rescue team:', error));
});


// Function to open edit modal and load data
function editRescueTeam(teamId) {
    fetch(`/rescueteams/api/${teamId}`)
      .then(response => response.json())
      .then(data => {
        if (!data) {
          alert("Rescue Team not found!");
          return;
        }
  
        // Fill the form with existing details
        document.getElementById('editTeamID').value = data.TeamID;
        document.getElementById('editTeamName').value = data.TeamName;
        document.getElementById('editTeamType').value = data.TeamType;
        document.getElementById('editContactNumber').value = data.ContactNumber;
        document.getElementById('editCity').value = data.City;
        document.getElementById('editState').value = data.State;
        document.getElementById('editCountry').value = data.Country;
  
        // Show the edit modal
        document.getElementById('editRescueTeamModal').style.display = 'block';
      })
      .catch(error => console.error('Error fetching rescue team details:', error));
  }
  
  // Close Edit Modal
  document.getElementById('closeEditRescueModal').addEventListener('click', function () {
    document.getElementById('editRescueTeamModal').style.display = 'none';
  });

  
  document.getElementById('editRescueTeamForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const teamId = document.getElementById('editTeamID').value;
    const updatedData = {
      TeamName: document.getElementById('editTeamName').value,
      TeamType: document.getElementById('editTeamType').value,
      ContactNumber: document.getElementById('editContactNumber').value,
      City: document.getElementById('editCity').value,
      State: document.getElementById('editState').value,
      Country: document.getElementById('editCountry').value
    };
  
    fetch(`/rescueteams/api/update/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    })
    .then(response => response.json())
    .then(result => {
      alert(result.message);
      document.getElementById('editRescueTeamModal').style.display = 'none';
      fetchRescueTeamsData(); // Refresh the table
    })
    .catch(error => console.error('Error updating rescue team:', error));
  });

  
  // Function to delete a rescue team
function deleteRescueTeam(teamId) {
    if (!confirm("Are you sure you want to delete this rescue team?")) {
      return;
    }
  
    fetch(`/rescueteams/api/delete/${teamId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      alert(result.message);
      fetchRescueTeams(); // Refresh the table after deletion
    })
    .catch(error => console.error('Error deleting rescue team:', error));
  }
  