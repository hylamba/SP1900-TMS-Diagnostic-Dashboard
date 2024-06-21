// scripts.js

window.addEventListener('beforeunload', function() {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
const tableHeader = document.getElementById('table-header');
const tableBody = document.getElementById('table-body');
// const fileInput = document.getElementById('fileInput');

// fileInput.addEventListener('change', handleFileChange);

// function handleFileChange(event) {
//   const file = fileInput.files[0];
//   const reader = new FileReader();

//   // Clear the table data before loading new data
//   tableBody.innerHTML = '';

//   reader.onload = function(event) {
//     const csvData = event.target.result;
//     const csvRows = csvData.split('\n');
//     const headers = csvRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(header => header.trim().replace(/^"|"$/g, ''));
//     const data = [];
//     let hideRows = false; // Initialize the hide rows flag

//     console.log('Headers:', headers);

//     for (let i = 1; i < csvRows.length; i++) {
//       const row = csvRows[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
//       const rowData = {};

//       for (let j = 0; j < row.length; j++) {
//         rowData[headers[j]] = row[j].trim().replace(/^"|"$/g, '');
//       }

//       // Add empty strings for missing columns
//       for (let j = row.length; j < headers.length; j++) {
//         rowData[headers[j]] = '';
//       }

//       if (row[0].startsWith('-')) { // Check if the row starts with '-'
//         hideRows = true; // Set the hide rows flag
//       }

//       if (hideRows) { // If the hide rows flag is set, mark the row as hidden
//         rowData['hidden'] = true;
//       }

//       data.push(rowData);
//     }

//     console.log('Data:', data);

//     createTable(headers, data);
//   };

//   reader.readAsText(file);
// }
initData();

function initData() {
  // fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/test.csv')
  fetch('https://raw.githubusercontent.com/hylamba/SP1900-TMS-Diagnostic-Dashboard/main/CAB.csv')
    .then(response => response.text())
    .then(csvData => {
      const csvRows = csvData.split('\n');
      const headers = csvRows[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(header => header.trim().replace(/^"|"$/g, ''));
      const data = [];
      let hideRows = false; // Initialize the hide rows flag

      console.log('Headers:', headers);

      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        const rowData = {};

        for (let j = 0; j < row.length; j++) {
          rowData[headers[j]] = row[j].trim().replace(/^"|"$/g, '');
        }

        // Add empty strings for missing columns
        for (let j = row.length; j < headers.length; j++) {
          rowData[headers[j]] = '';
        }

        if (row[0].startsWith('-')) { // Check if the row starts with '-'
          hideRows = true; // Set the hide rows flag
        }

        if (hideRows) { // If the hide rows flag is set, mark the row as hidden
          rowData['hidden'] = true;
        }

        data.push(rowData);
      }

      console.log('Data:', data);

      createTable(headers, data);
    });
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
    const arrow = document.createElement('span');
    arrow.textContent = '⬇';
    arrow.style.display = 'inline';
    arrow.className = 'arrow';
    tableHeaderCell.appendChild(arrow);
    tableHeaderCell.arrow = arrow;

    // Add an up arrow to the header cell
    const upArrow = document.createElement('span');
    upArrow.textContent = '⬆';
    upArrow.style.display = 'inline';
    upArrow.className = 'up-arrow';
    tableHeaderCell.appendChild(upArrow);
    tableHeaderCell.upArrow = upArrow;

    tableHeaderRow.appendChild(tableHeaderCell);
  }

  tableHeader.innerHTML = '';
  tableHeader.appendChild(tableHeaderRow);

  data.forEach((row, rowIndex) => {
    if (row['hidden']) { // If the row is marked as hidden, skip it
      return;
    }
    const tableRow = document.createElement('tr');

    for (let i = 0; i < headers.length; i++) {
      const tableCell = document.createElement('td');
      tableCell.textContent = row[headers[i]] !== undefined ? row[headers[i]] : '';

      // Add event listener to cells that contain references to other rows
      if (tableCell.textContent.startsWith('CAB ')) {
        tableCell.style.cursor = 'pointer'; // Change the cursor to a pointer on hover
        tableCell.style.textDecoration = 'underline'; // Underline the clickable text

        tableCell.addEventListener('click', () => {
          const reference = tableCell.textContent;
          const referenceRow = data.find((row) => row['Fault No.'] === reference);
          if (referenceRow) {
            // Create a popup to show the details of the referenced row
            const popup = document.createElement('div');
            popup.style.position = 'absolute';
            popup.style.top = `${window.scrollY + (window.innerHeight - popup.offsetHeight) / 2}px`;
            popup.style.left = `${window.scrollX + (window.innerWidth - popup.offsetWidth) / 2}px`;
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

            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
              <h2>${reference}</h2>
              <table>
                <tr><th>No.</th><td>${referenceRow['Fault No.']}</td></tr>
                <tr><th>Monitoring Item</th><td>${referenceRow['Fault Name for display']}</td></tr>
                <tr><th>Detect</th><td>${referenceRow['LEVEL']}</td></tr>
                <!-- <tr><th></th><td>${referenceRow['Car Type']}</td></tr> -->
                <!-- Add more columns as needed -->
              </table>
            `;
            popup.appendChild(popupContent);

            // const closeButton = document.createElement('button');
            // closeButton.textContent = 'Close';
            // closeButton.addEventListener('click', () => {
            //   popup.remove();
            // });
            // popup.appendChild(closeButton);
            
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

            // Add an event listener to the close button
            closeButton.addEventListener('click', () => {
              popup.remove();
            });

            // Append the close button to the popup
            popup.appendChild(closeButton);


            document.body.appendChild(popup);

            
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

function sortTable(columnIndex) {
  const tableRows = tableBody.rows;
  const sortedRows = Array.from(tableRows).sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent;
    const bValue = b.cells[columnIndex].textContent;
    if (aValue < bValue) return -sortDirection;
    if (aValue > bValue) return sortDirection;
    return 0;
  });

  // Toggle the sorting direction
  sortDirection *= -1;

  // Update the arrows in the header cell
  const headerCell = tableHeader.rows[0].cells[columnIndex];
  headerCell.arrow.style.display = sortDirection === 1 ? 'inline' : 'none';
  headerCell.upArrow.style.display = sortDirection === -1 ? 'inline' : 'none';
  headerCell.arrow.classList.toggle('active', sortDirection === 1);
  headerCell.upArrow.classList.toggle('active', sortDirection === -1);

  tableBody.innerHTML = '';
  sortedRows.forEach((row) => {
    tableBody.appendChild(row);
  });
}


function exportToCSV() {
    const data = [];
    const headers = [];
    const rows = tableBody.rows;
  
    // Get the headers from the table
    const tableHeaderRow = tableHeader.rows[0];
    for (let i = 0; i < tableHeaderRow.cells.length; i++) {
      headers.push(tableHeaderRow.cells[i].textContent);
    }
  
    // Add the headers to the data array
    data.push(headers);
  
    // Get the data from the table, only considering visible rows
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].style.display!== 'none') {
        const row = [];
        const cells = rows[i].cells;
        for (let j = 0; j < cells.length; j++) {
          const cellText = cells[j].textContent;
          // Handle quoted strings with commas inside
          if (cellText.includes('"') && cellText.includes(',')) {
            const quotedParts = cellText.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
            row.push(quotedParts.map(part => part.trim().replace(/^"|"$/g, '')).join(','));
          } else {
            row.push(cellText);
          }
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
const exportButton = document.getElementById('export-button');
exportButton.addEventListener('click', exportToCSV);

// Add a search input field
const searchInput = document.getElementById('search-input');

// Add an event listener to the search input field
searchInput.addEventListener('input', searchTable);

function searchTable(event) {
  const searchTerm = event.target.value.toLowerCase();
  const rows = tableBody.rows;

  // Hide all rows initially
  for (let i = 0; i < rows.length; i++) {
    rows[i].style.display = 'none';
  }

  // Show rows that match the search term
  for (let i = 0; i < rows.length; i++) {
    const rowCells = rows[i].cells;
    for (let j = 0; j < rowCells.length; j++) {
      const cellText = rowCells[j].textContent.toLowerCase();
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

