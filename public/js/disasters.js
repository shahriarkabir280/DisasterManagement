 // Fetch data when the page is loaded
 document.addEventListener('DOMContentLoaded', function() {
  fetchData(); // Automatically fetch all the disaster data
});


// Function to fetch all disaster data from the backend
function fetchData() {
  const url = '/disasters/api';  // Fetch all disasters from the backend

  fetch(url)
    .then(response => response.json())
    .then(data => {
      populateTable(data);  // Populate the table with all disaster data
    })
    .catch(error => console.error('Error fetching data:', error));
}

// Function to populate the table with fetched data
function populateTable(data) {
  const tableBody = document.querySelector('#disastersTable tbody');
  tableBody.innerHTML = '';  // Clear the table before appending new data

  if (Array.isArray(data) && data.length > 0) {
    data.forEach(disaster => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', disaster.id);  // Store the disaster ID in the row (hidden for backend)

      row.innerHTML = `
        <td>${disaster.DisasterType}</td>
        <td>${disaster.Location}</td>
        <td>${disaster.DateOccurred}</td>
        <td>${disaster.SeverityLevel}</td>
        <td>${disaster.Description}</td>
        <td>
          <button class="editButton" onclick="editDisaster(${disaster.id})">Edit</button>
          <button class="deleteButton" onclick="deleteDisaster(${disaster.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } else {
    tableBody.innerHTML = '<tr><td colspan="6">No data found</td></tr>';
  }
}


document.getElementById('fetchData').addEventListener('click', fetchFilterData);

function fetchFilterData() {
  let searchQuery = document.getElementById('searchInput').value.trim(); // Trim spaces

  searchQuery = searchQuery ? encodeURIComponent(searchQuery) : '';

  const url = `/disasters/api/search?query=${searchQuery}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      populateTable(data); // Update the table with new data
    })
    .catch(error => console.error('Error fetching data:', error));
}



/*
function fetchFilterData() {
  const disasterType = document.getElementById('disasterType').value;
  let location = document.getElementById('disasterLocation').value;
  let date = document.getElementById('disasterDate').value;

  // Ensure location and date are not undefined or empty
  location = location ? location : '';
  date = date ? date : '';

  const url = `/disasters/api/filter?disasterType=${disasterType}&location=${location}&date=${date}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      populateFilterTable(data);  // Update the table after fetching data
    })
    .catch(error => console.error('Error fetching data:', error));
}
*/




function editDisaster(id) {
  alert(`Editing disaster with ID: ${id}`);
  // Add the logic for editing the disaster data based on the ID
}





// Function to fetch and update statistics
function fetchAndUpdateStatistics() {
  fetch('/disasters/api/statistics')
    .then(response => response.json())
    .then(data => {
      // Update the statistics section with fetched data
      document.getElementById('disasterCount').textContent = data.disasterCount;
      document.getElementById('affectedAreaCount').textContent = data.affectedAreaCount;
      
      // Extract recent disaster details
      if (data.recentDisaster && typeof data.recentDisaster === 'object') {
        document.getElementById('disasterName').textContent = data.recentDisaster.DisasterType || 'N/A';
        document.getElementById('disasterDate').textContent = data.recentDisaster.DateOccurred || 'N/A';
        document.getElementById('disasterLocation').textContent = data.recentDisaster.Location || 'N/A';
      } else {
        document.getElementById('disasterName').textContent = 'N/A';
        document.getElementById('disasterDate').textContent = 'N/A';
        document.getElementById('disasterLocation').textContent = 'N/A';
      }
    })
    .catch(error => console.error('Error fetching statistics:', error));
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', fetchAndUpdateStatistics);



// Add disaster action (redirect to a form or modal)
document.getElementById('addDisaster').addEventListener('click', function() {
  alert('This will open a form to add a new disaster!');
});


