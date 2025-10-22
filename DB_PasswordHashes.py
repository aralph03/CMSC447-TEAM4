import bcrypt

# Temporary plaintext admin password
password = "Admin@123"

# Generate bcrypt hash (with salt)
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))

# Print out the hashed password to insert in the DB
print(hashed.decode('utf-8'))
