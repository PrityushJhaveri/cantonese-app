import fitz
import os
import glob

pdf_files = glob.glob("*.pdf")
if not pdf_files:
    raise FileNotFoundError("No PDF found in current directory")
pdf_path = pdf_files[0]
print(f"Using PDF: {pdf_path}")
output_dir = "pdf_images"

def render_glossary():
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    doc = fitz.open(pdf_path)
    total = len(doc)
    
    # Render pages 222 to end
    for p in range(222, total):
        page = doc.load_page(p)
        pix = page.get_pixmap(dpi=200)
        pix.save(os.path.join(output_dir, f"page_{p}.png"))
    
    print(f"Rendered pages 222 to {total - 1} ({total - 222} pages)")

if __name__ == "__main__":
    render_glossary()
