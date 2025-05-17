from app import db, Campaign
import sqlite3
from sqlite3 import Error

def update_campaign_table():
    """
    Add the new completion fields to the Campaign table in the database
    """
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect('cleanearth.db')
        cursor = conn.cursor()
        
        # Check if the columns already exist
        cursor.execute("PRAGMA table_info(campaign)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add columns if they don't exist
        if 'actual_participants' not in columns:
            print("Adding column actual_participants")
            cursor.execute("ALTER TABLE campaign ADD COLUMN actual_participants INTEGER DEFAULT 0")
        
        if 'waste_collected' not in columns:
            print("Adding column waste_collected")
            cursor.execute("ALTER TABLE campaign ADD COLUMN waste_collected VARCHAR(255)")
        
        if 'image_link' not in columns:
            print("Adding column image_link")
            cursor.execute("ALTER TABLE campaign ADD COLUMN image_link VARCHAR(255)")
        
        if 'completion_notes' not in columns:
            print("Adding column completion_notes")
            cursor.execute("ALTER TABLE campaign ADD COLUMN completion_notes TEXT")
        
        if 'completed_at' not in columns:
            print("Adding column completed_at")
            cursor.execute("ALTER TABLE campaign ADD COLUMN completed_at DATETIME")
        
        # Commit the changes
        conn.commit()
        print("Database updated successfully")
        
    except Error as e:
        print(f"Error updating database: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    update_campaign_table()
    print("Campaign table update complete.")