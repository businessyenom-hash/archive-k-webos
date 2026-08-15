let highestZ = 10;

// OPEN WINDOW

function openWindow(id) {
  const windowElement = document.getElementById(id);
  windowElement.style.display = "block";

  const edgeSpace = 12;
  const taskbarSpace = 82;
  const maxLeft = Math.max(edgeSpace, desktop.clientWidth - windowElement.offsetWidth - edgeSpace);
  const maxTop = Math.max(edgeSpace, desktop.clientHeight - windowElement.offsetHeight - taskbarSpace);

  windowElement.style.left = Math.min(Math.max(edgeSpace, windowElement.offsetLeft), maxLeft) + "px";
  windowElement.style.top = Math.min(Math.max(edgeSpace, windowElement.offsetTop), maxTop) + "px";

  highestZ++;
  windowElement.style.zIndex = highestZ;
}

// CLOSE WINDOW

function closeWindow(id) {
  document.getElementById(id).style.display = "none";
}

// FLIP THE ME? STICKY NOTE

function flipNote() {
  const note = document.getElementById("kevinNote");
  const isFlipped = note.classList.toggle("is-flipped");
  note.setAttribute("aria-pressed", isFlipped);
}

// MIND READER GAME

const mindGameSteps = [
  {
    title: "WANNA PLAY A GAME WITH ME? ;)",
    instruction: "Pick any number between 1 and 10. Don't tell me.",
    button: "I PICKED ONE"
  },
  {
    title: "KEEP IT SECRET.",
    instruction: "Multiply your number by 2.",
    button: "DONE"
  },
  {
    title: "GOOD. NOW ADD 8.",
    instruction: "Add 8 to the number you have now.",
    button: "DONE"
  },
  {
    title: "DIVIDE IT.",
    instruction: "Divide your answer by 2.",
    button: "DONE"
  },
  {
    title: "ONE LAST THING.",
    instruction: "Subtract the number you originally started with.",
    button: "I GOT IT"
  },
  {
    title: "I'M READING YOUR MIND...",
    instruction: "Focus on your final answer. Don't say it out loud.",
    button: "REVEAL IT"
  },
  {
    title: "YOUR ANSWER IS 4.",
    instruction: "AM I RIGHT? ;)",
    button: "PLAY AGAIN",
    reveal: true
  }
];

let mindGameStep = 0;

function renderMindGame() {
  const step = mindGameSteps[mindGameStep];
  const card = document.getElementById("mindGameCard");

  document.getElementById("gameTitle").textContent = step.title;
  document.getElementById("gameInstruction").textContent = step.instruction;
  document.getElementById("gameNext").textContent = step.button;
  document.getElementById("gameProgress").textContent = `${mindGameStep + 1} / ${mindGameSteps.length}`;
  card.classList.toggle("is-reveal", Boolean(step.reveal));
}

function openMindGame() {
  mindGameStep = 0;
  renderMindGame();
  openWindow("mindGameWindow");
}

function nextMindGameStep() {
  if (mindGameStep === mindGameSteps.length - 1) {
    mindGameStep = 0;
  } else {
    mindGameStep++;
  }

  renderMindGame();
}

// VISITOR MESSAGE FILE

const formspreeEndpoint = "https://formspree.io/f/xoealnor";

function formatVisitorMessage() {
  const name = document.getElementById("visitorName").value.trim() || "Anonymous visitor";
  const email = document.getElementById("visitorEmail").value.trim() || "Not shared";
  const message = document.getElementById("visitorMessage").value.trim();

  return [
    "MESSAGE FOR KEVIN",
    "-----------------",
    `From: ${name}`,
    `Email: ${email}`,
    "",
    message
  ].join("\n");
}

function showMessageResult(sent, preview) {
  const previewElement = document.getElementById("messagePreview");
  const copyButton = document.getElementById("copyMessageButton");

  document.getElementById("visitorForm").hidden = true;
  document.getElementById("messageReady").hidden = false;
  document.getElementById("copyStatus").textContent = "";
  previewElement.value = preview;

  if (sent) {
    document.getElementById("messageResultStatus").textContent = "TRANSMISSION SENT";
    document.getElementById("messageResultTitle").textContent = "Your message reached Kevin.";
    document.getElementById("messageResultText").textContent = "Thanks for leaving something behind.";
    previewElement.hidden = true;
    copyButton.hidden = true;
  } else {
    document.getElementById("messageResultStatus").textContent = "TRANSMISSION INTERRUPTED";
    document.getElementById("messageResultTitle").textContent = "The inbox couldn't be reached.";
    document.getElementById("messageResultText").textContent = "Your message is safe below. Copy it and send it to Kevin manually.";
    previewElement.hidden = false;
    copyButton.hidden = false;
  }
}

