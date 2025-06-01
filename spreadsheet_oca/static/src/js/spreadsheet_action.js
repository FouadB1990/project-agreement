odoo.define('spreadsheet_oca.spreadsheet_action', function (require) {
    "use strict";

    var AbstractAction = require('web.AbstractAction');
    var core = require('web.core');

    var SpreadsheetOCA = AbstractAction.extend({
        init: function (parent, action) {
            this._super.apply(this, arguments);
            this.params = action.params || {};
        },

        start: async function () {
            const spreadsheetId = this.params.spreadsheet_id;
            const model = this.params.model;

            const result = await this._rpc({
                model: model,
                method: 'get_spreadsheet_data',
                args: [[spreadsheetId]],
            });

            const htmlTable = this._buildSpreadsheetTable(result.spreadsheet_raw);

            this.$el.html(`
                <div class="o_spreadsheet_oca_view" style="padding: 20px;">
                    <h2 style="color: #1E90FF;">📊 Spreadsheet Viewer</h2>
                    <p><strong>Model:</strong> ${model}</p>
                    <p><strong>ID:</strong> ${spreadsheetId}</p>
                    <hr/>
                    <div class="spreadsheet-table-container" style="overflow:auto; max-height: 500px;">
                        ${htmlTable}
                    </div>
                </div>
            `);

            return Promise.resolve();
        },

        _buildSpreadsheetTable: function(data) {
            if (!data || !data.sheets) {
                return "<p>No spreadsheet data found.</p>";
            }

            const sheet = data.sheets[Object.keys(data.sheets)[0]];
            const cells = sheet.cells || {};

            // Build a 2D array with content using max row/col indexes
            const table = [];
            const cellMap = {};

            let maxRow = 0;
            let maxCol = 0;

            // Convert cell keys (A1, B2, etc.) to indexes
            for (const [key, cell] of Object.entries(cells)) {
                const match = key.match(/^([A-Z]+)([0-9]+)$/);
                if (!match) continue;
                const colLetter = match[1];
                const rowNumber = parseInt(match[2]);

                const colIndex = this._columnLetterToIndex(colLetter);
                const rowIndex = rowNumber - 1;

                if (!table[rowIndex]) table[rowIndex] = [];
                table[rowIndex][colIndex] = cell.value;

                maxRow = Math.max(maxRow, rowIndex);
                maxCol = Math.max(maxCol, colIndex);
            }

            // Build HTML table
            let html = "<table class='table table-striped table-bordered'>";
            for (let r = 0; r <= maxRow; r++) {
                html += "<tr>";
                for (let c = 0; c <= maxCol; c++) {
                    const value = (table[r] && table[r][c]) ? table[r][c] : "";
                    html += `<td>${value}</td>`;
                }
                html += "</tr>";
            }
            html += "</table>";

            return html;
        },

        _columnLetterToIndex: function (letters) {
            let index = 0;
            for (let i = 0; i < letters.length; i++) {
                index *= 26;
                index += letters.charCodeAt(i) - 64; // A=1, B=2, ..., Z=26
            }
            return index - 1; // Convert to 0-based index
        },
    });

    core.action_registry.add('action_spreadsheet_oca', SpreadsheetOCA);
    return SpreadsheetOCA;
});


// odoo.define('spreadsheet_oca.spreadsheet_action', function (require) {
//     "use strict";

//     var AbstractAction = require('web.AbstractAction');
//     var core = require('web.core');

//     var SpreadsheetOCA = AbstractAction.extend({
//         init: function (parent, action) {
//             this._super.apply(this, arguments);
//             this.params = action.params || {};
//         },

//         start: async function () {
//             const spreadsheetId = this.params.spreadsheet_id;
//             const model = this.params.model;

//             // Fetch spreadsheet data via RPC
//             const result = await this._rpc({
//                 model: model,
//                 method: 'get_spreadsheet_data',
//                 args: [[spreadsheetId]],
//             });

//             // Show raw data for now (later you can use o_spreadsheet to render)
//             this.$el.html(`
//                 <h2>Spreadsheet Viewer</h2>
//                 <p><strong>Model:</strong> ${model}</p>
//                 <p><strong>ID:</strong> ${spreadsheetId}</p>
//                 <pre>${JSON.stringify(result.spreadsheet_raw, null, 2)}</pre>
//             `);

//             // No need to call this._super here
//             return Promise.resolve();
//         }
//     });

//     core.action_registry.add('action_spreadsheet_oca', SpreadsheetOCA);

//     return SpreadsheetOCA;
// });



// odoo.define('spreadsheet_oca.spreadsheet_action', function (require) {
//     "use strict";

//     var AbstractAction = require('web.AbstractAction');
//     var core = require('web.core');

//     var SpreadsheetOCA = AbstractAction.extend({
//         init: function (parent, action) {
//             this._super.apply(this, arguments);
//             this.params = action.params || {};
//         },

