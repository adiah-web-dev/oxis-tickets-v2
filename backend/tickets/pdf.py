
from io import BytesIO
from pathlib import Path
from html import escape

import qrcode

from PIL import Image

from django.conf import settings
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle


def generate_ticket_pdf(ticket):
    """
    Generate a landscape Christmas in Bedrock ticket
    using the full-page event backdrop.
    """

    # -------------------------------------------------
    # PDF dimensions (match 1648 x 928 backdrop)
    # -------------------------------------------------

    width = 10 * inch
    height = width * 928 / 1648

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=(width, height))

    order = ticket.order_item.order
    event = order.event
    ticket_type = ticket.order_item.ticket_type

    # -------------------------------------------------
    # Colours
    # -------------------------------------------------

    dark_brown = colors.HexColor("#542714")
    muted_brown = colors.HexColor("#79502F")
    gold = colors.HexColor("#A66A19")

    try:
        text_color = colors.HexColor(event.ticket_text_color)
    except (ValueError, TypeError):
        text_color = dark_brown

    # -------------------------------------------------
    # Full-page ticket backdrop
    # -------------------------------------------------
    backdrop = None

    # First preference: event-specific backdrop
    if event.banner_image:
        try:
            event.banner_image.open('rb')
            with Image.open(event.banner_image.file) as source:
                backdrop = source.convert('RGB').copy()

        except Exception:
            backdrop = None

        finally:
            try:
                event.banner_image.close()
            except Exception:
                pass

    # Fallback: default backdrop
    if backdrop is None:

        default_backdrop = (
            Path(settings.BASE_DIR)
            / "static"
            / "tickets"
            / "default_backdrop.png"
        )

        if default_backdrop.exists():
            with Image.open(default_backdrop) as source:
                backdrop = source.convert('RGB').copy()
        else:
            raise FileNotFoundError(
                "No event ticket backdrop or default backdrop found"
            )

    image_buffer = BytesIO()
    backdrop.save(image_buffer, format="PNG")
    image_buffer.seek(0)

    pdf.drawImage(
        ImageReader(image_buffer),
        0,
        0,
        width=width,
        height=height,
        preserveAspectRatio=False,
    )

    # -------------------------------------------------
    # Text styles
    # -------------------------------------------------

    heading_style = ParagraphStyle(
        "TicketHeading",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=gold,
        alignment=0,
    )

    event_style = ParagraphStyle(
        "EventName",
        fontName="Helvetica-Bold",
        fontSize=23,
        leading=27,
        textColor=text_color,
        alignment=0,
    )

    attendee_style = ParagraphStyle(
        "AttendeeName",
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=23,
        textColor=dark_brown,
        alignment=0,
    )

    details_style = ParagraphStyle(
        "TicketDetails",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=19,
        textColor=dark_brown,
        alignment=0,
    )

    small_style = ParagraphStyle(
        "TicketSmall",
        fontName="Helvetica",
        fontSize=12,
        leading=12,
        textColor=muted_brown,
        alignment=0,
    )

    # -------------------------------------------------
    # Event information
    # -------------------------------------------------

    event_date = timezone.localtime(
        event.start_date
    ).strftime("%A, %d %B %Y")

    event_time = timezone.localtime(
        event.start_date
    ).strftime("%I:%M %p")

    # -------------------------------------------------
    # Central ticket content
    # -------------------------------------------------

    # The main content is positioned inside the
    # large blank parchment section of the backdrop.

    content_center_x = 1.0 * inch
    content_left_x = 1.9 * inch
    # 6.8
    content_width = 20 * inch

    def draw_left_aligned_paragraph(
        text,
        style,
        x,
        y,
        max_width,
        max_height=0.7 * inch,
    ):
        paragraph = Paragraph(
            text,
            style
        )

        actual_width, actual_height = paragraph.wrap(
            max_width,
            max_height,
        )

        paragraph.drawOn(
            pdf,
            x,
            y - actual_height
        )

    def draw_centered_paragraph(
        text,
        style,
        center_x,
        y,
        max_width,
        max_height=0.7 * inch,
    ):
        paragraph = Paragraph(text, style)

        actual_width, actual_height = paragraph.wrap(
            max_width,
            max_height,
        )

        paragraph.drawOn(
            pdf,
            center_x - actual_width / 2,
            y - actual_height,
        )

    # Heading
    # draw_centered_paragraph(
    #     "OFFICIAL ADMISSION TICKET",
    #     heading_style,
    #     content_center_x,
    #     # 3.05 * inch,
    #     2 * inch,
    #     content_width,
    # )

    # Event name
    # draw_centered_paragraph(
    #     escape(event.name),
    #     event_style,
    #     content_center_x,
    #     2.60 * inch,
    #     content_width,
    #     0.65 * inch,
    # )

    # Decorative separator
    pdf.saveState()
    pdf.setStrokeColor(gold)
    pdf.setLineWidth(1)
    pdf.line(
        6.0 * inch,         # Starting X
        2.5 * inch,        # Starting Y
        6.0 * inch,         # Ending X
        0.90 * inch,        # Ending Y
    )
    pdf.restoreState()

    # Attendee
    draw_left_aligned_paragraph(
        escape(order.customer_name),
        attendee_style,
        content_left_x,
        2.50 * inch,
        content_width,
    )

    # Date and time
    draw_left_aligned_paragraph(
        f"{escape(event_date)}<br/>"
        f"{escape(event_time)}",
        details_style,
        content_left_x,
        2.05 * inch,
        content_width,
    )

    # Venue
    draw_left_aligned_paragraph(
        escape(event.venue or ""),
        small_style,
        content_left_x,
        1.40 * inch,
        content_width,
    )

    # Ticket type
    draw_left_aligned_paragraph(
        f"TICKET TYPE: {escape(ticket_type.name)}",
        details_style,
        content_left_x,
        1.00 * inch,
        content_width,
    )

    # -------------------------------------------------
    # QR code
    # -------------------------------------------------

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )

    qr.add_data(ticket.ticket_code)
    qr.make(fit=True)

    qr_image = qr.make_image(
        fill_color="black",
        back_color="white",
    )

    qr_buffer = BytesIO()
    qr_image.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    # qr_size = 0.85 * inch
    qr_size = 1.5 * inch

    # Positioned on the right side of the parchment.
    qr_x = 6.50 * inch
    qr_y = 1.00 * inch

    pdf.drawImage(
        ImageReader(qr_buffer),
        qr_x,
        qr_y,
        width=qr_size,
        height=qr_size,
    )

    # -------------------------------------------------
    # Unique ticket code
    # -------------------------------------------------

    pdf.setFillColor(colors.HexColor("#FFFFFF"))
    pdf.setFont("Helvetica-Bold", 7)

    pdf.drawCentredString(
        qr_x + qr_size / 2,
        qr_y - 0.13 * inch,
        ticket.ticket_code,
    )

    # -------------------------------------------------
    # Finish PDF
    # -------------------------------------------------

    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    return buffer
