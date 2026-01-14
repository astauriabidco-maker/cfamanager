import os
import shutil
import re
import pdfplumber
from fastapi import UploadFile

UPLOAD_DIR = "/app/uploads"

class CvParserService:
    def __init__(self, tenant_id: int):
        self.tenant_id = tenant_id
        # Tenant isolation for files
        self.tenant_upload_dir = os.path.join(UPLOAD_DIR, str(tenant_id))
        os.makedirs(self.tenant_upload_dir, exist_ok=True)

    def save_upload(self, file: UploadFile) -> str:
        """Saves uploaded file to tenant specific directory and returns relative path"""
        filename = f"{file.filename}" 
        # In real app, probably want to sanitize filename or use UUID to prevent collision/overwrites
        file_path = os.path.join(self.tenant_upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def extract_text(self, file_path: str) -> str:
        """Extracts text from PDF using pdfplumber"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        except Exception as e:
            print(f"Error parsing PDF {file_path}: {e}")
            # Non-critical, just return empty text if parsing fails
            return ""
        return text

    def extract_email(self, text: str) -> str | None:
        """Finds the first email in text using Regex"""
        # Simple email regex
        email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(email_regex, text)
        if match:
            return match.group(0)
        return None