async function prepareVisitorMessage(event) {
  event.preventDefault();

  const form = document.getElementById("visitorForm");
  const submitButton = document.getElementById("messageSubmitButton");
  const status = document.getElementById("formSubmitStatus");
  const preview = formatVisitorMessage();
  const formData = new FormData(form);

  formData.append("_subject", "New message from Archive K");
  submitButton.disabled = true;
  submitButton.textContent = "TRANSMITTING...";
  status.classList.remove("is-error");
  status.textContent = "CONNECTING TO KEVIN'S INBOX...";

  try {
    const response = await fetch(formspreeEndpoint, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Formspree rejected the submission");
    }

    showMessageResult(true, preview);
  } catch {
    status.classList.add("is-error");
    status.textContent = "DELIVERY FAILED — A COPY OPTION HAS BEEN PREPARED.";
    showMessageResult(false, preview);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "TRANSMIT MESSAGE";
  }
}

async function copyVisitorMessage() {
  const preview = document.getElementById("messagePreview");
  const status = document.getElementById("copyStatus");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(preview.value);
    } else {
      preview.focus();
      preview.select();
      document.execCommand("copy");
    }

    status.textContent = "COPIED — READY TO SEND.";
  } catch {
    status.textContent = "SELECT THE MESSAGE ABOVE AND COPY IT MANUALLY.";
  }
}

function resetVisitorMessage() {
  document.getElementById("visitorForm").reset();
  document.getElementById("visitorForm").hidden = false;
  document.getElementById("messageReady").hidden = true;
  document.getElementById("messagePreview").value = "";
  document.getElementById("copyStatus").textContent = "";
  document.getElementById("formSubmitStatus").textContent = "";
  document.getElementById("formSubmitStatus").classList.remove("is-error");
}

// VISITOR WALL

const guestbookConfig = window.ARCHIVE_K_GUESTBOOK || {};
const guestbookIsOnline = Boolean(guestbookConfig.url && guestbookConfig.anonKey);
const localGuestbookKey = "archiveKLocalGuestbook";
const localVisitCountKey = "archiveKLocalVisitCount";
const onlineVisitSessionKey = "archiveKOnlineVisitRecorded";
const localVisitSessionKey = "archiveKLocalVisitRecorded";

function guestbookHeaders(extraHeaders = {}) {
  return {
    apikey: guestbookConfig.anonKey,
    Authorization: `Bearer ${guestbookConfig.anonKey}`,
    "Content-Type": "application/json",
    ...extraHeaders
  };
}

function getLocalGuestbookEntries() {
  try {
    return JSON.parse(localStorage.getItem(localGuestbookKey)) || [];
  } catch {
    return [];
  }
}

function renderVisitorWall(entries) {
  const wall = document.getElementById("visitorWallEntries");
  wall.replaceChildren();

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "visitor-wall-empty";
    empty.textContent = "No signatures yet. You could be the first.";
    wall.appendChild(empty);
    return;
  }

  entries.forEach(entry => {
    const card = document.createElement("article");
    card.className = "visitor-entry";

    const top = document.createElement("div");
    top.className = "visitor-entry-top";

    const name = document.createElement("strong");
    name.textContent = entry.name;

    const date = document.createElement("time");
    const createdAt = new Date(entry.created_at);
    date.dateTime = createdAt.toISOString();
    date.textContent = createdAt.toLocaleDateString([], { month: "short", day: "numeric" });

    top.append(name, date);
    card.appendChild(top);

    if (entry.message) {
      const message = document.createElement("p");
      message.textContent = entry.message;
      card.appendChild(message);
    }

    wall.appendChild(card);
  });
}

async function recordOnlineVisit() {
  if (sessionStorage.getItem(onlineVisitSessionKey)) return;

  const response = await fetch(`${guestbookConfig.url}/rest/v1/archive_k_visits`, {
    method: "POST",
    headers: guestbookHeaders({ Prefer: "return=minimal" }),
    body: "{}"
  });

  if (!response.ok) throw new Error("Could not record visit");
  sessionStorage.setItem(onlineVisitSessionKey, "true");
}

