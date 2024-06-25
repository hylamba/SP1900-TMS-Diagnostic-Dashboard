// scripts.js

window.addEventListener('beforeunload', function() {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
const tableHeader = document.getElementById('table-header');
const tableBody = document.getElementById('table-body');

// Global data array to store CSV data
let globalData = [];
let popupCount = 0; // Initialize popup count to 0
let popupArray = []; // Initialize popup array
initData();

// function initData() {
//   // fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/test.csv')
//   fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/CAB.csv')
//     .then(response => response.text())
//     .then(csvData => {
//       const csvRows = csvData.split('\n');
//       const headers = csvRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(header => header.trim().replace(/^"|"$/g, ''));
//       const data = [];
//       let hideRows = false; // Initialize the hide rows flag

//       console.log('Headers:', headers);

//       for (let i = 1; i < csvRows.length; i++) {
//         const row = csvRows[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
//         const rowData = {};

//         for (let j = 0; j < row.length; j++) {
//           rowData[headers[j]] = row[j].trim().replace(/^"|"$/g, '');
//         }

//         // Add empty strings for missing columns
//         for (let j = row.length; j < headers.length; j++) {
//           rowData[headers[j]] = '';
//         }

//         if (row[0].startsWith('-')) { // Check if the row starts with '-'
//           hideRows = true; // Set the hide rows flag
//         }

//         if (hideRows) { // If the hide rows flag is set, mark the row as hidden
//           rowData['hidden'] = true;
//         }

//         data.push(rowData);
//       }

//       console.log('Data:', data);

//       createTable(headers, data);
//     });
// }
function initData() {
  fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/CAB.csv')
    .then(response => response.text())
    .then(csvData => {
      const csvRows = csvData.split('\n');
      const headers = csvRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(header => header.trim().replace(/^"|"$/g, ''));
      let hideRows = false; // Initialize the hide rows flag
      globalData = []; // Reset global data

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
        }

        globalData.push(rowData);
      }

      createTable(headers, globalData);
    });
}

// Function to create the accordion list
// function createAccordionList(row, processedLevels = new Set()) {
//   if (processedLevels.has(row['LEVEL'])) {
//     return document.createElement('ul'); // Return an empty list to stop recursion
//   }

//   processedLevels.add(row['LEVEL']); // Mark this level as processed

//   const accordionList = document.createElement('ul');
//   accordionList.className = 'accordion-list';

//   const listItem = document.createElement('li');
//   listItem.textContent = row['Fault No.'];

//   const referencedRows = getReferencedRows(globalData, row['LEVEL'], processedLevels);
//   if (referencedRows.length > 0) {
//     const nestedList = document.createElement('ul');
//     referencedRows.forEach((referencedRow) => {
//       const nestedListItem = createAccordionList(referencedRow, new Set(processedLevels)); // Pass a copy of processed levels
//       nestedList.appendChild(nestedListItem);
//     });
//     listItem.appendChild(nestedList);
//   }

//   accordionList.appendChild(listItem);
//   return accordionList;
// }

function createAccordionList(row, data) {
  const accordionList = document.createElement('ul');
  accordionList.className = 'accordion-list';

  const listItem = document.createElement('li');
  listItem.textContent = `${row['LEVEL']}`;
  accordionList.appendChild(listItem);

  // Check for references in each relevant column
  ['D1', 'D2', 'D3', 'D4'].forEach(column => {
    if (row[column] && row[column].startsWith('CAB')) {
      const referencedRows = getReferencedRows(data, row[column]);
      referencedRows.forEach(referencedRow => {
        const nestedListItem = createAccordionList(referencedRow, data);
        accordionList.appendChild(nestedListItem);
      });
    }
  });

  return accordionList;
}


// function getReferencedRows(data, level, processedLevels) {
//   return data.filter(row => row['LEVEL'] === level && row['hidden'] && !processedLevels.has(row['LEVEL']));
// }

function getReferencedRows(data, reference) {
  return data.filter(row => Object.values(row).includes(reference) && row['hidden']);
}

