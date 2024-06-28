// scripts.js

window.addEventListener('beforeunload', function() {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
const tableHeader = document.getElementById('table-header');
const tableBody = document.getElementById('table-body');
const paginationContainer = document.getElementById('pagination-container');
const filterContainer = document.getElementById('filter-container');

// Global data array to store CSV data
let globalData = [];
let popupCount = 0; // Initialize popup count to 0
let popupArray = []; // Initialize popup array
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 10;
let totalPages = 0;
let hiddenData = [];
let headers;
let selectedFilter = 'All';

initData();
// https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/all.csv
// https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/TMS.csv

function initData() {
  fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/CAB.csv')
  // fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/all.csv')
  // fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/test.csv')
    .then(response => response.text())
    .then(csvData => {
      const csvRows = csvData.split('\n');
      headers = csvRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(header => header.trim().replace(/^"|"$/g, ''));
      let hideRows = false; // Initialize the hide rows flag
      globalData = []; // Reset global data
      hiddenData = [];

      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        const rowData = {};

        for (let j = 0; j < row.length; j++) {
          rowData[headers[j]] = row[j].trim().replace(/^"|"$/g, '');
        }

        if (row[0].startsWith('-')) {
          hideRows = true;
        }

        if (hideRows) {
          rowData['hidden'] = true;
          hiddenData.push(rowData);
        }

        globalData.push(rowData);
      }
      filteredData=globalData; //initialize filteredData with globalData
      createFilter();
      createTable(headers, globalData);
    });
}



function createFilter() {
  const filterContainer = document.getElementById('filter-container');
  const visibleRows = globalData.filter(row =>!row['hidden']);
  const faultNos = visibleRows.map(row => row['Fault No.']);

  const faultNoPrefixes = {};
  faultNos.forEach((faultNo) => {
    const prefix = faultNo.split('-')[0];
    if (!faultNoPrefixes[prefix]) {
      faultNoPrefixes[prefix] = [];
    }
    faultNoPrefixes[prefix].push(faultNo);
  });

  const filterTabs = ['All',...Object.keys(faultNoPrefixes)]; // Add 'All' and unique fault no prefixes to filter tabs

  filterTabs.forEach((filter) => {
    const filterTab = document.createElement('button');
    filterTab.className = 'filter-button';
    filterTab.textContent = filter;
    filterContainer.appendChild(filterTab);

    filterTab.addEventListener('click', () => {
      selectedFilter = filter; // Update the selected filter
      if (filter === 'All') {
        filteredData = globalData;
      } else {
        const prefix = filter;
        filteredData = globalData.filter((row) => row['Fault No.'].startsWith(prefix + '-'));
      }
      hiddenData = globalData.filter(row => row['hidden']); // Update hiddenData array
      currentPage = 1; // Reset current page to 1 when filter changes
      
      // Call searchTable() to handle search filtering
      searchTable({ target: document.getElementById('search-input') });

      createTable(headers, filteredData);
      createPagination();
    });
  });
}

function colorSelectedFilter(){
  // Color the selected filter button
  filterContainer.querySelectorAll('.filter-button').forEach((tab) => {
    if (tab.textContent === selectedFilter) {
      tab.style.background = '#727578';
      tab.style.color = '#fff';
    } else {
      tab.style.background = '';
      tab.style.color = '';
    }
  });
}


function createTable(headers, data) {
  const tableHeaderRow = document.createElement('tr');

  for (let i = 0; i < headers.length; i++) {
    const tableHeaderCell = document.createElement('th');
    tableHeaderCell.textContent = headers[i];
    tableHeaderRow.appendChild(tableHeaderCell);
  }
  
  let visibleData = data.filter(row =>!row['hidden']);
  totalPages = Math.ceil(visibleData.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const tableRows = visibleData.slice(startIndex, endIndex);

  tableHeader.innerHTML = '';
  tableHeader.appendChild(tableHeaderRow);
  tableBody.innerHTML = ''; // Clear the table body

  tableRows.forEach((row) => {
    if (row['hidden']) { // If the row is marked as hidden, skip it
      return;
    }
    const tableRow = document.createElement('tr');

    for (let i = 0; i < headers.length; i++) {
      const tableCell = document.createElement('td');
      tableCell.textContent = row[headers[i]] !== undefined ? row[headers[i]] : '';
    
      // Add event listener to cells that contain references to other rows
      if (['D1', 'D2', 'D3', 'D4'].some((column) => row[column] === tableCell.textContent)) {
        
    
        const faultNos = hiddenData.map((row) => row['Fault No.']);
    
        if (faultNos.includes(tableCell.textContent.replace(/^~/, '')) && tableCell.textContent.trim() !== '') {
          tableCell.style.textDecoration = 'underline'; // Underline the clickable text
          tableCell.style.cursor = 'pointer'; // Change the cursor to a pointer on hover
        }
    
        tableCell.addEventListener('click', () => {
          const reference = tableCell.textContent.replace(/^~/, ''); // Remove leading ~ character
          const hasTilde = tableCell.textContent.startsWith('~'); // Check if the cell value starts with ~
          if (reference.trim() !== '') { // Check if the cell is not blank
            const referenceRow = hiddenData.find((row) => row['Fault No.'] === reference);
      
            if (!referenceRow) {
              ['D1', 'D2', 'D3', 'D4'].some((column) => {
                hiddenData.some((row) => {
                  if (row[column] === reference) {
                    referenceRow = row;
                    return true;
                  }
                });
              });
            }
      
            if (referenceRow) {
              // Create a popup to show the details of the referenced row
              const popup = document.createElement('div');
              popup.style.position = 'absolute';
              popup.style.width = '300px';

              if (popupArray.length === 0) {
                // If all popups have been closed, reset the popup location
                popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2}px`;
                popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
              } else {
                // Otherwise, position the popup below the previous one
                popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2 + (popupCount * 20)}px`;
                popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
              }
              
              popup.style.zIndex = popupCount;
              
              // Add the popup to the popup array
              popupArray.push(popup);

              popup.style.background = 'white';
              popup.style.padding = '20px';
              popup.style.border = '0 px solid black';
              popup.style.borderRadius = '10px';
              popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
              popup.style.cursor = 'move'; // Add a move cursor to indicate draggability
          
              let isDragging = false;
              let offsetX = 0;
              let offsetY = 0;
          
              // Add event listeners for dragging
              popup.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - popup.offsetLeft;
                offsetY = e.clientY - popup.offsetTop;
                // Bring the popup to the front when dragging starts
                popupArray.forEach((p) => {
                  p.style.zIndex = popupCount;
                });
                popup.style.zIndex = popupCount + 1000;
              });
          
              document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                  popup.style.top = `${e.clientY - offsetY}px`;
                  popup.style.left = `${e.clientX - offsetX}px`;
                }
              });

              document.addEventListener('mouseup', () => {
                isDragging = false;
              });

              // Add event listeners for dragging (touch events)
              popup.addEventListener('touchstart', (e) => {
                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                  e.preventDefault();
                }
                isDragging = true;
                offsetX = e.touches[0].clientX - popup.offsetLeft;
                offsetY = e.touches[0].clientY - popup.offsetTop;
                // Bring the popup to the front when dragging starts
                popupArray.forEach((p) => {
                  p.style.zIndex = popupCount;
                });
                popup.style.zIndex = popupCount + 1000;
              });

              document.addEventListener('touchmove', (e) => {
                if (isDragging && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                  e.preventDefault();
                }
                if (isDragging) {
                  popup.style.top = `${e.touches[0].clientY - offsetY}px`;
                  popup.style.left = `${e.touches[0].clientX - offsetX}px`;
                }
              }, { passive: false});

              document.addEventListener('touchend', () => {
                isDragging = false;
              });


              // Increment the popup count
              popupCount++;


              const popupContent = document.createElement('div');
              popupContent.innerHTML = `
                <h2>${hasTilde ? `~${reference}` : reference}</h2>
                <table>
                  <tr><th>No.</th><td>${hasTilde ? `~${referenceRow['Fault No.']}` : referenceRow['Fault No.']}</td></tr>
                  <tr><th>Monitoring Item</th><td>${hasTilde ? `~${referenceRow['Fault Name for display']}` : referenceRow['Fault Name for display']}</td></tr>
                  <!-- <tr><th>Detect</th><td>${getReferenceText(referenceRow['LEVEL'])}</td></tr> -->
                  <!-- <tr><th></th><td>${getReferenceText(referenceRow['Car Type'])}</td></tr> -->
                  
                  ${hasTilde ?
                    `<tr><th>Detect</th><td><b>${getReferenceText(referenceRow['Car Type'])}</b><br>${getReferenceText(referenceRow['LEVEL'])}</td></tr>` :
                    `<tr><th>Detect</th><td><b>${getReferenceText(referenceRow['LEVEL'])}</b><br>${getReferenceText(referenceRow['Car Type'])}</td></tr>`
                  }
                  <!-- Add more columns as needed -->
                </table>
              `;

              popup.appendChild(popupContent);

              // Create a close button
              const closeButton = document.createElement('button');
              closeButton.textContent = '̽';
              closeButton.style.font = 'Calibri';
              closeButton.style.fontSize = '40px'; // Large font size
              closeButton.style.position = 'absolute'; // Set position to absolute
              closeButton.style.top = '10px'; // Set top position to 10px
              closeButton.style.right = '10px'; // Set right position to 10px
              closeButton.style.lineHeight = '40px'; // Set line height to match font size
              closeButton.style.width = '30px'; // Smaller width
              closeButton.style.height = '30px'; // Smaller height
              closeButton.style.padding = '5px'; // Increase padding to make clickable area larger
              closeButton.style.borderRadius = '50%'; // Make the button circular
              closeButton.style.cursor = 'pointer';
              closeButton.style.backgroundColor = 'transparent';
              closeButton.style.border = 'transparent';
              closeButton.style.fontWeight = 'bold';
              closeButton.style.color = 'gray'; // Set the initial color to gray
              closeButton.onmouseover = () => closeButton.style.color = 'black'; // Change the color to black on hover
              closeButton.onmouseout = () => closeButton.style.color = 'gray'; // Change the color back to gray on mouseout

              // Add an event listener to the close button to remove the popup from the array
              closeButton.addEventListener('click', () => {
                const index = popupArray.indexOf(popup);
                if (index !== -1) {
                  popupArray.splice(index, 1);
                  if (popupArray.length === 0) {
                    // If all popups have been closed, reset the popup count
                    popupCount = 0;
                  }
                }
                popup.remove();
              });

              // Append the close button to the popup
              popup.appendChild(closeButton);

              document.body.appendChild(popup);
            }
          }
        });
      } else {
        tableCell.style.textDecoration = 'none'; // Remove underline for non-clickable text
      }

      tableRow.appendChild(tableCell);
    }

    tableBody.appendChild(tableRow);
  });
  createPagination();
  colorSelectedFilter();
}

