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
      created_at: new Date().toISOString(),
      mode: null, 
    });

    form.reset();
    alert("User added successfully! Please add method...");
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
    const methods = [];
    if (user.fingerprint_id) methods.push("fingerprint");
    if (user.keypad_id) methods.push("keypad");
    if (user.rfid_id) methods.push("rfid");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.id}</td>
      <td>${methods.length > 0 ? methods.join(", ") : ""}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="updateUser('${user.id}')">Update</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
        <button class="btn btn-sm btn-success" onclick="showMethodModal('${user.id}')">Add Method</button>
      </td>
    `;
    tableBody.appendChild(row);
  }
});

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
    document.getElementById("update-fingerprint-id").value = userData.fingerprint_id || "";
    document.getElementById("update-rfid-id").value = userData.rfid_id || "";

    // Show the modal
    const updateModal = new bootstrap.Modal(document.getElementById("updateModal"));
    updateModal.show();

    // Handle save button click
    document.getElementById("save-updates-btn").onclick = async () => {
      const updatedName = document.getElementById("update-name").value.trim();
      const updatedPinCode = document.getElementById("update-pin-code").value.trim();
      const updatedFingerprintId = document.getElementById("update-fingerprint-id").value.trim();
      const updatedRFID = document.getElementById("update-rfid-id").value.trim();

      if (!updatedName) {
        alert("Name cannot be empty!");
        return;
      }

      // Update user data in Firebase
      const updates = {
        name: updatedName,
        pin_code: updatedPinCode || null,
        fingerprint_id: updatedFingerprintId || null,
        rfid_id: updatedRFID || null,
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

// Function to show the method selection modal
window.showMethodModal = function (userId) {
  const fingerprintBtn = document.getElementById("fingerprint-btn");
  const keypadBtn = document.getElementById("keypad-btn");
  const NFCBtn = document.getElementById("rfid-btn");

  // Attach event listeners for buttons
  fingerprintBtn.onclick = () => saveUserMode(userId, "F");
  keypadBtn.onclick = () => saveUserMode(userId, "P");
  NFCBtn.onclick = () => saveUserMode(userId, "N");

  // Show the modal
  const methodModal = new bootstrap.Modal(document.getElementById("methodModal"));
  methodModal.show();
};

// Function to save the selected mode to Firebase
async function saveUserMode(userId, mode) {
  try {
    // Fetch user data from Firebase
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await new Promise((resolve) => {
      onValue(userRef, (snap) => resolve(snap), { onlyOnce: true });
    });

    const userData = snapshot.val();
    if (!userData) {
      alert("User not found!");
      return;
    }

    // Update the user data with the selected mode
    const updates = {
      ...userData,
      mode: mode, // Add or update the mode field
    };

    // Save the updated data back to Firebase
    await set(userRef, updates);

    alert(`User mode successfully updated to ${mode}!`);
  } catch (error) {
    console.error(`Error updating user mode to ${mode}:`, error);
    alert(`Failed to update user mode. Please try again.`);
  }
}

