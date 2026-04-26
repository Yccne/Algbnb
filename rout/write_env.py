content = (
    "PORT=3001\n"
    "HOST=0.0.0.0\n"
    "CLIENT_URL=http://127.0.0.1:5173\n"
    "\n"
    "PGHOST=127.0.0.1\n"
    "PGPORT=5432\n"
    "PGDATABASE=bddd\n"
    "PGUSER=postgres\n"
    "PGPASSWORD=2357\n"
    "PGSSL=false\n"
    "\n"
    "JWT_SECRET=uneCleTresLongueEtAleatoire123!@#AlgBnb2026\n"
    "\n"
    "FIREBASE_PROJECT_ID=algbnb-4764f\n"
    "FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@algbnb-4764f.iam.gserviceaccount.com\n"
    'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDRmbDxxYbqONur\\nkhyLBYLz3hgDiQK56HkX3GtzaI9973IeAcpi9d1SrNDbYg8DJD/xOMBDKRB3D0Vl\\nrlkSesCEPD2gaFTWlNTw5dC1/AvFvvxYNZ8BidLbgRbIzCs9CB/91hJcsU/TvPKG\\nXfcQPzGsB8XayClcJMQqodawFaq9Zy85k9ECgvnMocgBTTcAS76fG3phcLF/VXm+\\nxGSnIuXt+/ICv6vvYlYeG0/iLXbPgaVeZUEyUcsQlFdnRQLoi7tW48tXUeDg0fZ8\\nrTlsaZx0YDqtTpYfflQEZtdx8RWjvFcSYle8dsXIcqD/ySLqkKTo3ZKjBjXuOqBI\\nwy0eqV3VAgMBAAECggEAAhviRXvCuBLd7YI7++x5Oj7W9r4kZht3YebxW9SvXI9v\\nEl/ysSKqnwMEOJjekym+nmncREf/uF3dYMDaG5TmsisCRhfzvGTN+Dzm/zLaWAQm\\nbZIOXaaNIXFFqHYyKtCKEYBbrk2Ia38GJvLFXHufv3VTSlt6lfdCX6qHp7GiTEwB\\nf2vdehaWi9FjaZyUuxwHnHER/OeXWlxlyOSuhAN8YN6daAEC35b2t6sKkyF+dgk1\\nZlUuJZQzT7UV/cdtUS+VHu1bEi/CJTbTnFZwN6gEyMWeRaX+9OEN88RbMPHdi8U6\\nySyCCZHvEknydQacLJM4b8IC2DRlsyrzn8iOj80xkQKBgQD3VtA1NLloobEIZsTY\\n4j/B13QlYYSovP7AQJwxYAJsXa0BPRm4BVxhm5aiXMCmmWjl3e+CW7qwjy3UT8+z\\noWpmHH/ataQkL1ZYoIQ2ALrseB9kkLdEvhYJPbaFgSxBZLmpvvQSg7G1LrZb+A9V\\n9iVnqq8Ufl8WAiys8RdWzIfffQKBgQDY8JTrdhf0Sknl6h8hlgNy8/btmZx9LM9D\\n5/Y1FxeR5tCbXnuPaZ5tLez2pxX5R/W1iHVG5jI+GWnOMf7Ga2XS9OyzxPw5XCML\\npYrcPlzCa05juno/lpcReeTw4/0FBY1FCU5+uDUZ+QCkpnd1tVr7beadDAMwZX4t\\nAjn4c5P3OQKBgQCc/wbT7u6NQqz7dzgVrq7nnJnFrHunG6fcYmaCVL3VCTTqZ10u\\n2IBGGJtp3dQPK6tQ1SnVJeJ/dbKSZEKjc570x7xEGC3jJgT55pFlMdt0g97xV4Zs\\n5PdZ0ElNvqtXqtbKr0F/iwY+yjLId9FMMByYC9hr+rbiYmj3MWUuHE9WhQKBgH0V\\n2wgZQ56b5xgmcmTPNpXljY9abxzN5YRmD1R1SCXcTJQJWn1KjQqu3F8r4EOn9kkB\\nsX175aRgyt0Vfq2x5zhH+ON+xV/dfGeOwA5V9u4zKTPfpfVcQybUfelXy+BFXztb\\nLmNqm1Oqe3B0e5TnSNqId9w9vOj+3E3fZsWW/s4hAoGATrGLMYAnnv9+aHCjR9wX\\nzWnfUT6I2N5sIUM2mi/niKc4P4ItDrUtxxUEOsCUY+k7qohPOf4wXirR+WEDv4QJ\\nPo8nter8zXLYTjln6PYn7oAv2N3Ejn6otqUSBV3g00R0SOH/87kdyV2b3Ip174LE\\nPrZYj/5baABWw8ob+22mvPs=\\n-----END PRIVATE KEY-----\\n"\n'
    "\n"
    "LOCATIONIQ_KEY=replace_me\n"
)

path = r'C:\Users\NIS\Pictures\Algbnb-main\rout\.env'
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('OK - .env ecrit avec succes')