function createPagination() {
  paginationContainer.innerHTML = '';

  const rowsPerPageSelect = document.createElement('select');
  rowsPerPageSelect.id = 'rows-per-page-select';
  rowsPerPageSelect.style.marginRight = '10px';

  const rowsPerPageOptions = [10, 25, 50, "All"];
  rowsPerPageOptions.forEach((option) => {
    const optionElement = document.createElement('option');
    if (option === "All") {
      optionElement.value = globalData.filter(row => !row['hidden']).length;
      optionElement.textContent = "All rows";
    } else {
      optionElement.value = option;
      optionElement.textContent = `${option} rows`;
    }
    rowsPerPageSelect.appendChild(optionElement);
  });

  rowsPerPageSelect.value = rowsPerPage;
  rowsPerPageSelect.addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value);
    const filteredDataTemp = filteredData.filter(row => !row['hidden']); // Filtered data based on current filter
    const totalPagesNew = Math.ceil(filteredDataTemp.length / rowsPerPage);
    currentPage = Math.min(currentPage, totalPagesNew); // Ensure currentPage doesn't exceed totalPagesNew
    createTable(headers, filteredData);
  });

  paginationContainer.appendChild(rowsPerPageSelect);

  const firstPageButton = document.createElement('a');
  firstPageButton.href = '#';
  firstPageButton.textContent = 'First';
  firstPageButton.className = 'pagination-link';
  firstPageButton.addEventListener('click', (e) => {
    e.preventDefault();
    currentPage = 1;
    createTable(headers, filteredData);
  });
  paginationContainer.appendChild(firstPageButton);

  const previousPageButton = document.createElement('a');
  previousPageButton.href = '#';
  previousPageButton.textContent = '<';
  previousPageButton.className = 'pagination-link';
  previousPageButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      createTable(headers, filteredData);
    }
  });
  paginationContainer.appendChild(previousPageButton);

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      const paginationLink = document.createElement('a');
      paginationLink.href = '#';
      paginationLink.textContent = i;
      paginationLink.className = 'pagination-link';
      if (i === currentPage) {
        paginationLink.className += ' active';
      }

      paginationLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        createTable(headers, filteredData);
      });
      paginationContainer.appendChild(paginationLink);
    }
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 5; i++) {
      const paginationLink = document.createElement('a');
      paginationLink.href = '#';
      paginationLink.textContent = i;
      paginationLink.className = 'pagination-link';
      if (i === currentPage) {
        paginationLink.className += ' active';
      }

      paginationLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        createTable(headers, filteredData);
      });
      paginationContainer.appendChild(paginationLink);
    }

    const ellipsisRight = document.createElement('span');
    ellipsisRight.textContent = ' ... ';
    ellipsisRight.style.color = 'gray';
    ellipsisRight.className = 'pagination-ellipsis';
    ellipsisRight.style.border = 'none';
    ellipsisRight.style.cursor = 'default';
    ellipsisRight.style.pointerEvents = 'none'; // Add this line to prevent clicking
    paginationContainer.appendChild(ellipsisRight);

    const lastPageLink = document.createElement('a');
    lastPageLink.href = '#';
    lastPageLink.textContent = totalPages;
    lastPageLink.className = 'pagination-link';
    lastPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = totalPages;
      createTable(headers, filteredData);
    });
    paginationContainer.appendChild(lastPageLink);
  } else if (currentPage >= totalPages - 2) {
    const firstPageLink = document.createElement('a');
    firstPageLink.href = '#';
    firstPageLink.textContent = 1;
    firstPageLink.className = 'pagination-link';
    firstPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = 1;
      createTable(headers, filteredData);
    });
    paginationContainer.appendChild(firstPageLink);

    const ellipsisLeft = document.createElement('span');
    ellipsisLeft.textContent = ' ... ';
    ellipsisLeft.style.color = 'gray';
    ellipsisLeft.className = 'pagination-ellipsis';
    ellipsisLeft.style.border = 'none';
    ellipsisLeft.style.cursor = 'default';
    ellipsisLeft.style.pointerEvents = 'none'; // Add this line to prevent clicking
    paginationContainer.appendChild(ellipsisLeft);

    for (let i = totalPages - 4; i <= totalPages;i++) {
      const paginationLink = document.createElement('a');
      paginationLink.href = '#';
      paginationLink.textContent = i;
      paginationLink.className = 'pagination-link';
      if (i === currentPage) {
        paginationLink.className += 'ctive';
      }

      paginationLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        createTable(headers, filteredData);
      });
      paginationContainer.appendChild(paginationLink);
    }
  } else {
    const firstPageLink = document.createElement('a');
    firstPageLink.href = '#';
    firstPageLink.textContent = 1;
    firstPageLink.className = 'pagination-link';
    firstPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = 1;
      createTable(headers, filteredData);
    });
    paginationContainer.appendChild(firstPageLink);

    const ellipsisLeft = document.createElement('span');
    ellipsisLeft.textContent = ' ... ';
    ellipsisLeft.style.color = 'gray';
    ellipsisLeft.className = 'pagination-ellipsis';
    ellipsisLeft.style.border = 'none';
    ellipsisLeft.style.cursor = 'default';
    ellipsisLeft.style.pointerEvents = 'none'; // Add this line to prevent clicking
    paginationContainer.appendChild(ellipsisLeft);

    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      const paginationLink = document.createElement('a');
      paginationLink.href = '#';
      paginationLink.textContent = i;
      paginationLink.className = 'pagination-link';
      if (i === currentPage) {
        paginationLink.className += 'ctive';
      }

      paginationLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        createTable(headers, filteredData);
      });
      paginationContainer.appendChild(paginationLink);
    }

    const ellipsisRight = document.createElement('span');
    ellipsisRight.textContent = ' ... ';
    ellipsisRight.style.color = 'gray';
    ellipsisRight.className = 'pagination-ellipsis';
    ellipsisRight.style.border = 'none';
    ellipsisRight.style.cursor = 'default';
    ellipsisRight.style.pointerEvents = 'none'; // Add this line to prevent clicking
    paginationContainer.appendChild(ellipsisRight);

    const lastPageLink = document.createElement('a');
    lastPageLink.href = '#';
    lastPageLink.textContent = totalPages;
    lastPageLink.className = 'pagination-link';
    lastPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = totalPages;
      createTable(headers, filteredData);
    });
    paginationContainer.appendChild(lastPageLink);
  }

  const nextPageButton = document.createElement('a');
  nextPageButton.href = '#';
  nextPageButton.textContent = '>';
  nextPageButton.className = 'pagination-link';
  nextPageButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      createTable(headers, filteredData);
    }
  });
  paginationContainer.appendChild(nextPageButton);

  const lastPageButton = document.createElement('a');
  lastPageButton.href = '#';
  lastPageButton.textContent = 'Last';
  lastPageButton.className = 'pagination-link';
  lastPageButton.addEventListener('click', (e) => {
    e.preventDefault();
    currentPage = totalPages;
    createTable(headers, filteredData);
  });
  paginationContainer.appendChild(lastPageButton);

  if (currentPage === 1) {
    firstPageButton.style.display = 'none';
    previousPageButton.style.display = 'none';
  } else {
    firstPageButton.style.display = 'inline';
    previousPageButton.style.display = 'inline';
  }
  
  if (currentPage === totalPages) {
    lastPageButton.style.display = 'none';
    nextPageButton.style.display = 'none';
  } else {
    lastPageButton.style.display = 'inline';
    nextPageButton.style.display = 'inline';
  }

  // Style the pagination container
  paginationContainer.style.textAlign = 'right';
  paginationContainer.style.marginTop = '20px';

  // Style the pagination links
  const paginationLinks = paginationContainer.children;
  for (let i = 0; i < paginationLinks.length; i++) {
    if (paginationLinks[i].className !== 'pagination-ellipsis') {
      paginationLinks[i].classList.remove('active');
      if (paginationLinks[i].textContent === currentPage.toString()) {
        paginationLinks[i].classList.add('active');
      }
      paginationLinks[i].style.font = "Calibri";
      paginationLinks[i].style.border = '1px solid #ddd';
      paginationLinks[i].style.borderRadius = '5px';
      paginationLinks[i].style.padding = '5px 10px';
      paginationLinks[i].style.margin = '0 5px';
      paginationLinks[i].style.cursor = 'pointer';
      paginationLinks[i].style.color = 'gray';
      paginationLinks[i].style.textDecoration = 'none';
  
      if (paginationLinks[i].classList.contains('active')) {
        paginationLinks[i].style.background = '#727578';
        paginationLinks[i].style.color = '#fff';
      }
    }
  }
}

