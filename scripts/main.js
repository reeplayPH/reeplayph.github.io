document.addEventListener("DOMContentLoaded", async function () {
  console.log("Page loaded. Initializing...");

  try {
    // Step 1: Initialize blank rankings
    ranking = newRanking();
    console.log("Initialized rankings:", ranking);

    // Step 2: Fetch any saved rankings from the URL
    console.log("Fetching saved rankings (if any)...");
    getRanking();

    // Step 3: Fetch CSV and populate the table
    console.log("Fetching CSV data...");
    await readFromCSV("./final_duo_info.csv");
    console.log("CSV data successfully loaded and table populated.");

    // Step 4: Populate the ranking pyramids
    console.log("Populating ranking pyramids...");
    populateRanking();
    console.log("Ranking pyramids populated successfully.");

  } catch (error) {
    console.error("An error occurred during initialization:", error);
  }
});

// Constructor for a blank ranking list
function newRanking() {
  // Holds the ordered list of rankings that the user selects
  let ranking = new Array(4); // Adjust size as needed
  for (let i = 0; i < ranking.length; i++) {
    ranking[i] = newHousemate();
  }
  console.log("Created a new blank ranking:", ranking);
  return ranking;
}

// Enhanced readFromCSV to handle errors gracefully
async function readFromCSV(path) {
  try {
    const response = await fetch(path);
    if (response.ok) {
      const allText = await response.text();
      const csvData = CSV.parse(allText);
      const housemates = convertCSVArrayToHousemateData(csvData);
      populateTable(housemates);
      console.log("Table data populated:", housemates);
    } else {
      console.error("Failed to fetch CSV. HTTP Status:", response.status);
    }
  } catch (error) {
    console.error("Error fetching or parsing the CSV file:", error);
  }
}

// Enhanced populateRanking function
function populateRanking() {
  // Currently just duplicates first ranking entry
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1); // remove the title element
  // let rankEntry = rankRows[0].children[0];
  let currRank = 1;
  for (let i = 0; i < rowNums.length; i++) {
    let rankRow = rankRows[i];
    for (let j = 0; j < rowNums[i]; j++) {
      let currHousemate = ranking[currRank-1];
      rankRow.insertAdjacentHTML("beforeend", populateRankingEntry(currHousemate, currRank))

      let insertedEntry = rankRow.lastChild;
      let dragIcon = insertedEntry.children[0].children[0]; // drag icon is just the housemate image and border
      let iconBorder = dragIcon.children[1]; // this is just the border and the recipient of dragged elements
      // only add these event listeners if a housemate exists in this slot
      if (currHousemate.id >= 0) {
        // add event listener to remove item
        insertedEntry.addEventListener("click", function (event) {
          rankingClicked(currHousemate);
        });
        // add event listener for dragging
        dragIcon.setAttribute('draggable', true);
        dragIcon.classList.add("drag-cursor");
        dragIcon.addEventListener("dragstart", createDragStartListener(currRank - 1));
      }
      // add event listeners for blank/filled ranking entries
      iconBorder.addEventListener("dragenter", createDragEnterListener());
      iconBorder.addEventListener("dragleave", createDragLeaveListener());
      iconBorder.addEventListener("dragover", createDragOverListener());
      iconBorder.addEventListener("drop", createDropListener());
      // }
      currRank++;
    }
  }
}

// Enhanced readFromCSV to handle errors gracefully
async function readFromCSV(path) {
  try {
    const response = await fetch(path);
    if (response.ok) {
      const allText = await response.text();
      const csvData = CSV.parse(allText);
      const housemates = convertCSVArrayToHousemateData(csvData);
      populateTable(housemates);
      console.log("Table data populated:", housemates);
    } else {
      console.error("Failed to fetch CSV. HTTP Status:", response.status);
    }
  } catch (error) {
    console.error("Error fetching or parsing the CSV file:", error);
  }
}

function findHousemateById(id) {
  for (let i = 0; i < housemates.length; i++) {
    if (id === housemates[i].id) { // if housemate's match
      return housemates[i];
    }
  }
  return newHousemate();
}

function getRanking() {
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("r")) {
    let rankString = atob(urlParams.get("r")) // decode the saved ranking
    let rankingIds = [];
    for (let i = 0; i < rankString.length; i += 2) {
      let housemateId = rankString.substr(i, 2); // get each id of the housemate by substringing every 2 chars
      rankingIds.push(parseInt(housemateId));
    }
    console.log(rankingIds);
    // use the retrieved rankingIds to populate ranking
    for (let i = 0; i < rankingIds.length; i++) {
      housemateId = rankingIds[i];
      if (housemateId < 0) {
        ranking[i] = newHousemate();
      } else {
        let housemate = findHousemateById(rankingIds[i])
        // let housemate = housemates[rankingIds[i]];
        housemate.selected = true;
        ranking[i] = housemate;
      }
    }
    // refresh table to show checkboxes
    rerenderTable();
    // refresh ranking to show newly inserted housemates
    rerenderRanking();
    console.log(ranking);
  }
}