async function loadOnlineVisitorWall() {
  await recordOnlineVisit();

  const [countResponse, entriesResponse] = await Promise.all([
    fetch(`${guestbookConfig.url}/rest/v1/archive_k_visits?select=id`, {
      headers: guestbookHeaders({ Prefer: "count=exact", Range: "0-0" })
    }),
    fetch(`${guestbookConfig.url}/rest/v1/archive_k_guestbook?select=id,name,message,created_at&order=created_at.desc&limit=24`, {
      headers: guestbookHeaders()
    })
  ]);

  if (!countResponse.ok || !entriesResponse.ok) throw new Error("Could not load public wall");

  const countRange = countResponse.headers.get("content-range") || "0-0/0";
  document.getElementById("visitorCount").textContent = countRange.split("/").pop();
  renderVisitorWall(await entriesResponse.json());
  document.getElementById("visitorSyncNotice").textContent = "PUBLIC LOG ONLINE — EVERY VISITOR SEES THE SAME WALL";
}

function loadLocalVisitorWall() {
  if (!sessionStorage.getItem(localVisitSessionKey)) {
    const currentCount = Number(localStorage.getItem(localVisitCountKey) || 0) + 1;
    localStorage.setItem(localVisitCountKey, String(currentCount));
    sessionStorage.setItem(localVisitSessionKey, "true");
  }

  document.getElementById("visitorCount").textContent = localStorage.getItem(localVisitCountKey) || "1";
  renderVisitorWall(getLocalGuestbookEntries());

  const notice = document.getElementById("visitorSyncNotice");
  notice.classList.add("is-local");
  notice.textContent = "LOCAL PREVIEW — CONNECT SUPABASE TO SHARE THIS WALL WITH EVERYONE";
}

async function initializeVisitorWall() {
  if (!guestbookIsOnline) {
    loadLocalVisitorWall();
    return;
  }

  try {
    await loadOnlineVisitorWall();
  } catch {
    loadLocalVisitorWall();
    const notice = document.getElementById("visitorSyncNotice");
    notice.textContent = "PUBLIC LOG OFFLINE — SHOWING THE LOCAL COPY";
  }
}

async function addVisitorWallEntry(event) {
  event.preventDefault();

  const nameInput = document.getElementById("visitorWallName");
  const messageInput = document.getElementById("visitorWallMessage");
  const submitButton = document.getElementById("visitorWallSubmit");
  const status = document.getElementById("visitorWallStatus");
  const entry = {
    name: nameInput.value.trim(),
    message: messageInput.value.trim(),
    created_at: new Date().toISOString()
  };

  if (!entry.name) return;

  submitButton.disabled = true;
  submitButton.textContent = "SIGNING...";
  status.classList.remove("is-error");
  status.textContent = "";

  try {
    if (guestbookIsOnline) {
      const response = await fetch(`${guestbookConfig.url}/rest/v1/archive_k_guestbook`, {
        method: "POST",
        headers: guestbookHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({ name: entry.name, message: entry.message })
      });

      if (!response.ok) throw new Error("Could not sign public wall");
      await loadOnlineVisitorWall();
      status.textContent = "SIGNED — YOU ARE NOW PART OF ARCHIVE K.";
    } else {
      const entries = getLocalGuestbookEntries();
      entries.unshift(entry);
      localStorage.setItem(localGuestbookKey, JSON.stringify(entries.slice(0, 24)));
      renderVisitorWall(entries.slice(0, 24));
      status.textContent = "SAVED IN THE LOCAL PREVIEW.";
    }

    event.target.reset();
  } catch {
    status.textContent = "THE PUBLIC LOG COULD NOT BE REACHED. TRY AGAIN.";
    status.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "SIGN THE WALL";
  }
}

initializeVisitorWall();

// CLOCK

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("clock").textContent = time;
}

updateClock();
setInterval(updateClock, 1000);

// DRAGGABLE DESKTOP ICONS

const desktop = document.getElementById("desktop");
const iconStorageKey = "archiveKIconPositions";

function getSavedIconPositions() {
  try {
    return JSON.parse(localStorage.getItem(iconStorageKey)) || {};
  } catch {
    return {};
  }
}

