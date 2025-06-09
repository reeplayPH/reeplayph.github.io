document.addEventListener("DOMContentLoaded", async function () {
  console.log("Page loaded. Initializing...");

  // Global variables
  let housemates = [];
  let filteredHousemates = [];
  let ranking = newRanking();
  const rowNums = [1, 3];
  const currentURL = "https://reeplayph.github.io/";
  let showEvicted = true;
  let showNominated = true;

  const alternateRomanizations = {
    'az and river': ['azver','az','martinez','ang miss sunuring daughter ng cebu','cebu','river','joseph','ang sporty business bro ng muntinlupa city','muntinlupa'],
    'dustin and bianca': ['dustbi','bianca','devera','de vera','ang sassy unica hija ng taguig','taguig','dustin','yu','ang chinito boss-sikap ng quezon city','quezon city','qc'],
    'mika and brent': ['breka','brent','manalo','ang gentle-linong heartthrob ng tarlac','tarlac','mica','salamanca','ang controversial ca-babe-len ng pampanga','pampanga'],
    'charlie and esnyr': ['chares','charlie','fleming','ang bubbly bread teener ng cagayan de oro','teen','cagayan de oro','esnyr','ang son-sational viral beshie ng davao del sur','davao'],
    'ralph and will': ['rawi','ralph','deleon','de leon','saing','saing king','kaldero','ang dutiful judo-son ng cavite','cavite','will','ashley','ang mamas dreambae ng cavite','nations son'],
    'shuvee and klarisse': ['shukla','shuvee','etrata','katipunera','island ate ng cebu','ang island ate ng cebu','cebu','klang','klarisse','ate klang','deguzman','de guzman','ang kwela soul diva ng antipolo','antipolo']
  };

  function newHousemate() {
    return {
      id: -1,
      fullname: '&#8203;',
      duoname: '&#8203;',
      duoname2: '&#8203;',
      duoname2color: 'gray',
      age: '',
      location: '',
      image: 'emptyrank.png',
      selected: false
    };
  }

  function newRanking() {
    return Array.from({ length: 4 }, () => newHousemate());
  }

  async function readFromCSV(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const csvData = CSV.parse(text);
      housemates = csvData.map((row, i) => {
        if (row.length < 8) return newHousemate();
        return {
          fullname: row[0],
          duoname: row[1],
          duoname2: row[2],
          duoname2color: row[3],
          age: row[4],
          location: row[5],
          evicted: row[6] === 'e',
          big4: row[6] === 'b',
          nominated: row[6] === 'n',
          id: parseInt(row[7]) - 1,
          image: row[0].replaceAll(" ", "").replaceAll("-", "") + ".JPG",
          selected: false
        };
      });
      filteredHousemates = [...housemates];
      populateTable(filteredHousemates);
    } catch (err) {
      console.error("CSV load error:", err);
    }
  }

  function includesIgnCase(main, sub) {
    return main.toLowerCase().includes(sub.toLowerCase());
  }

  function filterHousemates(event) {
    const filterText = event.target.value.toLowerCase();
    filteredHousemates = housemates.filter(h => {
      const baseMatch = includesIgnCase(h.fullname, filterText) || includesIgnCase(h.duoname2, filterText);
      const alternates = alternateRomanizations[h.fullname.toLowerCase()] || [];
      const altMatch = alternates.some(alt => includesIgnCase(alt, filterText));
      return baseMatch || altMatch;
    });
    rerenderTable();
  }

  function rerenderTable() {
    clearTable();
    populateTable(filteredHousemates);
  }

  function rerenderRanking() {
    clearRanking();
    populateRanking();
  }

  function clearTable() {
    const table = document.getElementById("table__entry-container");
    table.innerHTML = '';
  }

  function clearRanking() {
    const chart = document.getElementById("ranking__pyramid");
    const rows = Array.from(chart.children).slice(1);
    rows.forEach((row, i) => {
      for (let j = 0; j < rowNums[i]; j++) {
        row.innerHTML = '';
      }
    });
  }

  function populateTable(housemates) {
    const table = document.getElementById("table__entry-container");
    housemates.forEach(h => {
      const entryHTML = populateTableEntry(h);
      table.insertAdjacentHTML("beforeend", entryHTML);
      const entry = table.lastChild;
      entry.addEventListener("click", () => tableClicked(h));
    });
  }

  function populateTableEntry(h) {
    const evicted = showEvicted && h.evicted ? "evicted" : "";
    const nominated = showNominated && h.nominated ? "nominated" : "";
    return `
      <div class="table__entry ${evicted}">
        <div class="table__entry-icon">
          <img class="table__entry-img" src="assets/final_duo/${h.image}" />
          <div class="table__entry-icon-border ${h.duoname2color.toLowerCase()}-rank-border"></div>
          ${nominated ? '<div class="table__entry-nominated"></div>' : ''}
          ${h.selected ? '<img class="table__entry-check" src="assets/check.png"/>' : ''}
        </div>
        <div class="table__entry-text">
          <span class="fullname"><strong>${h.fullname}</strong></span>
          <span class="duoname2">(${h.duoname2})</span>
          <span class="ageandlocation">${h.age} • ${h.location.toUpperCase()}</span>
        </div>
      </div>`;
  }

  function tableClicked(h) {
    if (h.selected) {
      if (removeRankedHousemate(h)) h.selected = false;
    } else {
      if (addRankedHousemate(h)) h.selected = true;
    }
    rerenderTable();
    rerenderRanking();
  }

  function addRankedHousemate(h) {
    for (let i = 0; i < ranking.length; i++) {
      if (ranking[i].id === -1) {
        ranking[i] = h;
        return true;
      }
    }
    return false;
  }

  function removeRankedHousemate(h) {
    for (let i = 0; i < ranking.length; i++) {
      if (ranking[i].id === h.id) {
        ranking[i] = newHousemate();
        return true;
      }
    }
    return false;
  }

  function getRanking() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("r")) {
      const decoded = atob(params.get("r"));
      const ids = [];
      for (let i = 0; i < decoded.length; i += 2) {
        ids.push(parseInt(decoded.substr(i, 2)));
      }
      ids.forEach((id, i) => {
        if (id < 0) {
          ranking[i] = newHousemate();
        } else {
          const h = housemates.find(h => h.id === id);
          if (h) {
            h.selected = true;
            ranking[i] = h;
          }
        }
      });
      rerenderTable();
      rerenderRanking();
    }
  }

  function generateShareLink() {
    const code = btoa(ranking.map(h => ("0" + h.id).slice(-2)).join(""));
    const shareURL = `${currentURL}?r=${code}`;
    showShareLink(shareURL);
  }

  function showShareLink(url) {
    const box = document.getElementById("getlink-textbox");
    if (box) {
      box.value = url;
      box.style.display = "block";
    }
    const btn = document.getElementById("copylink-button");
    if (btn) btn.style.display = "block";
  }

  async function copyLink() {
    const box = document.getElementById("getlink-textbox");
    try {
      await navigator.clipboard.writeText(box.value);
      alert("Link copied!");
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  // Initialize the app
  await readFromCSV("./final_duo_info.csv");
  getRanking();
  rerenderTable();
  rerenderRanking();

  // Optional: Attach filter input listener
  const filterInput = document.getElementById("filter-input");
  if (filterInput) {
    filterInput.addEventListener("input", filterHousemates);
  }

  // Optional: Toggle menu logic
  const menuIcon = document.querySelector(".display-options-icon");
  const menu = document.getElementById("clickMenu");
  if (menuIcon && menu) {
    menu.style.display = "none";
    menuIcon.addEventListener("click", () => {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });
  }

  // Optional: Close menu when clicking outside
  window.addEventListener("click", function (event) {
    if (!event.target.matches('.display-options-icon')) {
      const menus = document.getElementsByClassName('click-menu');
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].style.display === 'block') {
          menus[i].style.display = 'none';
        }
      }
    }
  });
});
