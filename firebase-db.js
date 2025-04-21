// firebase-db.js
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { app } from './firebase-config.js';

const db = getDatabase(app);

export { db };

