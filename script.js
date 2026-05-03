/* ---------------- SUPABASE SETUP ---------------- */

const SUPABASE_URL = "https://kxqmjrioewqvtnacfnpg.supabase.co";
const SUPABASE_KEY = "sb_publishable_wEd83HZydbFaNaAF24Iamg_pPdZ95Q-";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGE_BUCKET = "date-images";

/* ---------------- GLOBAL VARIABLES ---------------- */

let selectedDateId = null;
let selectedDateTitle = "";
let selectedImageFile = null;

/* ---------------- HOME PAGE: CREATE DATE ---------------- */

const openCreateDate = document.getElementById("openCreateDate");
const createDateModal = document.getElementById("createDateModal");
const dateTitleInput = document.getElementById("dateTitleInput");
const saveDateBtn = document.getElementById("saveDateBtn");
const cancelCreateDateBtn = document.getElementById("cancelCreateDateBtn");

if (openCreateDate && createDateModal) {
  openCreateDate.addEventListener("click", () => {
    createDateModal.classList.add("show");
    dateTitleInput.focus();
  });
}

if (cancelCreateDateBtn && createDateModal) {
  cancelCreateDateBtn.addEventListener("click", () => {
    createDateModal.classList.remove("show");
    dateTitleInput.value = "";
  });
}

if (saveDateBtn) {
  saveDateBtn.addEventListener("click", async () => {
    const title = dateTitleInput.value.trim();

    if (!title) {
      alert("Please enter a date name.");
      return;
    }

    saveDateBtn.disabled = true;
    saveDateBtn.textContent = "SAVING...";

    const { error } = await supabaseClient
      .from("dates")
      .insert([
        {
          title: title,
          status: "pending"
        }
      ]);

    saveDateBtn.disabled = false;
    saveDateBtn.textContent = "SAVE";

    if (error) {
      console.error("Error creating date:", error);
      alert("Date could not be created. Please check Supabase table policies.");
      return;
    }

    dateTitleInput.value = "";
    createDateModal.classList.remove("show");

    window.location.href = "checklist.html";
  });
}

/* Close create modal when clicking outside */
if (createDateModal) {
  createDateModal.addEventListener("click", (e) => {
    if (e.target === createDateModal) {
      createDateModal.classList.remove("show");
    }
  });
}

/* ---------------- CHECKLIST PAGE ---------------- */

const allDates = document.getElementById("allDates");
const completeDateModal = document.getElementById("completeDateModal");
const completeDateTitle = document.getElementById("completeDateTitle");
const completeDateInput = document.getElementById("completeDateInput");
const completeLocationInput = document.getElementById("completeLocationInput");
const completeDescriptionInput = document.getElementById("completeDescriptionInput");
const completeImageInput = document.getElementById("completeImageInput");
const saveCompleteDateBtn = document.getElementById("saveCompleteDateBtn");
const cancelCompleteDateBtn = document.getElementById("cancelCompleteDateBtn");

async function getDates() {
  const { data, error } = await supabaseClient
    .from("dates")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching dates:", error);
    return [];
  }

  return data || [];
}

async function renderChecklist() {
  if (!allDates) return;

  const dates = await getDates();

  if (dates.length === 0) {
    allDates.innerHTML = `
      <p style="font-family: var(--text-font); color: var(--darkb);">
        No dates added yet.
      </p>
    `;
    return;
  }

  allDates.innerHTML = dates
    .map(
      (date) => `
        <div class="each-date ${escapeHtml(date.status)}" data-id="${date.id}" data-title="${escapeHtml(date.title)}">
          <div class="date">
            <h3>${escapeHtml(date.title)}</h3>
          </div>
          <div class="status">
            <h4>${escapeHtml(date.status)}</h4>
          </div>
        </div>
      `
    )
    .join("");

  const dateCards = allDates.querySelectorAll(".each-date");

  dateCards.forEach((card) => {
    card.addEventListener("click", () => {
      const status = card.classList.contains("completed") ? "completed" : "pending";

      if (status === "completed") {
        alert("This date is already completed.");
        return;
      }

      selectedDateId = card.dataset.id;
      selectedDateTitle = card.dataset.title;
      selectedImageFile = null;

      completeDateTitle.textContent = selectedDateTitle;
      completeDateInput.value = "";
      completeLocationInput.value = "";
      completeDescriptionInput.value = "";
      completeImageInput.value = "";

      completeDateModal.classList.add("show");
    });
  });
}

renderChecklist();

if (cancelCompleteDateBtn && completeDateModal) {
  cancelCompleteDateBtn.addEventListener("click", () => {
    completeDateModal.classList.remove("show");
    selectedDateId = null;
    selectedDateTitle = "";
    selectedImageFile = null;
  });
}

if (completeImageInput) {
  completeImageInput.addEventListener("change", () => {
    selectedImageFile = completeImageInput.files[0] || null;
  });
}