window.onload = function() {
    document.getElementById('clickMenu').style.display = 'none'; // Ensure menu is hidden on page load

    document.getElementById('.display-options-icon').addEventListener('click', function() {
        var menu = document.getElementById('clickMenu');
        if (menu.style.display === 'none') {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    });
};

function toggleMenu() {
  var menu = document.getElementById('clickMenu');
  /*if (menu.style.display === 'block') {
    menu.style.display = 'none';
  } else {
    menu.style.display = 'block';
  }*/
        if (menu.style.display === 'none') {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
}

// Optional: Close the menu if clicked outside
/*window.onclick = function(event) {
   (!event.target.matches('.display-options-icon')) {
    var menus = document.getElementsByClassName('click-menu');
    for (var i = 0; i < menus.length; i++) {
      var openMenu = menus[i];
      if (openMenu.style.display === 'block') {
        openMenu.style.display = 'none';
      }
    }
  }
}*/

function convertCSVArrayToHousemateData(csvArrays) {
  try {
    housemates = csvArrays.map(function (housemateArray, index) {
      if (housemateArray.length < 8) {
        console.warn(`Skipping invalid CSV row at index ${index}:`, housemateArray);
        return newHousemate(); // Fallback to a blank housemate
      }
      housemate = {};
      housemate.fullname = housemateArray[0];
      housemate.duoname = housemateArray[1];
      housemate.duoname2 = housemateArray[2];
      housemate.evicted = housemateArray[6] === 'e'; // Evicted flag
      housemate.big4 = housemateArray[6] === 'b'; // Top 4 flag
      housemate.nominated = housemateArray[6] === 'n'; // Nominated flag
      housemate.id = parseInt(housemateArray[7]) - 1; // Housemate ID
      housemate.image = housemate.fullname.replaceAll(" ", "").replaceAll("-", "") + ".JPG";
      return housemate;
    });
    filteredHousemates = housemates;
    return housemates;
  } catch (error) {
    console.error("Error converting CSV data to housemate objects:", error);
    return [];
  }
}

// Constructor for a blank housemate
function newHousemate() {
  const housemate = {
    id: -1,
    fullname: '&#8203;',
    duoname: '&#8203;',
    duoname2: '&#8203;',
    image: 'emptyrank.png',
  };
  console.log("Created new housemate:", housemate);
  return housemate;
}

// rerender method for table (search box)
// TODO: this site might be slow to rerender because it clears + adds everything each time
function rerenderTable() {
  clearTable();
  populateTable(filteredHousemates);
  // populateRanking();
}

// rerender method for ranking
function rerenderRanking() {
  clearRanking();
  populateRanking();
}

function removeAllChildren(element) {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}

// Clears out the table
function clearTable() {
	let table = document.getElementById("table__entry-container");
	removeAllChildren(table);
}

// Enhanced clearRanking function
function clearRanking() {
  // Currently just duplicates first ranking entry
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1); // remove the title element
  // let rankEntry = rankRows[0].children[0];
  for (let i = 0; i < rowNums.length; i++) {
    let rankRow = rankRows[i];
    for (let j = 0; j < rowNums[i]; j++) {
      removeAllChildren(rankRow);
    }
  }
}

// Uses populated local data structure from readFromCSV to populate table
function populateTable(housemates) {
  // Currently just duplicates the first table entry
  let table = document.getElementById("table__entry-container");
  exampleEntry = table.children[0];
  for (let i = 0; i < housemates.length; i++) {
    // generate and insert the html for a new housemate table entry
    table.insertAdjacentHTML("beforeend", populateTableEntry(housemates[i]));
    // add the click listener to the just inserted element
    let insertedEntry = table.lastChild;
    insertedEntry.addEventListener("click", function (event) {
      tableClicked(housemates[i]);
    });
  }
}

function populateTableEntry(housemate) {
    console.log(`Rendering table entry for housemate: ${housemate.fullname}, selected: ${housemate.selected}`);
    let evicted = (showEvicted && housemate.evicted) ? "evicted" : "";
    let nominated = (showNominated && housemate.nominated) ? "nominated" : "";

    const tableEntry = `
    <div class="table__entry ${evicted}">
        <div class="table__entry-icon">
            <img class="table__entry-img" src="assets/final_duo/${housemate.image}" />
            <div class="table__entry-icon-border ${housemate.duoname2color.toLowerCase()}-rank-border"></div>
            ${nominated ? '<div class="table__entry-nominated"></div>' : ''}
            ${
                housemate.selected
                    ? '<img class="table__entry-check" src="assets/check.png"/>'
                    : '<!-- No check icon -->'
            }
        </div>
        <div class="table__entry-text">
            <span class="fullname"><strong>${housemate.fullname}</strong></span>
            <span class="duoname2">(${housemate.duoname2})</span>
            <span class="ageandlocation">${housemate.age} • ${housemate.location.toUpperCase()}</span>
        </div>
    </div>`;
    return tableEntry;
}

function addHousemateToRank(rankRow, housemate, rank, clickHandler, rankingArray) {
    // Add housemate entry to the ranking row
    rankRow.insertAdjacentHTML("beforeend", populateRankingEntry(housemate, rank));

    let insertedEntry = rankRow.lastChild;
    let dragIcon = insertedEntry.children[0].children[0]; // Drag icon (housemate image and border)
    let iconBorder = dragIcon.children[1]; // Recipient of dragged elements

    if (housemate.id >= 0) {
        // Add click event listener to remove housemate
        insertedEntry.addEventListener("click", function () {
            clickHandler(housemate);
        });

        // Add drag-and-drop functionality
        dragIcon.setAttribute("draggable", true);
        dragIcon.classList.add("drag-cursor");
        dragIcon.addEventListener("dragstart", function (event) {
            event.dataTransfer.setData("text/plain", rank - 1); // Pass current rank as data
            event.dataTransfer.setData("pyramid", rankRow.closest(".ranking__pyramid").id); // Pass pyramid ID
            console.log(`Drag started for housemate: ${housemate.fullname}, pyramid: ${rankRow.closest(".ranking__pyramid").id}`);
        });
    }

    // Add event listeners for drag-and-drop on the icon border
    iconBorder.addEventListener("dragenter", createDragEnterListener());
    iconBorder.addEventListener("dragleave", createDragLeaveListener());
    iconBorder.addEventListener("dragover", createDragOverListener());
    iconBorder.addEventListener("drop", function (event) {
        event.preventDefault();
        const draggedRank = parseInt(event.dataTransfer.getData("text/plain"), 10);
        const sourcePyramidId = event.dataTransfer.getData("pyramid");
        const targetPyramidId = rankRow.closest(".ranking__pyramid").id;

        console.log(`Drop event: draggedRank = ${draggedRank}, sourcePyramidId = ${sourcePyramidId}, targetPyramidId = ${targetPyramidId}`);

        if (sourcePyramidId !== targetPyramidId) {
            console.warn("Cannot drop housemate into a different pyramid.");
            return;
        }

        // Swap housemates within the same pyramid
        swapHousemates(draggedRank, rank - 1, rankingArray);
    });
}

// Uses populated local data structure from getRanking to populate ranking
function populateRankingEntry(housemate, currRank) {
  let evicted = (showEvicted && housemate.evicted) ? "evicted" : "";
  let nominated = (showNominated && housemate.nominated) ? "nominated" : "";
  let RankTag = "BIG WINNER";
  if (currRank != 1) {
    RankTag = currRank.toString(); 
  }
  const rankingEntry = `
  <div class="ranking__entry ${evicted}">
    <div class="ranking__entry-view">
      <div class="ranking__entry-icon">
        <img class="ranking__entry-img" src="assets/housemates/${housemate.image}" />
        <div class="ranking__entry-icon-border ${housemate.duoname2color.toLowerCase()}-rank-border" data-rankid="${currRank-1}"></div>
      </div>
      <div class="ranking__entry-icon-badge bg-${housemate.duoname2color.toLowerCase()}">${RankTag}</div>
      ${nominated ? '<div class="ranking__entry-nominated"></div>' : ''}
    </div>
    <div class="ranking__row-text">
      <div class="name"><strong>${housemate.duoname.toUpperCase()}</strong></div>
      <div class="year">${housemate.age}</div>
    </div>
  </div>`;
  return rankingEntry;
}

// Event handlers for table
// Event handlers for table
function tableClicked(housemate) {
  if (housemate.selected) {
    // Remove the housemate from the ranking
    let success = removeRankedHousemate(housemate);
    if (success) { // if removed successfully
      housemate.selected = !housemate.selected;
    } else {
      return;
    }
  } else {
    // Add the housemate to the ranking
    let success = addRankedHousemate(housemate);
    if (success) { // if added successfully
      housemate.selected = true;
    } else {
      return;
    }
  }
  rerenderTable();
  rerenderRanking();
}

// Event handler for ranking
function rankingClicked(housemate) {
	if (housemate.selected) {
    housemate.selected = !housemate.selected;
    // Remove the housemate from the ranking
    removeRankedHousemate(housemate);
  }
  rerenderTable();
	rerenderRanking();
}

function swapHousemates(index1, index2) {
  tempHousemate = ranking[index1];
  ranking[index1] = ranking[index2];
  ranking[index2] = tempHousemate;
  rerenderRanking();
}

// Controls alternate ways to spell housemate names
// to add new entries use the following format:
// <original>: [<alternate1>, <alternate2>, <alternate3>, etc...]
// <original> is the original name as appearing on csv
// all of it should be lower case
const alternateRomanizations = {
  'az and river': ['azver','az','martinez','ang miss sunuring daughter ng cebu','cebu','river','joseph','ang sporty business bro ng muntinlupa city','muntinlupa'],
  'dustin and bianca': ['dustbi','bianca','devera','de vera','ang sassy unica hija ng taguig','taguig','dustin','yu','ang chinito boss-sikap ng quezon city','quezon city','qc'],
  'mika and brent': ['breka','brent','manalo','ang gentle-linong heartthrob ng tarlac','tarlac','mica','salamanca','ang controversial ca-babe-len ng pampanga','pampanga'],
  'charlie and esnyr': ['chares','charlie','fleming','ang bubbly bread teener ng cagayan de oro','teen','cagayan de oro','esnyr','ang son-sational viral beshie ng davao del sur','davao'],
  'ralph and will': ['rawi','ralph','deleon','de leon','saing','saing king','kaldero','ang dutiful judo-son ng cavite','cavite','will','ashley','ang mamas dreambae ng cavite','nations son''],
  'shuvee and klarisse': ['shukla','shuvee','etrata','katipunera','island ate ng cebu','ang island ate ng cebu','cebu','klang','klarisse','ate klang','deguzman','de guzman','ang kwela soul diva ng antipolo','antipolo']
};

// uses the current filter text to create a subset of housemates with matching info
function filterHousemates(event) {
  let filterText = event.target.value.toLowerCase();
  // filters housemates based on name, alternate names, location and birth year
  filteredHousemates = housemates.filter(function (housemate) {
    let initialMatch = includesIgnCase(housemate.fullname, filterText) || includesIgnCase (housemate.duoname2, filterText);
    // if alernates exists then check them as well
    let alternateMatch = false;
    let alternates = alternateRomanizations[housemate.fullname.toLowerCase()]
    if (alternates) {
      for (let i = 0; i < alternates.length; i++) {
        alternateMatch = alternateMatch || includesIgnCase(alternates[i], filterText);
      }
    }
    return initialMatch || alternateMatch;
  });
  filteredHousemates = sortedHousemates(filteredHousemates);
  rerenderTable();
}

// Checks if mainString includes a subString and ignores case
function includesIgnCase(mainString, subString) {
  return mainString.toLowerCase().includes(subString.toLowerCase());
}

// Finds the first blank spot for
/*function addRankedHousemate(housemate) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === -1) { // if spot is blank denoted by -1 id
      ranking[i] = housemate;
      return true;
    }
  }
  return false;
}

function removeRankedHousemate(housemate) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === housemate.id) { // if housemate's match
      ranking[i] = newHousemate();
      return true;
    }
  }
  return false;
}*/

function addRankedHousemate(housemate) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === -1) { // if spot is blank denoted by -1 id
      ranking[i] = housemate;
      return true;
    }
  }
  return false;
}

