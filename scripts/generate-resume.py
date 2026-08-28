from pathlib import Path
from shutil import copyfile

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Hrishikesh-Vyshnav-Resume.pdf"
PUBLIC = ROOT / "public" / "Hrishikesh-Vyshnav-Resume.pdf"

PAGE_W, PAGE_H = A4
INK = HexColor("#151515")
MUTED = HexColor("#626262")
LINE = HexColor("#D8D8D2")
ACCENT = HexColor("#D59626")
MARGIN = 48


def draw_text(pdf, text, x, y, size=9, color=INK, font="Helvetica", leading=None):
    pdf.setFont(font, size)
    pdf.setFillColor(color)
    pdf.drawString(x, y, text)
    return y - (leading or size * 1.45)


def wrap(pdf, text, x, y, width, size=9, color=MUTED, leading=14):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, "Helvetica", size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    for line in lines:
        y = draw_text(pdf, line, x, y, size=size, color=color, leading=leading)
    return y


def section(pdf, label, y):
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.6)
    pdf.line(MARGIN, y + 5, PAGE_W - MARGIN, y + 5)
    return draw_text(pdf, label.upper(), MARGIN, y - 8, 7.5, ACCENT, "Helvetica-Bold", 23)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle("Hrishikesh Vyshnav - Resume")
    pdf.setAuthor("Hrishikesh Vyshnav")

    y = PAGE_H - MARGIN
    y = draw_text(pdf, "HRISHIKESH VYSHNAV", MARGIN, y, 23, INK, "Helvetica-Bold", 29)
    y = draw_text(pdf, "DESIGNER + DEVELOPER", MARGIN, y, 9, ACCENT, "Helvetica-Bold", 22)

    pdf.setFont("Helvetica", 8)
    pdf.setFillColor(MUTED)
    pdf.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN, "hrishikeshvyshnavop@gmail.com")
    pdf.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN - 14, "+91 8547838091")
    pdf.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN - 28, "Available for full-time roles")

    y = wrap(
        pdf,
        "Independent designer and developer creating focused systems and expressive digital experiences across identity, interface, product design, and frontend development.",
        MARGIN,
        y,
        PAGE_W - MARGIN * 2,
        size=10,
        color=INK,
        leading=15,
    ) - 12

    y = section(pdf, "Experience", y)
    y = draw_text(pdf, "PRESENT", MARGIN, y, 7.5, ACCENT, "Helvetica-Bold", 13)
    y = draw_text(pdf, "Independent Designer & Developer", MARGIN, y, 11, INK, "Helvetica-Bold", 15)
    y = draw_text(pdf, "Independent practice", MARGIN, y, 8.5, MUTED, leading=14)
    y = wrap(pdf, "Leading projects from early strategy through identity, interface design, prototyping, and production.", MARGIN, y, PAGE_W - MARGIN * 2, leading=13) - 12

    y = draw_text(pdf, "ONGOING", MARGIN, y, 7.5, ACCENT, "Helvetica-Bold", 13)
    y = draw_text(pdf, "Design & Engineering Partner", MARGIN, y, 11, INK, "Helvetica-Bold", 15)
    y = draw_text(pdf, "Selected collaborations", MARGIN, y, 8.5, MUTED, leading=14)
    y = wrap(pdf, "Working with ambitious teams to make complex products and ideas feel clear, useful, and distinct.", MARGIN, y, PAGE_W - MARGIN * 2, leading=13) - 12

    y = section(pdf, "Capabilities", y)
    columns = [
        ("DESIGN", "Product design / UI & UX / Brand systems / Art direction"),
        ("ENGINEERING", "Creative development / Frontend systems / Prototyping / Interaction"),
        ("THINKING", "Strategy / Research / Systems thinking / Collaboration"),
    ]
    col_w = (PAGE_W - MARGIN * 2 - 28) / 3
    start_y = y
    for index, (title, body) in enumerate(columns):
        x = MARGIN + index * (col_w + 14)
        inner_y = draw_text(pdf, title, x, start_y, 8, INK, "Helvetica-Bold", 16)
        wrap(pdf, body, x, inner_y, col_w, size=8.5, color=MUTED, leading=13)
    y = start_y - 78

    y = section(pdf, "Education + Research", y)
    y = draw_text(pdf, "Independent studio research", MARGIN, y, 10.5, INK, "Helvetica-Bold", 15)
    y = wrap(pdf, "Ongoing study of product systems, visual culture, interaction, and creative technology.", MARGIN, y, PAGE_W - MARGIN * 2, leading=13) - 10
    y = draw_text(pdf, "Learning through making", MARGIN, y, 10.5, INK, "Helvetica-Bold", 15)
    wrap(pdf, "A practice shaped by experiments, collaboration, critique, and shipped work.", MARGIN, y, PAGE_W - MARGIN * 2, leading=13)

    pdf.setStrokeColor(ACCENT)
    pdf.setLineWidth(3)
    pdf.line(MARGIN, 30, PAGE_W - MARGIN, 30)
    pdf.setFont("Helvetica", 7)
    pdf.setFillColor(MUTED)
    pdf.drawString(MARGIN, 17, "PORTFOLIO RESUME / 2026")
    pdf.drawRightString(PAGE_W - MARGIN, 17, "HRISHIKESH VYSHNAV")

    pdf.showPage()
    pdf.save()
    copyfile(OUTPUT, PUBLIC)
    print(OUTPUT)
    print(PUBLIC)


if __name__ == "__main__":
    build()
