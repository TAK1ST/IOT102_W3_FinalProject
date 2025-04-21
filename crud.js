// crud.js
import { db } from './firebase-db.js';
import {
  ref,
  set,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// DOM
const form = document.getElementById("crud-form");
const nameInput = document.getElementById("name");
const idInput = document.getElementById("id");
const tableBody = document.getElementById("data-table");

// Thêm người dùng
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const id = idInput.value.trim();

  if (!name || !id) return;

  set(ref(db, 'users/' + id), {
    name,
    id
  }).then(() => {
    form.reset();
  });
});

// Hiển thị danh sách người dùng từ Firebase
onValue(ref(db, 'users'), (snapshot) => {
  tableBody.innerHTML = '';
  const data = snapshot.val();
  for (let key in data) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data[key].name}</td>
      <td>${data[key].id}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${data[key].id}')">Xoá</button>
      </td>
    `;
    tableBody.appendChild(row);
  }
});

// Hàm xoá người dùng
window.deleteUser = function (id) {
  if (confirm("Bạn có chắc chắn muốn xoá người dùng này?")) {
    remove(ref(db, 'users/' + id))
      .then(() => alert("Đã xoá thành công!"))
      .catch((error) => {
        console.error("Lỗi khi xoá:", error);
        alert("Có lỗi xảy ra khi xoá.");
      });
  }
};

