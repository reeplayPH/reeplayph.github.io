//document.addEventListener("DOMContentLoaded", async function () {
//  console.log("Page loaded. Initializing...");
//
// try {
//    // Step 1: Initialize blank rankings
//    ranking = newRanking();
//   console.log("Initialized rankings:", ranking);
//
//    // Step 2: Fetch any saved rankings from the URL
//    console.log("Fetching saved rankings (if any)...");
//    getRanking();

    // Step 3: Fetch CSV and populate the table
 //   console.log("Fetching CSV data...");
 //   await readFromCSV("./final_duo_info.csv");
 //   console.log("CSV data successfully loaded and table populated.");

    // Step 4: Populate the ranking pyramids
    //console.log("Populating ranking pyramids...");
    // populateRanking();
    //console.log("Ranking pyramids populated successfully.");

//  } catch (error) {
//    console.error("An error occurred during initialization:", error);
//  }
//});

function readFromCSV(path) {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", path, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        let allText = rawFile.responseText;
        let out = CSV.parse(allText);
        let housemates = convertCSVArrayToHousemateData(out);
        populateTable(housemates);
      }
    }
  };
  rawFile.send(null);
}

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
//async function readFromCSV(path) {
//  try {
//    const response = await fetch(path);
//    if (response.ok) {
//      const allText = await response.text();
//      const csvData = CSV.parse(allText);
//      const housemates = convertCSVArrayToHousemateData(csvData);
//      populateTable(housemates);
//      console.log("Table data populated:", housemates);
//    } else {
//      console.error("Failed to fetch CSV. HTTP Status:", response.status);
//    }
//  } catch (error) {
//    console.error("Error fetching or parsing the CSV file:", error);
//  }
//}

function convertCSVArrayToHousemateData(csvArrays) {
  try {
    housemates = csvArrays.map(function (housemateArray, index) {
      housemate = {};
      housemate.fullname = housemateArray[0];
      housemate.duoname = housemateArray[1];
      housemate.duoname2 = housemateArray[2];
      housemate.duoname2color = housemateArray[3];
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

const alternateRomanizations = {
	'az and river': ['azver','az','martinez','ang miss sunuring daughter ng cebu','cebu','river','joseph','ang sporty business bro ng muntinlupa city','muntinlupa'],
	'dustin and bianca': ['dustbi','bianca','devera','de vera','ang sassy unica hija ng taguig','taguig','dustin','yu','ang chinito boss-sikap ng quezon city','quezon city','qc'],
	'mika and brent': ['breka','brent','manalo','ang gentle-linong heartthrob ng tarlac','tarlac','mica','salamanca','ang controversial ca-babe-len ng pampanga','pampanga'],
	'charlie and esnyr': ['chares','charlie','fleming','ang bubbly bread teener ng cagayan de oro','teen','cagayan de oro','esnyr','ang son-sational viral beshie ng davao del sur','davao'],
	'ralph and will': ['rawi','ralph','deleon','de leon','saing','saing king','kaldero','ang dutiful judo-son ng cavite','cavite','will','ashley','ang mamas dreambae ng cavite','nations son'],
	'shuvee and klarisse': ['shukla','shuvee','etrata','katipunera','island ate ng cebu','ang island ate ng cebu','cebu','klang','klarisse','ate klang','deguzman','de guzman','ang kwela soul diva ng antipolo','antipolo']
};

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

function newHousemate() {
	return {
		id: -1,
		fullname: '&#8203;',
		duoname: '&#8203;',
		duoname2: '&#8203;',
		duoname2color: 'no',
		image: 'emptyrank.png',
		selected: false
	};
}

//function newRanking() {
//	return Array.from({ length: 4 }, () => newHousemate());
//}

function includesIgnCase(main, sub) {
	return main.toLowerCase().includes(sub.toLowerCase());
}

//function filterHousemates(event) {
//	const filterText = event.target.value.toLowerCase();
//	filteredHousemates = housemates.filter(h => {
//		const baseMatch = includesIgnCase(h.fullname, filterText) || includesIgnCase(h.duoname2, filterText);
//		const alternates = alternateRomanizations[h.fullname.toLowerCase()] || [];
//		const altMatch = alternates.some(alt => includesIgnCase(alt, filterText));
//		return baseMatch || altMatch;
//	});
//	rerenderTable();
//}

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

// Uses populated local data structure from getRanking to populate ranking
function populateRankingEntry(housemate, currRank) {
	let evicted = (showEvicted && housemate.evicted) ? "evicted" : "";
	let nominated = (showNominated && housemate.nominated) ? "nominated" : "";
	let RankTag = "BIG WINNER";
	let bigWinnerClass = "big-winner";

	if (currRank !== 1) {
		RankTag = currRank.toString();
		bigWinnerClass = "";
	} 

	const rankingEntry = `
	<div class="ranking__entry ${evicted}">
	<div class="ranking__entry-view ${bigWinnerClass}">
	<div class="ranking__entry-icon">
	<img class="ranking__entry-img ${bigWinnerClass}" src="assets/final_duo/${bigWinnerClass}${housemate.image}" />
	<div class="ranking__entry-icon-border ${housemate.duoname2color.toLowerCase()}-rank-border" data-rankid="${currRank-1}"></div>
	</div>
	<div class="ranking__entry-icon-badge bg-${housemate.duoname2color.toLowerCase()}">${RankTag}</div>
 	${nominated ? `<div class="ranking__entry-nominated ${bigWinnerClass}"></div>` : ''}
	</div>
	<div class="ranking__row-text">
	<div class="name"><strong>${housemate.duoname.toUpperCase()}</strong></div>
	</div>
	</div>`;
	return rankingEntry;
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

// Move outside DOMContentLoaded or attach to window
function swapHousemates(index1, index2) {
	tempHousemate = ranking[index1];
	ranking[index1] = ranking[index2];
	ranking[index2] = tempHousemate;
	rerenderRanking();
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

let housemates = [];
let filteredHousemates = [];
let ranking = newRanking();
const rowNums = [1, 3];
const currentURL = "https://reeplayph.github.io/";

  populateRanking();
  readFromCSV("./final_duo_info.csv");
//});
// checks the URL for a ranking and uses it to populate ranking
getRanking();