if (saveCompleteDateBtn) {
  saveCompleteDateBtn.addEventListener("click", async () => {
    const completedDate = completeDateInput.value;
    const location = completeLocationInput.value.trim();
    const description = completeDescriptionInput.value.trim();

    if (!selectedDateId || !selectedDateTitle) {
      alert("Please select a date first.");
      return;
    }

    if (!completedDate || !location || !description) {
      alert("Please fill date, location and description.");
      return;
    }

    if (!selectedImageFile) {
      alert("Please upload one image.");
      return;
    }

    saveCompleteDateBtn.disabled = true;
    saveCompleteDateBtn.textContent = "SAVING...";

    const imageUrl = await uploadDateImage(selectedImageFile);

    if (!imageUrl) {
      saveCompleteDateBtn.disabled = false;
      saveCompleteDateBtn.textContent = "SAVE";
      alert("Image could not be uploaded. Please check Supabase Storage bucket.");
      return;
    }

    const { error: insertError } = await supabaseClient
      .from("date_diaries")
      .insert([
        {
          date_id: selectedDateId,
          title: selectedDateTitle,
          date: completedDate,
          location: location,
          description: description,
          image_url: imageUrl
        }
      ]);

    if (insertError) {
      console.error("Error saving date diary:", insertError);
      saveCompleteDateBtn.disabled = false;
      saveCompleteDateBtn.textContent = "SAVE";
      alert("Date diary could not be saved. Please check Supabase table policies.");
      return;
    }

    const { error: updateError } = await supabaseClient
      .from("dates")
      .update({ status: "completed" })
      .eq("id", selectedDateId);

    if (updateError) {
      console.error("Error updating date status:", updateError);
      saveCompleteDateBtn.disabled = false;
      saveCompleteDateBtn.textContent = "SAVE";
      alert("Diary saved, but checklist status could not be updated.");
      return;
    }

    completeDateModal.classList.remove("show");

    selectedDateId = null;
    selectedDateTitle = "";
    selectedImageFile = null;

    saveCompleteDateBtn.disabled = false;
    saveCompleteDateBtn.textContent = "SAVE";

    await renderChecklist();

    alert("Date saved in Date Diary!");
  });
}

/* Close complete modal when clicking outside */
if (completeDateModal) {
  completeDateModal.addEventListener("click", (e) => {
    if (e.target === completeDateModal) {
      completeDateModal.classList.remove("show");
    }
  });
}

/* ---------------- IMAGE UPLOAD ---------------- */

async function uploadDateImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `date-diary/${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    console.error("Image upload error:", uploadError);
    return null;
  }

  const { data } = supabaseClient.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/* ---------------- DATE DIARIES PAGE ---------------- */

const dateRecords = document.getElementById("dateRecords");

async function getRecords() {
  const { data, error } = await supabaseClient
    .from("date_diaries")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching date diaries:", error);
    return [];
  }

  return data || [];
}

async function renderDateRecords() {
  if (!dateRecords) return;

  const records = await getRecords();

  if (records.length === 0) {
    dateRecords.innerHTML = `
      <p style="font-family: var(--text-font); color: var(--darkb); padding: 30px;">
        No date diaries recorded yet.
      </p>
    `;
    return;
  }

  dateRecords.innerHTML = records
    .map(
      (record) => `
        <div class="each-dr">
          <div class="dr-name">
            <h3>${escapeHtml(record.title)}</h3>
          </div>

          <div class="dr-imgtext">
            <div class="dr-img">
              <img src="${record.image_url}" alt="${escapeHtml(record.title)}">
            </div>

            <div class="dr-text">
              <h4>${escapeHtml(formatDate(record.date))}</h4>
              <h4>${escapeHtml(record.location)}</h4>
              <h4>${escapeHtml(record.description)}</h4>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

renderDateRecords();


/* ---------------- MEMORY WALL ON HOME PAGE ---------------- */

const memoryWall = document.getElementById("memoryWall");

async function renderMemoryWall() {
  if (!memoryWall) return;

  const records = await getRecords();

  if (records.length === 0) {
    memoryWall.innerHTML = `
      <p style="font-family: var(--text-font); color: var(--darkb); padding: 20px;">
        No memories yet.
      </p>
    `;
    return;
  }

  memoryWall.innerHTML = records
    .map(
      (record) => `
        <div class="each-memory">
          <div class="memory-img">
            <img src="${record.image_url}" alt="${escapeHtml(record.title)}">
          </div>

          <div class="memory-text">
            <h3>${escapeHtml(record.title)}</h3>
            <p>${escapeHtml(formatDate(record.date))}</p>
          </div>
        </div>
      `
    )
    .join("");
}

renderMemoryWall();

/* ---------------- HOME PAGE: TOP 5 CHECKLIST DATES ---------------- */

const homeChecklistList = document.getElementById("homeChecklistList");

async function renderHomeChecklistList() {
  if (!homeChecklistList) return;

  const dates = await getDates();

  const topFiveDates = dates.slice(0, 5);

  if (topFiveDates.length === 0) {
    homeChecklistList.innerHTML = `<li>No dates added yet.</li>`;
    return;
  }

  homeChecklistList.innerHTML = topFiveDates
    .map((date) => `<li>${escapeHtml(date.title)}</li>`)
    .join("");
}

renderHomeChecklistList();

/* ---------------- HELPERS ---------------- */

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}