function removeRankedHousemate(housemate) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === housemate.id) { // if housemate's match
      ranking[i] = newHousemate();
      return true;
    }
  }
  return false;
}

const currentURL = "https://reeplayph.github.io/";
// Serializes the ranking into a string and appends that to the current URL

function generateShareLink() {
  let shareCode = ranking.map(function (housemate) {
    let twoCharID = ("0" + housemate.id).slice(-2); // adds a zero to front of digit if necessary e.g 1 --> 01
    return twoCharID;
  }).join("");
  console.log(shareCode);
  shareCode = btoa(shareCode);
  shareURL = currentURL + "?r=" + shareCode;
  showShareLink(shareURL);
}

function showShareLink(shareURL) {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.value = shareURL;
  document.getElementById("getlink-textbox").style.display = "block";
  document.getElementById("copylink-button").style.display = "block";
}

function copyLink() {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.select();
  document.execCommand("copy");
}

// holds the list of all housemates
var housemates = [];
// holds the list of housemates to be shown on the table
var filteredHousemates = [];
// holds the ordered list of rankings that the user selects
var ranking = new Array(4).fill(newHousemate()); 
const rowNums = [1,3];
//window.addEventListener("load", function () {
  populateRanking();
  readFromCSV("./final_duo_info.csv");
//});
// checks the URL for a ranking and uses it to populate ranking
getRanking();
