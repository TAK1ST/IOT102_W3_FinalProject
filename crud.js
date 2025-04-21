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

// Function to generate a random 7-digit number with leading zeros
function generateRandomNumber() {
  const num = Math.floor(Math.random() * 10000000); // 0 to 9999999
  return String(num).padStart(7, '0'); // Ensure 7 digits with leading zeros
}

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
      id,
      waiting: true,
      created_at: new Date().toISOString()
    });

    form.reset();
    alert("User added successfully! Waiting for fingerprint data...");
  } catch (error) {
    console.error("Error adding user:", error);
    alert("Failed to add user. Please try again.");
  } finally {
    // Reset button state
    addBtn.disabled = false;
    addBtnText.textContent = "Add";
    addBtnSpinner.classList.add("d-none");
  }
});

// Display user list from Firebase
onValue(ref(db, 'users'), (snapshot) => {
  tableBody.innerHTML = '';
  const data = snapshot.val();

  if (!data) return;

  for (let key in data) {
    const user = data[key];
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.id}</td>
      <td>${user.waiting ? "Waiting for fingerprint..." : `Fingerprint ID: ${user.fingerprint_id || 'N/A'}`}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="updateUser('${user.id}')">Update</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  }
});

// Update user function (placeholder for now)
window.updateUser = function (id) {
  alert("Update functionality not implemented yet for user ID: " + id);
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

