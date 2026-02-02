import csv
import mysql.connector

# ---------------- DB Configuration ----------------
DB_CONFIG = {
    'host': 'localhost',
    'user': 'cmsc447team4',
    'password': 'team4.proj447.04',
    'database': 'cmsc447projteam4db'
}

# ---------------- CSV File Paths ----------------
categories_csv = 'Categories.csv'
users_csv = 'Users.csv'
forms_csv = 'Forms.csv'
faqs_csv = 'FAQs.csv'

# ---------------- Helper Functions ----------------
def parse_boolean(value):
    """Convert TRUE/FALSE or 1/0 strings to Python booleans."""
    if value is None:
        return False
    val = str(value).strip().lower()
    return val in ('true', '1', 'yes')

def parse_nullable(value):
    """Convert 'NULL', empty string, or None to actual Python None."""
    if value is None:
        return None
    val = str(value).strip().lower()
    if val in ('', 'null', 'none'):
        return None
    return value.strip()

def get_id_by_name(cursor, table, name_field, name_value):
    """Generic function to fetch a record's ID using a unique name field."""
    name_value = parse_nullable(name_value)
    if not name_value:
        return None

    # Handle irregular table-to-ID naming cases
    if table == "Categories":
        id_field = "Category_ID"
    elif table == "FAQs":
        id_field = "FAQ_ID"
    elif table == "Users":
        id_field = "User_ID"
    elif table == "Forms":
        id_field = "Form_ID"
    else:
        id_field = f"{table[:-1]}_ID"

    query = f"SELECT {id_field} FROM {table} WHERE {name_field} = %s"
    cursor.execute(query, (name_value,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        raise ValueError(f"No match found in '{table}' for {name_field} = '{name_value}'.")

# ---------------- Main Population Logic ----------------
def populate_database():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    print("Starting database population...\n")

    # 1) Populate Categories
    print("Populating Categories...")
    with open(categories_csv, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            cursor.execute(
                "INSERT INTO Categories (Category_Name) VALUES (%s)",
                (row['Category_Name'].strip(),)
            )

    # 2) Populate Users (Admins pre-filled)
    print("Populating Users...")
    with open(users_csv, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            cursor.execute(
                """
                INSERT INTO Users (
                    Full_Name, User_Name, User_Email, User_Phone,
                    User_Password, Password_Reset_Token, Password_Reset_Expires,
                    User_Role, User_Type
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    row['Full_Name'].strip(),
                    row['User_Name'].strip(),
                    row['User_Email'].strip(),
                    parse_nullable(row.get('User_Phone')),
                    parse_nullable(row.get('User_Password')),
                    parse_nullable(row.get('Password_Reset_Token')),
                    parse_nullable(row.get('Password_Reset_Expires')),
                    row['User_Role'].strip(),
                    parse_nullable(row.get('User_Type'))
                )
            )

    # 3) Populate Forms
    print("Populating Forms...")
    with open(forms_csv, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            requires_staff = parse_boolean(row['requires_staff'])
            staff_contact_name = parse_nullable(row.get('staff_contact_Name'))
            staff_contact_id = None

            if staff_contact_name:
                staff_contact_id = get_id_by_name(cursor, "Users", "Full_Name", staff_contact_name)

            cursor.execute(
                """
                INSERT INTO Forms (
                    Form_Name, Form_URL, requires_staff, staff_contact_id, Form_Target_User_Type
                ) VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    row['Form_Name'].strip(),
                    row['Form_URL'].strip(),
                    requires_staff,
                    staff_contact_id,
                    parse_nullable(row.get('Form_Target_User_Type'))
                )
            )

    # 4) Populate FAQs
    print("Populating FAQs...")
    with open(faqs_csv, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            category_id = get_id_by_name(cursor, "Categories", "Category_Name", row['FAQ_Category_Name'])
            form_id = get_id_by_name(cursor, "Forms", "Form_Name", row['FAQ_Form_Name'])
            escalation_id = get_id_by_name(cursor, "Users", "Full_Name", row['Escalation_contact_Name'])

            cursor.execute(
                """
                INSERT INTO FAQs (
                    Question, Answer, FAQ_Category_ID, FAQ_Form_ID, Escalation_contact_ID, Target_User_Type
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    row['Question'].strip(),
                    parse_nullable(row['Answer']),
                    category_id,
                    form_id,
                    escalation_id,
                    parse_nullable(row.get('Target_User_Type')) or 'All'
                )
            )

    # Commit all inserts and close connection
    conn.commit()
    cursor.close()
    conn.close()
    print("\nDatabase populated successfully!")

# ---------------- Entry Point ----------------
if __name__ == "__main__":
    populate_database()