let sortDirection = 1;

function createTable(headers, data) {
  const tableHeaderRow = document.createElement('tr');

  for (let i = 0; i < headers.length; i++) {
    const tableHeaderCell = document.createElement('th');
    tableHeaderCell.textContent = headers[i];
    tableHeaderCell.addEventListener('click', () => {
      sortTable(i);
    });

    // Add an arrow to the header cell
    // const arrow = document.createElement('span');
    // arrow.textContent = '⇅'; // Initial arrow icon
    // arrow.style.display = 'inline';
    // arrow.className = 'arrow';
    // tableHeaderCell.appendChild(arrow);
    // tableHeaderCell.arrow = arrow;

    // // Add an up arrow to the header cell (hidden initially)
    // const upArrow = document.createElement('span');
    // upArrow.textContent = '⬆';
    // upArrow.style.display = 'none';
    // upArrow.className = 'up-arrow';
    // tableHeaderCell.appendChild(upArrow);
    // tableHeaderCell.upArrow = upArrow;

    // // Add a down arrow to the header cell (hidden initially)
    // const downArrow = document.createElement('span');
    // downArrow.textContent = '⬇';
    // downArrow.style.display = 'none';
    // downArrow.className = 'down-arrow';
    // tableHeaderCell.appendChild(downArrow);
    // tableHeaderCell.downArrow = downArrow;

    tableHeaderRow.appendChild(tableHeaderCell);
  }

  tableHeader.innerHTML = '';
  tableHeader.appendChild(tableHeaderRow);

  // let popupCount = 0; // Keep track of the number of popups
  // let popupArray = []; // Keep track of all popups

  data.forEach((row, rowIndex) => {
    if (row['hidden']) { // If the row is marked as hidden, skip it
      return;
    }
    const tableRow = document.createElement('tr');

    // for (let i = 0; i < headers.length; i++) {
    //   const tableCell = document.createElement('td');
    //   tableCell.textContent = row[headers[i]] !== undefined ? row[headers[i]] : '';

    //   // Add event listener to cells that contain references to other rows
    //   if (tableCell.textContent.startsWith('CAB ')) {
    //     tableCell.style.cursor = 'pointer'; // Change the cursor to a pointer on hover
    //     tableCell.style.textDecoration = 'underline'; // Underline the clickable text

    //     tableCell.addEventListener('click', () => {
    //       const reference = tableCell.textContent;
    //       // const referenceRow = data.find((row) => row['Fault No.'] === reference);
    //       const hiddenRows = data.filter((row) => row['hidden'] === true);
    //       // const referenceRow = hiddenRows.find((row) => row['Fault No.'] === reference);
    //       const referenceRow = globalData.find(row => row['Fault No.'] === reference && row['hidden']);
    for (let i = 0; i < headers.length; i++) {
      const tableCell = document.createElement('td');
      tableCell.textContent = row[headers[i]] !== undefined ? row[headers[i]] : '';
    
      // Add event listener to cells that contain references to other rows
      if (['D1', 'D2', 'D3', 'D4'].some((column) => row[column] === tableCell.textContent)) {
        
    
        const faultNos = data.map((row) => row['Fault No.']);
    
        if (faultNos.includes(tableCell.textContent) && tableCell.textContent.trim() !== '') {
          tableCell.style.textDecoration = 'underline'; // Underline the clickable text
          tableCell.style.cursor = 'pointer'; // Change the cursor to a pointer on hover
        }
    
        tableCell.addEventListener('click', () => {
          const reference = tableCell.textContent;
          if (reference.trim() !== '') { // Check if the cell is not blank
            const referenceRow = data.find((row) => row['Fault No.'] === reference);
      
            if (!referenceRow) {
              ['D1', 'D2', 'D3', 'D4'].some((column) => {
                data.some((row) => {
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
              // popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2}px`;
              // popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
              // popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2 + (popupCount * 20)}px`; 
              // popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
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

              // Increment the popup count
              popupCount++;
              // const popupContent = document.createElement('div');
              // popupContent.innerHTML = `
              //   <h2>${reference}</h2>
              //   <table>
              //     <tr><th>No.</th><td>${referenceRow['Fault No.']}</td></tr>
              //     <tr><th>Monitoring Item</th><td>${referenceRow['Fault Name for display']}</td></tr>
              //     <tr><th>Detect</th><td>${referenceRow['LEVEL']}</td></tr>
              //     <!-- <tr><th></th><td>${referenceRow['Car Type']}</td></tr> -->
              //     <!-- Add more columns as needed -->
              //   </table>
              // `;


              const popupContent = document.createElement('div');
              popupContent.innerHTML = `
                <h2>${reference}</h2>
                <table>
                  <tr><th>No.</th><td>${referenceRow['Fault No.']}</td></tr>
                  <tr><th>Monitoring Item</th><td>${referenceRow['Fault Name for display']}</td></tr>
                  <tr><th>Detect</th><td>${getReferenceText(referenceRow['LEVEL'])}</td></tr>
                  <!-- Add more columns as needed -->
                </table>
              `;

              

              


              popup.appendChild(popupContent);
              
              // const accordionContainer = document.createElement('div');
              // accordionContainer.className = 'accordion-container';
              // const accordionList = createAccordionList(referenceRow, globalData);
              // accordionContainer.appendChild(accordionList);
              // popup.appendChild(accordionContainer);

              
              
              // Create a close button
              const closeButton = document.createElement('button');
              closeButton.textContent = 'x';
              closeButton.style.font = 'Calibri';
              closeButton.style.fontSize = '15px';
              closeButton.style.position = 'absolute'; // Set position to absolute
              closeButton.style.top = '10px'; // Set top position to 10px
              closeButton.style.right = '10px'; // Set right position to 10px
              closeButton.style.lineHeight = '15px'; // Set line height to match font size
              closeButton.style.width = '15px'; // Set width to match font size
              closeButton.style.height = '15px'; // Set height to match font size
              closeButton.style.padding = '0'; // Remove padding
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
}


// function getReferenceText(text) {
//   const codeRegex = /\b([A-Z]{2,3} \d{3,})\b/g;
//   const codes = text.match(codeRegex);
//   if (codes) {
//     return codes.map(code => {
//       const referenceRow = globalData.find(row => row['Fault No.'] === code);
//       if (referenceRow) {
//         return `<a style="color: black; text-decoration: underline;" onclick="${`showPopup('${code}')`}">${code}</a>`;
//       } else {
//         return code;
//       }
//     }).join(', ');
//   } else {
//     return text;
//   }
// }


function getReferenceText(text) {
  const codeRegex = /\b([A-Z]{2,3} \d{3,})\b/g;
  return text.replace(codeRegex, (match) => {
    const referenceRow = globalData.find(row => row['Fault No.'] === match);
    if (referenceRow) {
      return `<a style="color: black; text-decoration: underline; cursor: pointer;" onclick="${`showPopup('${match}')`}"">${match}</a>`;
    } else {
      return match;
    }
  });
}

function showPopup(faultNo) {
  const referenceRow = globalData.find((row) => row['Fault No.'] === faultNo);
  if (!referenceRow) {
    console.error(`No row found with Fault No. ${faultNo}`);
    return;
  }
  

  const popup = document.createElement('div');
  popup.style.position = 'absolute';
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

  // Increment the popup count
  popupCount++;

  const popupContent = document.createElement('div');
  popupContent.innerHTML = `
    <h2>${faultNo}</h2>
    <table>
      <tr><th>No.</th><td>${referenceRow['Fault No.']}</td></tr>
      <tr><th>Monitoring Item</th><td>${referenceRow['Fault Name for display']}</td></tr>
      <tr><th>Logic/Conversion Ratio</th><td>${referenceRow['LEVEL']}</td></tr>
      <!-- Add more columns as needed -->
    </table>
  `;

  popup.appendChild(popupContent);

  // Create a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'x';
  closeButton.style.font = 'Calibri';
  closeButton.style.fontSize = '15px';
  closeButton.style.position = 'absolute'; // Set position to absolute
  closeButton.style.top = '10px'; // Set top position to 10px
  closeButton.style.right = '10px'; // Set right position to 10px
  closeButton.style.lineHeight = '15px'; // Set line height to match font size
  closeButton.style.width = '15px'; // Set width to match font size
  closeButton.style.height = '15px'; // Set height to match font size
  closeButton.style.padding = '0'; // Remove padding
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

// function sortTable(columnIndex) {
//   const tableRows = tableBody.rows;
//   const sortedRows = Array.from(tableRows).sort((a, b) => {
//     const aValue = a.cells[columnIndex].textContent;
//     const bValue = b.cells[columnIndex].textContent;
//     if (aValue < bValue) return -sortDirection;
//     if (aValue > bValue) return sortDirection;
//     return 0;
//   });

//   // Toggle the sorting direction
//   sortDirection *= -1;

//   // Update the arrows in the header cell
//   const headerCell = tableHeader.rows[0].cells[columnIndex];
//   headerCell.arrow.style.display = 'none'; // Hide the initial arrow
//   if (sortDirection === 1) {
//     headerCell.downArrow.style.display = 'inline'; // Show the down arrow
//     headerCell.upArrow.style.display = 'none'; // Hide the up arrow
//   } else {
//     headerCell.downArrow.style.display = 'none'; // Hide the down arrow
//     headerCell.upArrow.style.display = 'inline'; // Show the up arrow
//   }
//   headerCell.arrow.classList.toggle('active', sortDirection === 1);
//   headerCell.upArrow.classList.toggle('active', sortDirection === -1);

//   tableBody.innerHTML = '';
//   sortedRows.forEach((row) => {
//     tableBody.appendChild(row);
//   });
// }


function exportToCSV() {
  const data = [];
  const headers = [];
  const rows = tableBody.rows;

  // Get the headers from the table
  const tableHeaderRow = tableHeader.rows[0];
  for (let i = 0; i < tableHeaderRow.cells.length; i++) {
    const headerCell = tableHeaderRow.cells[i];
    // Remove the arrow icons from the header cell text, but keep dashes, brackets, and punctuation
    const headerText = headerCell.textContent.replace(/[^a-zA-Z0-9\s\-()\[\],.!?:;]/g, '');
    headers.push(headerText);
  }

  // Add the headers to the data array
  data.push(headers);

  // Get the data from the table, only considering visible rows
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].style.display !== 'none') {
      const row = [];
      const cells = rows[i].cells;
      for (let j = 0; j < cells.length; j++) {
        const cellText = cells[j].textContent.replace(/[^a-zA-Z0-9\s\-()\[\],.!?:;]/g, '');
        row.push(cellText);
      }
      data.push(row);
    }
  }

  const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.csv';
  a.click();
}

// Add an event listener to a button to trigger the export
// const exportButton = document.getElementById('export-button');
// exportButton.addEventListener('click', exportToCSV);

// Add a search input field
const searchInput = document.getElementById('search-input');

// Add an event listener to the search input field
searchInput.addEventListener('input', searchTable);

function searchTable(event) {
  const searchTerm = event.target.value.toLowerCase().replace(/[-\s]/g, ''); // Remove - and spaces from search term
  const rows = tableBody.rows;

  // Hide all rows initially
  for (let i = 0; i < rows.length; i++) {
    rows[i].style.display = 'none';
  }

  // Show rows that match the search term
  for (let i = 0; i < rows.length; i++) {
    const rowCells = rows[i].cells;
    for (let j = 0; j < rowCells.length; j++) {
      const cellText = rowCells[j].textContent.toLowerCase().replace(/[-\s]/g, ''); // Remove - and spaces from cell text
      if (cellText.includes(searchTerm)) {
        rows[i].style.display = '';
        break;
      }
    }
  }
}

function clearSearch() {
  // window.location.href = "/"; // Return to home page
  // or
  window.location.reload(); // Reload the current page
  // or
  // Perform any other action you want
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