from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os
from datetime import date

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "../templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

class PdfService:
    def generate_contrat_pdf(self, context: dict) -> bytes:
        """
        Generates a PDF from the contract template with provided context.
        """
        # Add today's date if not present
        if "date_jour" not in context:
            context["date_jour"] = date.today().strftime("%d/%m/%Y")

        # Load Template
        template = env.get_template("contrat_template.html")
        
        # Render HTML
        html_content = template.render(context)
        
        # Convert to PDF
        pdf_file = HTML(string=html_content).write_pdf()
        
        return pdf_file
