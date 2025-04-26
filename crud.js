// crud.js
import { db } from './firebase-db.js';
import {
  ref,
  set,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// DOM Elements
const form = document.getElementById("crud-form");
const nameInput = document.getElementById("name");
const tableBody = document.getElementById("data-table");
const addBtn = document.getElementById("add-btn");
const addBtnText = document.getElementById("add-btn-text");
const addBtnSpinner = document.getElementById("add-btn-spinner");

let allUsers = [];
// Function to generate a random 7-digit number with leading zeros
function generateRandomNumber() {
  const num = Math.floor(Math.random() * 10000000); // 0 to 9999999
  return String(num).padStart(7, '0'); // Ensure 7 digits with leading zeros
}

//create a unique ID
// Function to generate a unique ID in the format G3_XXXXXXX
async function generateUniqueId() {
  let isUnique = false;
  let newId;

  while (!isUnique) {
    const randomNum = generateRandomNumber();
    newId = `G3_${randomNum}`;
    
    // Check if the ID already exists in Firebase
    const snapshot = await new Promise((resolve) => {
      onValue(ref(db, 'users/' + newId), (snap) => {
        resolve(snap);
      }, { onlyOnce: true });
    });

    isUnique = !snapshot.exists(); // If snapshot doesn't exist, ID is unique
  }

  return newId;
}


// Add new user
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please fill in the Name.");
    return;
  }

  // Show loading spinner and disable button
  addBtn.disabled = true;
  addBtnText.textContent = "Adding...";
  addBtnSpinner.classList.remove("d-none");

  try {
    // Generate a unique ID
    const id = await generateUniqueId();

    // Add user to Firebase
    await set(ref(db, 'users/' + id), {
      name,
      created_at: new Date().toISOString(),
      mode: "Register", 
    });

    form.reset();
    alert("User added successfully! Please add method...");
  } catch (error) {
    console.error("Error adding user:", error);
    alert("Failed to add user. Please try again.");
  } finally {
    // Reset button state
    addBtn.disabled = false;
    addBtnText.textContent = "Register";
    addBtnSpinner.classList.add("d-none");
  }
});

// Display user list from Firebase
onValue(ref(db, 'users'), (snapshot) => {
  tableBody.innerHTML = '';
  const data = snapshot.val();
  allUsers = []; // reset mảng mỗi lần load lại

  if (!data) return;

  for (let key in data) {
    const user = data[key];
    const userId = key;
    
    allUsers.push({
      id: userId,
      name: user.name,
      created_at: user.created_at
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${userId}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary" onclick="updateUser('${userId}')">Update</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${userId}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  }
});


// Filter 
// Event listener for the filter button
document.getElementById("filter-btn").addEventListener("click", function() {
  // Get filter values from the input fields
  const nameFilter = getFilterValue("filter-name");
  const idFilter = getFilterValue("filter-id");
  const startDateFilter = getFilterValue("filter-date-start");
  const endDateFilter = getFilterValue("filter-date-end");

  // Convert date values to Date objects if provided
  const startDate = convertToDate(startDateFilter);
  const endDate = convertToDate(endDateFilter);

  // Filter users based on the provided filters
  const filteredUsers = filterUsers(nameFilter, idFilter, startDate, endDate);

  // Display the filtered users in the table
  displayUsers(filteredUsers);

  // If no users match the filter criteria, display a "No results" message
  if (filteredUsers.length === 0) {
    showNoResultsMessage();
  }
});

// Function to get the value of a filter input and convert it to lowercase
function getFilterValue(elementId) {
  return document.getElementById(elementId).value.trim().toLowerCase();
}

// Function to convert a date string to a Date object
// Returns null if the date string is empty
function convertToDate(dateString) {
  return dateString ? new Date(dateString) : null;
}

// Function to filter the users array based on the provided filters
function filterUsers(nameFilter, idFilter, startDate, endDate) {
  return allUsers.filter(user => {
    let matches = true;

    if (nameFilter && !user.name.toLowerCase().includes(nameFilter)) {
      matches = false;
    }

    if (idFilter && !user.id.toLowerCase().includes(idFilter)) {
      matches = false;
    }

    const userDate = new Date(user.created_at);
    if (startDate && userDate < startDate) {
      matches = false;
    }
    if (endDate && userDate > endDate) {
      matches = false;
    }

    return matches;
  });
}


// Function to display the filtered users in the table
function displayUsers(users) {
  const tableBody = document.getElementById("data-table");
  tableBody.innerHTML = ''; // Clear the existing table content before adding new data

  // Create a row for each filtered user and append it to the table
  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.id}</td>
      <td>${user.created_at}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Function to display a "No results found" message when no users match the filters
function showNoResultsMessage() {
  const tableBody = document.getElementById("data-table");
  const row = document.createElement("tr");
  row.innerHTML = `<td colspan="3" class="text-center alert alert-warning">No results found based on your filters.</td>`;
  tableBody.appendChild(row);
}

// Update user function
window.updateUser = function (userId) {
  // Fetch user data from Firebase
  const userRef = ref(db, `users/${userId}`);
  onValue(userRef, (snapshot) => {
    const userData = snapshot.val();
    if (!userData) {
      alert("User not found!");
      return;
    }

    // Populate modal fields with user data
    document.getElementById("update-name").value = userData.name || "";
    document.getElementById("update-pin-code").value = userData.pin_code || "";
    //document.getElementById("update-fingerprint-id").value = userData.fingerprint_id || "";
    //document.getElementById("update-rfid-id").value = userData.rfid_id || "";

    // Show the modal
    const updateModal = new bootstrap.Modal(document.getElementById("updateModal"));
    updateModal.show();

    // Handle save button click
    document.getElementById("save-updates-btn").onclick = async () => {
      const updatedName = document.getElementById("update-name").value.trim();
      const updatedPinCode = document.getElementById("update-pin-code").value.trim();
      //const updatedFingerprintId = document.getElementById("update-fingerprint-id").value.trim();
      //const updatedRFID = document.getElementById("update-rfid-id").value.trim();

      if (!updatedName) {
        alert("Name cannot be empty!");
        return;
      }
      if (updatedPinCode && !/^\d{4}$/.test(updatedPinCode)) {
        alert("PIN code must 4-digits (0-9)");
        return;
  }

      // Update user data in Firebase
      const updates = {
        name: updatedName,
        pin_code: updatedPinCode || null,
        //fingerprint_id: updatedFingerprintId || null,
        //rfid_id: updatedRFID || null,
      };
         
      try {
        await set(userRef, { ...userData, ...updates });
        alert("User updated successfully!");
        updateModal.hide();
      } catch (error) {
        console.error("Error updating user:", error);
        alert("Failed to update user. Please try again.");
      }
    };
  }, { onlyOnce: true });
};

// Delete user function
window.deleteUser = function (id) {
  if (confirm("Are you sure you want to delete this user?")) {
    remove(ref(db, 'users/' + id))
      .then(() => alert("User deleted successfully!"))
      .catch((error) => {
        console.error("Error deleting user:", error);
        alert("An error occurred while deleting the user.");
      });
  }
};

