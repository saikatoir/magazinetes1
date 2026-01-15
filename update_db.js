const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./magazine.db');

db.serialize(() => {
    // This command adds the missing column to your existing table
    db.run("ALTER TABLE magazines ADD COLUMN is_discover INTEGER DEFAULT 1", (err) => {
        if (err) {
            console.error("Error updating table:", err.message);
        } else {
            console.log("Successfully added is_discover column!");
        }
        db.close();
    });
});