//         start: async function () {

//             const self = this;
//             const spreadsheetId = this.params.spreadsheet_id;
//             const model = this.params.model;

//             // RPC to fetch spreadsheet data
//             const result = await this._rpc({
//                 model: model,
//                 method: 'get_spreadsheet_data',
//                 args: [[spreadsheetId]],
//             });

//             // Display raw JSON for now
//             this.$el.html(`
//                 <h2>Spreadsheet Viewer</h2>
//                 <p><strong>Model:</strong> ${model}</p>
//                 <p><strong>ID:</strong> ${spreadsheetId}</p>
//                 <pre>${JSON.stringify(result.spreadsheet_raw, null, 2)}</pre>
//             `);

//             return this._super.apply(this, arguments);
//         }

//     });

//     core.action_registry.add('action_spreadsheet_oca', SpreadsheetOCA);

//     return SpreadsheetOCA;
// });



// odoo.define('spreadsheet_oca.spreadsheet_action', function (require) {
//     "use strict";

//     var AbstractAction = require('web.AbstractAction');
//     var core = require('web.core');

//     var SpreadsheetOCA = AbstractAction.extend({
//         /**
//          * Called when the action is initialized.
//          * Stores the `params` passed from the Python backend.
//          */
//         init: function (parent, action) {
//             this._super.apply(this, arguments);
//             this.params = action.params || {};  // <- Store the action's params properly
//         },

//         /**
//          * Called when the action is rendered on the screen.
//          * Use stored params to display data.
//          */
//         start: function () {
//             var spreadsheetId = this.params.spreadsheet_id || 'Not Provided';
//             var model = this.params.model || 'Unknown Model';

//             // Display a simple output (for testing)
//             this.$el.html(`
//                 <h2>Spreadsheet Viewer</h2>
//                 <p><strong>Model:</strong> ${model}</p>
//                 <p><strong>ID:</strong> ${spreadsheetId}</p>
//             `);

//             return this._super.apply(this, arguments);
//         }
//     });

//     // Register the action so Odoo can use it
//     core.action_registry.add('action_spreadsheet_oca', SpreadsheetOCA);

//     return SpreadsheetOCA;
// });




// odoo.define('spreadsheet_oca.spreadsheet_action', function (require) {
//     "use strict";

//     const AbstractAction = require('web.AbstractAction');
//     const core = require('web.core');
//     const rpc = require('web.rpc');

//     const SpreadsheetOCA = AbstractAction.extend({
//         start: async function () {
//             const self = this;
//             const id = this.params.spreadsheet_id;
//             const model = this.params.model || "spreadsheet.spreadsheet";

//             const result = await rpc.query({
//                 model: model,
//                 method: 'get_spreadsheet_data',
//                 args: [[id]],
//             });

//             // Render basic HTML table from spreadsheet_raw
//             const raw = result.spreadsheet_raw;
//             const content = self.render_spreadsheet(raw);
//             self.$el.html(`<h2>${result.name}</h2>${content}`);

//             return this._super.apply(this, arguments);
//         },

//         render_spreadsheet: function (raw) {
//             if (!raw || !raw.sheets) return "<p>No data available</p>";

//             const sheet = raw.sheets[raw.active_sheet_id];
//             if (!sheet || !sheet.cells) return "<p>No sheet content</p>";

//             let html = '<table border="1" cellspacing="0" cellpadding="5">';
//             for (let row = 0; row < 20; row++) {
//                 html += "<tr>";
//                 for (let col = 0; col < 10; col++) {
//                     const key = `${col}:${row}`;
//                     const cell = sheet.cells[key];
//                     html += `<td>${cell ? cell.content || '' : ''}</td>`;
//                 }
//                 html += "</tr>";
//             }
//             html += "</table>";
//             return html;
//         }
//     });

//     core.action_registry.add('action_spreadsheet_oca', SpreadsheetOCA);
//     return SpreadsheetOCA;
// });



// odoo.define('spreadsheet_oca.spreadsheet_action', function (require) {
//     "use strict";

//     var AbstractAction = require('web.AbstractAction');
//     var core = require('web.core');

//     var SpreadsheetOCA = AbstractAction.extend({
//         start: function () {
//             // Safely handle missing params
//             var params = this.params || {};
//             var spreadsheetId = params.spreadsheet_id || "Unknown";

//             // Optional: Log to console for debugging
//             console.log("SpreadsheetOCA params:", params);

//             this.$el.html('<h2>Spreadsheet Viewer</h2><p>ID: ' + spreadsheetId + '</p>');
//             return this._super.apply(this, arguments);
//         }
//     });

//     core.action_registry.add('action_spreadsheet_oca', SpreadsheetOCA);

//     return SpreadsheetOCA;
// });