function saveIconPosition(icon) {
  try {
    const positions = getSavedIconPositions();
    positions[icon.dataset.window] = {
      left: icon.offsetLeft,
      top: icon.offsetTop
    };
    localStorage.setItem(iconStorageKey, JSON.stringify(positions));
  } catch {
    // The icons still drag if storage is unavailable.
  }
}

function clampIconPosition(icon, left, top) {
  const taskbarSpace = 82;
  const maxLeft = Math.max(0, desktop.clientWidth - icon.offsetWidth);
  const maxTop = Math.max(0, desktop.clientHeight - icon.offsetHeight - taskbarSpace);

  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop)
  };
}

const savedIconPositions = getSavedIconPositions();

document.querySelectorAll(".desktop-icon").forEach(icon => {
  const savedPosition = savedIconPositions[icon.dataset.window];

  if (savedPosition) {
    const position = clampIconPosition(icon, savedPosition.left, savedPosition.top);
    icon.style.left = position.left + "px";
    icon.style.top = position.top + "px";
  }

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let hasMoved = false;
  let dragging = false;

  icon.addEventListener("mousedown", event => {
    if (event.button !== 0) return;

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = icon.offsetLeft;
    startTop = icon.offsetTop;
    hasMoved = false;

    icon.classList.add("is-dragging");
    event.preventDefault();
  });

  document.addEventListener("mousemove", event => {
    if (!dragging) return;

    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    if (Math.abs(moveX) + Math.abs(moveY) > 5) {
      hasMoved = true;
    }

    if (!hasMoved) return;

    const position = clampIconPosition(icon, startLeft + moveX, startTop + moveY);
    icon.style.left = position.left + "px";
    icon.style.top = position.top + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;

    dragging = false;
    icon.classList.remove("is-dragging");

    if (hasMoved) {
      saveIconPosition(icon);
    } else {
      openWindow(icon.dataset.window);
    }
  });

  icon.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWindow(icon.dataset.window);
    }
  });
});

// DRAGGABLE WINDOWS

document.querySelectorAll(".window").forEach(windowElement => {
  const titleBar = windowElement.querySelector(".title-bar");
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  titleBar.addEventListener("mousedown", (event) => {
    dragging = true;
    offsetX = event.clientX - windowElement.offsetLeft;
    offsetY = event.clientY - windowElement.offsetTop;
    highestZ++;
    windowElement.style.zIndex = highestZ;
  });

  document.addEventListener("mousemove", (event) => {
    if (!dragging) return;
    windowElement.style.left = event.clientX - offsetX + "px";
    windowElement.style.top = event.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
});

// LIVING DESKTOP FISH

const desktopFish = document.getElementById("desktop-fish");
const fishEmoji = document.getElementById("fish-emoji");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let fishX = desktop.clientWidth * 0.55;
let fishY = desktop.clientHeight * 0.35;
let fishDirection = 1;
let lastFishFrame = performance.now();

function createFishBubble() {
  const bubble = document.createElement("span");
  bubble.className = "fish-bubble";
  bubble.textContent = "○";
  bubble.style.left = fishX + desktopFish.offsetWidth * 0.45 + "px";
  bubble.style.top = fishY + "px";
  desktop.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), 1600);
}

function moveDesktopFish(time) {
  const secondsPassed = Math.min((time - lastFishFrame) / 1000, 0.05);
  const maxX = Math.max(0, desktop.clientWidth - desktopFish.offsetWidth);
  const maxY = Math.max(0, desktop.clientHeight - desktopFish.offsetHeight - 82);

  fishX += 62 * fishDirection * secondsPassed;
  fishY += Math.sin(time / 650) * 18 * secondsPassed;

  if (fishX >= maxX) {
    fishX = maxX;
    fishDirection = -1;
  } else if (fishX <= 0) {
    fishX = 0;
    fishDirection = 1;
  }

  fishY = Math.min(Math.max(0, fishY), maxY);
  fishEmoji.style.transform = fishDirection === 1 ? "scaleX(-1)" : "scaleX(1)";
  desktopFish.style.transform = `translate3d(${fishX}px, ${fishY}px, 0)`;
  lastFishFrame = time;

  if (!reduceMotion) {
    window.requestAnimationFrame(moveDesktopFish);
  }
}

desktopFish.addEventListener("click", createFishBubble);
desktopFish.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    createFishBubble();
  }
});

if (reduceMotion) {
  desktopFish.style.transform = `translate3d(${fishX}px, ${fishY}px, 0)`;
} else {
  window.requestAnimationFrame(moveDesktopFish);
}