function getReferenceText(text) {
  const codeRegex = /([~])?[A-Z]{2}[A-Z0-9]?\s?\d{3}(?= |$|&|,|>=|#| |>|=|<|<=)/g;
  return text.replace(codeRegex, (match, tilde) => {
    const faultNo = match.replace(/^~/, ''); // Remove the tilde from the faultNo if it exists
    if (hiddenData.find(row => row['Fault No.'] === faultNo)) {
      const textDecoration = tilde ? 'underline' : 'underline';
      return `<a style="color: black; text-decoration: ${textDecoration}; cursor: pointer;" onclick="${`showPopup('${faultNo}', ${tilde? true : false})`}"">${tilde ? '~' + faultNo : faultNo}</a>`;
    } else {
      return match;
    }
  });
}

function showPopup(faultNo,tilde) {
  const referenceRow = hiddenData.find((row) => row['Fault No.'] === faultNo);
  if (!referenceRow) {
    console.error(`No row found with Fault No. ${faultNo}`);
    return;
  }
  

  const popup = document.createElement('div');
  popup.style.position = 'absolute';
  popup.style.width = '300px';
  
  if (popupArray.length === 0) {
    // If all popups have been closed, reset the popup location
    popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2}px`;
    popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
  } else {
    // Otherwise, position the popup below the previous one
    popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2 + (popupCount * 20)}px`;
    popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
  }
  popup.style.zIndex = popupCount+1000;
  popup.style.background = 'white';
  popup.style.padding = '20px';
  popup.style.border = '0px solid black';
  popup.style.borderRadius = '10px';
  popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
  popup.style.cursor = 'move'; // Add a move cursor to indicate draggability

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  popupArray.push(popup);
  

  // Add event listeners for dragging
  popup.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
    // Bring the popup to the front when dragging starts
    popupArray.forEach((p) => {
      p.style.zIndex = popupCount;
    });
    popup.style.zIndex = popupCount + 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      popup.style.top = `${e.clientY - offsetY}px`;
      popup.style.left = `${e.clientX - offsetX}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Add event listeners for dragging (touch events)
  popup.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      e.preventDefault();
    }
    isDragging = true;
    offsetX = e.touches[0].clientX - popup.offsetLeft;
    offsetY = e.touches[0].clientY - popup.offsetTop;
    // Bring the popup to the front when dragging starts
    popupArray.forEach((p) => {
      p.style.zIndex = popupCount;
    });
    popup.style.zIndex = popupCount + 1000;
  });

  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      e.preventDefault();
    }
    if (isDragging) {
      popup.style.top = `${e.touches[0].clientY - offsetY}px`;
      popup.style.left = `${e.touches[0].clientX - offsetX}px`;
    }
  }, { passive: false});

  document.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Increment the popup count
  popupCount++;

  const popupContent = document.createElement('div');
  popupContent.innerHTML = `
    <h2>${tilde ? '~' + faultNo : faultNo}</h2>
    <table>
      <tr><th>No.</th><td>${tilde ? '~' + referenceRow['Fault No.'] : referenceRow['Fault No.']}</td></tr>
      <tr><th>Monitoring Item</th><td>${tilde ? '~' + referenceRow['Fault Name for display'] : referenceRow['Fault Name for display']}</td></tr>
      ${tilde ?
        `<tr><th>Detect</th><td><b>${getReferenceText(referenceRow['Car Type'])}</b><br>${getReferenceText(referenceRow['LEVEL'])}</td></tr>` :
        `<tr><th>Detect</th><td><b>${getReferenceText(referenceRow['LEVEL'])}</b><br>${getReferenceText(referenceRow['Car Type'])}</td></tr>`
      }
      <!-- Add more columns as needed -->
    </table>
  `;

  popup.appendChild(popupContent);

  // Create a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '̽';
  closeButton.style.font = 'Calibri';
  closeButton.style.fontSize = '40px'; // Large font size
  closeButton.style.position = 'absolute'; // Set position to absolute
  closeButton.style.top = '10px'; // Set top position to 10px
  closeButton.style.right = '10px'; // Set right position to 10px
  closeButton.style.lineHeight = '40px'; // Set line height to match font size
  closeButton.style.width = '30px'; // Smaller width
  closeButton.style.height = '30px'; // Smaller height
  closeButton.style.padding = '5px'; // Increase padding to make clickable area larger
  closeButton.style.borderRadius = '50%'; // Make the button circular
  closeButton.style.cursor = 'pointer';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = 'transparent';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.color = 'gray'; // Set the initial color to gray
  closeButton.onmouseover = () => closeButton.style.color = 'black'; // Change the color to black on hover
  closeButton.onmouseout = () => closeButton.style.color = 'gray'; // Change the color back to gray on mouseout

  // Add an event listener to the close button to remove the popup from the array
  closeButton.addEventListener('click', () => {
    const index = popupArray.indexOf(popup);
    if (index !== -1) {
      popupArray.splice(index, 1);
      if (popupArray.length === 0) {
        // If all popups have been closed, reset the popup count
        popupCount = 0;
      }
    }
    popup.remove();
  });

  // Append the close button to the popup
  popup.appendChild(closeButton);

  document.body.appendChild(popup);
}

// Add a search input field
const searchInput = document.getElementById('search-input');

// Add an event listener to the search input field
searchInput.addEventListener('input', searchTable);

function searchTable(event) {
  const searchTerm = event.target.value.replace(/[-\s]/g, '').toLowerCase(); // Remove - and spaces from search term and convert to lowercase

  let searchData = (selectedFilter === 'All')? globalData : globalData.filter((row) => row['Fault No.'].startsWith(selectedFilter + '-'));

  if (searchTerm !== '') {
    searchData = searchData.filter((row) => {
      for (let key in row) {
        const value = row[key].toString().replace(/[-\s]/g, '').toLowerCase(); 
        if (value.includes(searchTerm)) {
          return true;
        }
      }
      return false;
    });
  }

  filteredData = searchData;

  // Update the currentPage and totalPages based on the search results
  totalPages = Math.ceil(filteredData.length / rowsPerPage);
  currentPage = 1;

  // Create a new table with the search results
  createTable(headers, filteredData);
}

function showNote() {
  // Create a new popup element
  const notePopup = document.createElement('div');
  notePopup.className = 'note-popup';

  // Create a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '̽';
  closeButton.style.font = 'Calibri';
  closeButton.style.fontSize = '40px'; // Large font size
  closeButton.style.position = 'absolute'; // Set position to absolute
  closeButton.style.top = '10px'; // Set top position to 10px
  closeButton.style.right = '10px'; // Set right position to 10px
  closeButton.style.lineHeight = '40px'; // Set line height to match font size
  closeButton.style.width = '30px'; // Smaller width
  closeButton.style.height = '30px'; // Smaller height
  closeButton.style.padding = '5px'; // Increase padding to make clickable area larger
  closeButton.style.borderRadius = '50%'; // Make the button circular
  closeButton.style.cursor = 'pointer';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = 'transparent';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.color = 'gray'; // Set the initial color to gray
  closeButton.onmouseover = () => closeButton.style.color = 'black'; // Change the color to black on hover
  closeButton.onmouseout = () => closeButton.style.color = 'gray'; // Change the color back to gray on mouseout
  closeButton.addEventListener('click', () => {
    notePopup.remove();
  });

  // Create a tabbed interface for the note
  const tabs = document.createElement('div');
  tabs.className = 'tabs';

  const tabButtons = [];
  const tabContents = [];

  // Create tabs for each section
  const sections = [
    { title: 'Logical Operators', content: `
      <ul>
        <li><strong>U</strong> OR</li>
        <li><strong>~</strong> Negation</li>
        <li><strong>^</strong> Exclusive OR</li>
        <li><strong>&</strong> AND</li>
        <li><strong>< , > , == , => , =< , !=</strong> Comparison</li>
        <li><strong>#</strong> Direct value</li>
      </ul>
    ` },
    { title: 'Detect and Clear', content: `
      <ul>
        <li><strong>D</strong> Detect</li>
        <li><strong>C</strong> Clear</li>
        <li><strong>DTD</strong> Detect Time Delay</li>
        <li><strong>CTD</strong> Clear Time Delay</li>
      </ul>
    ` },
    { title: 'Car Types', content: `
      <ul>
        <li><strong>DT-CU1</strong> Central Unit 1 of DT car</li>
        <li><strong>DT-CU2</strong> Central Unit 2 of DT car</li>
        <li><strong>PM</strong> PM1, PM2 car</li>
        <li><strong>M</strong> MW1, MW2 car</li>
        <li><strong>T</strong> TH1, TCH car</li>
      </ul>
    ` },
    { title: 'Fault Codes', content: `
      <ul>
        <li><strong>TMS</strong> TMS (Fault made by application)</li>
        <li><strong>CAB</strong> CAB</li>
        <li><strong>VOBC</strong> VOBC, ATP</li>
        <li><strong>BRAKE</strong> Brake system, Air compressor</li>
        <li><strong>CI1</strong> Converter inverter1</li>
        <li><strong>CI2</strong> Converter inverter2</li>
        <li><strong>SIV1</strong> SIV1</li>
        <li><strong>SIV2</strong> SIV2</li>
        <li><strong>DCU U</strong> Door system up side</li>
        <li><strong>DCU D</strong> Door system down side</li>
        <li><strong>A/C1</strong> Air Condition Control Board1 (ACCB1)</li>
        <li><strong>A/C2</strong> Air Condition Control Board2 (ACCB2)</li>
        <li><strong>COM</strong> Train Radio, Driver Information Display (Analog)</li>
        <li><strong>MC</strong> New Media Controller</li>
        <li><strong>PID</strong> Passenger Information Display1~6 (Analog)</li>
        <li><strong>TNI</strong> Train Number Indicator</li>
        <li><strong>DI</strong> Destination Indicator</li>
        <li><strong>ETC</strong> Pantograph, Main transfer, Automatic Power Control system, etc.</li>
        <li><strong>DRM</strong> Dynamic Route Map / Gangway End Display system</li>
        <li><strong>DPID</strong> Passenger Information Display system (Digital)</li>
        <li><strong>DCCTV</strong> CCTV system (Digital)</li>
      </ul>
    ` },
  ];

  sections.forEach((section, index) => {
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.textContent = section.title;
    tabButton.addEventListener('click', () => {
      tabButtons.forEach((tab) => tab.classList.remove('active'));
      tabButton.classList.add('active');
      tabContents.forEach((content) => content.style.display = 'none');
      tabContents[index].style.display = 'block';
    });
    tabButtons.push(tabButton);
    tabs.appendChild(tabButton);

    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.innerHTML = section.content;
    tabContent.style.display = index === 0? 'block' : 'none';
    tabContents.push(tabContent);
    notePopup.appendChild(tabContent);

    if (index === 0) {
      tabButton.classList.add('active');
    }
  });

  // Append the tabs and close button to the popup
  notePopup.appendChild(tabs);
  notePopup.appendChild(closeButton);

  // Append the popup to the body of the document
  document.body.appendChild(notePopup);
  // Make the popup draggable
  let isDragging = false;
  let startX, startY, initialX, initialY;
  notePopup.style.cursor = 'move';

  notePopup.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = notePopup.offsetLeft;
    initialY = notePopup.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      notePopup.style.top = `${initialY + e.clientY - startY}px`;
      notePopup.style.left = `${initialX + e.clientX - startX}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  notePopup.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      e.preventDefault();
    }
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    initialX = notePopup.offsetLeft;
    initialY = notePopup.offsetTop;
  });
  
  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      e.preventDefault();
    }
    if (isDragging) {
      notePopup.style.top = `${initialY + e.touches[0].clientY - startY}px`;
      notePopup.style.left = `${initialX + e.touches[0].clientX - startX}px`;
    }
  }, { passive: false});
  
  document.addEventListener('touchend', () => {
    isDragging = false;
  });
}

const noteLink = document.getElementById('note-link');
noteLink.addEventListener('click', showNote);

function clearSearch() {
  window.location.reload(); // Reload the current page
}

// Add an event listener to the Go to Top button
document.addEventListener('DOMContentLoaded', function() {
  const goToTopButton = document.querySelector('.js-gotop');

  goToTopButton.addEventListener('click', function(event) {
    event.preventDefault();

    // Animate the scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide the Go to Top button based on scroll position
  window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    if (scrollTop > 200) {
      goToTopButton.style.display = 'block';
    } else {
      goToTopButton.style.display = 'none';
    }
  });
});